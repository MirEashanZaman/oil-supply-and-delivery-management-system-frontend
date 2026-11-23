import Link from "next/link";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";

export const dynamic = "force-static";

export default function AboutUs() {
    return (
        <main className="w-full flex flex-col items-center" role="main">
            <MyHeader name="About" message="Refinery supply, dealer distribution, and bulk fuel custody transfer" />
            <MyNavigation />

            <div className="w-full max-w-[1240px] mt-6 space-y-6">
                <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-8 text-left">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7487] mb-3">
                                <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                <span>System overview</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-[#111827] leading-tight">
                                Oil Supply & Delivery Management System
                            </h1>
                            <p className="mt-3 text-[#4B5565] text-sm sm:text-base leading-relaxed">
                                The Oil Supply & Delivery Management System connects certified petroleum refineries, licensed regional dealers, commercial buyers, and road-tanker fleets on a single operational ledger.
                            </p>
                            <p className="mt-2 text-[#4B5565] text-sm leading-relaxed">
                                By recording procurement lots, depot dispatch schedules, and 4-digit PIN Electronic Proof of Delivery (e-POD) receipts, the platform reduces transit delays and keeps every barrel accountable from refinery gate to intake manifold.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/dashboard"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium border-none rounded-lg px-5 h-11"
                                >
                                    Browse Products
                                </Link>
                                <Link
                                    href="/contact"
                                    className="btn bg-[#F5F7FA] text-[#111827] border border-[#CBD5E1] hover:bg-[#ECEFF4] rounded-lg px-5 h-11 font-medium"
                                >
                                    Contact Team
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Refinery Suppliers</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1">
                                Certified refineries publish fuel inventory lots, manage bulk petroleum allocations, and coordinate terminal tanker dispatches.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Licensed Dealers</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1">
                                Regional distribution stations procure wholesale stock from refinery suppliers and fulfill orders for local commercial facilities.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Direct Customers</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1">
                                Industrial buyers and fleet operators browse verified fuel grades, select their preferred supplier or dealer, and track deliveries in real time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-left">
                    <h2 className="text-lg font-medium text-[#111827] mb-4">How the delivery process works</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="font-mono tabular-nums text-xs font-medium text-[#6B7487]">Step 1</span>
                            <h3 className="text-sm font-medium text-[#111827] mt-1">Catalog order</h3>
                            <p className="text-xs text-[#4B5565] mt-1 leading-relaxed">Browse crude oil, diesel, or gasoline and place orders directly with preferred sourcing parties.</p>
                        </div>
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="font-mono tabular-nums text-xs font-medium text-[#6B7487]">Step 2</span>
                            <h3 className="text-sm font-medium text-[#111827] mt-1">Order dispatch</h3>
                            <p className="text-xs text-[#4B5565] mt-1 leading-relaxed">The supplier or dealer confirms the order, assigns a tanker unit, and schedules the road dispatch.</p>
                        </div>
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <span className="font-mono tabular-nums text-xs font-medium text-[#6B7487]">Step 3</span>
                            <h3 className="text-sm font-medium text-[#111827] mt-1">Delivery & invoicing</h3>
                            <p className="text-xs text-[#4B5565] mt-1 leading-relaxed">Track GPS telemetry until custody transfer is verified via e-POD PIN and a tax invoice is issued.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
