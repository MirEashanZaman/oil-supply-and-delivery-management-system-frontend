"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import MyHeader from "@/components/header";
import MyNavigation from "@/components/navigation";
import { PRODUCT_IMAGE_MAP, getProductImage } from "@/components/dashboard/utils";
import { getStoredReviews, OrderReview } from "@/lib/reviews";

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
        title: "Oil Supply & Delivery Management System",
        tagline: "Connecting refinery suppliers, licensed regional dealers, and bulk commercial customers in one streamlined platform.",
        image: "/Brent Crude Oil.jpg",
        badge: "Direct Fuel Distribution",
    },
    {
        id: 2,
        title: "Wholesale & Tanker Fleet Logistics",
        tagline: "Efficient order placement, depot dispatch coordination, and fast scheduled road deliveries.",
        image: "/Ultra-Low Sulfur Diesel.jpg",
        badge: "Reliable Logistics",
    },
    {
        id: 3,
        title: "Transparent Pricing & Verified Invoicing",
        tagline: "Clear per-barrel benchmark rates, secure order verification, and reliable delivery tracking.",
        image: "/Heavy Marine Fuel Oil (HFO).jpg",
        badge: "Verified Energy Grades",
    },
];

export default function Home() {
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isMarqueeMode, setIsMarqueeMode] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [products, setProducts] = useState<CarouselProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [user, setUser] = useState<{ userName?: string; email?: string; title?: string } | null>(null);
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
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        window.location.reload();
    };

    useEffect(() => {
        const fetchHomeProducts = async () => {
            try {
                setIsLoadingProducts(true);
                setProductsError(null);

                const res = await axios.get("/api/products", {
                    withCredentials: true,
                    validateStatus: (status) => status < 500,
                });

                if (Array.isArray(res.data)) {
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
                } else {
                    setProducts([]);
                }
            } catch (err: any) {
                console.warn("Could not fetch products for home carousel:", err);
                setProductsError("Unable to load featured products right now.");
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchHomeProducts();
    }, []);

    useEffect(() => {
        if (!isAutoPlay) return;
        const timer = setInterval(() => {
            setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 4000);
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

    return (
        <div className="w-full max-w-[1240px] flex flex-col items-center">
            <MyHeader name="Home" message="Centralized petroleum supply, dealer management, and delivery tracking" />
            <MyNavigation />

            <div className="w-full bg-[#0F2747] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left border border-[#0F2747]/30">
                <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-[#F59E0B]/20 text-[#F59E0B] px-3 py-1 rounded-full border border-[#F59E0B]/30">
                        Oil Supply & Delivery Platform
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold mt-3 tracking-tight text-white">
                        {user ? `Welcome back, ${user.userName || user.email}` : "Oil Supply & Delivery Management System"}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                        Streamlining energy and fuel trade with direct sourcing from refinery suppliers and certified dealer distribution.
                    </p>
                </div>
                <div className="flex gap-3 items-center flex-wrap shrink-0">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold shadow-sm px-6 flex items-center gap-2 border-none rounded-xl"
                            >
                                <span>Go to Dashboard</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="btn btn-outline text-white border-white/40 hover:bg-white/10 rounded-xl cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold shadow-sm px-6 flex items-center gap-2 border-none rounded-xl"
                            >
                                <span>Sign In</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                            <Link
                                href="/registration"
                                className="btn btn-outline text-white border-white/40 hover:bg-white/10 rounded-xl"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="w-full mb-12">
                <div className="flex items-center justify-between mb-3 px-1 text-left">
                    <div>
                        <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                            <span>Operations Overview</span>
                            <span className="badge bg-[#0F2747] text-[#F59E0B] badge-sm text-[11px] font-bold border-none">Auto-Slide</span>
                        </h2>
                        <p className="text-xs text-[#64748B]">Integrated energy supply and fleet distribution channels</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAutoPlay(!isAutoPlay)}
                            className="btn btn-xs btn-ghost text-xs text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                        >
                            {isAutoPlay ? "Pause" : "Play"}
                        </button>
                    </div>
                </div>

                {productsError && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {productsError}
                    </div>
                )}

                <div className="carousel w-full rounded-2xl shadow-md overflow-hidden relative bg-black h-[360px] md:h-[420px] border border-[#E2E8F0]">
                    {isLoadingProducts ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`home-skeleton-${index}`}
                                className="absolute inset-0 flex items-end justify-start bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse p-6 md:p-12"
                            >
                                <div className="w-full max-w-xl space-y-3">
                                    <div className="h-4 w-32 rounded-full bg-slate-300" />
                                    <div className="h-8 w-3/4 rounded-md bg-slate-300" />
                                    <div className="h-4 w-2/3 rounded-md bg-slate-300" />
                                </div>
                            </div>
                        ))
                    ) : (
                        HERO_SLIDES.map((slide, idx) => (
                            <div
                                key={slide.id}
                                className={`carousel-item absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === currentHeroSlide
                                    ? "opacity-100 translate-x-0 z-10"
                                    : idx < currentHeroSlide
                                        ? "opacity-0 -translate-x-full z-0"
                                        : "opacity-0 translate-x-full z-0"
                                    }`}
                            >
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover brightness-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-6 md:p-12 text-left text-white">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] mb-2 bg-[#F59E0B]/20 w-fit px-3 py-1 rounded-full border border-[#F59E0B]/30">
                                        {slide.badge}
                                    </span>
                                    <h3 className="text-2xl md:text-4xl font-extrabold max-w-2xl leading-tight tracking-tight text-white">
                                        {slide.title}
                                    </h3>
                                    <p className="text-xs md:text-sm text-slate-200 mt-2 max-w-xl leading-relaxed">
                                        {slide.tagline}
                                    </p>
                                    <div className="mt-5 flex gap-3">
                                        <Link href="/dashboard" className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm md:btn-md shadow-sm font-bold border-none rounded-xl">
                                            Explore Products
                                        </Link>
                                        <Link href="/about" className="btn btn-outline btn-sm md:btn-md text-white border-white/50 hover:bg-white/20 rounded-xl">
                                            Learn Logistics
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none">
                        <button
                            onClick={() => setCurrentHeroSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                            className="btn btn-circle btn-sm md:btn-md bg-black/60 hover:bg-black text-white border-none pointer-events-auto shadow-md cursor-pointer"
                            aria-label="Previous Slide"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                            className="btn btn-circle btn-sm md:btn-md bg-black/60 hover:bg-black text-white border-none pointer-events-auto shadow-md cursor-pointer"
                            aria-label="Next Slide"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {HERO_SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentHeroSlide(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentHeroSlide ? "bg-[#F59E0B] w-7" : "bg-white/50 hover:bg-white"
                                    }`}
                                aria-label={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 px-1 text-left gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] tracking-tight">
                                Featured Oil Products & Energy Grades
                            </h2>
                            <span className="badge bg-[#16A34A] text-white text-[11px] font-bold border-none">
                                Live Catalog
                            </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                            Items stream continuously. Hover over any product card to pause and view details.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMarqueeMode(!isMarqueeMode)}
                            className="btn btn-xs rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] text-[#1E293B] hover:bg-[#F5F7FA] cursor-pointer text-xs"
                        >
                            {isMarqueeMode ? "Switch to Manual Mode" : "Switch to Auto Stream"}
                        </button>
                        {!isMarqueeMode && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleScroll("left")}
                                    className="btn btn-circle btn-xs bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F5F7FA] text-[#1E293B] cursor-pointer"
                                    title="Scroll Left"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleScroll("right")}
                                    className="btn btn-circle btn-xs bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F5F7FA] text-[#1E293B] cursor-pointer"
                                    title="Scroll Right"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden">
                    {products.length === 0 ? (
                        <div className="text-center py-12 text-[#64748B]">
                            <p className="font-semibold text-base mb-1 text-[#1E293B]">No products currently available in the catalog.</p>
                            <p className="text-xs">Verified oil products will appear here once listed.</p>
                        </div>
                    ) : isMarqueeMode ? (
                        <div className="carousel w-full overflow-hidden">
                            <div className="animate-carousel-rtl flex gap-6">
                                {products.map((product) => (
                                    <div key={`prod-1-${product.id}`} className="carousel-item">
                                        <div className="card bg-[#FFFFFF] w-80 sm:w-96 shadow-sm border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all text-left rounded-2xl">
                                            <figure className="h-48 w-full overflow-hidden bg-[#F5F7FA]">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                                    }}
                                                />
                                            </figure>
                                            <div className="card-body p-5 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="badge bg-[#F5F7FA] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B]">
                                                            {product.category}
                                                        </span>
                                                        <span className={`badge text-xs font-semibold border-none ${product.stockLevel === "In Stock" ? "bg-[#16A34A] text-white" : product.stockLevel === "Low Stock" ? "bg-[#F59E0B] text-[#1E293B]" : "bg-[#DC2626] text-white"
                                                            }`}>
                                                            {product.stockLevel}
                                                        </span>
                                                    </div>
                                                    <h3 className="card-title text-base sm:text-lg font-bold text-[#1E293B] mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                </div>

                                                <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                                    <span className="text-base font-extrabold text-[#0F2747]">
                                                        {product.price}
                                                    </span>
                                                    <div className="card-actions justify-end">
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm font-bold border-none rounded-xl"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {products.map((product) => (
                                    <div key={`prod-2-${product.id}`} className="carousel-item">
                                        <div className="card bg-[#FFFFFF] w-80 sm:w-96 shadow-sm border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all text-left rounded-2xl">
                                            <figure className="h-48 w-full overflow-hidden bg-[#F5F7FA]">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                                    }}
                                                />
                                            </figure>
                                            <div className="card-body p-5 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="badge bg-[#F5F7FA] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B]">
                                                            {product.category}
                                                        </span>
                                                        <span className={`badge text-xs font-semibold border-none ${product.stockLevel === "In Stock" ? "bg-[#16A34A] text-white" : product.stockLevel === "Low Stock" ? "bg-[#F59E0B] text-[#1E293B]" : "bg-[#DC2626] text-white"
                                                            }`}>
                                                            {product.stockLevel}
                                                        </span>
                                                    </div>
                                                    <h3 className="card-title text-base sm:text-lg font-bold text-[#1E293B] mb-1">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                </div>

                                                <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                                    <span className="text-base font-extrabold text-[#0F2747]">
                                                        {product.price}
                                                    </span>
                                                    <div className="card-actions justify-end">
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm font-bold border-none rounded-xl"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            ref={scrollContainerRef}
                            className="carousel carousel-center rounded-box w-full space-x-6 p-2 overflow-x-auto scroll-smooth"
                        >
                            {products.map((product) => (
                                <div key={product.id} className="carousel-item">
                                    <div className="card bg-[#FFFFFF] w-80 sm:w-96 shadow-sm border border-[#E2E8F0] overflow-hidden text-left rounded-2xl">
                                        <figure className="h-48 w-full overflow-hidden bg-[#F5F7FA]">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                                }}
                                            />
                                        </figure>
                                        <div className="card-body p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="badge bg-[#F5F7FA] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B]">
                                                        {product.category}
                                                    </span>
                                                    <span className={`badge text-xs font-semibold border-none ${product.stockLevel === "In Stock" ? "bg-[#16A34A] text-white" : product.stockLevel === "Low Stock" ? "bg-[#F59E0B] text-[#1E293B]" : "bg-[#DC2626] text-white"
                                                        }`}>
                                                        {product.stockLevel}
                                                    </span>
                                                </div>
                                                <h3 className="card-title text-base sm:text-lg font-bold text-[#1E293B] mb-1">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-[#64748B] line-clamp-2">
                                                    {product.description}
                                                </p>
                                            </div>

                                            <div className="pt-3 mt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                                <span className="text-base font-extrabold text-[#0F2747]">
                                                    {product.price}
                                                </span>
                                                <div className="card-actions justify-end">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm font-bold border-none rounded-xl"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                <div className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#0F2747]/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#0F2747]/10 text-[#0F2747] flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-base text-[#1E293B] mb-1">Direct Refinery Sourcing</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                        Refineries post verified fuel inventory directly, eliminating intermediaries and reducing supply chain bottlenecks.
                    </p>
                </div>

                <div className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#0F2747]/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-base text-[#1E293B] mb-1">Regional Dealer Network</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                        Licensed dealers procure stock in bulk from suppliers and dispatch localized deliveries to commercial customers.
                    </p>
                </div>

                <div className="card bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#0F2747]/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-base text-[#1E293B] mb-1">Scheduled Tanker Delivery</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                        Complete shipment tracking with estimated transit times, destination depot validation, and delivery status logs.
                    </p>
                </div>
            </div>

            {/* Public Verified Delivery Reviews Section (Visible to Everyone) */}
            <div className="w-full mb-12 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-[#E2E8F0] pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="badge bg-[#16A34A] text-white text-[11px] font-bold border-none">
                                100% Verified
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-[#1E293B]">
                                Verified Delivery Reviews & Fuel Ratings
                            </h2>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1">
                            Feedback from commercial buyers, fleet managers, and dealers with confirmed completed deliveries.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            🔒 Only complete order buyers can review
                        </span>
                    </div>
                </div>

                {publicReviews.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center shadow-xs">
                        <p className="text-xs text-slate-500">No verified delivery reviews recorded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {publicReviews.map((rev) => (
                            <div
                                key={rev.orderId}
                                className="card bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex text-amber-500 text-sm">
                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                    <span key={idx} className={idx < rev.rating ? "text-amber-500" : "text-slate-200"}>
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-dark-slate">({rev.rating}/5)</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Verified Delivery #{rev.orderId}
                                        </span>
                                    </div>

                                    <p className="text-xs text-[#1E293B] font-medium leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        "{rev.comment}"
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold text-[#1E293B]">{rev.reviewerName}</p>
                                        <p className="text-[11px] text-[#64748B]">
                                            {rev.reviewerRole || "Commercial Buyer"} · {rev.productName || "Petroleum Grade"}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recent"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-slate-600">
                        <strong className="text-slate-800">Have a delivered order?</strong> Log in to your account, head to the Orders tab, and submit your delivery rating directly on your completed order receipt.
                    </p>
                    <Link
                        href="/dashboard"
                        className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-xs px-4 py-2 rounded-lg font-bold border-none shrink-0"
                    >
                        Go to My Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}