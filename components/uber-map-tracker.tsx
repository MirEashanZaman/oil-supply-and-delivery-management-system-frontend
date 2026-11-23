"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import type * as LeafletType from "leaflet";
import { API_ENDPOINT } from "@/lib/api";

export type TrackingOrderData = {
    id: number | string;
    quantity: number;
    status: string;
    address?: string;
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    deliveryDate?: string;
    product?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        userName?: string;
        username?: string;
    };
    dealer?: {
        id: number;
        userName?: string;
        username?: string;
    };
    payment?: {
        cardNumber?: string;
        cardType?: string;
        amount?: number;
        status?: string;
    };
};

interface UberMapTrackerProps {
    order: TrackingOrderData | null;
    userRole?: string;
    onClose: () => void;
    isEmbedded?: boolean;
}

// High-resolution 18-point corridor from Eastern Refinery Depot (Kuril/Uttara) to Customer Facility (Dhanmondi)
const DEFAULT_ROUTE_COORDS: [number, number][] = [
    [23.8340, 90.4195], // 0: Eastern Refinery Fuel Terminal
    [23.8295, 90.4198],
    [23.8242, 90.4210],
    [23.8180, 90.4205], // 3: Kuril Flyover Checkpoint
    [23.8115, 90.4220],
    [23.8045, 90.4232],
    [23.7975, 90.4240], // 6: Pragati Sarani Transit Hub
    [23.7905, 90.4245],
    [23.7840, 90.4238],
    [23.7785, 90.4185], // 9: Gulshan-Badda Link Corridor
    [23.7760, 90.4110],
    [23.7735, 90.4025],
    [23.7690, 90.3955], // 12: Mohakhali Flyover Sector
    [23.7630, 90.3915],
    [23.7575, 90.3880],
    [23.7530, 90.3835],
    [23.7495, 90.3790],
    [23.7465, 90.3750], // 17: Customer Intake Terminal
];

const DEFAULT_DEPOT_COORDS: [number, number] = DEFAULT_ROUTE_COORDS[0];
const DEFAULT_DEST_COORDS: [number, number] = DEFAULT_ROUTE_COORDS[DEFAULT_ROUTE_COORDS.length - 1];

const CORRIDOR_CHECKPOINTS = [
    { label: "Refinery Terminal", threshold: 0 },
    { label: "Kuril Flyover", threshold: 22 },
    { label: "Pragati Sarani", threshold: 45 },
    { label: "Gulshan Link", threshold: 68 },
    { label: "Intake Manifold", threshold: 96 },
];

const MAP_TILES = {
    dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri, HERE, Garmin",
    },
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    },
    light: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri",
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri &mdash; Earthstar Geographics",
    },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function interpolateRoute(progressPercent: number): {
    coords: [number, number];
    heading: number;
    traveledPath: [number, number][];
    remainingPath: [number, number][];
} {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const totalSegments = DEFAULT_ROUTE_COORDS.length - 1;
    const exactSegment = (clamped / 100) * totalSegments;
    const segIdx = Math.min(Math.floor(exactSegment), totalSegments - 1);
    const localT = exactSegment - segIdx;

    const p1 = DEFAULT_ROUTE_COORDS[segIdx];
    const p2 = DEFAULT_ROUTE_COORDS[segIdx + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * localT;
    const lng = p1[1] + (p2[1] - p1[1]) * localT;

    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    const angle = Math.round(((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360);

    const currentPt: [number, number] = [lat, lng];
    const traveledPath: [number, number][] = [
        ...DEFAULT_ROUTE_COORDS.slice(0, segIdx + 1),
        currentPt,
    ];
    const remainingPath: [number, number][] = [
        currentPt,
        ...DEFAULT_ROUTE_COORDS.slice(segIdx + 1),
    ];

    return { coords: currentPt, heading: angle, traveledPath, remainingPath };
}

export default function UberMapTracker({ order, userRole = "customer", onClose, isEmbedded = false }: UberMapTrackerProps) {
    // Default to smooth 60fps live route stream so the user immediately sees fluid real-time motion
    const [trackingMode, setTrackingMode] = useState<"route-sim" | "device-gps">("route-sim");
    const [mapTheme, setMapTheme] = useState<keyof typeof MAP_TILES>("dark");
    const [isBroadcastingGps, setIsBroadcastingGps] = useState<boolean>(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [followCarrier, setFollowCarrier] = useState<boolean>(false);
    const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<1 | 2 | 4>(1);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    const initialInterp = useMemo(() => interpolateRoute(32), []);
    const [currentCoords, setCurrentCoords] = useState<[number, number]>(initialInterp.coords);
    const [gpsAccuracy, setGpsAccuracy] = useState<number>(4.8);
    const [gpsSpeed, setGpsSpeed] = useState<number>(52);
    const [gpsHeading, setGpsHeading] = useState<number>(initialInterp.heading);
    const [backendTrackingStatus, setBackendTrackingStatus] = useState<string>("IN TRANSIT");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [callAlert, setCallAlert] = useState<string | null>(null);
    const [simProgress, setSimProgress] = useState<number>(32);

    const [fuelTempCelsius, setFuelTempCelsius] = useState<number>(22.4);
    const [tankPressureBar, setTankPressureBar] = useState<number>(1.85);
    const [flowRateLpm, setFlowRateLpm] = useState<number>(185);
    const [ullagePercent, setUllagePercent] = useState<number>(94.6);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<LeafletType.Map | null>(null);
    const vehicleMarkerRef = useRef<LeafletType.Marker | null>(null);
    const accuracyCircleRef = useRef<LeafletType.Circle | null>(null);
    const traveledPolylineRef = useRef<LeafletType.Polyline | null>(null);
    const remainingPolylineRef = useRef<LeafletType.Polyline | null>(null);
    const glowPolylineRef = useRef<LeafletType.Polyline | null>(null);
    const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);
    const geoWatchIdRef = useRef<number | null>(null);
    const progressRef = useRef<number>(32);

    const destCoords = DEFAULT_DEST_COORDS;
    const remainingDistanceKm = useMemo(() => {
        return calculateDistanceKm(currentCoords[0], currentCoords[1], destCoords[0], destCoords[1]);
    }, [currentCoords, destCoords]);

    const remainingEtaMins = useMemo(() => {
        const speed = gpsSpeed > 5 ? gpsSpeed : 42;
        const hours = remainingDistanceKm / speed;
        return Math.max(1, Math.round(hours * 60));
    }, [remainingDistanceKm, gpsSpeed]);

    const fetchLiveTracking = async () => {
        if (!order) return;
        setIsRefreshing(true);
        const r = userRole.toLowerCase() === "dealer" ? "dealer" : "customer";
        try {
            const res = await axios.get(`${API_ENDPOINT}/${r}/trackorder/${order.id}`, {
                withCredentials: true,
                validateStatus: (status) => status < 500,
            });
            if (res.status === 200 && res.data) {
                const s = res.data.order?.status || res.data.status || res.data.message || order.status || "In Transit";
                setBackendTrackingStatus(typeof s === "string" ? s.toUpperCase() : "IN TRANSIT");

                if (res.data.latitude && res.data.longitude) {
                    setCurrentCoords([Number(res.data.latitude), Number(res.data.longitude)]);
                    if (res.data.speed) setGpsSpeed(Number(res.data.speed));
                    if (res.data.heading) setGpsHeading(Number(res.data.heading));
                }
            } else {
                setBackendTrackingStatus(order.status ? order.status.toUpperCase() : "IN TRANSIT");
            }
        } catch {
            setBackendTrackingStatus(order.status ? order.status.toUpperCase() : "IN TRANSIT");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLiveTracking();
    }, [order?.id]);

    // Initialize Leaflet Map once
    useEffect(() => {
        let isMounted = true;

        async function initMap() {
            if (!mapContainerRef.current || leafletMapRef.current) return;

            const L = await import("leaflet");
            if (!isMounted || !mapContainerRef.current) return;

            delete ((L.Icon.Default.prototype as unknown) as { _getIconUrl?: unknown })._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapContainerRef.current, {
                center: currentCoords,
                zoom: 13,
                zoomControl: false,
                attributionControl: false,
            });

            L.control.zoom({ position: "bottomright" }).addTo(map);

            const tileLayer = L.tileLayer(MAP_TILES[mapTheme].url, {
                maxZoom: 19,
                subdomains: "abcd",
            }).addTo(map);
            tileLayerRef.current = tileLayer;

            // Origin Depot Beacon
            const depotIcon = L.divIcon({
                className: "custom-depot-icon",
                html: `
                    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
                        <div class="animate-radar-ripple" style="position: absolute; inset: 2px; border-radius: 9999px; background: rgba(245, 158, 11, 0.35);"></div>
                        <div style="position: relative; background-color: #D97706; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5); border: 2px solid #FEF3C7;">
                            DEP
                        </div>
                    </div>
                `,
                iconSize: [42, 42],
                iconAnchor: [21, 21],
            });
            L.marker(DEFAULT_DEPOT_COORDS, { icon: depotIcon })
                .addTo(map)
                .bindPopup("<b>Eastern Refinery Fuel Terminal</b><br>Dispatch Origin Manifold");

            // Destination Facility Beacon
            const destIcon = L.divIcon({
                className: "custom-dest-icon",
                html: `
                    <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
                        <div class="animate-radar-ripple" style="position: absolute; inset: 2px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35);"></div>
                        <div style="position: relative; background-color: #059669; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.5); border: 2px solid #D1FAE5;">
                            DEST
                        </div>
                    </div>
                `,
                iconSize: [42, 42],
                iconAnchor: [21, 21],
            });
            L.marker(DEFAULT_DEST_COORDS, { icon: destIcon })
                .addTo(map)
                .bindPopup(`<b>Customer Intake Facility</b><br>${order?.address || "Delivery Terminal"}`);

            const interp = interpolateRoute(progressRef.current);

            // Subtle corridor under-glow
            const glowLine = L.polyline(DEFAULT_ROUTE_COORDS, {
                color: "#0EA5E9",
                weight: 10,
                opacity: 0.14,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map);
            glowPolylineRef.current = glowLine;

            // Traveled path (solid emerald-cyan)
            const traveledLine = L.polyline(interp.traveledPath, {
                color: "#10B981",
                weight: 5,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map);
            traveledPolylineRef.current = traveledLine;

            // Remaining path (animated flowing dash)
            const remainingLine = L.polyline(interp.remainingPath, {
                color: "#38BDF8",
                weight: 4,
                opacity: 0.9,
                dashArray: "10, 14",
                lineCap: "round",
                lineJoin: "round",
                className: "live-route-flow",
            }).addTo(map);
            remainingPolylineRef.current = remainingLine;

            // Live Tanker Carrier Icon (created once; rotated smoothly via DOM query without re-mounting!)
            const vehicleIcon = L.divIcon({
                className: "custom-vehicle-marker",
                html: `
                    <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
                        <div class="animate-radar-ripple" style="position: absolute; inset: 4px; background: rgba(56, 189, 248, 0.42); border-radius: 9999px;"></div>
                        <div class="animate-radar-ripple-delayed" style="position: absolute; inset: 8px; border: 1.5px solid rgba(56, 189, 248, 0.65); border-radius: 9999px;"></div>
                        <div class="tanker-heading-arrow" style="position: relative; width: 36px; height: 36px; background-color: #0F172A; border: 2.5px solid #38BDF8; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.75); transform: rotate(${interp.heading}deg); will-change: transform;">
                            <svg style="width: 18px; height: 18px; color: #38BDF8;" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                            </svg>
                        </div>
                    </div>
                `,
                iconSize: [56, 56],
                iconAnchor: [28, 28],
            });

            const vehicleMarker = L.marker(interp.coords, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
            vehicleMarker.bindPopup(`
                <div style="font-family: Inter, sans-serif; font-size: 12px; color: #0F172A; padding: 2px;">
                    <b style="color: #0F2747;">Tanker Unit #${order?.id || "4491"}</b><br/>
                    Status: <b>Live Telemetry Stream</b><br/>
                    Speed: <b>${gpsSpeed} km/h</b>
                </div>
            `);
            vehicleMarkerRef.current = vehicleMarker;

            const accuracyCircle = L.circle(interp.coords, {
                radius: 140,
                color: "#38BDF8",
                fillColor: "#38BDF8",
                fillOpacity: 0.08,
                weight: 1,
            }).addTo(map);
            accuracyCircleRef.current = accuracyCircle;

            leafletMapRef.current = map;
            map.fitBounds(glowLine.getBounds(), { padding: [36, 36] });

            setTimeout(() => map.invalidateSize(), 200);
            setTimeout(() => map.invalidateSize(), 600);
        }

        initMap();

        const handleWindowResize = () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.invalidateSize();
            }
        };
        window.addEventListener("resize", handleWindowResize);

        return () => {
            isMounted = false;
            window.removeEventListener("resize", handleWindowResize);
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // Switch map tiles cleanly
    useEffect(() => {
        if (!leafletMapRef.current || !tileLayerRef.current) return;
        import("leaflet").then((L) => {
            if (tileLayerRef.current && leafletMapRef.current) {
                leafletMapRef.current.removeLayer(tileLayerRef.current);
                const newLayer = L.tileLayer(MAP_TILES[mapTheme].url, {
                    maxZoom: 19,
                    subdomains: "abcd",
                }).addTo(leafletMapRef.current);
                tileLayerRef.current = newLayer;
            }
        });
    }, [mapTheme]);

    // 60fps requestAnimationFrame live trajectory loop
    useEffect(() => {
        if (trackingMode !== "route-sim" || isPaused) return;

        let animationFrameId: number;
        let lastTime = performance.now();
        let lastUiSyncTime = performance.now();

        const animate = (now: number) => {
            const dtSeconds = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            // Full route takes ~42 seconds at 1x speed
            const deltaPercent = dtSeconds * 2.4 * simSpeedMultiplier;
            let nextProgress = progressRef.current + deltaPercent;
            if (nextProgress >= 100) {
                nextProgress = 0;
            }
            progressRef.current = nextProgress;

            const { coords, heading, traveledPath, remainingPath } = interpolateRoute(nextProgress);

            // Direct 60fps Leaflet layer updates without React re-render overhead
            if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setLatLng(coords);
                const el = vehicleMarkerRef.current.getElement();
                const arrow = el?.querySelector(".tanker-heading-arrow") as HTMLElement | null;
                if (arrow) {
                    arrow.style.transform = `rotate(${heading}deg)`;
                }
            }
            if (accuracyCircleRef.current) {
                accuracyCircleRef.current.setLatLng(coords);
            }
            if (traveledPolylineRef.current) {
                traveledPolylineRef.current.setLatLngs(traveledPath);
            }
            if (remainingPolylineRef.current) {
                remainingPolylineRef.current.setLatLngs(remainingPath);
            }
            if (followCarrier && leafletMapRef.current) {
                leafletMapRef.current.panTo(coords, { animate: false });
            }

            // Sync React telemetry HUD at 10Hz (every 100ms) for smooth live counters
            if (now - lastUiSyncTime >= 100) {
                lastUiSyncTime = now;
                const wave = Math.sin(nextProgress * 0.25);
                setSimProgress(Number(nextProgress.toFixed(1)));
                setCurrentCoords(coords);
                setGpsHeading(heading);
                setGpsSpeed(Math.round(50 + wave * 6));
                setGpsAccuracy(Number((4.6 + Math.abs(wave) * 0.7).toFixed(1)));
                setFuelTempCelsius(Number((22.3 + wave * 0.2).toFixed(1)));
                setTankPressureBar(Number((1.84 + wave * 0.03).toFixed(2)));
                setFlowRateLpm(Math.round(184 + wave * 5));
                setUllagePercent(Number((94.8 - (nextProgress / 100) * 0.4).toFixed(1)));
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [trackingMode, isPaused, simSpeedMultiplier, followCarrier]);

    // Real Device Hardware GPS mode
    useEffect(() => {
        if (trackingMode !== "device-gps") {
            if (geoWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
                geoWatchIdRef.current = null;
            }
            return;
        }

        if (!navigator.geolocation) {
            setGpsError("Browser Geolocation is not available on this device. Running live route telemetry.");
            setTrackingMode("route-sim");
            return;
        }

        setGpsError(null);

        const handlePositionSuccess = (pos: GeolocationPosition) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const speedKmH = pos.coords.speed !== null && pos.coords.speed !== undefined ? Math.round(pos.coords.speed * 3.6) : 46;
            const heading = pos.coords.heading !== null && pos.coords.heading !== undefined ? Math.round(pos.coords.heading) : 185;
            const accuracy = Number((pos.coords.accuracy || 5).toFixed(1));

            const newPt: [number, number] = [lat, lng];
            setCurrentCoords(newPt);
            setGpsSpeed(speedKmH > 0 ? speedKmH : 44);
            setGpsHeading(heading);
            setGpsAccuracy(accuracy);

            if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setLatLng(newPt);
                const el = vehicleMarkerRef.current.getElement();
                const arrow = el?.querySelector(".tanker-heading-arrow") as HTMLElement | null;
                if (arrow) {
                    arrow.style.transform = `rotate(${heading}deg)`;
                }
            }
            if (accuracyCircleRef.current) {
                accuracyCircleRef.current.setLatLng(newPt);
            }
            if (traveledPolylineRef.current) {
                traveledPolylineRef.current.setLatLngs([DEFAULT_DEPOT_COORDS, newPt]);
            }
            if (remainingPolylineRef.current) {
                remainingPolylineRef.current.setLatLngs([newPt, DEFAULT_DEST_COORDS]);
            }
            if (leafletMapRef.current) {
                leafletMapRef.current.panTo(newPt, { animate: true });
            }

            if (isBroadcastingGps && order) {
                try {
                    localStorage.setItem(`live_gps_order_${order.id}`, JSON.stringify({
                        lat,
                        lng,
                        speed: speedKmH,
                        heading,
                        accuracy,
                        timestamp: Date.now(),
                    }));
                } catch {}
            }
        };

        const handlePositionError = (err: GeolocationPositionError) => {
            setGpsError(err.message || "Hardware GPS permission unavailable. Running live route telemetry stream.");
            setTrackingMode("route-sim");
        };

        const watchId = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 8000,
        });

        geoWatchIdRef.current = watchId;

        return () => {
            if (geoWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
                geoWatchIdRef.current = null;
            }
        };
    }, [trackingMode, isBroadcastingGps, order]);

    const handleScrubProgress = (newPercent: number) => {
        progressRef.current = newPercent;
        const { coords, heading, traveledPath, remainingPath } = interpolateRoute(newPercent);
        setSimProgress(newPercent);
        setCurrentCoords(coords);
        setGpsHeading(heading);

        if (vehicleMarkerRef.current) {
            vehicleMarkerRef.current.setLatLng(coords);
            const el = vehicleMarkerRef.current.getElement();
            const arrow = el?.querySelector(".tanker-heading-arrow") as HTMLElement | null;
            if (arrow) {
                arrow.style.transform = `rotate(${heading}deg)`;
            }
        }
        if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(coords);
        }
        if (traveledPolylineRef.current) {
            traveledPolylineRef.current.setLatLngs(traveledPath);
        }
        if (remainingPolylineRef.current) {
            remainingPolylineRef.current.setLatLngs(remainingPath);
        }
    };

    const handleCenterVehicle = () => {
        if (leafletMapRef.current) {
            leafletMapRef.current.setView(currentCoords, 15, { animate: true });
        }
    };

    const handleFitRoute = () => {
        setFollowCarrier(false);
        if (leafletMapRef.current && glowPolylineRef.current) {
            leafletMapRef.current.fitBounds(glowPolylineRef.current.getBounds(), { padding: [36, 36] });
        }
    };

    if (!order) return null;

    const partnerName = order.supplier?.userName || order.supplier?.username || order.dealer?.userName || order.dealer?.username || "Regional Dispatch Terminal";
    const originLocation = order.supplier ? "Eastern Fuel Refinery Terminal" : "Metropolitan Oil Logistics Depot";
    const destinationLocation = order.address || "Customer Intake Facility";
    const normalizedStatus = (backendTrackingStatus || order.status || "EN ROUTE").toLowerCase();
    const isDelivered = normalizedStatus.includes("delivered") || normalizedStatus.includes("complete") || normalizedStatus.includes("completed") || remainingDistanceKm <= 0.15;

    const content = (
        <div className={`bg-[#0B111E] rounded-2xl border border-[#1E293B] w-full ${isEmbedded ? "" : "max-w-6xl max-h-[96vh]"} flex flex-col overflow-hidden text-white`}>
            {/* Top Telemetry Command Bar */}
            <div className="bg-[#0F172A] border-b border-[#1E293B] px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-[#162238] border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <span className="animate-radar-ripple absolute inset-1 rounded-lg bg-sky-400/20" />
                        <svg className="w-5 h-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-medium text-white">
                                Live Tanker Telemetry & GIS Corridor
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-slate-700 text-slate-200 font-mono tabular-nums text-xs">
                                Order #{order.id}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium ${isDelivered
                                ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                                : "bg-sky-500/15 border border-sky-500/40 text-sky-300"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? "bg-emerald-400" : "bg-sky-400"}`} />
                                {isDelivered ? "Delivered" : remainingDistanceKm <= 0.15 ? "Arriving at manifold" : "In transit"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                            <span>60fps DGPS Stream</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400">
                                {currentCoords[0].toFixed(5)}°N, {currentCoords[1].toFixed(5)}°E
                            </span>
                        </p>
                    </div>
                </div>

                {/* Mode & Map Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-[#162033] p-1 rounded-xl border border-[#263449]">
                        <button
                            type="button"
                            onClick={() => setTrackingMode("route-sim")}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${trackingMode === "route-sim"
                                ? "bg-sky-500 text-slate-950 font-semibold"
                                : "text-slate-300 hover:text-white"
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${trackingMode === "route-sim" ? "bg-slate-950" : "bg-sky-400"}`} />
                            <span>Live Route Stream</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTrackingMode("device-gps")}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${trackingMode === "device-gps"
                                ? "bg-emerald-500 text-slate-950 font-semibold"
                                : "text-slate-300 hover:text-white"
                                }`}
                        >
                            <span>Hardware GPS</span>
                        </button>
                    </div>

                    <select
                        value={mapTheme}
                        onChange={(e) => setMapTheme(e.target.value as keyof typeof MAP_TILES)}
                        className="bg-[#162033] hover:bg-[#1E293B] border border-[#263449] text-xs font-medium text-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                    >
                        <option value="dark">Dark Radar Map</option>
                        <option value="street">OpenStreetMap</option>
                        <option value="light">Daylight Vector</option>
                        <option value="satellite">Orbital Satellite</option>
                    </select>

                    <button
                        type="button"
                        onClick={fetchLiveTracking}
                        disabled={isRefreshing}
                        className="px-3 py-1.5 rounded-xl bg-[#162033] hover:bg-[#1E293B] border border-[#263449] text-xs font-medium text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync</span>
                    </button>

                    {!isEmbedded && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-[#162033] hover:bg-[#1E293B] border border-[#263449] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Close tracker"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Live Route Progress & Checkpoint Ribbon */}
            <div className="bg-[#111A2E] border-b border-[#1E293B] px-5 py-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <span className="text-xs sm:text-sm font-medium text-white">
                            {isDelivered
                                ? "Custody transfer completed at destination manifold"
                                : `Active dispatch corridor: ${originLocation} → ${destinationLocation}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                        <span className="text-slate-400">
                            Corridor progress: <strong className="text-sky-400">{simProgress.toFixed(0)}%</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-semibold">
                            ETA {remainingEtaMins} min ({remainingDistanceKm.toFixed(2)} km)
                        </span>
                    </div>
                </div>

                {/* Interactive Animated Corridor Progress Bar */}
                <div className="relative pt-1">
                    <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-[width] duration-100"
                            style={{ width: `${Math.min(100, Math.max(2, simProgress))}%` }}
                        />
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={simProgress}
                        onChange={(e) => handleScrubProgress(Number(e.target.value))}
                        aria-label="Corridor route progress"
                        className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
                    />
                    <div className="flex justify-between items-center mt-2">
                        {CORRIDOR_CHECKPOINTS.map((cp) => {
                            const reached = simProgress >= cp.threshold;
                            return (
                                <button
                                    key={cp.label}
                                    type="button"
                                    onClick={() => handleScrubProgress(cp.threshold)}
                                    className="flex items-center gap-1.5 text-[11px] cursor-pointer group"
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full transition-colors ${reached ? "bg-emerald-400" : "bg-slate-600 group-hover:bg-slate-400"}`}
                                    />
                                    <span className={`hidden sm:inline transition-colors ${reached ? "text-slate-200 font-medium" : "text-slate-500 group-hover:text-slate-300"}`}>
                                        {cp.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {gpsError && (
                <div className="bg-amber-950/70 border-b border-amber-700/50 px-5 py-2 text-xs text-amber-200 flex items-center justify-between">
                    <span>{gpsError}</span>
                    <button
                        type="button"
                        onClick={() => setGpsError(null)}
                        className="underline font-medium hover:text-white cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Main Split Body: Live Map + Telemetry Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-[420px]">
                <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[#1E293B] relative">
                    <div
                        ref={mapContainerRef}
                        className="w-full h-[360px] sm:h-[440px] bg-[#090E1A] relative z-0"
                    />

                    {/* Live Floating Telemetry Overlay Top-Left */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
                        <div className="bg-[#0F172A]/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-mono tabular-nums flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-radar-ripple absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                            </span>
                            <span className="text-emerald-400 font-medium">
                                {trackingMode === "device-gps" ? "HARDWARE GPS LOCK" : "60FPS TELEMETRY STREAM"}
                            </span>
                        </div>

                        <div className="bg-[#0F172A]/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 font-mono tabular-nums">
                            Precision: <span className="text-emerald-400">±{gpsAccuracy}m</span> · Heading: <span className="text-sky-400">{gpsHeading}°</span>
                        </div>
                    </div>

                    {/* Interactive Playback & Camera Controls Top-Right */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap justify-end">
                        {trackingMode === "route-sim" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsPaused((p) => !p)}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                                >
                                    {isPaused ? "Resume" : "Pause"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSimSpeedMultiplier((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 font-mono tabular-nums text-xs font-medium text-sky-400 transition-colors cursor-pointer"
                                    title="Toggle simulation playback speed"
                                >
                                    {simSpeedMultiplier}x Speed
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                const next = !followCarrier;
                                setFollowCarrier(next);
                                if (next) handleCenterVehicle();
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${followCarrier
                                ? "bg-sky-500 text-slate-950 border-sky-400 font-semibold"
                                : "bg-[#0F172A]/90 hover:bg-[#1E293B] border-slate-700 text-slate-200"
                                }`}
                        >
                            <span>{followCarrier ? "Following Carrier" : "Follow Carrier"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleFitRoute}
                            className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                        >
                            Fit Corridor
                        </button>
                    </div>

                    {/* Live Animated Sensor Gauges Bottom Bar */}
                    <div className="p-4 bg-[#0F172A] border-t border-[#1E293B] space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                            <div className="bg-[#162033] p-2.5 rounded-xl border border-[#263449]">
                                <span className="text-[11px] text-slate-400 block">Carrier velocity</span>
                                <span className="text-base font-semibold text-white font-mono tabular-nums">{gpsSpeed} km/h</span>
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <div className="h-full bg-sky-400 transition-[width] duration-150" style={{ width: `${Math.min(100, (gpsSpeed / 80) * 100)}%` }} />
                                </div>
                            </div>
                            <div className="bg-[#162033] p-2.5 rounded-xl border border-[#263449]">
                                <span className="text-[11px] text-slate-400 block">Distance remaining</span>
                                <span className="text-base font-semibold text-emerald-400 font-mono tabular-nums">{remainingDistanceKm.toFixed(2)} km</span>
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <div className="h-full bg-emerald-400 transition-[width] duration-150" style={{ width: `${Math.min(100, simProgress)}%` }} />
                                </div>
                            </div>
                            <div className="bg-[#162033] p-2.5 rounded-xl border border-[#263449]">
                                <span className="text-[11px] text-slate-400 block">Estimated arrival</span>
                                <span className="text-base font-semibold text-amber-300 font-mono tabular-nums">{remainingEtaMins} mins</span>
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <div className="h-full bg-amber-400 transition-[width] duration-150" style={{ width: `${Math.max(10, 100 - remainingEtaMins * 3)}%` }} />
                                </div>
                            </div>
                            <div className="bg-[#162033] p-2.5 rounded-xl border border-[#263449]">
                                <span className="text-[11px] text-slate-400 block">Cargo temperature</span>
                                <span className="text-base font-semibold text-white font-mono tabular-nums">{fuelTempCelsius}°C <span className="text-[11px] text-emerald-400 font-normal">Normal</span></span>
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <div className="h-full bg-emerald-400 transition-[width] duration-150" style={{ width: "62%" }} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-left">
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Manifold pressure</span>
                                <span className="text-xs font-medium text-amber-300 font-mono tabular-nums">{tankPressureBar} bar</span>
                            </div>
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Flowmeter rate</span>
                                <span className="text-xs font-medium text-sky-300 font-mono tabular-nums">{flowRateLpm} L/min</span>
                            </div>
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Tank ullage</span>
                                <span className="text-xs font-medium text-emerald-300 font-mono tabular-nums">{ullagePercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Dispatch Details Column */}
                <div className="lg:col-span-4 p-5 bg-[#0F172A] flex flex-col justify-between space-y-4 text-xs">
                    <div className="space-y-4">
                        {(userRole.toLowerCase() === "dealer" || userRole.toLowerCase() === "supplier" || userRole.toLowerCase() === "admin") && (
                            <div className="bg-[#162033] p-3.5 rounded-xl border border-[#263449] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-200 text-xs flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                        Driver GPS Broadcast
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isBroadcastingGps}
                                            onChange={(e) => setIsBroadcastingGps(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    {isBroadcastingGps
                                        ? "Streaming your live device coordinates to the customer."
                                        : "Enable to broadcast your device GPS coordinates."}
                                </p>
                            </div>
                        )}

                        <div className="bg-[#162033] p-4 rounded-xl border border-[#263449] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#263449] pb-2">
                                <span className="font-medium text-slate-300 text-xs">
                                    Assigned Tanker Operator
                                </span>
                                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono text-[11px]">
                                    DH-METRO-TA-4491
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[#0F2747] border border-sky-500/40 flex items-center justify-center text-sky-300 font-semibold text-sm shrink-0">
                                    MR
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm text-white">Md. Rafiqul Islam</h4>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono tabular-nums">
                                            4.9
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        HazMat Class 3 Tanker Operator
                                    </p>
                                    <p className="text-[11px] text-emerald-400 font-mono tabular-nums">
                                        1,420 verified dispatches
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setCallAlert("Connecting carrier radio channel to Md. Rafiqul Islam (+880 1711-449182)")}
                                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>Call Driver</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCallAlert("Dispatch control center notified for Order #" + order.id)}
                                    className="py-2 rounded-lg bg-[#263449] hover:bg-[#334155] text-slate-200 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Alert Desk</span>
                                </button>
                            </div>

                            {callAlert && (
                                <div className="p-2.5 rounded-lg bg-sky-950/80 border border-sky-700/50 text-[11px] text-sky-200 animate-fadeIn">
                                    {callAlert}
                                </div>
                            )}
                        </div>

                        <div className="bg-[#162033] p-4 rounded-xl border border-[#263449] space-y-2.5">
                            <span className="font-medium text-slate-300 text-xs block border-b border-[#263449] pb-2">
                                Consignment & Manifest
                            </span>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Fuel grade</span>
                                    <span className="font-medium text-white">{order.product?.name || "Ultra-Low Sulfur Diesel"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Batch volume</span>
                                    <span className="font-mono tabular-nums font-medium text-amber-300">{order.quantity} units ({(Number(order.quantity || 1) * 1000).toLocaleString()} L)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Dispatch party</span>
                                    <span className="font-medium text-white">{partnerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Origin terminal</span>
                                    <span className="font-medium text-slate-300">{originLocation}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Intake manifold</span>
                                    <span className="font-medium text-emerald-400">{destinationLocation}</span>
                                </div>
                                {order.payment?.amount && (
                                    <div className="flex justify-between border-t border-[#263449] pt-2">
                                        <span className="text-slate-400">Settled invoice</span>
                                        <span className="font-mono tabular-nums font-medium text-emerald-400">${order.payment.amount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#263449] border border-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                            Return to Orders
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            {content}
        </div>
    );
}
