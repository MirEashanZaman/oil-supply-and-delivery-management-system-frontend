import Link from "next/link";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";

export const dynamic = "force-static";

export default function AboutUs() {
    return (
        <main className="w-full flex flex-col items-center" role="main">
            <MyHeader name="About Us" message="Learn about the Oil Supply & Delivery Management System" />
            <MyNavigation />

            <div className="w-full max-w-5xl mt-6 space-y-6">
                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-10 text-left">
                        <div className="max-w-3xl">
                            <span className="badge bg-[#0F2747] text-[#F59E0B] font-bold uppercase tracking-wider text-xs px-3 py-1 mb-3">
                                System Overview
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight leading-tight">
                                Oil Supply & Delivery Management System
                            </h1>
                            <p className="mt-3 text-[#475569] text-sm sm:text-base leading-relaxed">
                                The Oil Supply & Delivery Management System is a centralized web platform designed to streamline the fuel supply chain. It provides an integrated digital ecosystem where certified petroleum suppliers, licensed regional dealers, and commercial customers manage orders, inventory, and logistics with total transparency.
                            </p>
                            <p className="mt-2 text-[#475569] text-sm leading-relaxed">
                                By digitizing procurement workflows and automating order tracking, our system minimizes delivery delays, simplifies invoicing, and ensures that critical fuel resources reach their destination safely and reliably.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/dashboard"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold border-none shadow-sm rounded-xl px-5"
                                >
                                    Browse Products
                                </Link>
                                <Link
                                    href="/contact"
                                    className="btn btn-outline text-[#0F2747] border-[#0F2747] hover:bg-[#0F2747] hover:text-white rounded-xl px-5"
                                >
                                    Contact Team
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#0F2747]/10 text-[#0F2747] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Refinery Suppliers</h2>
                            <p className="text-xs text-[#475569] leading-relaxed mt-1">
                                Sourced directly from certified refineries. Suppliers publish inventory lots, manage bulk petroleum allocations, and coordinate transport dispatches.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Licensed Dealers</h2>
                            <p className="text-xs text-[#475569] leading-relaxed mt-1">
                                Regional intermediaries who purchase wholesale stock from suppliers and deliver to local business customers and industrial facilities.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#16A34A]/15 text-[#16A34A] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Direct Customers</h2>
                            <p className="text-xs text-[#475569] leading-relaxed mt-1">
                                Businesses and fleet operators can browse certified fuel grades, choose their preferred supplier or dealer, and track shipments in real time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-left">
                    <h2 className="text-xl font-bold text-[#1E293B] mb-4">How The Delivery Process Works</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="text-xs font-bold text-[#B45309] uppercase">Step 1</span>
                            <h3 className="text-sm font-bold text-[#1E293B] mt-1">Catalog Order</h3>
                            <p className="text-xs text-[#475569] mt-1">Browse crude oil, diesel, or gasoline and place orders directly with preferred sourcing parties.</p>
                        </div>
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="text-xs font-bold text-[#B45309] uppercase">Step 2</span>
                            <h3 className="text-sm font-bold text-[#1E293B] mt-1">Order Dispatch</h3>
                            <p className="text-xs text-[#475569] mt-1">The supplier or dealer accepts the order, schedules delivery dates, and dispatches tanker logistics.</p>
                        </div>
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="text-xs font-bold text-[#B45309] uppercase">Step 3</span>
                            <h3 className="text-sm font-bold text-[#1E293B] mt-1">Delivery & Invoicing</h3>
                            <p className="text-xs text-[#475569] mt-1">Customers track status in real-time until delivery is completed with instant digital receipts.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}