"use client";

import { useState } from "react";
import MyHeader from "@/components/header";
import MyNavigation from "@/components/navigation";
import Link from "next/link";

interface FAQItem {
    id: string;
    category: string;
    question: string;
    answer: string;
}

const FAQ_DATA: FAQItem[] = [
    {
        id: "faq-1",
        category: "General & Account",
        question: "Who can register on the Oil Supply & Delivery Management System?",
        answer: "Refinery Suppliers, Licensed Regional Dealers, Commercial Industrial Customers, and Certified Tanker Delivery Personnel can register. Registrations are vetted and approved by the System Administrator before operational dispatch.",
    },
    {
        id: "faq-2",
        category: "Fuel & Quality Standards",
        question: "What fuel standards and certifications are supported?",
        answer: "We support Ultra-Low Sulfur Diesel (ULSD Euro V, <=10-15 ppm sulfur), Octane 95 & Octane 98 Premium Gasoline, Heavy Fuel Oil (HFO), and Aviation Turbine Fuel (Jet A-1), compliant with ISO 9001 and API standards.",
    },
    {
        id: "faq-3",
        category: "Ordering & Pricing",
        question: "How is bulk fuel pricing calculated?",
        answer: "Pricing is pegged to international Platts benchmark indices plus localized terminal throughput, pipeline tariffs, and statutory VAT. Pricing updates in your order ledger.",
    },
    {
        id: "faq-4",
        category: "Delivery & Security (e-POD)",
        question: "How does the Electronic Proof of Delivery (e-POD) & 4-digit PIN work?",
        answer: "When a delivery tanker arrives at the destination depot or commercial pump, the customer provides a 4-digit PIN. The driver inputs the PIN, records the totalizer meter reading, and captures the digital receipt for settlement.",
    },
    {
        id: "faq-5",
        category: "Safety & Transport",
        question: "What HazMat safety protocols are enforced for transport tankers?",
        answer: "All authorized tankers maintain valid HazMat Class 3 certifications, dual pneumatic emergency shut-off valves, copper bonding grounding wires for static dissipation during offloading, and calibrated digital flow meters.",
    },
    {
        id: "faq-6",
        category: "Support & Compliance",
        question: "Can I get compliance answers and order help in real time?",
        answer: "Our integrated PetroBot assistant operates in the live dispatch chat to retrieve verified ASTM and ISO specifications, tanker procedures, and delivery status updates.",
    },
];

const CATEGORIES = ["All", "General & Account", "Fuel & Quality Standards", "Ordering & Pricing", "Delivery & Security (e-POD)", "Safety & Transport", "Support & Compliance"];

export default function FAQPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [openIndex, setOpenIndex] = useState<string | null>("faq-1");

    const filteredFaqs = FAQ_DATA.filter((faq) => {
        const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
        const matchesSearch =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const toggleAccordion = (id: string) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    return (
        <main className="w-full flex flex-col items-center" role="main">
            <MyHeader name="FAQ" message="Fuel specifications, custody transfer protocols, and safety standards" />
            <MyNavigation />

            <div className="w-full max-w-[1240px] mt-6 space-y-6 text-left">
                <div className="bg-[#0F2747] text-white p-6 sm:p-8 rounded-2xl border border-[#163860]">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />
                        <span>Public knowledge base</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-white">
                        Procurement, Dispatch & Compliance Reference
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                        Verified details covering wholesale fuel procurement, tanker telemetry, ISO safety compliance, and the Electronic Proof of Delivery (e-POD) workflow.
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions"
                            aria-label="Search questions"
                            className="flex-1 h-10 px-3.5 rounded-lg bg-[#163860] text-white placeholder-slate-300 border border-white/15 outline-none text-xs sm:text-sm focus:border-[#F59E0B] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-4 h-10 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                selectedCategory === cat
                                    ? "bg-[#0F2747] text-white"
                                    : "bg-white text-[#4B5565] hover:bg-[#ECEFF4] border border-[#E2E8F0]"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center">
                            <p className="text-xs text-[#6B7487]">No matching questions found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        filteredFaqs.map((faq) => {
                            const isOpen = openIndex === faq.id;
                            return (
                                <div
                                    key={faq.id}
                                    className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden transition-colors"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(faq.id)}
                                        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#F5F7FA] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-md bg-[#F5F7FA] border border-[#E2E8F0] text-[#4B5565] font-mono text-xs flex items-center justify-center shrink-0">
                                                ?
                                            </span>
                                            <div>
                                                <span className="text-xs font-medium text-[#6B7487] block">
                                                    {faq.category}
                                                </span>
                                                <h2 className="text-sm font-medium text-[#111827] mt-0.5">
                                                    {faq.question}
                                                </h2>
                                            </div>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-[#6B7487] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 sm:px-5 pb-5 pt-2 text-xs text-[#4B5565] leading-relaxed border-t border-[#E2E8F0] bg-[#F5F7FA]">
                                            <p className="p-3.5 bg-white rounded-lg border border-[#E2E8F0] text-[#111827]">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                        <h3 className="font-medium text-sm text-[#111827]">Need direct operational assistance?</h3>
                        <p className="text-xs text-[#4B5565] mt-0.5">Support engineers and dispatch coordinators are available around the clock</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                        <Link
                            href="/contact"
                            className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-sm px-4 rounded-lg font-medium border-none w-full sm:w-auto text-center justify-center"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/registration"
                            className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] btn-sm px-4 rounded-lg font-medium border-none w-full sm:w-auto text-center justify-center"
                        >
                            Register Account
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
