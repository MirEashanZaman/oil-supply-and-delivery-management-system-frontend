"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import { getProductImage } from "@/components/dashboard/utils";
import { getPusherClient } from "@/lib/pusher";
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
    const [, setIsPusherConnected] = useState(false);
    const [, setConnectionStatus] = useState("Connecting");
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
                        const pusherClient = getPusherClient();
                        if (pusherClient) {
                            pusherClient.subscribe("oil-supply-chat");
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
                message={`Specification and dispatch ordering details for lot #${productId}`}
            />
            <MyNavigation />

            <div className="w-full max-w-[1240px] mt-6">
                <div className="breadcrumbs text-xs text-[#6B7487] mb-4 px-1">
                    <ul>
                        <li><Link href="/" className="hover:text-[#0F2747]">Home</Link></li>
                        <li><Link href="/dashboard" className="hover:text-[#0F2747]">Catalog</Link></li>
                        <li className="font-mono tabular-nums font-medium text-[#111827]">Lot #{productId}</li>
                    </ul>
                </div>

                {product ? (
                    <div className="card lg:card-side bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl overflow-hidden">
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
                                <span className="inline-flex items-center gap-1.5 bg-[#0F2747] text-white font-medium text-xs px-3 py-1 rounded-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                    Verified grade
                                </span>
                            </div>
                        </figure>

                        <div className="card-body p-6 sm:p-8 lg:w-1/2 justify-between text-left">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2.5 py-0.5 rounded bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] text-xs font-medium">
                                        {product.category || "Petroleum"}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium ${product.stockLevel === "Out of Stock" ? "bg-rose-50 text-[#DC2626] border border-rose-200" : product.stockLevel === "Low Stock" ? "bg-amber-50 text-[#D97706] border border-amber-200" : "bg-emerald-50 text-[#16A34A] border border-emerald-200"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${product.stockLevel === "Out of Stock" ? "bg-[#DC2626]" : product.stockLevel === "Low Stock" ? "bg-[#D97706]" : "bg-[#16A34A]"}`} />
                                        {product.stockLevel || "In Stock"}
                                    </span>
                                </div>

                                <h1 className="card-title text-2xl sm:text-3xl font-medium text-[#111827]">
                                    {product.name}
                                </h1>

                                <p className="text-[#4B5565] text-xs sm:text-sm leading-relaxed mt-3">
                                    {product.description || "Standard refinery specification."}
                                </p>

                                <div className="mt-5 pt-4 border-t border-[#E2E8F0] space-y-2 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-[#F5F7FA]">
                                        <span className="text-[#6B7487]">Item code</span>
                                        <span className="font-mono tabular-nums font-medium text-[#111827]">OIL-{product.id}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-[#F5F7FA]">
                                        <span className="text-[#6B7487]">Quality standard</span>
                                        <span className="font-medium text-[#111827]">National Refinery & ISO 9001 Grade</span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-[#6B7487]">Delivery method</span>
                                        <span className="font-medium text-[#111827]">Road Tanker / Bulk Depot Dispatch</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs text-[#6B7487] block font-medium">Standard price</span>
                                    <span className="font-mono tabular-nums text-3xl font-semibold text-[#0F2747]">
                                        {typeof product.price === "number" ? `$${product.price.toFixed(2)}` : product.price || "$0.00"}
                                    </span>
                                    <span className="text-xs text-[#6B7487] block">per unit / barrel</span>
                                </div>

                                <div className="card-actions flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setIsInquireModalOpen(true);
                                            setInquirySuccess(false);
                                        }}
                                        className="btn bg-[#0F2747] hover:bg-[#163860] text-white font-medium border-none text-xs sm:text-sm rounded-lg"
                                    >
                                        Inquire Dispatch
                                    </button>
                                    <Link href="/dashboard" className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium border-none text-xs sm:text-sm rounded-lg">
                                        Order Fuel
                                    </Link>
                                    <Link href="/" className="btn bg-white border border-[#CBD5E1] text-[#111827] hover:bg-[#F5F7FA] text-xs sm:text-sm rounded-lg font-medium">
                                        Back
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] p-8 text-center rounded-2xl">
                        <h2 className="text-lg font-medium text-[#111827] mb-1">Product #{productId} not found</h2>
                        <p className="text-[#6B7487] text-xs mb-4">No product record matched this identification number</p>
                        <div className="flex justify-center gap-3">
                            <Link href="/dashboard" className="btn bg-[#0F2747] text-white hover:bg-[#163860] btn-sm rounded-lg font-medium">
                                View Catalog
                            </Link>
                            <Link href="/" className="btn bg-white border border-[#CBD5E1] text-[#111827] btn-sm rounded-lg font-medium">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}

                {product && (
                    <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[#E2E8F0] pb-4">
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-lg sm:text-xl font-medium text-[#111827]">
                                        Customer Delivery Reviews & Ratings
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                        Verified
                                    </span>
                                </div>
                                <p className="text-xs text-[#4B5565] mt-0.5">
                                    Delivery feedback from buyers with completed tanker shipments
                                </p>
                            </div>
                            <span className="text-xs font-medium text-[#6B7487] bg-[#F5F7FA] px-3 py-1 rounded-lg border border-[#E2E8F0] shrink-0">
                                Verified completed buyers only
                            </span>
                        </div>

                        {productReviews.length === 0 ? (
                            <div className="p-6 bg-[#F5F7FA] rounded-xl text-center border border-[#E2E8F0]">
                                <p className="text-xs text-[#6B7487]">No delivery reviews posted for this petroleum product yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {productReviews.map((rev) => (
                                    <div
                                        key={rev.orderId}
                                        className="p-4 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0] flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="font-mono tabular-nums text-xs font-semibold text-[#111827] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded">
                                                    {rev.rating}.0 / 5.0
                                                </span>
                                                <span className="font-mono tabular-nums text-xs font-medium text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    Order #{rev.orderId}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#111827] leading-relaxed">
                                                &ldquo;{rev.comment}&rdquo;
                                            </p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                                            <span className="font-medium text-[#111827]">{rev.reviewerName}</span>
                                            <span className="font-mono tabular-nums text-xs text-[#6B7487]">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] w-full max-w-[500px] text-left p-6 sm:p-8">
                        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-[#111827]">Inquire About Product</h3>
                                <p className="text-xs text-[#6B7487] font-mono tabular-nums">{product.name} · Lot #{product.id}</p>
                            </div>
                            <button
                                onClick={() => setIsInquireModalOpen(false)}
                                className="text-[#6B7487] hover:text-[#111827] p-1 cursor-pointer"
                                aria-label="Close modal"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {inquirySuccess ? (
                            <div className="text-center py-6 space-y-3">
                                <div role="alert" className="alert bg-emerald-50 text-[#16A34A] border border-emerald-200 py-3 rounded-lg text-xs font-medium">
                                    <span>Inquiry sent to the supplier dispatch channel</span>
                                </div>
                                <button
                                    onClick={() => setIsInquireModalOpen(false)}
                                    className="btn bg-[#0F2747] text-white btn-sm rounded-lg font-medium"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendProductInquiry} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[#111827] mb-1">Your name</label>
                                    <input
                                        type="text"
                                        required
                                        value={inquiryName}
                                        placeholder="Full name"
                                        onChange={(e) => setInquiryName(e.target.value)}
                                        className="input input-bordered w-full bg-[#FFFFFF] text-[#111827] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#111827] mb-1">Your email</label>
                                    <input
                                        type="email"
                                        required
                                        value={inquiryEmail}
                                        placeholder="Email address"
                                        onChange={(e) => setInquiryEmail(e.target.value)}
                                        className="input input-bordered w-full bg-[#FFFFFF] text-[#111827] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[#111827] mb-1">Message & volume requirements</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={inquiryMessage}
                                        placeholder="Specify required volume and delivery depot"
                                        onChange={(e) => setInquiryMessage(e.target.value)}
                                        className="textarea textarea-bordered w-full bg-[#FFFFFF] text-[#111827] border-[#CBD5E1] focus:border-[#0F2747] text-xs rounded-lg"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInquireModalOpen(false)}
                                        className="btn bg-white border border-[#CBD5E1] text-[#111827] btn-sm rounded-lg flex-1 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingInquiry}
                                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium btn-sm border-none rounded-lg flex-2"
                                    >
                                        {isSendingInquiry ? "Sending..." : "Send Inquiry"}
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
