import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getPusherServer, ChatMessage } from "@/lib/pusher";

const MESSAGES_FILE = path.join(process.cwd(), "data", "messages.json");

function normalizeChannel(channel?: string | null) {
    const trimmed = (channel || "").trim();

    if (!trimmed || trimmed === "oil-supply-chat" || trimmed === "oil-supply-chat-general") {
        return "oil-supply-chat";
    }

    if (trimmed.startsWith("oil-supply-chat-")) {
        return trimmed;
    }

    return trimmed;
}

function getRequestedChannel(channel?: string | null) {
    return normalizeChannel(channel);
}

export async function GET(request: Request) {
    try {
        const messages = await readStoredMessages();
        return NextResponse.json({
            success: true,
            data: messages,
        });
    } catch (err: any) {
        console.error("Error reading saved messages:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Unable to load messages" },
            { status: 500 }
        );
    }
}

let GLOBAL_MESSAGES_CACHE: ChatMessage[] | null = null;

async function readStoredMessages(): Promise<ChatMessage[]> {
    if (GLOBAL_MESSAGES_CACHE && GLOBAL_MESSAGES_CACHE.length > 0) {
        return [...GLOBAL_MESSAGES_CACHE];
    }
    try {
        const fileText = await fs.readFile(MESSAGES_FILE, "utf8");
        const parsed = JSON.parse(fileText);

        if (!Array.isArray(parsed)) {
            GLOBAL_MESSAGES_CACHE = [];
            return [];
        }

        const normalized = parsed.map((message: any) => ({
            ...message,
            channel: normalizeChannel(message.channel),
        }));
        GLOBAL_MESSAGES_CACHE = normalized;
        return [...normalized];
    } catch {
        GLOBAL_MESSAGES_CACHE = [];
        return [];
    }
}

async function writeStoredMessages(messages: ChatMessage[]) {
    GLOBAL_MESSAGES_CACHE = [...messages];
    try {
        await fs.mkdir(path.dirname(MESSAGES_FILE), { recursive: true });
        await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
    } catch (err) {
        console.warn("Write to messages.json file fallback:", err);
    }
}

interface KnowledgeDoc {
    id: string;
    category: string;
    title: string;
    content: string;
    keywords: string[];
}

const PETROLEUM_KNOWLEDGE_BASE: KnowledgeDoc[] = [
    {
        id: "KB-01",
        category: "Fuel Specification",
        title: "Ultra-Low Sulfur Diesel (ULSD Euro V) Standards",
        content: "ULSD Euro V must maintain maximum sulfur content <= 10-15 ppm, minimum flash point >= 52°C, cetane index >= 48-51, and density 820-845 kg/m³ at 15°C.",
        keywords: ["diesel", "ulsd", "sulfur", "flash point", "cetane", "euro 5", "euro v", "density", "fuel spec"],
    },
    {
        id: "KB-02",
        category: "Fuel Specification",
        title: "Octane 95 & Octane 98 Premium Petrol Specifications",
        content: "Research Octane Number (RON) is 95/98 min, Motor Octane Number (MON) 85 min, maximum Reid Vapor Pressure (RVP) 60-70 kPa with corrosion inhibitor additive package.",
        keywords: ["octane", "petrol", "ron", "mon", "gasoline", "rvp", "premium"],
    },
    {
        id: "KB-03",
        category: "Safety & HazMat Transport",
        title: "Hazmat Road Transport & Tanker Discharge Protocol",
        content: "Tankers must maintain emergency pneumatic internal shut-off valves, copper bonding wire for static dissipation grounding during fuel offloading, flame arrestor caps, and certified HazMat class 3 placards.",
        keywords: ["safety", "transport", "tanker", "hazmat", "grounding", "static", "valve", "spill", "emergency", "fire", "discharge"],
    },
    {
        id: "KB-04",
        category: "Procurement & Pricing",
        title: "Wholesale Benchmark Pricing & Platts Index Allocation",
        content: "Bulk depot allocations are pegged against daily Platts Singapore / Arab Gulf benchmark postings plus localized terminal handling surcharges, pipeline tariffs, and VAT.",
        keywords: ["pricing", "price", "cost", "platts", "wholesale", "allocation", "benchmark", "rate", "tariff", "invoice"],
    },
    {
        id: "KB-05",
        category: "Delivery & Verification",
        title: "Electronic Proof of Delivery (e-POD) & 4-Digit PIN Security",
        content: "Deliveries require customer 4-digit PIN authentication upon arrival, digital flow meter totalizer reading photo capture, and cryptographic timestamp recording before driver settlement.",
        keywords: ["pod", "pin", "otp", "delivery", "meter", "proof", "verification", "dispatch", "track", "tracking"],
    },
    {
        id: "KB-06",
        category: "Compliance & Standards",
        title: "ISO 9001 / ISO 14001 Quality & Environmental Compliance",
        content: "All bunkering operations, depot storage, and pipeline blending strictly adhere to ISO 9001 quality management, ISO 14001 environmental safety, and API (American Petroleum Institute) specs.",
        keywords: ["iso", "iso 9001", "iso 14001", "api", "standard", "compliance", "audit", "certification", "license"],
    },
];

function runRAGInference(query: string): { answer: string; docTitles: string[] } | null {
    const qLower = query.toLowerCase().trim();
    if (!qLower) return null;

    const matchedDocs = PETROLEUM_KNOWLEDGE_BASE.filter((doc) => {
        return (
            doc.keywords.some((k) => qLower.includes(k)) ||
            doc.title.toLowerCase().split(" ").some((w) => w.length > 3 && qLower.includes(w)) ||
            doc.content.toLowerCase().split(" ").some((w) => w.length > 4 && qLower.includes(w))
        );
    });

    if (matchedDocs.length === 0) {
        return {
            answer: `Hello! I am your 24/7 PetroBot AI Assistant (RAG Pipeline). Received your message: "${query}". You can ask me about Fuel Standards (ULSD Euro V, Octane 95/98), HazMat Tanker Safety, Platts Wholesale Pricing, or e-POD PIN Verification. How can I assist your logistics today?`,
            docTitles: ["Petroleum Knowledge Base v2.4"],
        };
    }

    const docTitles = matchedDocs.map((d) => d.title);
    const knowledgeSnippet = matchedDocs.map((d) => `• [${d.category}] ${d.title}: ${d.content}`).join("\n");

    const response = `[RAG Verified Knowledge Base Response]\n${knowledgeSnippet}\n\nSources: ${docTitles.join(" | ")}`;

    return {
        answer: response,
        docTitles,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sender, email, role, topic, message, channel } = body;
        const normalizedChannel = getRequestedChannel(channel || "oil-supply-chat");

        if (!message || !message.trim()) {
            return NextResponse.json(
                { success: false, error: "Message content cannot be empty." },
                { status: 400 }
            );
        }

        const messageData: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            sender: sender?.trim() || "Anonymous User",
            email: email?.trim() || "user@oilsupply.com",
            role: role?.trim() || "Customer",
            topic: topic?.trim() || "General Inquiry",
            message: message.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            channel: normalizedChannel,
        };

        const existingMessages = await readStoredMessages();
        const normalizedExistingMessages = existingMessages.map((message) => ({
            ...message,
            channel: normalizeChannel(message.channel),
        }));

        const newMessagesList: ChatMessage[] = [messageData];

        if (sender !== "PetroBot AI (RAG Assistant)") {
            const ragResult = runRAGInference(message);
            if (ragResult) {
                const botMessage: ChatMessage = {
                    id: `msg_bot_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`,
                    sender: "PetroBot AI (RAG Assistant)",
                    email: "petrobot@oilsupply.internal",
                    role: "AI Compliance Officer",
                    topic: "RAG Knowledge Retrieval",
                    message: ragResult.answer,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    channel: normalizedChannel,
                };
                newMessagesList.push(botMessage);
            }
        }

        const updatedMessages = [...normalizedExistingMessages, ...newMessagesList].slice(-200);
        await writeStoredMessages(updatedMessages);

        const pusherServer = getPusherServer();
        if (pusherServer) {
            try {
                for (const msg of newMessagesList) {
                    await pusherServer.trigger(normalizedChannel, "new-message", msg);
                }
            } catch (pusherErr) {
                console.warn("Pusher server trigger error (falling back to persisted message):", pusherErr);
            }
        }

        return NextResponse.json({
            success: true,
            data: messageData,
            botReply: newMessagesList.length > 1 ? newMessagesList[0] : null,
            status: "Message processed and RAG agent pipeline active",
        });
    } catch (err: any) {
        console.error("Error in /api/messages route:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
