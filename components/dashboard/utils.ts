import { API_ENDPOINT } from "@/lib/api";

export const PRODUCT_IMAGE_MAP: Record<number, string> = {
    1: "/Brent Crude Oil.jpg",
    2: "/Ultra-Low Sulfur Diesel.jpg",
    3: "/Premium Unleaded Gasoline.jpg",
    4: "/Aviation Turbine Fuel (Jet A-1).jpg",
    5: "/images.jpg",
    6: "/Heavy Marine Fuel Oil (HFO).jpg",
};

export const getProductImage = (name?: string, img?: string, id?: number | string): string => {
    if (img && typeof img === "string" && img.trim() !== "") {
        const trimmed = img.trim();
        if (
            trimmed.startsWith("data:") ||
            trimmed.startsWith("blob:") ||
            trimmed.startsWith("http://") ||
            trimmed.startsWith("https://")
        ) {
            return trimmed;
        }
        if (trimmed.startsWith("/uploads/")) {
            return `${API_ENDPOINT}${trimmed}`;
        }
        if (trimmed.startsWith("/") && trimmed !== "/Brent Crude Oil.jpg") {
            return trimmed;
        }
    }

    if (typeof window !== "undefined") {
        try {
            if (id) {
                const customStoredId = localStorage.getItem(`product_img_${id}`);
                if (customStoredId && (customStoredId.startsWith("data:") || customStoredId.startsWith("blob:") || customStoredId.startsWith("http") || customStoredId.startsWith("/"))) {
                    return customStoredId;
                }
            }
            if (name) {
                const customStoredName = localStorage.getItem(`product_img_${name.trim()}`);
                if (customStoredName && (customStoredName.startsWith("data:") || customStoredName.startsWith("blob:") || customStoredName.startsWith("http") || customStoredName.startsWith("/"))) {
                    return customStoredName;
                }
            }
        } catch {
        }
    }

    const lower = (name || "").toLowerCase();
    if (lower.includes("lpg") || lower.includes("liquefied") || lower.includes("cylinder") || lower.includes("propane") || lower.includes("butane")) {
        return "/images.jpg";
    }
    if (lower.includes("diesel") || lower.includes("sulfur") || lower.includes("ulsd") || lower.includes("gasoil")) {
        return "/Ultra-Low Sulfur Diesel.jpg";
    }
    if (lower.includes("gasoline") || lower.includes("petrol") || lower.includes("octane") || lower.includes("unleaded") || lower.includes("mogas")) {
        return "/Premium Unleaded Gasoline.jpg";
    }
    if (lower.includes("jet") || lower.includes("aviation") || lower.includes("turbine") || lower.includes("a-1") || lower.includes("kerosene")) {
        return "/Aviation Turbine Fuel (Jet A-1).jpg";
    }
    if (lower.includes("marine") || lower.includes("bunker") || lower.includes("hfo") || lower.includes("heavy") || lower.includes("fuel oil")) {
        return "/Heavy Marine Fuel Oil (HFO).jpg";
    }
    if (lower.includes("crude") || lower.includes("brent") || lower.includes("wti") || lower.includes("raw")) {
        return "/Brent Crude Oil.jpg";
    }

    if (id !== undefined && id !== null) {
        const numId = Number(id);
        if (!isNaN(numId) && PRODUCT_IMAGE_MAP[numId]) {
            return PRODUCT_IMAGE_MAP[numId];
        }
        if (!isNaN(numId) && numId > 0) {
            const fallbackImages = [
                "/Brent Crude Oil.jpg",
                "/Ultra-Low Sulfur Diesel.jpg",
                "/Premium Unleaded Gasoline.jpg",
                "/Aviation Turbine Fuel (Jet A-1).jpg",
                "/images.jpg",
                "/Heavy Marine Fuel Oil (HFO).jpg",
            ];
            return fallbackImages[(numId - 1) % fallbackImages.length];
        }
    }

    if (img && (img.startsWith("/") || img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:"))) {
        return img;
    }

    return "/Brent Crude Oil.jpg";
};

export const getProductDescription = (product: any): string => {
    const description = [
        product?.description,
        product?.productDescription,
        product?.product_description,
        product?.details,
    ].find((value) => typeof value === "string" && value.trim());

    if (description) return description.trim();

    if (typeof window !== "undefined" && product?.id) {
        try {
            return localStorage.getItem(`product_description_${product.id}`)?.trim() || "";
        } catch {
        }
    }

    return "";
};

export const getRolePath = (title?: string): string => {
    const t = (title || "").toLowerCase();
    if (t.includes("admin")) return "admin";
    if (t.includes("supplier")) return "supplier";
    if (t.includes("dealer")) return "dealer";
    if (t.includes("delivery") || t.includes("driver") || t.includes("rider")) return "deliveryman";
    return "customer";
};

export const normalizeRole = (role?: string): string => {
    const path = getRolePath(role);
    if (path === "deliveryman") return "Deliveryman";
    return path.charAt(0).toUpperCase() + path.slice(1);
};

export const isValidPhoneNumber = (value?: string): boolean => {
    if (!value?.trim()) return true;
    const compact = value.trim().replace(/[()\s-]/g, "");
    return /^\+[1-9]\d{7,14}$/.test(compact) || /^0\d{9,14}$/.test(compact);
};

export const getAllUsersUrl = (title?: string): string => {
    const r = getRolePath(title);
    if (r === "admin") return `${API_ENDPOINT}/admin/getalladmin`;
    if (r === "supplier") return `${API_ENDPOINT}/supplier/getallsupplier`;
    if (r === "dealer") return `${API_ENDPOINT}/dealer/all`;
    if (r === "deliveryman") return `${API_ENDPOINT}/deliveryman/all`;
    return `${API_ENDPOINT}/customer/getallcustomer`;
};

export const getRoleBadgeColor = (role?: string): string => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (r.includes("supplier")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (r.includes("dealer")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (r.includes("delivery") || r.includes("driver")) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
};

export const getStatusBadgeClass = (status?: string): string => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed") || s.includes("active") || s.includes("paid")) {
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("confirmed") || s.includes("processing") || s.includes("transit")) {
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (s.includes("rejected") || s.includes("cancelled") || s.includes("inactive")) {
        return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
};

export interface SourcingPartyOption {
    id: number | string;
    userName?: string;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
}

export interface ProductSourcingConfig {
    posterRole: "supplier" | "dealer";
    posterParty: SourcingPartyOption;
    linkedDealers: SourcingPartyOption[];
    allowedSuppliers: SourcingPartyOption[];
    allowedDealers: SourcingPartyOption[];
    canChooseBetweenSupplierAndDealer: boolean;
    defaultSourcingChoice: "supplier" | "dealer";
    defaultPartyId: number | string;
    sourcingNotice: string;
}

export const getProductSourcingConfig = (
    product: any,
    availableSuppliers: any[] = [],
    availableDealers: any[] = []
): ProductSourcingConfig => {
    if (!product) {
        return {
            posterRole: "supplier",
            posterParty: availableSuppliers[0] || { id: 1, userName: "Refinery Supplier" },
            linkedDealers: [],
            allowedSuppliers: availableSuppliers,
            allowedDealers: availableDealers,
            canChooseBetweenSupplierAndDealer: availableSuppliers.length > 0 && availableDealers.length > 0,
            defaultSourcingChoice: "supplier",
            defaultPartyId: availableSuppliers[0]?.id || 1,
            sourcingNotice: "Standard sourcing channel available.",
        };
    }

    const rawSupplier = product.supplier?.id ? product.supplier : null;
    const rawUserOwner = product.user?.id ? product.user : null;
    const rawDealer = product.dealer?.id ? product.dealer : null;
    const originalOwner = rawSupplier || rawUserOwner;
    const isDealerPosted = !rawSupplier && !rawUserOwner && Boolean(rawDealer);
    const posterRole: "supplier" | "dealer" = isDealerPosted ? "dealer" : "supplier";

    const posterParty: SourcingPartyOption = isDealerPosted
        ? {
            id: rawDealer.id,
            userName: rawDealer.userName || rawDealer.username || rawDealer.name || `Dealer #${rawDealer.id}`,
            email: rawDealer.email || "Verified Dealer",
            role: "Dealer",
        }
        : rawSupplier
            ? {
                id: rawSupplier.id,
                userName: rawSupplier.userName || rawSupplier.username || rawSupplier.name || `Supplier #${rawSupplier.id}`,
                email: rawSupplier.email || "Verified Supplier",
                role: "Supplier",
            }
            : rawUserOwner
                ? {
                    id: rawUserOwner.id,
                    userName: rawUserOwner.userName || rawUserOwner.username || rawUserOwner.name || `Owner #${rawUserOwner.id}`,
                    email: rawUserOwner.email || "Verified Owner",
                    role: "Supplier",
                }
                : availableSuppliers[0] || { id: 1, userName: "Refinery Supplier Direct", email: "depot@refinery.com", role: "Supplier" };

    const linkedDealersMap = new Map<string, SourcingPartyOption>();

    if (Array.isArray(product.dealers)) {
        for (const d of product.dealers) {
            if (d?.id && (!rawDealer || String(d.id) !== String(rawDealer.id))) {
                linkedDealersMap.set(String(d.id), {
                    id: d.id,
                    userName: d.userName || d.username || d.name || `Dealer #${d.id}`,
                    email: d.email || "Verified Dealer",
                    role: "Dealer",
                });
            }
        }
    }

    if (typeof window !== "undefined" && product.id) {
        try {
            const stored = localStorage.getItem(`product_dealers_${product.id}`);
            if (stored) {
                const parsed: SourcingPartyOption[] = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    for (const d of parsed) {
                        if (d?.id) {
                            linkedDealersMap.set(String(d.id), {
                                id: d.id,
                                userName: d.userName || d.username || d.name || `Dealer #${d.id}`,
                                email: d.email || "Verified Dealer",
                                role: "Dealer",
                            });
                        }
                    }
                }
            }
        } catch {
        }
    }

    const linkedDealers = Array.from(linkedDealersMap.values());

    const ownerOption = originalOwner && String(originalOwner.id) !== String(posterParty.id)
        ? {
            id: originalOwner.id,
            userName: originalOwner.userName || originalOwner.username || originalOwner.name || "Original Owner",
            email: originalOwner.email || "Verified Owner",
            role: originalOwner.role || "Supplier",
        }
        : null;

    let allowedSuppliers: SourcingPartyOption[] = [];
    let allowedDealers: SourcingPartyOption[] = [];
    let canChooseBetweenSupplierAndDealer = false;
    let defaultSourcingChoice: "supplier" | "dealer" = "supplier";
    let defaultPartyId: number | string = posterParty.id;
    let sourcingNotice = "";

    if (posterRole === "supplier") {
        allowedSuppliers = [posterParty];
        if (linkedDealers.length > 0 || rawDealer) {
            allowedDealers = linkedDealers.length > 0 ? linkedDealers : [
                {
                    id: rawDealer.id,
                    userName: rawDealer.userName || rawDealer.username || rawDealer.name || `Dealer #${rawDealer.id}`,
                    email: rawDealer.email || "Verified Dealer",
                    role: "Dealer",
                }
            ];
            canChooseBetweenSupplierAndDealer = true;
            defaultSourcingChoice = "supplier";
            defaultPartyId = posterParty.id;
            sourcingNotice = `Available directly from the original owner (${posterParty.userName}) or from ${allowedDealers.length} authorized dealer(s) who added this product to their profile.`;
        } else {
            allowedDealers = [];
            canChooseBetweenSupplierAndDealer = false;
            defaultSourcingChoice = "supplier";
            defaultPartyId = posterParty.id;
            sourcingNotice = `Direct Sourcing: Posted by ${posterParty.userName}. No other dealer has added this product to their profile, so order is fulfilled directly by the posting supplier.`;
        }
    } else {
        const dedupedDealers = new Map<string, SourcingPartyOption>();
        [ownerOption, posterParty, ...linkedDealers.filter((d) => String(d.id) !== String(posterParty.id))]
            .filter(Boolean)
            .forEach((party) => {
                if (party && party.id) {
                    dedupedDealers.set(String(party.id), party);
                }
            });

        allowedSuppliers = ownerOption && (ownerOption.role || "").toLowerCase().includes("supplier") ? [ownerOption] : [];
        allowedDealers = Array.from(dedupedDealers.values()).filter((party) => {
            const isOwnerSupplier = (party.role || "").toLowerCase().includes("supplier");
            return !isOwnerSupplier;
        });

        const hasOriginalOwner = Boolean(ownerOption);
        canChooseBetweenSupplierAndDealer = hasOriginalOwner && (allowedSuppliers.length > 0 || allowedDealers.length > 1);
        if (!hasOriginalOwner && rawDealer) {
            allowedDealers = [posterParty, ...linkedDealers.filter((d) => String(d.id) !== String(posterParty.id))];
            canChooseBetweenSupplierAndDealer = allowedDealers.length > 1;
        }
        defaultSourcingChoice = "dealer";
        defaultPartyId = posterParty.id;
        sourcingNotice = hasOriginalOwner
            ? `Available from the original owner (${ownerOption?.userName}) or from ${posterParty.userName}, who added this product to their profile.`
            : `Authorized Dealer Lot: Posted by ${posterParty.userName}. Fulfill order directly through this dealer.`;
    }

    return {
        posterRole,
        posterParty,
        linkedDealers,
        allowedSuppliers,
        allowedDealers,
        canChooseBetweenSupplierAndDealer,
        defaultSourcingChoice,
        defaultPartyId,
        sourcingNotice,
    };
};

export const isProductLinkedToUser = (product: any, user: any): boolean => {
    if (!product || !user) return false;
    const userId = user.id ? Number(user.id) : null;
    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.userName || user.name || user.username || "").toLowerCase().trim();

    const matchesUser = (candidate: any) => {
        if (!candidate) return false;
        if (userId && candidate.id !== undefined && candidate.id !== null && Number(candidate.id) === userId) return true;
        if (userEmail && (candidate.email || "").toLowerCase().trim() === userEmail) return true;
        const candidateName = (candidate.userName || candidate.username || candidate.name || "").toLowerCase().trim();
        return Boolean(userName && candidateName && (candidateName === userName || candidateName.includes(userName) || userName.includes(candidateName)));
    };

    if (typeof window !== "undefined" && product.id) {
        try {
            const linkedDealers = JSON.parse(localStorage.getItem(`product_dealers_${product.id}`) || "[]");
            if (Array.isArray(linkedDealers) && linkedDealers.some((dealer: any) => matchesUser(dealer))) {
                return true;
            }
        } catch {
        }
    }

    if (Array.isArray(product.dealers) && product.dealers.some((dealer: any) => matchesUser(dealer))) {
        return true;
    }

    return false;
};

export const isProductOwner = (product: any, user: any): boolean => {
    if (!product || !user) return false;
    const userId = user.id ? Number(user.id) : null;
    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.userName || user.name || user.username || "").toLowerCase().trim();
    const userRole = getRolePath(user.title || user.role);

    const matchesUser = (candidate: any, expectedRole?: string) => {
        if (!candidate) return false;
        const candidateRole = getRolePath(candidate.role || candidate.title);
        if (expectedRole && candidateRole !== expectedRole) return false;
        if (userId && candidate.id !== undefined && candidate.id !== null && Number(candidate.id) === userId) return true;
        if (userEmail && (candidate.email || "").toLowerCase().trim() === userEmail) return true;
        const candidateName = (candidate.userName || candidate.username || candidate.name || "").toLowerCase().trim();
        return Boolean(userName && candidateName && candidateName === userName);
    };

    if (typeof window !== "undefined" && product.id) {
        try {
            const creatorStr = localStorage.getItem(`product_creator_${product.id}`);
            if (creatorStr) {
                const creator = JSON.parse(creatorStr);
                return matchesUser(creator, userRole);
            }

            const linkedDealers = JSON.parse(localStorage.getItem(`product_dealers_${product.id}`) || "[]");
            if (Array.isArray(linkedDealers) && linkedDealers.some((dealer: any) => matchesUser(dealer, "dealer"))) {
                return false;
            }
        } catch {
        }
    }

    if (userRole === "supplier" && product.supplier && matchesUser(product.supplier, "supplier")) return true;
    if (userRole === "supplier" && product.user && matchesUser(product.user, "supplier")) return true;
    if (userRole === "dealer" && !product.supplier && !product.user && product.dealer && matchesUser(product.dealer, "dealer")) return true;

    return false;
};
