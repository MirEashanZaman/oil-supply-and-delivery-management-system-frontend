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

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

let GLOBAL_MESSAGES_CACHE: ChatMessage[] = [];

async function readStoredMessages(): Promise<ChatMessage[]> {
    try {
        const fileText = await fs.readFile(MESSAGES_FILE, "utf8");
        const parsed = JSON.parse(fileText);

        if (Array.isArray(parsed)) {
            const normalized = parsed.map((message: any) => ({
                ...message,
                channel: normalizeChannel(message.channel),
            }));
            GLOBAL_MESSAGES_CACHE = [...normalized];
            return [...normalized];
        }
    } catch {
        // file doesn't exist or read error, check in-memory cache
    }

    if (GLOBAL_MESSAGES_CACHE && GLOBAL_MESSAGES_CACHE.length > 0) {
        return [...GLOBAL_MESSAGES_CACHE];
    }

    return [];
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
