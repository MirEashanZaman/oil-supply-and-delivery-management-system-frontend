"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { UserData } from "../types";
import { ChatMessage, getPusherClient, getRoleBasedChannel } from "@/lib/pusher";

interface LiveChatTabProps {
  userData: UserData | null;
}

export const LiveChatTab: React.FC<LiveChatTabProps> = ({ userData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("General Support");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channelName = getRoleBasedChannel(userData?.title || userData?.role || "customer");

  useEffect(() => {
    const loadStoredMessages = async () => {
      try {
        const res = await axios.get(`/api/messages?channel=${encodeURIComponent(channelName)}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setMessages(res.data.data.slice(0, 50));
        }
      } catch (err) {
        console.warn("Failed to load live chat history:", err);
      }
    };

    if (!userData) {
      return;
    }

    loadStoredMessages();

    const pollTimer = window.setInterval(() => {
      loadStoredMessages();
    }, 4000);

    const pusher = getPusherClient();
    if (!pusher) {
      return () => window.clearInterval(pollTimer);
    }

    const subscriptions = [channelName].map((name) => {
      const channel = pusher.subscribe(name);
      channel.bind("new-message", (data: ChatMessage) => {
        setMessages((prev) => [data, ...prev.filter((m) => m.id !== data.id)].slice(0, 50));
      });
      return channel;
    });

    return () => {
      window.clearInterval(pollTimer);
      subscriptions.forEach((channel) => {
        channel.unbind_all();
        channel.unsubscribe();
      });
    };
  }, [channelName, userData?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    const payload: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: userData?.userName || userData?.name || "User",
      email: userData?.email || "user@example.com",
      role: userData?.title || userData?.role || "Customer",
      topic: selectedTopic,
      message: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: channelName,
    };

    setInputMessage("");

    try {
      const res = await axios.post("/api/messages", {
        sender: payload.sender,
        email: payload.email,
        role: payload.role,
        topic: payload.topic,
        message: payload.message,
        channel: payload.channel,
      });

      if (res.data?.success && res.data?.data) {
        const newMsg = res.data.data;
        setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)].slice(0, 50));
      }
    } catch (err) {
      console.warn("Live chat send fallback:", err);
      setMessages((prev) => [payload, ...prev.filter((m) => m.id !== payload.id)].slice(0, 50));
    }
  };

  return (
    <div className="w-full text-left animate-fadeIn max-w-full overflow-x-hidden">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-6 shadow-sm w-full max-w-full">
        <h2 className="text-lg sm:text-xl font-bold text-dark-slate mb-1">Realtime Logistics Dispatch Chat</h2>
        <p className="text-xs text-secondary-gray mb-3 sm:mb-4">Direct WebSocket line across Refineries, Dealers, and Transport Fleets.</p>

        <div className="h-80 sm:h-96 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 mb-3 sm:mb-4 w-full">
          {messages.map((m) => {
            const isMe = m.email === userData?.email;
            return (
              <div
                key={m.id}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-xs transition-all w-full max-w-full break-words ${isMe ? "bg-[#0F2747]/5 border-[#0F2747]/20" : "bg-white border-[#E2E8F0]"
                  }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[#1E293B] text-xs sm:text-sm">{m.sender}</span>
                    <span
                      className={`badge text-[9px] sm:text-[10px] font-bold uppercase border-none px-1.5 sm:px-2 py-0.5 ${m.role === "Supplier"
                        ? "bg-[#0F2747] text-[#F59E0B]"
                        : m.role === "Dealer"
                          ? "bg-[#F59E0B]/20 text-[#D97706]"
                          : m.role === "Admin"
                            ? "bg-[#16A34A]/20 text-[#16A34A]"
                            : "bg-[#64748B]/15 text-[#1E293B]"
                        }`}
                    >
                      {m.role || "User"}
                    </span>
                    {isMe && (
                      <span className="badge bg-[#16A34A] text-white text-[8px] sm:text-[9px] font-bold border-none px-1.5 py-0.5">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-[#64748B] font-mono">{m.timestamp}</span>
                </div>
                <div className="mb-1.5">
                  <span className="inline-block text-[10px] sm:text-[11px] font-semibold text-[#0F2747] bg-[#0F2747]/10 px-2 py-0.5 rounded-md">
                    {m.topic}
                  </span>
                </div>
                <p className="text-[#1E293B] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 w-full max-w-full">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="p-2.5 border border-[#CBD5E1] rounded-xl text-xs sm:text-sm outline-none bg-white text-dark-slate w-full sm:w-auto shrink-0"
            >
              <option value="General Support">General Support</option>
              <option value="Order Dispatch">Order Dispatch</option>
              <option value="Supplier Update">Supplier Update</option>
              <option value="Dealer Update">Dealer Update</option>
              <option value="Delivery Status">Delivery Status</option>
            </select>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-w-0 p-2.5 border border-[#CBD5E1] rounded-xl text-xs sm:text-sm outline-none bg-white text-dark-slate w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-[#0F2747] hover:bg-[#163860] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer w-full sm:w-auto self-end"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};
