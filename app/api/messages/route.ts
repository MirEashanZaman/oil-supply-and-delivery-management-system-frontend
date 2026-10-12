import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { getPusherServer, ChatMessage } from "@/lib/pusher";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";

const MESSAGES_FILE = path.join(process.cwd(), "data", "messages.json");
const TMP_MESSAGES_FILE = path.join(os.tmpdir(), "oil_supply_messages.json");

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

let GLOBAL_MESSAGES_CACHE: ChatMessage[] = [];

const isLocalPrivateIp = !API_ENDPOINT || API_ENDPOINT.includes("localhost") || API_ENDPOINT.includes("127.0.0.1") || API_ENDPOINT.includes("192.168.") || API_ENDPOINT.includes("10.0.");
const shouldFetchBackend = !(process.env.VERCEL && isLocalPrivateIp);

function extractMessageTime(m: ChatMessage): number {
    if (!m) return 0;
    if (typeof (m as any).createdAt === "number") return (m as any).createdAt;
    const match = m.id && typeof m.id === "string" ? m.id.match(/_(\d{10,14})/) : null;
    if (match && match[1]) {
        const val = Number(match[1]);
        if (!isNaN(val) && val > 0) return val;
    }
    return 0;
}

function sortMessagesChronologically(list: ChatMessage[]): ChatMessage[] {
    return [...list].sort((a, b) => {
        const tA = extractMessageTime(a);
        const tB = extractMessageTime(b);
        if (tA && tB && tA !== tB) return tA - tB;
        return 0;
    });
}

async function readStoredMessages(): Promise<ChatMessage[]> {
    const combinedMap = new Map<string, ChatMessage>();

    if (Array.isArray(GLOBAL_MESSAGES_CACHE)) {
        GLOBAL_MESSAGES_CACHE.forEach((m) => {
            if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
        });
    }

    try {
        const fileText = await fs.readFile(MESSAGES_FILE, "utf8");
        const parsed = JSON.parse(fileText);
        if (Array.isArray(parsed)) {
            parsed.forEach((m: any) => {
                if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
            });
        }
    } catch {}

    try {
        const tmpText = await fs.readFile(TMP_MESSAGES_FILE, "utf8");
        const parsedTmp = JSON.parse(tmpText);
        if (Array.isArray(parsedTmp)) {
            parsedTmp.forEach((m: any) => {
                if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
            });
        }
    } catch {}

    if (shouldFetchBackend) {
        try {
            const backendRes = await fetchWithTimeout(`${API_ENDPOINT}/rabbitmq/messages`, { cache: "no-store" }, 1200);
            if (backendRes.ok) {
                const data = await backendRes.json();
                if (data?.success && Array.isArray(data?.data)) {
                    data.data.forEach((m: any) => {
                        if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
                    });
                }
            }
        } catch {}
    }

    const result = sortMessagesChronologically(Array.from(combinedMap.values())).slice(-200);
    GLOBAL_MESSAGES_CACHE = [...result];
    return result;
}

export async function GET() {
    try {
        const messages = await readStoredMessages();
        return NextResponse.json({
            success: true,
            data: messages,
        }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
        });
    } catch (err: any) {
        console.error("Error reading saved messages:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Unable to load messages" },
            { status: 500 }
        );
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

    try {
        await fs.mkdir(path.dirname(TMP_MESSAGES_FILE), { recursive: true });
        await fs.writeFile(TMP_MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
    } catch (err) {
        console.warn("Write to tmp messages file fallback:", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id: clientId, sender, email, role, topic, message, channel, timestamp: clientTimestamp } = body;
        const normalizedChannel = normalizeChannel(channel || "oil-supply-chat");

        if (!message || !message.trim()) {
            return NextResponse.json(
                { success: false, error: "Message content cannot be empty." },
                { status: 400 }
            );
        }

        const effectiveTimestamp = (typeof clientTimestamp === "string" && clientTimestamp.trim())
            ? clientTimestamp.trim()
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const messageData: ChatMessage = {
            id: (typeof clientId === "string" && clientId.trim()) ? clientId.trim() : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            sender: sender?.trim() || "Anonymous User",
            email: email?.trim() || "user@oilsupply.com",
            role: role?.trim() || "Customer",
            topic: topic?.trim() || "General Inquiry",
            message: message.trim(),
            timestamp: effectiveTimestamp,
            channel: normalizedChannel,
        };

        const existingMessages = await readStoredMessages();
        const normalizedExistingMessages = existingMessages.map((message) => ({
            ...message,
            channel: normalizeChannel(message.channel),
        }));

        const newMessagesList: ChatMessage[] = [messageData];

        const updatedMessages = sortMessagesChronologically([...normalizedExistingMessages, ...newMessagesList]).slice(-200);
        await writeStoredMessages(updatedMessages);

        const pusherServer = getPusherServer();
        if (pusherServer) {
            try {
                const targetChannels = Array.from(new Set([normalizedChannel, "oil-supply-chat"]));
                for (const msg of newMessagesList) {
                    for (const ch of targetChannels) {
                        await pusherServer.trigger(ch, "new-message", msg);
                    }
                }
            } catch (pusherErr) {
                console.warn("Pusher server trigger error (falling back to persisted message):", pusherErr);
            }
        }

        if (shouldFetchBackend) {
            try {
                await fetchWithTimeout(`${API_ENDPOINT}/rabbitmq/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        queue: "customer_messages_queue",
                        pattern: "chat.message.created",
                        data: messageData,
                        sender: messageData.sender,
                        recipient: messageData.channel,
                    }),
                }, 1500).catch(() => {});
            } catch {}
        }

        return NextResponse.json({
            success: true,
            data: messageData,
            botReply: newMessagesList.length > 1 ? newMessagesList[1] : null,
            status: "Message processed successfully",
        });
    } catch (err: any) {
        console.error("Error in /api/messages route:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
