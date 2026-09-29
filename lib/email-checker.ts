import axios from "axios";
import { API_ENDPOINT } from "@/lib/api";

export interface EmailUniquenessResult {
    isUnique: boolean;
    existingRole?: string;
    existingUser?: any;
    message?: string;
}

export async function checkEmailUniqueness(email: string): Promise<EmailUniquenessResult> {
    if (!email || !email.includes("@")) {
        return { isUnique: true };
    }

    const cleanEmail = email.trim().toLowerCase();
    try {
        const resAll = await axios.get(`${API_ENDPOINT}/users/all`, {
            validateStatus: (status) => status < 500,
        });

        if (resAll.status === 200 && resAll.data) {
            const allUsers: Array<{ email?: string; roleName: string; title?: string }> = [
                ...(resAll.data.customers || []).map((u: any) => ({ ...u, roleName: "Customer" })),
                ...(resAll.data.admins || []).map((u: any) => ({ ...u, roleName: "Admin" })),
                ...(resAll.data.dealers || []).map((u: any) => ({ ...u, roleName: "Dealer" })),
                ...(resAll.data.suppliers || []).map((u: any) => ({ ...u, roleName: "Supplier" })),
                ...(resAll.data.deliverymen || []).map((u: any) => ({ ...u, roleName: "Deliveryman" })),
            ];

            const match = allUsers.find(
                (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
            );

            if (match) {
                const role = match.roleName || match.title || "existing";
                return {
                    isUnique: false,
                    existingRole: role,
                    existingUser: match,
                    message: `An account with this email (${cleanEmail}) already exists as a ${role}. Only one account is permitted per email address.`,
                };
            }
        }
    } catch (err) {
        console.warn("Cross-table check /users/all error, falling back to /users/search:", err);
    }

    try {
        const searchRes = await axios.get(
            `${API_ENDPOINT}/users/search?email=${encodeURIComponent(cleanEmail)}`,
            { validateStatus: (status) => status < 500 }
        );

        if (searchRes.status === 200 && searchRes.data?.user && searchRes.data?.role) {
            const role = searchRes.data.role.charAt(0).toUpperCase() + searchRes.data.role.slice(1);
            return {
                isUnique: false,
                existingRole: role,
                existingUser: searchRes.data.user,
                message: `An account with this email (${cleanEmail}) already exists as a ${role}. Only one account is permitted per email address.`,
            };
        }
    } catch (searchErr) {
        console.warn("Cross-table search error:", searchErr);
    }

    return { isUnique: true };
}
