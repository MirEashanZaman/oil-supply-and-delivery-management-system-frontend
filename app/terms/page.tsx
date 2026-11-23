"use client";

import React from "react";
import Link from "next/link";
import MyHeader from "@/components/header";
import MyNavigation from "@/components/navigation";

export default function TermsPage() {
    return (
        <main className="w-full flex flex-col items-center" role="main">
            <MyHeader
                name="Terms & Conditions"
                message="Petroleum supply, custody transfer, and logistics terms of service"
            />
            <MyNavigation />

            <div className="w-full max-w-[1240px] mt-6 space-y-6 text-left">
                <div className="bg-[#0F2747] text-white p-6 sm:p-8 rounded-2xl border border-[#163860]">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
                        <span>Legal & compliance standards</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-white break-words">
                        Terms of Petroleum Supply & Logistics
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                        These terms govern wholesale fuel procurement, road tanker dispatch, custody transfer protocols, and Electronic Proof of Delivery (e-POD) verification on our platform.
                    </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-6 sm:p-8 rounded-2xl space-y-6 text-xs sm:text-sm text-[#111827] overflow-hidden">
                    <section className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-medium text-[#0F2747]">1. Custody Transfer & Electronic Proof of Delivery (e-POD)</h2>
                        <p className="text-[#4B5565] leading-relaxed break-words">
                            Transfer of risk and petroleum title occurs once the bulk road tanker connects to the consignee&apos;s intake terminal manifold and the receiver inputs their verified 4-digit Delivery PIN. Digital flowmeter readings calibrated at 15°C standard temperature govern invoice net volumes.
                        </p>
                    </section>

                    <section className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-medium text-[#0F2747]">2. HazMat & Safety Compliance</h2>
                        <p className="text-[#4B5565] leading-relaxed break-words">
                            All dispatches adhere to Class 3 Flammable Liquid regulations and ISO 9001:2015 handling standards. Consignees must maintain grounded intake reservoirs, clear discharge lanes, and active emergency shutoff valves prior to tanker arrival.
                        </p>
                    </section>

                    <section className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-medium text-[#0F2747]">3. SAGA Financial Settlements & Escrow</h2>
                        <p className="text-[#4B5565] leading-relaxed break-words">
                            Order payments are processed through our distributed 2-Phase Commit SAGA orchestrator. Funds remain in escrow until terminal dispatch confirmation. In the event of supplier inventory shortage or transport failure, automated compensating transactions refund the order balance without penalty.
                        </p>
                    </section>

                    <section className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-medium text-[#0F2747]">4. Pricing, Benchmark Indices & Taxes</h2>
                        <p className="text-[#4B5565] leading-relaxed break-words">
                            Petroleum lot pricing reflects Platts regional indices, plus applicable localized terminal handling fees and statutory energy VAT (10%). Promotional discounts and bulk volume rates apply at the point of checkout authorization.
                        </p>
                    </section>

                    <section className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-medium text-[#0F2747]">5. Account Responsibilities & Role Integrity</h2>
                        <p className="text-[#4B5565] leading-relaxed break-words">
                            Platform participants (Refinery Suppliers, Wholesale Dealers, Delivery Personnel, and Customers) must maintain accurate registration credentials. Tanker drivers must possess valid HazMat commercial endorsements.
                        </p>
                    </section>

                    <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <p className="text-xs text-[#6B7487] font-mono">
                            Last updated: October 2026 · ISO 9001:2015 protocol
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                            <Link
                                href="/registration"
                                className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-sm px-4 rounded-lg font-medium border-none w-full sm:w-auto text-center justify-center"
                            >
                                Back to Registration
                            </Link>
                            <Link
                                href="/dashboard"
                                className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] btn-sm px-4 rounded-lg font-medium border-none w-full sm:w-auto text-center justify-center"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
