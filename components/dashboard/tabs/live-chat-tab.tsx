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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const initialLoadDoneRef = useRef<boolean>(false);
  const [showScrollDown, setShowScrollDown] = useState<boolean>(false);

  const channelName = "oil-supply-chat";

  const STORAGE_KEY = "persistent_chat_messages_v1";

  useEffect(() => {
    const extractTimestamp = (m: ChatMessage): number => {
      if (!m) return 0;
      if (typeof (m as any).createdAt === "number") return (m as any).createdAt;
      const match = m.id && typeof m.id === "string" ? m.id.match(/_(\d{10,14})/) : null;
      if (match && match[1]) {
        const val = Number(match[1]);
        if (!isNaN(val) && val > 0) return val;
      }
      return 0;
    };

    const sortChronologically = (list: ChatMessage[]): ChatMessage[] => {
      return [...list].sort((a, b) => {
        const tA = extractTimestamp(a);
        const tB = extractTimestamp(b);
        if (tA && tB && tA !== tB) return tA - tB;
        return 0;
      });
    };

    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(sortChronologically(parsed));
        }
      }
    } catch {}

    let isFetching = false;
    const loadStoredMessages = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await axios.get(`/api/messages?channel=${encodeURIComponent(channelName)}&t=${Date.now()}`);
        if (res.data?.success && Array.isArray(res.data?.data)) {
          const serverList: ChatMessage[] = res.data.data;
          setMessages((prev) => {
            const combinedMap = new Map<string, ChatMessage>();
            try {
              const cached = localStorage.getItem(STORAGE_KEY);
              if (cached) {
                const parsed: ChatMessage[] = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                  parsed.forEach((m) => {
                    if (m && m.id) combinedMap.set(m.id, m);
                  });
                }
              }
            } catch {}

            prev.forEach((m) => {
              if (m && m.id) combinedMap.set(m.id, m);
            });
            serverList.forEach((m) => {
              if (m && m.id) combinedMap.set(m.id, m);
            });

            const merged = sortChronologically(Array.from(combinedMap.values())).slice(-200);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.warn("Failed to load live chat history:", err);
      } finally {
        isFetching = false;
      }
    };

    loadStoredMessages();

    const pollTimer = window.setInterval(() => {
      loadStoredMessages();
    }, 1200);

    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("oil_supply_chat_bus");
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "NEW_MESSAGE" && event.data?.message) {
            const incoming: ChatMessage = event.data.message;
            setMessages((prev) => {
              const next = sortChronologically([...prev.filter((m) => m.id !== incoming.id), incoming]).slice(-200);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
          }
        };
      }
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setMessages(sortChronologically(parsed));
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const pusher = getPusherClient();
    let channels: any[] = [];
    if (pusher) {
      try {
        const subChannels = [channelName];
        const userRole = userData?.title || userData?.role;
        const roleChannel = getRoleBasedChannel(userRole);
        if (roleChannel && !subChannels.includes(roleChannel)) {
          subChannels.push(roleChannel);
        }

        subChannels.forEach((cName) => {
          try {
            const ch = pusher.subscribe(cName);
            ch.bind("new-message", (data: ChatMessage) => {
              setMessages((prev) => {
                const next = sortChronologically([...prev.filter((m) => m.id !== data.id), data]).slice(-200);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {}
                return next;
              });
            });
            channels.push(ch);
          } catch {}
        });
      } catch {}
    }

    const handleLocalUpdate = (e: any) => {
      const newMsg = e?.detail;
      if (newMsg) {
        setMessages((prev) => {
          const next = sortChronologically([...prev.filter((m) => m.id !== newMsg.id), newMsg]).slice(-200);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        loadStoredMessages();
      }
    };

    window.addEventListener("local_chat_update", handleLocalUpdate);

    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local_chat_update", handleLocalUpdate);
      if (broadcastChannel) {
        try {
          broadcastChannel.close();
        } catch {}
      }
      channels.forEach((ch) => {
        try {
          ch.unbind_all();
          ch.unsubscribe();
        } catch {}
      });
    };
  }, [userData?.title, userData?.role]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNear = distanceFromBottom < 80;
    isNearBottomRef.current = isNear;
    setShowScrollDown(!isNear && scrollHeight > clientHeight + 100);
  };

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
    isNearBottomRef.current = true;
    setShowScrollDown(false);
  };

  useEffect(() => {
    if (!initialLoadDoneRef.current && messages.length > 0) {
      initialLoadDoneRef.current = true;
      scrollToBottom(false);
    } else if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    let resolvedSender = userData?.userName || userData?.name;
    let resolvedEmail = userData?.email;
    let resolvedRole = userData?.title || userData?.role;

    if (!resolvedSender || !resolvedEmail) {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          resolvedSender = resolvedSender || u.userName || u.name;
          resolvedEmail = resolvedEmail || u.email;
          resolvedRole = resolvedRole || u.title || u.role;
        }
      } catch {}
    }

    const payload: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: resolvedSender || "User",
      email: resolvedEmail || "user@example.com",
      role: resolvedRole || "Customer",
      topic: selectedTopic,
      message: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: channelName,
    };

    setInputMessage("");
    setMessages((prev) => {
      const next = [...prev.filter((m) => m.id !== payload.id), payload].slice(-200);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setTimeout(() => scrollToBottom(true), 50);

    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("local_chat_update", { detail: payload }));
      }
    } catch {}

    try {
      const res = await axios.post("/api/messages", {
        id: payload.id,
        sender: payload.sender,
        email: payload.email,
        role: payload.role,
        topic: payload.topic,
        message: payload.message,
        timestamp: payload.timestamp,
        channel: payload.channel,
      });

      if (res.data?.success && res.data?.data) {
        const newMsg = res.data.data;
        const botReply = res.data.botReply;
        setMessages((prev) => {
          let updated = [...prev.filter((m) => m.id !== newMsg.id && m.id !== payload.id), newMsg];
          if (botReply) {
            updated = [...updated.filter((m) => m.id !== botReply.id), botReply];
          }
          const finalSlice = updated.slice(-200);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSlice));
          } catch {}
          return finalSlice;
        });

        try {
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const bc = new BroadcastChannel("oil_supply_chat_bus");
            bc.postMessage({ type: "NEW_MESSAGE", message: newMsg });
            if (botReply) {
              bc.postMessage({ type: "NEW_MESSAGE", message: botReply });
            }
            bc.close();
          }
        } catch {}
      }
    } catch (err) {
      console.warn("Live chat send fallback:", err);
    }
  };

  return (
    <div className="w-full text-left animate-fadeIn max-w-full overflow-x-hidden">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-6 shadow-sm w-full max-w-full">
        <h2 className="text-lg sm:text-xl font-bold text-dark-slate mb-1">Realtime Logistics Dispatch Chat</h2>
        <p className="text-xs text-secondary-gray mb-3 sm:mb-4">Direct WebSocket line across Refineries, Dealers, and Transport Fleets.</p>

        <div className="relative mb-3 sm:mb-4 w-full">
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="h-80 sm:h-96 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 w-full scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7487]">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4B5565] mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#111827]">No dispatch messages yet</p>
                <p className="text-xs text-[#6B7487] max-w-sm mt-1">
                  Start the conversation by selecting a topic and typing a message below
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.email === userData?.email;
                const isBot = m.sender.includes("Automated Support") || m.sender.includes("PetroBot") || m.role?.includes("Auto-Reply") || m.role?.includes("AI");
                return (
                  <div
                    key={m.id}
                    className={`p-3 sm:p-4 rounded-xl border text-xs transition-colors w-full max-w-full break-words ${
                      isBot
                        ? "bg-[#F5F7FA] border-[#CBD5E1]"
                        : isMe
                          ? "bg-white border-[#CBD5E1]"
                          : "bg-white border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[#111827] text-xs sm:text-sm flex items-center gap-1.5">
                          {isBot && <span className="w-2 h-2 rounded-full bg-[#F59E0B]" aria-hidden="true" />}
                          {m.sender}
                        </span>
                        <span
                          className={`badge text-[10px] font-medium border-none px-2 py-0.5 ${
                            isBot
                              ? "bg-[#0F2747] text-white"
                              : m.role === "Supplier"
                              ? "bg-[#0F2747] text-[#F59E0B]"
                              : m.role === "Dealer"
                                ? "bg-amber-50 text-[#D97706]"
                                : m.role === "Admin"
                                  ? "bg-emerald-50 text-[#16A34A]"
                                  : "bg-[#F5F7FA] text-[#4B5565]"
                            }`}
                        >
                          {m.role || "User"}
                        </span>
                        {isMe && (
                          <span className="badge bg-emerald-50 text-[#16A34A] text-[10px] font-medium border border-emerald-200 px-1.5 py-0.5">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B7487] font-mono tabular-nums">{m.timestamp}</span>
                    </div>
                    <div className="mb-1.5">
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                          isBot ? "text-[#D97706] bg-amber-50" : "text-[#4B5565] bg-[#F5F7FA]"
                        }`}
                      >
                        {m.topic}
                      </span>
                    </div>
                    <p className="text-[#111827] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {showScrollDown && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-3 right-4 bg-[#0F2747] hover:bg-[#163860] text-white border border-white/20 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer z-10"
            >
              <span>Scroll to latest</span>
              <span>↓</span>
            </button>
          )}
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
