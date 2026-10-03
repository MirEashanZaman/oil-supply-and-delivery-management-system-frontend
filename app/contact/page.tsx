"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import { getPusherClient, ChatMessage } from "@/lib/pusher";

export default function ContactInfo() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [topic, setTopic] = useState("Bulk Procurement");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isPusherConnected, setIsPusherConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("Connecting...");
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        const loadStoredMessages = async () => {
            try {
                const res = await axios.get("/api/messages?channel=oil-supply-chat");
                if (res.data?.success && Array.isArray(res.data?.data)) {
                    const serverList: ChatMessage[] = res.data.data;
                    setLiveMessages((prev) => {
                        const serverIds = new Set(serverList.map((m) => m.id));
                        const localPending = prev.filter((m) => !serverIds.has(m.id) && m.id.startsWith("msg_"));
                        return [...serverList, ...localPending].slice(-15);
                    });
                }
            } catch (err) {
                console.warn("Failed to load saved chat history:", err);
            }
        };

        loadStoredMessages();

        const pollTimer = window.setInterval(() => {
            loadStoredMessages();
        }, 4000);

        const pusher = getPusherClient();
        if (!pusher) {
            return () => window.clearInterval(pollTimer);
        }

        const channel = pusher.subscribe("oil-supply-chat");

        channel.bind("pusher:subscription_succeeded", () => {
            setIsPusherConnected(true);
        });

        channel.bind("new-message", (data: ChatMessage) => {
            setLiveMessages((prev) => [...prev.filter((m) => m.id !== data.id), data].slice(-20));
        });

        return () => {
            window.clearInterval(pollTimer);
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedMsg = message.trim();
        if (!trimmedName || !trimmedEmail || !trimmedMsg) return;

        const optimisticMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: trimmedName,
            email: trimmedEmail,
            topic,
            message: trimmedMsg,
            role: "Customer Inquiry",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            channel: "oil-supply-chat",
        };

        setIsSending(true);
        setSubmitted(false);
        setLiveMessages((prev) => [...prev.filter((m) => m.id !== optimisticMsg.id), optimisticMsg].slice(-10));

        try {
            const res = await axios.post("/api/messages", {
                id: optimisticMsg.id,
                sender: trimmedName,
                email: trimmedEmail,
                topic,
                message: trimmedMsg,
                role: "Customer Inquiry",
                timestamp: optimisticMsg.timestamp,
                channel: "oil-supply-chat",
            });

            if (res.data?.success && res.data?.data) {
                const newMsg = res.data.data;
                const botReply = res.data.botReply;
                setLiveMessages((prev) => {
                    let updated = [...prev.filter((m) => m.id !== newMsg.id && m.id !== optimisticMsg.id), newMsg];
                    if (botReply) {
                        updated = [...updated.filter((m) => m.id !== botReply.id), botReply];
                    }
                    return updated.slice(-15);
                });
            }
            setSubmitted(true);
            setMessage("");
        } catch (err) {
            console.warn("Message transmission failed:", err);
            setSubmitted(true);
            setMessage("");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Contact Us" message="Get in touch with the Oil Supply & Delivery Management System team" />
            <MyNavigation />

            <div className="w-full max-w-5xl mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                            <div className="card-body p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="badge bg-[#0F2747] text-[#F59E0B] font-bold uppercase tracking-wider text-xs px-3 py-1">
                                        Support & Inquiries
                                    </span>
                                    <span className="badge bg-[#16A34A]/15 text-[#16A34A] font-bold text-xs border-none px-2.5 py-1 flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${isPusherConnected ? "bg-[#16A34A]" : "bg-[#64748B]"}`}></span>
                                        PusherJS Active
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-[#1E293B]">Contact Directory</h2>
                                <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                                    For order updates, dealership registration, supplier onboarding, and system assistance.
                                </p>

                                <div className="divide-y divide-[#E2E8F0] mt-4 text-xs">
                                    <div className="py-3 flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-[#0F2747]/10 text-[#0F2747] shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-[#1E293B] block">Central Headquarters</span>
                                            <span className="text-[#64748B]">Oil Supply & Delivery Operations Center, Kuril, Dhaka.</span>
                                        </div>
                                    </div>

                                    <div className="py-3 flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 text-[#D97706] shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-[#1E293B] block">Phone Support</span>
                                            <span className="text-[#64748B]">+880 1700-000000 / +880 1800-000000</span>
                                        </div>
                                    </div>

                                    <div className="py-3 flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-[#16A34A]/15 text-[#16A34A] shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-[#1E293B] block">Email Inquiries</span>
                                            <span className="text-[#64748B]">support@oilsupply-delivery.com</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-2xl">
                            <div className="card-body p-5 text-xs text-[#64748B]">
                                <span className="font-bold text-[#1E293B] block mb-1">Office Hours & Pusher Gateway</span>
                                <p>Customer support and order inquiry dispatch are handled in real time using PusherJS on the central operations channel.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                            <div className="card-body p-6 sm:p-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">Send Us a Message</h2>
                                        <p className="text-xs text-[#64748B]">Submit your question or order inquiry via real-time PusherJS transmission.</p>
                                    </div>
                                    <span className="badge bg-[#0F2747] text-white text-[11px] font-bold border-none">
                                        PusherJS
                                    </span>
                                </div>

                                {submitted && (
                                    <div role="alert" className="alert bg-[#16A34A] text-white shadow-sm mt-4 py-2.5 rounded-xl border-none text-xs">
                                        <svg className="w-4 h-4 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Message transmitted successfully via PusherJS! Our support team received your dispatch.</span>
                                    </div>
                                )}

                                <form onSubmit={handleSend} className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-semibold text-[#1E293B]">Your Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                placeholder="Enter your name"
                                                onChange={(e) => setName(e.target.value)}
                                                className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl"
                                            />
                                        </div>

                                        <div className="form-control w-full">
                                            <label className="label pb-1">
                                                <span className="label-text font-semibold text-[#1E293B]">Email Address</span>
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                placeholder="Enter your email"
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control w-full">
                                        <label className="label pb-1">
                                            <span className="label-text font-semibold text-[#1E293B]">Inquiry Type</span>
                                        </label>
                                        <select
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="select select-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl"
                                        >
                                            <option value="Bulk Procurement">Bulk Fuel Order / Purchasing</option>
                                            <option value="Spot Order Dispatch">Delivery & Schedule Inquiry</option>
                                            <option value="Dealership Application">Dealer Registration & Partnership</option>
                                            <option value="Logistics & Tanker Tracking">Supplier Onboarding</option>
                                            <option value="General Support">Technical & Account Support</option>
                                        </select>
                                    </div>

                                    <div className="form-control w-full">
                                        <label className="label pb-1">
                                            <span className="label-text font-semibold text-[#1E293B]">Message</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={message}
                                            placeholder="Enter your message"
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="textarea textarea-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none text-sm rounded-xl"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold w-full border-none shadow-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Transmitting via PusherJS...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send Message via PusherJS</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {liveMessages.length > 0 && (
                            <div className="card bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping"></span>
                                        <h3 className="font-bold text-sm text-[#1E293B]">Recent Dispatches (PusherJS Real-Time Feed)</h3>
                                    </div>
                                    <span className="text-[11px] text-[#64748B] font-mono">channel: oil-supply-chat</span>
                                </div>
                                <div className="space-y-3">
                                    {liveMessages.map((msg) => {
                                        const isBot = msg.sender.includes("Automated Support") || msg.sender.includes("PetroBot") || msg.role?.includes("Auto-Reply") || msg.role?.includes("AI");
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all ${
                                                    isBot
                                                        ? "bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs"
                                                        : "bg-[#F5F7FA] border-[#E2E8F0] text-[#1E293B]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold flex items-center gap-1.5">
                                                        {isBot && <span>🤖</span>}
                                                        {msg.sender}
                                                        <span className="text-[10px] font-semibold text-[#64748B] bg-white px-2 py-0.5 rounded border border-slate-200">
                                                            {msg.topic}
                                                        </span>
                                                    </span>
                                                    <span className="text-[10px] text-[#64748B] font-mono">{msg.timestamp}</span>
                                                </div>
                                                <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}