"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import type * as LeafletType from "leaflet";
import { API_ENDPOINT } from "@/lib/api";

export type TrackingOrderData = {
    id: number;
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

const DEFAULT_DEPOT_COORDS: [number, number] = [23.8340, 90.4195];
const DEFAULT_DEST_COORDS: [number, number] = [23.7465, 90.3750];
const DEFAULT_ROUTE_COORDS: [number, number][] = [
    [23.8340, 90.4195],
    [23.8180, 90.4150],
    [23.7940, 90.4045],
    [23.7780, 90.3980],
    [23.7590, 90.3900],
    [23.7465, 90.3750],
];

const MAP_TILES = {
    dark: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri, HERE, Garmin',
    },
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    },
    light: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri',
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri &mdash; Earthstar Geographics',
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

export default function UberMapTracker({ order, userRole = "customer", onClose, isEmbedded = false }: UberMapTrackerProps) {

    const [trackingMode, setTrackingMode] = useState<"device-gps" | "live-stream" | "route-sim">("device-gps");
    const [mapTheme, setMapTheme] = useState<keyof typeof MAP_TILES>("dark");
    const [isBroadcastingGps, setIsBroadcastingGps] = useState<boolean>(false);
    const [gpsPermissionState, setGpsPermissionState] = useState<string>("prompt");
    const [gpsError, setGpsError] = useState<string | null>(null);

    const [currentCoords, setCurrentCoords] = useState<[number, number]>(DEFAULT_ROUTE_COORDS[2]);
    const [gpsAccuracy, setGpsAccuracy] = useState<number>(8.5);
    const [gpsSpeed, setGpsSpeed] = useState<number>(48);
    const [gpsHeading, setGpsHeading] = useState<number>(195);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [backendTrackingStatus, setBackendTrackingStatus] = useState<string>("IN TRANSIT");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [callAlert, setCallAlert] = useState<string | null>(null);
    const [simProgress, setSimProgress] = useState<number>(45);

    // Live IoT Tanker Sensor Telematics
    const [fuelTempCelsius, setFuelTempCelsius] = useState<number>(22.4);
    const [tankPressureBar, setTankPressureBar] = useState<number>(1.85);
    const [flowRateLpm, setFlowRateLpm] = useState<number>(185);
    const [ullagePercent, setUllagePercent] = useState<number>(94.6);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<LeafletType.Map | null>(null);
    const vehicleMarkerRef = useRef<LeafletType.Marker | null>(null);
    const accuracyCircleRef = useRef<LeafletType.Circle | null>(null);
    const routePolylineRef = useRef<LeafletType.Polyline | null>(null);
    const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);
    const geoWatchIdRef = useRef<number | null>(null);

    const destCoords = DEFAULT_DEST_COORDS;
    const remainingDistanceKm = useMemo(() => {
        return calculateDistanceKm(currentCoords[0], currentCoords[1], destCoords[0], destCoords[1]);
    }, [currentCoords]);

    const remainingEtaMins = useMemo(() => {
        const speed = gpsSpeed > 5 ? gpsSpeed : 35;
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
            if (!mapContainerRef.current) return;
            if (leafletMapRef.current) return;

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
                    <div style="background-color: #D97706; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.6); border: 2px solid white;">
                        DEP
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            });
            L.marker(DEFAULT_DEPOT_COORDS, { icon: depotIcon })
                .addTo(map)
                .bindPopup("<b>Eastern Refinery Fuel Terminal</b><br>Refinery Dispatch Origin Hub");

            const destIcon = L.divIcon({
                className: "custom-dest-icon",
                html: `
                    <div style="background-color: #059669; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.6); border: 2px solid white;">
                        DEST
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            });
            L.marker(DEFAULT_DEST_COORDS, { icon: destIcon })
                .addTo(map)
                .bindPopup(`<b>Customer Facility</b><br>${order?.address || "Delivery Site"}`);

            const polyline = L.polyline(DEFAULT_ROUTE_COORDS, {
                color: "#3B82F6",
                weight: 5,
                opacity: 0.85,
                dashArray: "8, 8",
                lineCap: "round",
            }).addTo(map);
            routePolylineRef.current = polyline;

            const vehicleIcon = L.divIcon({
                className: "custom-vehicle-marker",
                html: `
                    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; inset: 0; background-color: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="position: relative; width: 32px; height: 32px; background-color: #0F172A; border: 3px solid #38BDF8; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.8); transform: rotate(${gpsHeading}deg);">
                            <svg style="width: 18px; height: 18px; color: #38BDF8;" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                            </svg>
                        </div>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
            });

            const vehicleMarker = L.marker(currentCoords, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
            vehicleMarker.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; color: #0F172A; padding: 2px;">
                    <b style="color: #1E3A8A;">Fuel Tanker #${order?.id || "4491"}</b><br/>
                    Status: <b>Live Real-Time GPS</b><br/>
                    Speed: <b>${gpsSpeed} km/h</b>
                </div>
            `);
            vehicleMarkerRef.current = vehicleMarker;

            const accuracyCircle = L.circle(currentCoords, {
                radius: gpsAccuracy,
                color: "#38BDF8",
                fillColor: "#38BDF8",
                fillOpacity: 0.15,
                weight: 1,
            }).addTo(map);
            accuracyCircleRef.current = accuracyCircle;

            leafletMapRef.current = map;
        }

        initMap();

        return () => {
            isMounted = false;
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
        if (!leafletMapRef.current || !vehicleMarkerRef.current) return;

        const L = (window as unknown as { L?: typeof LeafletType }).L;
        const newLatLng: [number, number] = currentCoords;

        vehicleMarkerRef.current.setLatLng(newLatLng);

        import("leaflet").then((Leaflet) => {
            const vehicleIcon = Leaflet.divIcon({
                className: "custom-vehicle-marker",
                html: `
                    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; inset: 0; background-color: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="position: relative; width: 32px; height: 32px; background-color: #0F172A; border: 3px solid #38BDF8; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.8); transform: rotate(${gpsHeading}deg); transition: transform 0.3s ease;">
                            <svg style="width: 18px; height: 18px; color: #38BDF8;" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                            </svg>
                        </div>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
            });
            if (vehicleMarkerRef.current) {
                vehicleMarkerRef.current.setIcon(vehicleIcon);
            }
        });

        if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(newLatLng);
            accuracyCircleRef.current.setRadius(Math.max(5, gpsAccuracy));
        }

        if (routePolylineRef.current && trackingMode === "device-gps") {
            routePolylineRef.current.setLatLngs([DEFAULT_DEPOT_COORDS, currentCoords, DEFAULT_DEST_COORDS]);
        }
    }, [currentCoords, gpsHeading, gpsAccuracy, trackingMode]);

    useEffect(() => {
        if (trackingMode !== "device-gps") {
            if (geoWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
                geoWatchIdRef.current = null;
            }
            return;
        }

        if (!navigator.geolocation) {
            setGpsError("Browser Geolocation is not supported on this device.");
            setTrackingMode("route-sim");
            return;
        }

        setGpsError(null);
        setGpsPermissionState("requesting");

        const handlePositionSuccess = (pos: GeolocationPosition) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const speedKmH = pos.coords.speed !== null && pos.coords.speed !== undefined ? Math.round(pos.coords.speed * 3.6) : 42;
            const heading = pos.coords.heading !== null && pos.coords.heading !== undefined ? Math.round(pos.coords.heading) : 180;
            const accuracy = Math.round(pos.coords.accuracy || 5);

            setCurrentCoords([lat, lng]);
            setGpsSpeed(speedKmH > 0 ? speedKmH : 38);
            setGpsHeading(heading);
            setGpsAccuracy(accuracy);
            setLastUpdated(new Date());
            setGpsPermissionState("granted");

            if (leafletMapRef.current) {
                leafletMapRef.current.panTo([lat, lng], { animate: true });
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
                } catch {

                }
            }
        };

        const handlePositionError = (err: GeolocationPositionError) => {
            console.warn("Geolocation watch warning:", err.message);
            setGpsPermissionState("denied");
            setGpsError(err.message || "GPS location permission was denied. Switched to high-precision telematics stream.");

            setTrackingMode("route-sim");
        };

        const watchId = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
        });

        geoWatchIdRef.current = watchId;

        return () => {
            if (geoWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
                geoWatchIdRef.current = null;
            }
        };
    }, [trackingMode, isBroadcastingGps, order]);

    useEffect(() => {
        if (trackingMode !== "route-sim") return;

        const interval = setInterval(() => {
            setSimProgress((prev) => {
                const next = prev >= 100 ? 0 : prev + 0.5;

                const waypoints = DEFAULT_ROUTE_COORDS;
                const totalSegments = waypoints.length - 1;
                const segmentProgress = (next / 100) * totalSegments;
                const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
                const localT = segmentProgress - segmentIndex;

                const p1 = waypoints[segmentIndex];
                const p2 = waypoints[segmentIndex + 1];

                const currentLat = p1[0] + (p2[0] - p1[0]) * localT;
                const currentLng = p1[1] + (p2[1] - p1[1]) * localT;

                const dLat = p2[0] - p1[0];
                const dLng = p2[1] - p1[1];
                const angle = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);

                setCurrentCoords([currentLat, currentLng]);
                setGpsHeading((angle + 360) % 360);
                setGpsSpeed(44 + Math.round(Math.sin(next) * 8));
                setGpsAccuracy(6.2);
                setLastUpdated(new Date());

                return next;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [trackingMode]);

    const handleCenterVehicle = () => {
        if (leafletMapRef.current) {
            leafletMapRef.current.setView(currentCoords, 15, { animate: true });
        }
    };

    const handleFitRoute = () => {
        if (leafletMapRef.current && routePolylineRef.current) {
            leafletMapRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
        }
    };

    if (!order) return null;

    const partnerName = order.supplier?.userName || order.supplier?.username || order.dealer?.userName || order.dealer?.username || "Regional Dispatch Terminal";
    const originLocation = order.supplier ? "Eastern Fuel Refinery Terminal" : "Metropolitan Oil Logistics Depot";
    const destinationLocation = order.address || "Customer Terminal Facility";
    const normalizedStatus = (backendTrackingStatus || order.status || "EN ROUTE").toLowerCase();
    const isDelivered = normalizedStatus.includes("delivered") || normalizedStatus.includes("complete") || normalizedStatus.includes("completed") || remainingDistanceKm <= 0.2;

    const content = (
        <div className={`bg-[#0F172A] rounded-2xl border border-[#334155] w-full ${isEmbedded ? "" : "max-w-6xl max-h-[96vh]"} flex flex-col overflow-hidden text-white`}>

            { }
            <div className="bg-[#0B1329] border-b border-[#1E293B] px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black border border-[#334155] flex items-center justify-center text-white font-black text-xs tracking-tighter">
                        UBER
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                                Real-Time GPS Live Tracker
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-primary/40 border border-primary text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                                Order #{order.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDelivered
                                ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300"
                                : "bg-amber-500/20 border border-amber-500 text-amber-300"
                                }`}>
                                {isDelivered ? "DELIVERY COMPLETE" : remainingDistanceKm <= 0.1 ? "ARRIVED AT SITE" : backendTrackingStatus || "EN ROUTE"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>Real-world OpenStreetMap GIS Telematics</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-mono text-[11px]">
                                Lat: {currentCoords[0].toFixed(5)}°, Lng: {currentCoords[1].toFixed(5)}°
                            </span>
                        </p>
                    </div>
                </div>

                { }
                <div className="flex items-center gap-2 flex-wrap">
                    { }
                    <div className="flex items-center bg-[#1E293B] p-1 rounded-xl border border-[#334155]">
                        <button
                            type="button"
                            onClick={() => setTrackingMode("device-gps")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${trackingMode === "device-gps"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-300 hover:text-white"
                                }`}
                            title="Use your device's actual live GPS hardware"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Device Live GPS</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTrackingMode("route-sim")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${trackingMode === "route-sim"
                                ? "bg-primary text-white"
                                : "text-slate-300 hover:text-white"
                                }`}
                            title="Autonomous live navigation trajectory"
                        >
                            <span>Simulated GPS</span>
                        </button>
                    </div>

                    { }
                    <select
                        value={mapTheme}
                        onChange={(e) => setMapTheme(e.target.value as keyof typeof MAP_TILES)}
                        className="bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                    >
                        <option value="dark">Uber Dark Map</option>
                        <option value="street">OpenStreetMap</option>
                        <option value="light">Carto Light</option>
                        <option value="satellite">Satellite Map</option>
                    </select>

                    <button
                        type="button"
                        onClick={fetchLiveTracking}
                        disabled={isRefreshing}
                        className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Sync tracking status from backend"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            { }
            <div className="bg-[#059669] px-4 py-2.5 flex items-center justify-between text-white flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-black/25 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-100 font-bold block">
                            {trackingMode === "device-gps" ? "Active Device Hardware GPS" : "Autonomous Route GIS Guidance"}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                            {isDelivered
                                ? "Delivery complete and handoff confirmed at the destination terminal"
                                : remainingDistanceKm <= 0.2
                                    ? "Carrier has arrived at the destination terminal"
                                    : `In transit towards ${destinationLocation} via Pragati Sarani`}
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] text-emerald-100 block font-medium">Estimated Live Arrival</span>
                    <span className="text-sm sm:text-base font-black font-mono">
                        {isDelivered ? "Delivered" : remainingDistanceKm <= 0.2 ? "Arrived" : `${remainingEtaMins} MINS (${remainingDistanceKm.toFixed(2)} km away)`}
                    </span>
                </div>
            </div>

            {gpsError && (
                <div className="bg-amber-900/60 border-b border-amber-600/50 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span>{gpsError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setTrackingMode("device-gps")}
                        className="underline font-bold hover:text-white cursor-pointer"
                    >
                        Retry GPS Permission
                    </button>
                </div>
            )}

            { }
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-[380px]">

                { }
                <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[#1E293B] relative">

                    { }
                    <div
                        ref={mapContainerRef}
                        className="w-full h-[340px] sm:h-[420px] bg-[#0B1120] relative z-0"
                    />

                    { }
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
                        <div className="bg-black/85 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                            <span className="text-emerald-400 font-bold">
                                {trackingMode === "device-gps" ? "REAL DEVICE GPS LOCK" : "SIMULATED SATELLITE GPS"}
                            </span>
                        </div>

                        <div className="bg-black/85 px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 font-mono">
                            GPS Precision: <span className="text-emerald-400 font-bold">±{gpsAccuracy}m</span> | Heading: <span className="text-white font-bold">{gpsHeading}°</span>
                        </div>
                    </div>

                    { }
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCenterVehicle}
                            className="px-2.5 py-1.5 rounded-xl bg-black/85 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 hover:border-primary"
                            title="Center map on live vehicle position"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>Center Carrier</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleFitRoute}
                            className="px-2.5 py-1.5 rounded-xl bg-black/85 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 hover:border-emerald-500"
                            title="Zoom out to show entire depot-to-destination corridor"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span>Fit Corridor</span>
                        </button>
                    </div>

                    {/* Bottom Status & Metrics Strip */}
                    <div className="p-3.5 bg-[#0B1329] border-t border-[#1E293B] space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <div className="bg-[#1E293B] p-2 rounded-xl border border-[#334155]">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Live Speed</span>
                                <span className="text-sm font-black text-white font-mono">{gpsSpeed} KM/H</span>
                            </div>
                            <div className="bg-[#1E293B] p-2 rounded-xl border border-[#334155]">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance Remaining</span>
                                <span className="text-sm font-black text-emerald-400 font-mono">{remainingDistanceKm.toFixed(2)} KM</span>
                            </div>
                            <div className="bg-[#1E293B] p-2 rounded-xl border border-[#334155]">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">ETA</span>
                                <span className="text-sm font-black text-amber-300 font-mono">{remainingEtaMins} MINS</span>
                            </div>
                            <div className="bg-[#1E293B] p-2 rounded-xl border border-[#334155]">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">GPS Fix</span>
                                <span className="text-sm font-black text-emerald-400 font-mono">3D DGPS (±{gpsAccuracy}m)</span>
                            </div>
                        </div>

                        {/* IoT Cargo & HazMat Sensors */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 border-t border-[#1E293B]/70">
                            <div className="bg-[#131F38] p-1.5 rounded-lg border border-sky-900/50">
                                <span className="text-[9px] text-sky-300 uppercase font-bold block">🌡️ Cargo Temp</span>
                                <span className="text-xs font-black text-white font-mono">{fuelTempCelsius}°C <span className="text-[9px] text-emerald-400">(Norm)</span></span>
                            </div>
                            <div className="bg-[#131F38] p-1.5 rounded-lg border border-sky-900/50">
                                <span className="text-[9px] text-sky-300 uppercase font-bold block">⚖️ Tank Pressure</span>
                                <span className="text-xs font-black text-amber-300 font-mono">{tankPressureBar} Bar</span>
                            </div>
                            <div className="bg-[#131F38] p-1.5 rounded-lg border border-sky-900/50">
                                <span className="text-[9px] text-sky-300 uppercase font-bold block">⛽ Flowmeter</span>
                                <span className="text-xs font-black text-sky-300 font-mono">{flowRateLpm} LPM</span>
                            </div>
                            <div className="bg-[#131F38] p-1.5 rounded-lg border border-sky-900/50">
                                <span className="text-[9px] text-sky-300 uppercase font-bold block">📊 Ullage / Volume</span>
                                <span className="text-xs font-black text-emerald-300 font-mono">{ullagePercent}% Full</span>
                            </div>
                        </div>
                    </div>
                </div>

                { }
                <div className="lg:col-span-4 p-5 bg-[#0F172A] flex flex-col justify-between space-y-4 text-xs">
                    <div className="space-y-4">

                        { }
                        {(userRole.toLowerCase() === "dealer" || userRole.toLowerCase() === "supplier" || userRole.toLowerCase() === "admin") && (
                            <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                        Driver Live GPS Broadcast
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isBroadcastingGps}
                                            onChange={(e) => setIsBroadcastingGps(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    {isBroadcastingGps
                                        ? "Streaming your live device coordinates to customer in real-time."
                                        : "Turn ON to broadcast your phone's real GPS to the customer."}
                                </p>
                            </div>
                        )}

                        { }
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#334155] pb-2">
                                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                                    Lead Tanker Dispatch Lead
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px] font-bold">
                                    DH-METRO-TA-4491
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-black text-base shrink-0">
                                    MR
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-sm text-white">Md. Rafiqul Islam</h4>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                            4.9
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Certified Hazardous Cargo Logistics Lead
                                    </p>
                                    <p className="text-[10px] text-emerald-400 font-mono">
                                        1,420+ Safe Dispatches Completed
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setCallAlert("Dispatching secure carrier radio call to Md. Rafiqul Islam (+880 1711-449182)...")}
                                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span>Call Driver</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCallAlert("Emergency dispatch coordination center notified for Order #" + order.id)}
                                    className="py-2 rounded-lg bg-[#334155] hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Emergency</span>
                                </button>
                            </div>

                            {callAlert && (
                                <div className="p-2 rounded-lg bg-blue-900/50 border border-blue-500/50 text-[11px] text-blue-200 animate-fadeIn">
                                    {callAlert}
                                </div>
                            )}
                        </div>

                        { }
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-2.5">
                            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block border-b border-[#334155] pb-1.5">
                                Fuel Cargo & Route Details
                            </span>

                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Product:</span>
                                    <span className="font-bold text-white">{order.product?.name || "Petroleum Grade Fuel"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Volume:</span>
                                    <span className="font-bold text-amber-400">{order.quantity} Barrels / Units</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Supplier:</span>
                                    <span className="font-bold text-white">{partnerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Origin Depot:</span>
                                    <span className="font-bold text-slate-300">{originLocation}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Destination:</span>
                                    <span className="font-bold text-emerald-400">{destinationLocation}</span>
                                </div>
                                {order.payment?.amount && (
                                    <div className="flex justify-between border-t border-[#334155] pt-1.5">
                                        <span className="text-slate-400">Settled Invoice:</span>
                                        <span className="font-bold text-emerald-400">${order.payment.amount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-primary hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            {content}
        </div>
    );
}
