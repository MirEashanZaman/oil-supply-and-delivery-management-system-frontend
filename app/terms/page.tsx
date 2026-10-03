"use client";

import React from "react";
import Link from "next/link";
import MyHeader from "@/components/header";
import MyNavigation from "@/components/navigation";

export default function TermsPage() {
    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader
                name="Terms & Conditions"
                message="Enterprise Petroleum Supply, Custody Transfer & Logistics Terms of Service"
            />
            <MyNavigation />

            <div className="w-full max-w-4xl mt-4 sm:mt-6 space-y-4 sm:space-y-6 text-left px-1 sm:px-0">
                <div className="bg-gradient-to-r from-[#0F2747] to-[#1E3A8A] !text-white p-5 sm:p-10 rounded-2xl shadow-md border border-[#163860]">
                    <span className="badge bg-[#F59E0B] text-[#1E293B] font-bold text-xs uppercase px-3 py-1 mb-2">
                        Legal & Compliance Standards
                    </span>
                    <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white break-words">
                        Terms of Petroleum Supply & Logistics
                    </h1>
                    <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                        These Terms and Conditions govern wholesale fuel procurement, road tanker dispatch, custody transfer protocols, and Electronic Proof of Delivery (e-POD) verification on our platform.
                    </p>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-5 sm:p-8 rounded-2xl space-y-5 sm:space-y-6 text-xs sm:text-sm text-dark-slate shadow-sm overflow-hidden">
                    <section className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0F2747]">1. Custody Transfer & Electronic Proof of Delivery (e-POD)</h2>
                        <p className="text-secondary-gray leading-relaxed break-words">
                            Transfer of risk and petroleum title occurs once the bulk road tanker connects to the consignee's intake terminal manifold and the receiver inputs their verified 4-digit Delivery PIN. Digital flowmeter readings calibrated at 15°C standard temperature govern invoice net volumes.
                        </p>
                    </section>

                    <section className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0F2747]">2. HazMat & Safety Compliance</h2>
                        <p className="text-secondary-gray leading-relaxed break-words">
                            All dispatches strictly adhere to Class 3 Flammable Liquid regulations and ISO 9001:2015 handling standards. Consignees must maintain grounded intake reservoirs, clear discharge lanes, and active emergency shutoff valves prior to tanker arrival.
                        </p>
                    </section>

                    <section className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0F2747]">3. SAGA Financial Settlements & Escrow</h2>
                        <p className="text-secondary-gray leading-relaxed break-words">
                            Order payments are processed through our distributed 2-Phase Commit SAGA orchestrator. Funds remain in escrow until terminal dispatch confirmation. In the event of supplier inventory shortage or transport failure, automated compensating transactions refund the order balance without penalty.
                        </p>
                    </section>

                    <section className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0F2747]">4. Pricing, Benchmark Indices & Taxes</h2>
                        <p className="text-secondary-gray leading-relaxed break-words">
                            Petroleum lot pricing reflects real-time Platts regional indices, plus applicable localized terminal handling fees and statutory energy VAT (10%). Promotional discounts and bulk volume rates apply strictly at the point of checkout authorization.
                        </p>
                    </section>

                    <section className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0F2747]">5. Account Responsibilities & Role Integrity</h2>
                        <p className="text-secondary-gray leading-relaxed break-words">
                            Platform participants (Refinery Suppliers, Wholesale Dealers, Delivery Personnel, and Customers) must maintain accurate registration credentials. Tanker drivers must possess valid HazMat commercial endorsements.
                        </p>
                    </section>

                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <p className="text-xs text-secondary-gray text-center sm:text-left">
                            Last Updated: October 2026 | ISO 9001:2015 Certified Protocol
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                            <Link
                                href="/registration"
                                className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-sm px-4 rounded-xl font-bold border-none w-full sm:w-auto text-center justify-center"
                            >
                                Back to Registration
                            </Link>
                            <Link
                                href="/dashboard"
                                className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm px-4 rounded-xl font-bold border-none w-full sm:w-auto text-center justify-center"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
