"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Pause,
    Play,
    ShieldCheck,
    Truck,
    Zap,
} from "lucide-react";
import MyHeader from "@/components/header";
import MyNavigation from "@/components/navigation";
import { getProductImage } from "@/components/dashboard/utils";
import { getStoredReviews, fetchAllServerReviews, OrderReview } from "@/lib/reviews";
import { SpotlightCard, LiveTelemetrySpark } from "@/components/ui/motion-primitives";

type CarouselProduct = {
    id: number;
    name: string;
    category: string;
    price: string;
    description: string;
    stockLevel: string;
    image: string;
};

const HERO_SLIDES = [
    {
        id: 1,
        title: "Refinery Supply, Dealer Allocation & Tanker Dispatch",
        tagline: "Connecting certified petroleum refineries, regional fuel dealers, and commercial buyers on one operational ledger",
        image: "/Brent Crude Oil.webp",
        badge: "Direct fuel distribution",
    },
    {
        id: 2,
        title: "Wholesale Lots & Road Tanker Fleet Logistics",
        tagline: "Verified depot allocations, scheduled road tanker dispatches, and real-time GPS route telemetry",
        image: "/Ultra-Low Sulfur Diesel.webp",
        badge: "Fleet dispatch",
    },
    {
        id: 3,
        title: "Benchmark Pricing & Electronic Proof of Delivery",
        tagline: "Platts-indexed per-barrel rates, 4-digit PIN custody transfer receipts, and automated tax invoicing",
        image: "/Heavy Marine Fuel Oil (HFO).webp",
        badge: "Verified energy grades",
    },
];

const INITIAL_DEFAULT_PRODUCTS: CarouselProduct[] = [
    { id: 1, name: "Brent Crude Oil", category: "Crude Oil", price: "$82.50", description: "Sweet light crude benchmark extracted from the North Sea.", stockLevel: "In Stock", image: "/Brent Crude Oil.webp" },
    { id: 2, name: "Ultra-Low Sulfur Diesel", category: "Diesel", price: "$94.20", description: "Clean-burning commercial automotive diesel fuel compliant with Euro VI.", stockLevel: "In Stock", image: "/Ultra-Low Sulfur Diesel.webp" },
    { id: 3, name: "Premium Unleaded Gasoline", category: "Octane", price: "$88.75", description: "High-octane RON 95 motor spirit designed for optimal combustion efficiency.", stockLevel: "In Stock", image: "/Premium Unleaded Gasoline.webp" },
    { id: 4, name: "Aviation Turbine Fuel (Jet A-1)", category: "Aviation Fuel", price: "$112.00", description: "Standard kerosene-grade aviation fuel for civil and cargo transport.", stockLevel: "In Stock", image: "/Aviation Turbine Fuel (Jet A-1).webp" },
    { id: 5, name: "Liquefied Petroleum Gas (LPG)", category: "LPG", price: "$45.00", description: "Pressurized propane-butane blend for industrial heating and kitchens.", stockLevel: "In Stock", image: "/images.webp" },
    { id: 6, name: "Heavy Marine Fuel Oil (HFO)", category: "Fuel Oil", price: "$68.30", description: "High-viscosity residual fuel oil for ocean vessels and power generation.", stockLevel: "In Stock", image: "/Heavy Marine Fuel Oil (HFO).webp" },
];

export default function Home() {
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isMarqueeMode, setIsMarqueeMode] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<CarouselProduct[]>(INITIAL_DEFAULT_PRODUCTS);
    const [isLoadingProducts] = useState(false);
    const [productsError] = useState<string | null>(null);
    const [user, setUser] = useState<{ name?: string; userName?: string; email?: string; title?: string } | null>(null);
    const [publicReviews, setPublicReviews] = useState<OrderReview[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (err) {
                console.error("Failed to parse user session:", err);
            }
        }
        const reviewsMap = getStoredReviews();
        setPublicReviews(Object.values(reviewsMap));

        let pollReviews: NodeJS.Timeout | null = null;

        const initBackgroundReviews = () => {
            fetchAllServerReviews().then((liveMap) => {
                setPublicReviews(Object.values(liveMap));
            });

            pollReviews = setInterval(() => {
                fetchAllServerReviews().then((liveMap) => setPublicReviews(Object.values(liveMap)));
            }, 8000);
        };

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            (window as any).requestIdleCallback(initBackgroundReviews, { timeout: 2000 });
        } else {
            setTimeout(initBackgroundReviews, 1500);
        }

        const handleReviewsUpdate = (e: any) => {
            if (e?.detail) {
                setPublicReviews(Object.values(e.detail));
            } else {
                fetchAllServerReviews().then((liveMap) => setPublicReviews(Object.values(liveMap)));
            }
        };

        window.addEventListener("osdms_reviews_updated", handleReviewsUpdate);

        return () => {
            window.removeEventListener("osdms_reviews_updated", handleReviewsUpdate);
            if (pollReviews) clearInterval(pollReviews);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        window.location.reload();
    };

    useEffect(() => {
        const fetchHomeProducts = async () => {
            try {
                const res = await axios.get("/api/products", {
                    withCredentials: true,
                    validateStatus: (status) => status < 500,
                });

                if (Array.isArray(res.data) && res.data.length > 0) {
                    const mapped: CarouselProduct[] = res.data
                        .sort((a: any, b: any) => (a.id || 0) - (b.id || 0))
                        .map((p: any) => ({
                            id: p.id,
                            name: p.name || `Product #${p.id}`,
                            category: p.category || (p.categories?.[0]?.name) || "Petroleum Grade",
                            price: typeof p.price === "number" ? `$${p.price.toFixed(2)}` : p.price || "$0.00",
                            description: (p.description || p.productDescription || p.product_description || p.details || "").trim(),
                            stockLevel: typeof p.quantity === "number"
                                ? (p.quantity <= 0 ? "Out of Stock" : p.quantity < 1000 ? "Low Stock" : "In Stock")
                                : p.stockLevel || "In Stock",
                            image: getProductImage(p.name, p.image, p.id),
                        }));
                    setProducts(mapped);
                }
            } catch (err: any) {
                console.warn("Could not fetch remote products for home carousel, utilizing cached catalog:", err);
            }
        };
        fetchHomeProducts();
    }, []);

    useEffect(() => {
        if (!isAutoPlay) return;
        const timer = setInterval(() => {
            setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isAutoPlay]);

    const handleScroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 380;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const activeSlide = HERO_SLIDES[currentHeroSlide];

    return (
        <main className="w-full max-w-[1240px] flex flex-col items-center" role="main">
            <MyHeader name="Home" message="Centralized petroleum supply, dealer allocation, and tanker delivery tracking" />
            <MyNavigation />

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="w-full bg-[#0F2747] text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left border border-[#163860]"
            >
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-radar-ripple absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
                        </span>
                        <span>{user ? `Signed in as ${user.name || user.userName || user.email?.split("@")[0] || "User"}` : "Direct refinery & dealer network"}</span>
                        <LiveTelemetrySpark color="#F59E0B" active={true} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-medium mt-2 text-white">
                        Oil Supply & Delivery Management System
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                        Procure certified fuel grades directly from refinery suppliers and regional dealers with live tanker telemetry and e-POD custody verification.
                    </p>
                </div>
                <div className="flex gap-3 items-center flex-wrap shrink-0">
                    {user ? (
                        <>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/dashboard"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium px-5 h-11 flex items-center gap-2 border-none rounded-lg"
                                >
                                    <span>Open Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleLogout}
                                className="btn bg-transparent text-slate-200 border border-white/25 hover:bg-white/10 rounded-lg h-11 px-4 font-medium cursor-pointer"
                            >
                                Sign out
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/login"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium px-5 h-11 flex items-center gap-2 border-none rounded-lg"
                                >
                                    <span>Sign in</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/registration"
                                    className="btn bg-transparent text-slate-200 border border-white/25 hover:bg-white/10 rounded-lg h-11 px-4 font-medium"
                                >
                                    Register
                                </Link>
                            </motion.div>
                        </>
                    )}
                </div>
            </motion.div>

            <div className="w-full mb-12">
                <div className="flex items-center justify-between mb-3 px-1 text-left">
                    <div>
                        <h2 className="text-lg sm:text-xl font-medium text-[#111827] flex items-center gap-2">
                            <span>Operations Overview</span>
                            <span className="text-xs font-mono text-[#6B7487]">3 channels</span>
                        </h2>
                        <p className="text-xs text-[#4B5565]">Integrated energy supply and fleet distribution terminals</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsAutoPlay(!isAutoPlay)}
                            aria-label={isAutoPlay ? "Pause automatic slide transition" : "Play automatic slide transition"}
                            className="btn btn-xs btn-ghost text-xs text-[#4B5565] hover:text-[#111827] cursor-pointer font-medium inline-flex items-center gap-1"
                        >
                            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{isAutoPlay ? "Pause" : "Play"}</span>
                        </motion.button>
                    </div>
                </div>

                {productsError && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {productsError}
                    </div>
                )}

                <div className="w-full rounded-2xl overflow-hidden relative bg-[#0F2747] h-[360px] md:h-[420px] border border-[#E2E8F0]">
                    {isLoadingProducts ? (
                        <div className="absolute inset-0 flex items-end justify-start bg-[#ECEFF4] p-6 md:p-12">
                            <div className="w-full max-w-xl space-y-3">
                                <div className="h-4 w-32 rounded bg-slate-300" />
                                <div className="h-8 w-3/4 rounded bg-slate-300" />
                                <div className="h-4 w-2/3 rounded bg-slate-300" />
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSlide.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 w-full h-full"
                            >
                                <motion.div
                                    initial={{ scale: 1 }}
                                    animate={{ scale: 1.06 }}
                                    transition={{ duration: 5.5, ease: "linear" }}
                                    className="w-full h-full relative"
                                >
                                    <Image
                                        src={activeSlide.image}
                                        alt={activeSlide.title}
                                        fill
                                        priority={currentHeroSlide === 0}
                                        unoptimized={currentHeroSlide === 0}
                                        quality={75}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1240px"
                                        className="w-full h-full object-cover brightness-50"
                                    />
                                </motion.div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-6 md:p-12 pb-14 md:pb-14 text-left text-white">
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.38, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#F59E0B] mb-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-radar-ripple absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
                                            </span>
                                            <span>{activeSlide.badge}</span>
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-medium max-w-2xl leading-tight text-white">
                                            {activeSlide.title}
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-200 mt-2 max-w-xl leading-relaxed">
                                            {activeSlide.tagline}
                                        </p>
                                        <div className="mt-5 flex gap-3">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                                <Link href="/dashboard" className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] btn-sm md:btn-md font-medium border-none rounded-lg">
                                                    Explore Products
                                                </Link>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                                <Link href="/about" className="btn bg-transparent btn-sm md:btn-md text-white border border-white/40 hover:bg-white/15 rounded-lg font-medium">
                                                    Learn Logistics
                                                </Link>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none">
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setCurrentHeroSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                            className="btn btn-circle btn-sm md:btn-md bg-black/60 hover:bg-black/80 text-white border-none pointer-events-auto cursor-pointer"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                            className="btn btn-circle btn-sm md:btn-md bg-black/60 hover:bg-black/80 text-white border-none pointer-events-auto cursor-pointer"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 items-center">
                        {HERO_SLIDES.map((s, idx) => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentHeroSlide(idx)}
                                className="p-1.5 flex items-center justify-center cursor-pointer focus:outline-none"
                                aria-label={`Go to slide ${idx + 1}`}
                            >
                                <motion.span
                                    layout
                                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                    className={`block h-2 rounded-full ${idx === currentHeroSlide ? "bg-[#F59E0B] w-7" : "bg-white/60 hover:bg-white w-2"}`}
                                />
                            </button>
                        ))}
                    </div>

                    {isAutoPlay && (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-20">
                            <motion.div
                                key={`progress-${currentHeroSlide}`}
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="h-full bg-[#F59E0B]"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 px-1 text-left gap-3">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-medium text-[#111827]">
                                Petroleum Products & Energy Grades
                            </h2>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                Live catalog
                            </span>
                        </div>
                        <p className="text-xs text-[#4B5565] mt-0.5">
                            Hover over any product card to pause the stream and view grade details
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsMarqueeMode(!isMarqueeMode)}
                            className="btn btn-xs h-8 px-3 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] text-[#111827] hover:bg-[#F5F7FA] cursor-pointer text-xs font-medium"
                        >
                            {isMarqueeMode ? "Switch to manual scroll" : "Switch to auto stream"}
                        </motion.button>
                        {!isMarqueeMode && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleScroll("left")}
                                    className="btn btn-circle btn-xs h-8 w-8 bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F5F7FA] text-[#111827] cursor-pointer"
                                    title="Scroll left"
                                    aria-label="Scroll products left"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleScroll("right")}
                                    className="btn btn-circle btn-xs h-8 w-8 bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F5F7FA] text-[#111827] cursor-pointer"
                                    title="Scroll right"
                                    aria-label="Scroll products right"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 md:p-6 overflow-hidden">
                    {products.length === 0 ? (
                        <div className="text-center py-12 text-[#6B7487]">
                            <p className="font-medium text-base mb-1 text-[#111827]">No products currently available in the catalog</p>
                            <p className="text-xs">Verified petroleum products appear here once listed</p>
                        </div>
                    ) : isMarqueeMode ? (
                        <div className="w-full overflow-hidden">
                            <div className="animate-carousel-rtl flex flex-nowrap">
                                {[1, 2].map((trackIdx) => (
                                    <div key={`track-${trackIdx}`} className="marquee-track" aria-hidden={trackIdx === 2 ? "true" : undefined}>
                                        {products.map((product) => (
                                            <div key={`prod-${trackIdx}-${product.id}`} className="marquee-card">
                                                <SpotlightCard className="card bg-[#FFFFFF] w-full border border-[#E2E8F0] hover:border-[#CBD5E1] text-left rounded-2xl h-full">
                                                    <figure className="h-44 sm:h-48 w-full overflow-hidden bg-[#F5F7FA] shrink-0 relative">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={360}
                                                            height={192}
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                                            }}
                                                        />
                                                    </figure>
                                                    <div className="card-body p-5 flex flex-col justify-between grow">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] truncate max-w-[140px]">
                                                                    {product.category}
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${product.stockLevel === "In Stock" ? "bg-emerald-50 text-[#16A34A] border border-emerald-200" : product.stockLevel === "Low Stock" ? "bg-amber-50 text-[#D97706] border border-amber-200" : "bg-rose-50 text-[#DC2626] border border-rose-200"}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${product.stockLevel === "In Stock" ? "bg-[#16A34A]" : product.stockLevel === "Low Stock" ? "bg-[#D97706]" : "bg-[#DC2626]"}`} />
                                                                    {product.stockLevel}
                                                                </span>
                                                            </div>
                                                            <h3 className="card-title text-base font-medium text-[#111827] mb-1 line-clamp-1">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-xs text-[#4B5565] line-clamp-2 leading-relaxed">
                                                                {product.description}
                                                            </p>
                                                        </div>

                                                        <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                                            <span className="font-mono tabular-nums text-base font-semibold text-[#0F2747]">
                                                                {product.price}
                                                            </span>
                                                            <div className="card-actions justify-end">
                                                                <Link
                                                                    href={`/products/${product.id}`}
                                                                    tabIndex={trackIdx === 2 ? -1 : undefined}
                                                                    aria-hidden={trackIdx === 2 ? "true" : undefined}
                                                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] btn-xs sm:btn-sm font-medium border-none rounded-lg"
                                                                >
                                                                    View Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SpotlightCard>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            ref={scrollContainerRef}
                            className="carousel carousel-center rounded-box w-full space-x-5 p-2 overflow-x-auto scroll-smooth"
                        >
                            {products.map((product) => (
                                <div key={product.id} className="carousel-item">
                                    <SpotlightCard className="card bg-[#FFFFFF] w-80 sm:w-96 border border-[#E2E8F0] text-left rounded-2xl">
                                        <figure className="h-48 w-full overflow-hidden bg-[#F5F7FA]">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                                }}
                                            />
                                        </figure>
                                        <div className="card-body p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="px-2 py-0.5 rounded bg-[#F5F7FA] border border-[#E2E8F0] text-xs font-medium text-[#4B5565]">
                                                        {product.category}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${product.stockLevel === "In Stock" ? "bg-emerald-50 text-[#16A34A] border border-emerald-200" : product.stockLevel === "Low Stock" ? "bg-amber-50 text-[#D97706] border border-amber-200" : "bg-rose-50 text-[#DC2626] border border-rose-200"}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${product.stockLevel === "In Stock" ? "bg-[#16A34A]" : product.stockLevel === "Low Stock" ? "bg-[#D97706]" : "bg-[#DC2626]"}`} />
                                                        {product.stockLevel}
                                                    </span>
                                                </div>
                                                <h3 className="card-title text-base font-medium text-[#111827] mb-1">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-[#4B5565] line-clamp-2 leading-relaxed">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                                <span className="font-mono tabular-nums text-base font-semibold text-[#0F2747]">
                                                    {product.price}
                                                </span>
                                                <div className="card-actions justify-end">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] btn-sm font-medium border-none rounded-lg"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </SpotlightCard>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                <SpotlightCard className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#CBD5E1]">
                    <div>
                        <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-[#0F2747] flex items-center justify-center mb-3">
                            <Zap className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium text-base text-[#111827] mb-1">Direct Refinery Sourcing</h3>
                        <p className="text-xs text-[#4B5565] leading-relaxed">
                            Refineries publish verified fuel inventory directly, reducing supply chain bottlenecks and middleman markups.
                        </p>
                    </div>
                </SpotlightCard>

                <SpotlightCard className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#CBD5E1]">
                    <div>
                        <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-[#0F2747] flex items-center justify-center mb-3">
                            <Truck className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium text-base text-[#111827] mb-1">Regional Dealer Network</h3>
                        <p className="text-xs text-[#4B5565] leading-relaxed">
                            Licensed dealers procure stock in bulk from refinery terminals and dispatch local deliveries to commercial buyers.
                        </p>
                    </div>
                </SpotlightCard>

                <SpotlightCard className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] hover:border-[#CBD5E1]">
                    <div>
                        <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] text-[#0F2747] flex items-center justify-center mb-3">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium text-base text-[#111827] mb-1">Scheduled Tanker Delivery</h3>
                        <p className="text-xs text-[#4B5565] leading-relaxed">
                            End-to-end shipment tracking with estimated transit times, destination depot validation, and e-POD custody receipts.
                        </p>
                    </div>
                </SpotlightCard>
            </div>

            <div className="w-full mb-12 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-medium text-[#111827]">
                                Delivery Reviews & Fuel Ratings
                            </h2>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                Verified deliveries
                            </span>
                        </div>
                        <p className="text-xs text-[#4B5565] mt-1">
                            Feedback from commercial buyers, fleet managers, and dealers with completed tanker deliveries
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#6B7487] bg-[#F5F7FA] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                            Completed order buyers only
                        </span>
                    </div>
                </div>

                {publicReviews.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center">
                        <p className="text-xs text-[#6B7487]">No verified delivery reviews recorded yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {publicReviews.map((rev) => (
                            <SpotlightCard
                                key={rev.orderId}
                                className="card bg-white p-5 rounded-2xl border border-[#E2E8F0]"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-1.5" aria-label={`Rating ${rev.rating} out of 5`}>
                                            <span className="font-mono tabular-nums text-xs font-semibold text-[#111827] bg-[#F5F7FA] border border-[#E2E8F0] px-2 py-0.5 rounded">
                                                {rev.rating}.0 / 5.0
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums font-medium text-[#16A34A] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                            Order #{rev.orderId}
                                        </span>
                                    </div>

                                    <p className="text-xs text-[#111827] leading-relaxed bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0]">
                                        &ldquo;{rev.comment}&rdquo;
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-medium text-[#111827]">{rev.reviewerName}</p>
                                        <p className="text-xs text-[#4B5565]">
                                            {rev.reviewerRole || "Commercial Buyer"} · {rev.productName || "Petroleum Grade"}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[#6B7487] font-mono tabular-nums">
                                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recent"}
                                    </span>
                                </div>
                            </SpotlightCard>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 rounded-xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-[#4B5565]">
                        <span className="font-medium text-[#111827]">Completed a delivery?</span> Sign in to your account, open the Orders tab, and record your delivery rating on the receipt.
                    </p>
                    <Link
                        href="/dashboard"
                        className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-xs h-8 px-4 rounded-lg font-medium border-none shrink-0"
                    >
                        Go to My Orders
                    </Link>
                </div>
            </div>

            <div className="w-full mb-12 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7487] mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                        <span>Help & compliance</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-medium text-[#111827]">Questions on Procurement or Electronic Proof of Delivery?</h2>
                    <p className="text-xs text-[#4B5565] mt-1 max-w-xl leading-relaxed">
                        Read our public knowledge base covering Euro V diesel specs, HazMat transport protocols, Platts wholesale pricing, and 4-digit PIN delivery receipts.
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                    <Link
                        href="/faq"
                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium text-xs rounded-lg px-5 h-10 border-none"
                    >
                        View FAQ
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
