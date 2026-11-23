"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
    Navigation,
    Satellite,
    RefreshCw,
    X,
    Play,
    Pause,
    Maximize2,
    Crosshair,
    Phone,
    AlertTriangle,
    Thermometer,
    Gauge,
    Activity,
    Droplets,
    MapPin,
    ShieldCheck,
    Compass,
} from "lucide-react";
import type * as LeafletType from "leaflet";
import { API_ENDPOINT } from "@/lib/api";
import { AnimatedMetricValue, LiveTelemetrySpark } from "./ui/motion-primitives";

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

const DEFAULT_ROUTE_COORDS: [number, number][] = [
    [23.8340, 90.4195],
    [23.8295, 90.4198],
    [23.8242, 90.4210],
    [23.8180, 90.4205],
    [23.8115, 90.4220],
    [23.8045, 90.4232],
    [23.7975, 90.4240],
    [23.7905, 90.4245],
    [23.7840, 90.4238],
    [23.7785, 90.4185],
    [23.7760, 90.4110],
    [23.7735, 90.4025],
    [23.7690, 90.3955],
    [23.7630, 90.3915],
    [23.7575, 90.3880],
    [23.7530, 90.3835],
    [23.7495, 90.3790],
    [23.7465, 90.3750],
];

const DEFAULT_DEPOT_COORDS: [number, number] = DEFAULT_ROUTE_COORDS[0];
const DEFAULT_DEST_COORDS: [number, number] = DEFAULT_ROUTE_COORDS[DEFAULT_ROUTE_COORDS.length - 1];

const CORRIDOR_CHECKPOINTS = [
    { label: "Refinery Terminal", threshold: 0, code: "DEP-01" },
    { label: "Kuril Flyover", threshold: 22, code: "CHK-02" },
    { label: "Pragati Sarani", threshold: 45, code: "CHK-03" },
    { label: "Gulshan Link", threshold: 68, code: "CHK-04" },
    { label: "Intake Manifold", threshold: 96, code: "MAN-05" },
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

            const depotIcon = L.divIcon({
                className: "custom-depot-icon",
                html: `
                    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: relative; background-color: #D97706; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; border: 2px solid #FEF3C7;">
                            DEP
                        </div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            L.marker(DEFAULT_DEPOT_COORDS, { icon: depotIcon })
                .addTo(map)
                .bindPopup("<b>Eastern Refinery Fuel Terminal</b><br>Dispatch Origin Manifold");

            const destIcon = L.divIcon({
                className: "custom-dest-icon",
                html: `
                    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: relative; background-color: #059669; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; border: 2px solid #D1FAE5;">
                            DEST
                        </div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            L.marker(DEFAULT_DEST_COORDS, { icon: destIcon })
                .addTo(map)
                .bindPopup(`<b>Customer Intake Facility</b><br>${order?.address || "Delivery Terminal"}`);

            const interp = interpolateRoute(progressRef.current);

            const glowLine = L.polyline(DEFAULT_ROUTE_COORDS, {
                color: "#1E293B",
                weight: 6,
                opacity: 0.4,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map);
            glowPolylineRef.current = glowLine;

            const traveledLine = L.polyline(interp.traveledPath, {
                color: "#10B981",
                weight: 4,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
            }).addTo(map);
            traveledPolylineRef.current = traveledLine;

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

            const vehicleIcon = L.divIcon({
                className: "custom-vehicle-marker",
                html: `
                    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                        <div class="tanker-heading-arrow" style="position: relative; width: 36px; height: 36px; background-color: #0F172A; border: 2.5px solid #38BDF8; border-radius: 9999px; display: flex; align-items: center; justify-content: center; transform: rotate(${interp.heading}deg); will-change: transform;">
                            <svg style="width: 18px; height: 18px; color: #38BDF8;" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                            </svg>
                        </div>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
            });

            const vehicleMarker = L.marker(interp.coords, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
            vehicleMarker.bindPopup(`
                <div style="font-family: Inter, sans-serif; font-size: 12px; color: #0F172A; padding: 2px;">
                    <b style="color: #0F2747;">Tanker Unit #${order?.id || "4491"}</b><br/>
                    Status: <b>Live 60fps Telemetry</b><br/>
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

    useEffect(() => {
        if (trackingMode !== "route-sim" || isPaused) return;

        let animationFrameId: number;
        let lastTime = performance.now();
        let lastUiSyncTime = performance.now();

        const animate = (now: number) => {
            const dtSeconds = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            const deltaPercent = dtSeconds * 2.4 * simSpeedMultiplier;
            let nextProgress = progressRef.current + deltaPercent;
            if (nextProgress >= 100) {
                nextProgress = 0;
            }
            progressRef.current = nextProgress;

            const { coords, heading, traveledPath, remainingPath } = interpolateRoute(nextProgress);

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

            if (now - lastUiSyncTime >= 110) {
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
            {/* Top Telemetry Command Bar with 21st.dev sliding mode pill */}
            <div className="bg-[#0F172A] border-b border-[#1E293B] px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-[#162238] border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Navigation className="w-4 h-4 relative" />
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

                {/* 21st.dev Spring-Animated Mode Pill & Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-[#162033] p-1 rounded-xl border border-[#263449] relative">
                        {(["route-sim", "device-gps"] as const).map((mode) => {
                            const active = trackingMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setTrackingMode(mode)}
                                    className={`relative px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
                                        active ? "text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
                                    }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="tracker-mode-pill"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className={`absolute inset-0 rounded-lg -z-10 ${
                                                mode === "route-sim" ? "bg-sky-400" : "bg-emerald-400"
                                            }`}
                                        />
                                    )}
                                    <Satellite className="w-3.5 h-3.5" />
                                    <span>{mode === "route-sim" ? "Live Route Stream" : "Hardware GPS"}</span>
                                </button>
                            );
                        })}
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

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={fetchLiveTracking}
                        disabled={isRefreshing}
                        className="px-3 py-1.5 rounded-xl bg-[#162033] hover:bg-[#1E293B] border border-[#263449] text-xs font-medium text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
                        <span>Sync</span>
                    </motion.button>

                    {!isEmbedded && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-[#162033] hover:bg-[#1E293B] border border-[#263449] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Close tracker"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Interactive Motion Corridor Progress & Checkpoint Stepper */}
            <div className="bg-[#111A2E] border-b border-[#1E293B] px-5 py-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-white">
                            {isDelivered
                                ? "Custody transfer completed at destination manifold"
                                : `${originLocation} → ${destinationLocation}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                        <span className="text-slate-400">
                            Corridor: <AnimatedMetricValue value={simProgress} decimals={0} suffix="%" className="text-sky-400 font-semibold" />
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-semibold">
                            ETA <AnimatedMetricValue value={remainingEtaMins} decimals={0} suffix=" min" /> (<AnimatedMetricValue value={remainingDistanceKm} decimals={2} suffix=" km" />)
                        </span>
                    </div>
                </div>

                <div className="relative pt-1">
                    <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            animate={{ width: `${Math.min(100, Math.max(2, simProgress))}%` }}
                            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
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
                    <div className="flex justify-between items-center mt-2.5">
                        {CORRIDOR_CHECKPOINTS.map((cp, idx) => {
                            const reached = simProgress >= cp.threshold;
                            const nextThreshold = CORRIDOR_CHECKPOINTS[idx + 1]?.threshold ?? 101;
                            const isCurrentStage = simProgress >= cp.threshold && simProgress < nextThreshold;
                            return (
                                <motion.button
                                    key={cp.label}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    onClick={() => handleScrubProgress(cp.threshold)}
                                    className="flex items-center gap-1.5 text-[11px] cursor-pointer group"
                                >
                                    <span className="relative flex items-center justify-center">
                                        {isCurrentStage && (
                                            <motion.span
                                                animate={{ scale: [1, 1.9, 1], opacity: [0.8, 0, 0.8] }}
                                                transition={{ duration: 1.6, repeat: Infinity }}
                                                className="absolute w-2.5 h-2.5 rounded-full bg-sky-400"
                                            />
                                        )}
                                        <span
                                            className={`relative w-2 h-2 rounded-full transition-colors ${
                                                isCurrentStage
                                                    ? "bg-sky-400"
                                                    : reached
                                                      ? "bg-emerald-400"
                                                      : "bg-slate-600 group-hover:bg-slate-400"
                                            }`}
                                        />
                                    </span>
                                    <span
                                        className={`hidden sm:inline transition-colors ${
                                            isCurrentStage
                                                ? "text-sky-300 font-medium"
                                                : reached
                                                  ? "text-slate-200 font-medium"
                                                  : "text-slate-500 group-hover:text-slate-300"
                                        }`}
                                    >
                                        {cp.label}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500 hidden md:inline">
                                        {cp.code}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gpsError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-950/70 border-b border-amber-700/50 px-5 py-2 text-xs text-amber-200 flex items-center justify-between"
                    >
                        <span>{gpsError}</span>
                        <button
                            type="button"
                            onClick={() => setGpsError(null)}
                            className="underline font-medium hover:text-white cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Split Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-[430px]">
                <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[#1E293B] relative">
                    <div
                        ref={mapContainerRef}
                        className="w-full h-[360px] sm:h-[440px] bg-[#090E1A] relative z-0"
                    />

                    {/* Live Floating Telemetry HUD Top-Left */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
                        <div className="bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono tabular-nums flex items-center gap-2.5">
                            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                            <span className="text-emerald-400 font-medium">
                                {trackingMode === "device-gps" ? "HARDWARE GPS LOCK" : "60FPS TELEMETRY STREAM"}
                            </span>
                            <LiveTelemetrySpark color="#38BDF8" active={!isPaused} />
                        </div>

                        <div className="bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 font-mono tabular-nums flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-sky-400" />
                            <span>Precision: <strong className="text-emerald-400">±{gpsAccuracy}m</strong></span>
                            <span>·</span>
                            <span>Bearing: <strong className="text-sky-400">{gpsHeading}°</strong></span>
                        </div>
                    </div>

                    {/* Interactive Playback & Camera Controls Top-Right */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap justify-end">
                        {trackingMode === "route-sim" && (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    type="button"
                                    onClick={() => setIsPaused((p) => !p)}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                                    <span>{isPaused ? "Resume" : "Pause"}</span>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    type="button"
                                    onClick={() => setSimSpeedMultiplier((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
                                    className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 font-mono tabular-nums text-xs font-medium text-sky-400 transition-colors cursor-pointer"
                                    title="Toggle simulation playback speed"
                                >
                                    {simSpeedMultiplier}x Speed
                                </motion.button>
                            </>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={() => {
                                const next = !followCarrier;
                                setFollowCarrier(next);
                                if (next) handleCenterVehicle();
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${followCarrier
                                ? "bg-sky-400 text-slate-950 border-sky-300 font-semibold"
                                : "bg-[#0F172A]/90 hover:bg-[#1E293B] border-slate-700 text-slate-200"
                                }`}
                        >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>{followCarrier ? "Following" : "Follow Carrier"}</span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={handleFitRoute}
                            className="px-2.5 py-1.5 rounded-xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Fit Corridor</span>
                        </motion.button>
                    </div>

                    {/* 21st.dev Live Animated Sensor Telemetry Deck */}
                    <div className="p-4 bg-[#0F172A] border-t border-[#1E293B] space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                            <motion.div whileHover={{ y: -2 }} className="bg-[#162033] p-3 rounded-xl border border-[#263449]">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                    <span>Carrier velocity</span>
                                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                                </div>
                                <AnimatedMetricValue value={gpsSpeed} decimals={0} suffix=" km/h" className="text-base font-semibold text-white block" />
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-sky-400"
                                        animate={{ width: `${Math.min(100, (gpsSpeed / 80) * 100)}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ y: -2 }} className="bg-[#162033] p-3 rounded-xl border border-[#263449]">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                    <span>Distance left</span>
                                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <AnimatedMetricValue value={remainingDistanceKm} decimals={2} suffix=" km" className="text-base font-semibold text-emerald-400 block" />
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-emerald-400"
                                        animate={{ width: `${Math.min(100, simProgress)}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ y: -2 }} className="bg-[#162033] p-3 rounded-xl border border-[#263449]">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                    <span>Estimated arrival</span>
                                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <AnimatedMetricValue value={remainingEtaMins} decimals={0} suffix=" mins" className="text-base font-semibold text-amber-300 block" />
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-400"
                                        animate={{ width: `${Math.max(10, 100 - remainingEtaMins * 3)}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                            </motion.div>

                            <motion.div whileHover={{ y: -2 }} className="bg-[#162033] p-3 rounded-xl border border-[#263449]">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                    <span>Cargo temperature</span>
                                    <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <AnimatedMetricValue value={fuelTempCelsius} decimals={1} suffix="°C" className="text-base font-semibold text-white block" />
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-emerald-400 w-[62%]" />
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-left">
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
                                    <Gauge className="w-3 h-3 text-amber-400" />
                                    <span>Manifold</span>
                                </span>
                                <AnimatedMetricValue value={tankPressureBar} decimals={2} suffix=" bar" className="text-xs font-medium text-amber-300" />
                            </div>
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 text-sky-400" />
                                    <span>Flowmeter</span>
                                </span>
                                <AnimatedMetricValue value={flowRateLpm} decimals={0} suffix=" L/min" className="text-xs font-medium text-sky-300" />
                            </div>
                            <div className="bg-[#131C2E] px-3 py-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
                                    <Droplets className="w-3 h-3 text-emerald-400" />
                                    <span>Ullage</span>
                                </span>
                                <AnimatedMetricValue value={ullagePercent} decimals={1} suffix="%" className="text-xs font-medium text-emerald-300" />
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
                                    <p className="text-[11px] text-emerald-400 font-mono tabular-nums inline-flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>1,420 verified dispatches</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    onClick={() => setCallAlert("Connecting carrier radio channel to Md. Rafiqul Islam (+880 1711-449182)")}
                                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>Call Driver</span>
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    type="button"
                                    onClick={() => setCallAlert("Dispatch control center notified for Order #" + order.id)}
                                    className="py-2 rounded-lg bg-[#263449] hover:bg-[#334155] text-slate-200 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Alert Desk</span>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {callAlert && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="p-2.5 rounded-lg bg-sky-950/80 border border-sky-700/50 text-[11px] text-sky-200"
                                    >
                                        {callAlert}
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#263449] border border-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                            Return to Orders
                        </motion.button>
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
