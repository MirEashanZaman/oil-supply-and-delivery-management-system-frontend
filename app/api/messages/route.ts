import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getPusherServer, ChatMessage } from "@/lib/pusher";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

let GLOBAL_MESSAGES_CACHE: ChatMessage[] = [];

async function readStoredMessages(): Promise<ChatMessage[]> {
    const combinedMap = new Map<string, ChatMessage>();

    // 1. First check in-memory cache
    if (Array.isArray(GLOBAL_MESSAGES_CACHE)) {
        GLOBAL_MESSAGES_CACHE.forEach((m) => {
            if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
        });
    }

    // 2. Read local file storage
    try {
        const fileText = await fs.readFile(MESSAGES_FILE, "utf8");
        const parsed = JSON.parse(fileText);
        if (Array.isArray(parsed)) {
            parsed.forEach((m: any) => {
                if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
            });
        }
    } catch {
        // file might not exist in serverless container
    }

    // 3. Fetch from backend centralized message broker/API
    try {
        const backendRes = await fetchWithTimeout(`${API_ENDPOINT}/rabbitmq/messages`, { cache: "no-store" }, 2500);
        if (backendRes.ok) {
            const data = await backendRes.json();
            if (data?.success && Array.isArray(data?.data)) {
                data.data.forEach((m: any) => {
                    if (m && m.id) combinedMap.set(m.id, { ...m, channel: normalizeChannel(m.channel) });
                });
            }
        }
    } catch {}

    const result = Array.from(combinedMap.values()).slice(-200);
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

        // Bridge message to RabbitMQ backend broker queue
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
            }, 3000).catch(() => {});
        } catch {}

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
