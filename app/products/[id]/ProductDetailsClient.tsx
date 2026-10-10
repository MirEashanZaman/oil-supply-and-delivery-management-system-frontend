"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import { getProductImage } from "@/components/dashboard/utils";
import { getPusherClient, ChatMessage } from "@/lib/pusher";
import { getStoredReviews, fetchAllServerReviews, OrderReview } from "@/lib/reviews";

type Product = {
    id: number;
    name: string;
    category?: string;
    price?: string | number;
    description?: string;
    stockLevel?: string;
    image?: string;
};

export default function ProductDetails({
    product,
    productId,
}: {
    product: Product | null;
    productId: string;
}) {

    const [isInquireModalOpen, setIsInquireModalOpen] = useState(false);
    const [isPusherConnected, setIsPusherConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [inquiryName, setInquiryName] = useState("");
    const [inquiryEmail, setInquiryEmail] = useState("");
    const [inquiryMessage, setInquiryMessage] = useState("");
    const [isSendingInquiry, setIsSendingInquiry] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);
    const [productReviews, setProductReviews] = useState<OrderReview[]>([]);

    useEffect(() => {
        const filterForProduct = (reviewsMap: Record<number, OrderReview>) => {
            const all = Object.values(reviewsMap);
            return all.filter(
                (r) =>
                    (product?.id && r.productId === product.id) ||
                    (product?.name && r.productName && r.productName.toLowerCase().includes(product.name.toLowerCase())) ||
                    (product?.name && product.name.toLowerCase().includes((r.productName || "").toLowerCase()))
            );
        };

        const localMap = getStoredReviews();
        setProductReviews(filterForProduct(localMap));

        fetchAllServerReviews().then((liveMap) => {
            setProductReviews(filterForProduct(liveMap));
        });

        const handleReviewsUpdate = (e: any) => {
            if (e?.detail) {
                setProductReviews(filterForProduct(e.detail));
            } else {
                fetchAllServerReviews().then((liveMap) => setProductReviews(filterForProduct(liveMap)));
            }
        };

        window.addEventListener("osdms_reviews_updated", handleReviewsUpdate);
        const pollReviews = setInterval(() => {
            fetchAllServerReviews().then((liveMap) => setProductReviews(filterForProduct(liveMap)));
        }, 4000);

        return () => {
            window.removeEventListener("osdms_reviews_updated", handleReviewsUpdate);
            clearInterval(pollReviews);
        };
    }, [product]);

    useEffect(() => {
        const pusher = getPusherClient();
        if (pusher) {
            const channel = pusher.subscribe("oil-supply-chat");

            channel.bind("pusher:subscription_succeeded", () => {
                setIsPusherConnected(true);
                setConnectionStatus("Connected");
            });

            channel.bind("pusher:subscription_error", (error: { message?: string }) => {
                setConnectionStatus(`Connection failed: ${error.message}`);
                setConnectionAttempts(prev => prev + 1);
                if (connectionAttempts < 3) {
                    setTimeout(() => {
                        const pusher = getPusherClient();
                        if (pusher) {
                            pusher.subscribe("oil-supply-chat");
                        }
                    }, 3000);
                }
            });
        }

        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const u = JSON.parse(stored);
                if (u.userName) setInquiryName(u.userName);
                if (u.email) setInquiryEmail(u.email);
            } catch (err) {
                console.warn(err);
            }
        }
    }, []);

    const handleSendProductInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryName || !inquiryEmail || !inquiryMessage || !product) return;

        setIsSendingInquiry(true);
        try {
            await axios.post("/api/messages", {
                sender: inquiryName,
                email: inquiryEmail,
                topic: `Product Inquiry #${product.id}: ${product.name}`,
                message: inquiryMessage,
                role: "Customer Inquiry",
                channel: "oil-supply-chat",
            });
            setInquirySuccess(true);
            setInquiryMessage("");
        } catch (err) {
            console.warn("Product inquiry transmission failed:", err);
            setInquirySuccess(false);
        } finally {
            setIsSendingInquiry(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader
                name="Product Details"
                message={`Product specification and ordering details for item #${productId}`}
            />
            <MyNavigation />

            <div className="w-full max-w-4xl mt-6">
                <div className="breadcrumbs text-xs text-[#64748B] mb-4 px-1">
                    <ul>
                        <li><Link href="/" className="hover:text-[#0F2747]">Home</Link></li>
                        <li><Link href="/dashboard" className="hover:text-[#0F2747]">Catalog</Link></li>
                        <li className="font-semibold text-[#1E293B]">Product #{productId}</li>
                    </ul>
                </div>

                {product ? (
                    <div className="card lg:card-side bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl overflow-hidden">
                        <figure className="lg:w-1/2 h-72 lg:h-auto bg-[#F5F7FA] relative">
                            <img
                                src={product.image || getProductImage(product.name, product.image, product.id)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                                }}
                            />
                            <div className="absolute top-4 left-4">
                                <span className="badge bg-[#0F2747] text-[#F59E0B] font-bold text-xs px-3 py-1 border-none shadow-sm">
                                    Verified Grade
                                </span>
                            </div>
                        </figure>

                        <div className="card-body p-6 sm:p-8 lg:w-1/2 justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="badge bg-[#F5F7FA] border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold">
                                        {product.category || "Petroleum"}
                                    </span>
                                    <span className={`badge text-xs font-semibold border-none ${product.stockLevel === "Out of Stock" ? "bg-[#DC2626] text-white" : product.stockLevel === "Low Stock" ? "bg-[#F59E0B] text-[#1E293B]" : "bg-[#16A34A] text-white"}`}>
                                        {product.stockLevel || "In Stock"}
                                    </span>
                                </div>

                                <h1 className="card-title text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
                                    {product.name}
                                </h1>

                                <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed mt-3">
                                    {product.description || "No description provided."}
                                </p>

                                <div className="mt-5 pt-4 border-t border-[#E2E8F0] space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                                        <span className="text-[#64748B]">Item Code</span>
                                        <span className="font-mono font-semibold text-[#1E293B]">OIL-{product.id}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                                        <span className="text-[#64748B]">Quality Standard</span>
                                        <span className="font-semibold text-[#1E293B]">Standard National Refinery Grade</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-[#64748B]">Delivery Options</span>
                                        <span className="font-semibold text-[#1E293B]">Tanker Truck / Bulk Depot Dispatch</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider text-[#64748B] block font-bold">Standard Price</span>
                                    <span className="text-3xl font-extrabold text-[#0F2747]">
                                        {typeof product.price === "number" ? `$${product.price.toFixed(2)}` : product.price || "$0.00"}
                                    </span>
                                    <span className="text-xs text-[#64748B] block">per unit / barrel</span>
                                </div>

                                <div className="card-actions flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setIsInquireModalOpen(true);
                                            setInquirySuccess(false);
                                        }}
                                        className="btn bg-[#0F2747] hover:bg-[#163860] text-white font-bold border-none shadow-sm text-xs sm:text-sm rounded-xl"
                                    >
                                        Inquire via PusherJS
                                    </button>
                                    <Link href="/dashboard" className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold border-none shadow-sm text-xs sm:text-sm rounded-xl">
                                        Order Oil Now
                                    </Link>
                                    <Link href="/" className="btn btn-outline border-[#CBD5E1] text-[#1E293B] hover:bg-[#F5F7FA] text-xs sm:text-sm rounded-xl">
                                        Back
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] p-8 text-center shadow-sm rounded-2xl">
                        <h2 className="text-lg font-bold text-[#1E293B] mb-1">Product #{productId} Not Found</h2>
                        <p className="text-[#64748B] text-xs mb-4">No product was found matching this identification number.</p>
                        <div className="flex justify-center gap-3">
                            <Link href="/dashboard" className="btn bg-[#0F2747] text-white hover:bg-[#153e70] btn-sm rounded-xl">
                                View Catalog
                            </Link>
                            <Link href="/" className="btn btn-outline border-[#CBD5E1] text-[#1E293B] btn-sm rounded-xl">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}

                {/* Verified Delivery Reviews Section for this Product (Visible to Everyone) */}
                {product && (
                    <div className="mt-8 bg-white p-5 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16A34A] text-white shadow-none shrink-0">
                                        Verified
                                    </span>
                                    <h2 className="text-lg sm:text-xl font-black text-[#1E293B]">
                                        Customer Delivery Reviews & Ratings
                                    </h2>
                                </div>
                                <p className="text-xs text-[#64748B] mt-0.5">
                                    Real delivery experiences from buyers with confirmed completed tanker shipments.
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shrink-0">
                                Verified completed buyers only
                            </span>
                        </div>

                        {productReviews.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-xl text-center border border-slate-200">
                                <p className="text-xs text-slate-500">No delivery reviews posted for this petroleum product yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {productReviews.map((rev) => (
                                    <div
                                        key={rev.orderId}
                                        className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex text-amber-500 text-xs">
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <span key={idx} className={idx < rev.rating ? "text-amber-500" : "text-slate-200"}>
                                                                ★
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold text-dark-slate">({rev.rating}/5)</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    Delivered Order #{rev.orderId}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-800 italic leading-relaxed">
                                                "{rev.comment}"
                                            </p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-dark-slate">{rev.reviewerName}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recent"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isInquireModalOpen && product && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E2E8F0] w-full max-w-[500px] text-left p-6 sm:p-8">
                        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#1E293B]">Inquire About Product</h3>
                                <p className="text-xs text-[#64748B]">{product.name} (ID: #{product.id})</p>
                            </div>
                            <button
                                onClick={() => setIsInquireModalOpen(false)}
                                className="text-[#64748B] hover:text-[#1E293B] text-xl font-bold cursor-pointer"
                            >
                                x
                            </button>
                        </div>

                        {inquirySuccess ? (
                            <div className="text-center py-6 space-y-3">
                                <div role="alert" className="alert bg-[#16A34A] text-white py-3 rounded-xl border-none text-xs">
                                    <span>Inquiry dispatched in real-time via PusherJS! The supplier has been notified.</span>
                                </div>
                                <button
                                    onClick={() => setIsInquireModalOpen(false)}
                                    className="btn bg-[#0F2747] text-white btn-sm rounded-xl"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendProductInquiry} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={inquiryName}
                                        placeholder="Enter your name"
                                        onChange={(e) => setInquiryName(e.target.value)}
                                        className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">Your Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={inquiryEmail}
                                        placeholder="Enter your email"
                                        onChange={(e) => setInquiryEmail(e.target.value)}
                                        className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">Your Message / Requirements</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={inquiryMessage}
                                        placeholder="Enter your message"
                                        onChange={(e) => setInquiryMessage(e.target.value)}
                                        className="textarea textarea-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-xl"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInquireModalOpen(false)}
                                        className="btn btn-outline border-[#CBD5E1] text-[#1E293B] btn-sm rounded-xl flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingInquiry}
                                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold btn-sm border-none shadow-sm rounded-xl flex-2"
                                    >
                                        {isSendingInquiry ? "Broadcasting..." : "Send via PusherJS"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}