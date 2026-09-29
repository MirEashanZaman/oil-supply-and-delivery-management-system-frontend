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
        answer: "We support Ultra-Low Sulfur Diesel (ULSD Euro V, <=10-15 ppm sulfur), Octane 95 & Octane 98 Premium Gasoline, Heavy Fuel Oil (HFO), and Aviation Turbine Fuel (Jet A-1), fully compliant with ISO 9001 and API standards.",
    },
    {
        id: "faq-3",
        category: "Ordering & Pricing",
        question: "How is bulk fuel pricing calculated?",
        answer: "Pricing is transparently pegged to international Platts benchmark indices plus localized terminal throughput, pipeline tariffs, and government VAT. Real-time pricing is updated dynamically in your order ledger.",
    },
    {
        id: "faq-4",
        category: "Delivery & Security (e-POD)",
        question: "How does the Electronic Proof of Delivery (e-POD) & 4-digit PIN work?",
        answer: "When a delivery tanker arrives at the destination depot or commercial pump, the customer provides a secure 4-digit PIN. The driver inputs the PIN, records the totalizer meter reading, and captures the digital signature for instant cryptographic settlement.",
    },
    {
        id: "faq-5",
        category: "Safety & Transport",
        question: "What HazMat safety protocols are enforced for transport tankers?",
        answer: "All authorized tankers must have valid HazMat Class 3 certifications, dual pneumatic emergency shut-off valves, copper bonding grounding wires for static dissipation during offloading, and calibrated digital flow meters.",
    },
    {
        id: "faq-6",
        category: "Real-time AI & Support",
        question: "Can I get instant compliance answers and order help?",
        answer: "Yes! Our integrated PetroBot AI assistant (RAG Pipeline) operates 24/7 in the live dispatch chat to retrieve verified ASTM/ISO specifications, tanker procedures, and delivery status updates instantly.",
    },
];

const CATEGORIES = ["All", "General & Account", "Fuel & Quality Standards", "Ordering & Pricing", "Delivery & Security (e-POD)", "Safety & Transport", "Real-time AI & Support"];

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
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Frequently Asked Questions" message="Everything you need to know about fuel supply, delivery logistics, and safety standards." />
            <MyNavigation />

            <div className="w-full max-w-5xl mt-6 space-y-6 text-left">
                <div className="card bg-gradient-to-r from-[#0F2747] to-[#1E3A8A] text-white p-6 sm:p-10 rounded-2xl shadow-md border border-[#163860]">
                    <span className="badge bg-[#F59E0B] text-[#1E293B] font-bold text-xs uppercase px-3 py-1 mb-2">
                        Public Knowledge Base
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Got Questions? We Have Answers.
                    </h1>
                    <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                        Find verified details regarding wholesale fuel procurement, tanker telemetry, ISO safety compliance, and the Electronic Proof of Delivery (e-POD) process.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions (e.g., diesel, PIN, pricing, safety)..."
                            className="flex-1 p-3 rounded-xl bg-white/10 text-white placeholder-slate-300 border border-white/20 outline-none text-xs sm:text-sm focus:bg-white/20 transition"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
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
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? "bg-[#0F2747] text-[#F59E0B] shadow-sm"
                                    : "bg-white text-[#64748B] hover:bg-slate-100 border border-[#E2E8F0]"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center shadow-xs">
                            <p className="text-xs text-slate-500">No matching questions found for "{searchQuery}".</p>
                        </div>
                    ) : (
                        filteredFaqs.map((faq) => {
                            const isOpen = openIndex === faq.id;
                            return (
                                <div
                                    key={faq.id}
                                    className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs hover:border-[#0F2747]/30 transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(faq.id)}
                                        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-[#0F2747]/10 text-[#0F2747] font-bold text-xs flex items-center justify-center shrink-0">
                                                ?
                                            </span>
                                            <div>
                                                <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                                                    {faq.category}
                                                </span>
                                                <h2 className="text-xs sm:text-sm font-bold text-[#1E293B] mt-0.5">
                                                    {faq.question}
                                                </h2>
                                            </div>
                                        </div>
                                        <span className={`text-[#0F2747] text-sm font-bold transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                                            ▼
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#64748B] leading-relaxed border-t border-slate-100 bg-[#F8FAFC]">
                                            <p className="p-3 bg-white rounded-xl border border-slate-200/70 text-[#1E293B]">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-sm text-[#1E293B]">Still have questions?</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">Our support engineers and PetroBot AI assistant are available 24/7.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                            href="/contact"
                            className="btn bg-[#0F2747] hover:bg-[#163860] text-white btn-sm px-4 rounded-xl font-bold border-none w-full sm:w-auto"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/registration"
                            className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm px-4 rounded-xl font-bold border-none w-full sm:w-auto"
                        >
                            Join Platform
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
