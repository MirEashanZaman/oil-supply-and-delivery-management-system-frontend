"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import UberMapTracker from "@/components/uber-map-tracker";
import { getPusherClient, ChatMessage } from "@/lib/pusher";
import { checkEmailUniqueness } from "@/lib/email-checker";
import { API_ENDPOINT, API_ENDPOINT as apiBase } from "@/lib/api";

import {
    UserData,
    Order,
    Product,
    CartItem,
    SystemUser,
    DashboardTab,
} from "@/components/dashboard/types";
import {
    getProductImage,
    getProductDescription,
    getRolePath,
    normalizeRole,
    getAllUsersUrl,
    getRoleBadgeColor,
    getProductSourcingConfig,
    isProductOwner,
    isValidPhoneNumber,
} from "@/components/dashboard/utils";

import { CartDrawerModal } from "@/components/dashboard/modals/cart-drawer-modal";
import { CheckoutPaymentModal } from "@/components/dashboard/modals/checkout-payment-modal";
import { SandboxGatewayModal } from "@/components/dashboard/modals/sandbox-gateway-modal";
import { WholesaleOrderModal } from "@/components/dashboard/modals/wholesale-order-modal";
import { PostProductModal } from "@/components/dashboard/modals/post-product-modal";
import { EditProductModal } from "@/components/dashboard/modals/edit-product-modal";
import { EditUserModal } from "@/components/dashboard/modals/edit-user-modal";
import { EditOrderModal } from "@/components/dashboard/modals/edit-order-modal";

const OverviewTab = dynamic(() => import("@/components/dashboard/tabs/overview-tab").then((mod) => mod.OverviewTab));
const ProductsTab = dynamic(() => import("@/components/dashboard/tabs/products-tab").then((mod) => mod.ProductsTab));
const OrdersTab = dynamic(() => import("@/components/dashboard/tabs/orders-tab").then((mod) => mod.OrdersTab));
const TrackingTab = dynamic(() => import("@/components/dashboard/tabs/tracking-tab").then((mod) => mod.TrackingTab));
const InventoryTab = dynamic(() => import("@/components/dashboard/tabs/inventory-tab").then((mod) => mod.InventoryTab));
const AdminMonitoringTab = dynamic(() => import("@/components/dashboard/tabs/admin-monitoring-tab").then((mod) => mod.AdminMonitoringTab));
const LiveChatTab = dynamic(() => import("@/components/dashboard/tabs/live-chat-tab").then((mod) => mod.LiveChatTab));
const ProfileTab = dynamic(() => import("@/components/dashboard/tabs/profile-tab").then((mod) => mod.ProfileTab));

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>("products");
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [customInventory, setCustomInventory] = useState<Product[]>([]);
    const [supplierOperationalStatus, setSupplierOperationalStatus] = useState<string>("active");

    const [orders, setOrders] = useState<Order[]>([]);
    const [trackedOrderId, setTrackedOrderId] = useState<number | null>(null);
    const [isUberMapOpen, setIsUberMapOpen] = useState<boolean>(false);
    const [uberTrackingOrder, setUberTrackingOrder] = useState<Order | null>(null);

    const [allMergedUsers, setAllMergedUsers] = useState<SystemUser[]>([]);
    const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
    const [availableDealers, setAvailableDealers] = useState<any[]>([]);

    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [editUserForm, setEditUserForm] = useState({ name: "", email: "", role: "Customer", phone: "", address: "" });
    const [isEditingUserSubmitting, setIsEditingUserSubmitting] = useState(false);

    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editOrderForm, setEditOrderForm] = useState({ status: "Pending", quantity: "1", totalAmount: "0", deliveryAddress: "" });
    const [isEditingOrderSubmitting, setIsEditingOrderSubmitting] = useState(false);

    const [wholesaleProduct, setWholesaleProduct] = useState<Product | null>(null);
    const [wholesaleQuantity, setWholesaleQuantity] = useState<string>("50");
    const [wholesaleAddress, setWholesaleAddress] = useState<string>("");
    const [wholesaleNotes, setWholesaleNotes] = useState<string>("");
    const [orderingWholesale, setOrderingWholesale] = useState<boolean>(false);

    const [isPostProductModalOpen, setIsPostProductModalOpen] = useState<boolean>(false);
    const [newProductForm, setNewProductForm] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "Octane",
        photo: null as File | null,
    });
    const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState<boolean>(false);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editProductForm, setEditProductForm] = useState({ price: "", stock: "" });
    const [isSubmittingEditProduct, setIsSubmittingEditProduct] = useState<boolean>(false);

    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
    const [sourcingChoice, setSourcingChoice] = useState<"supplier" | "dealer">("supplier");
    const [selectedPartyId, setSelectedPartyId] = useState<number | "">("");
    const [orderQuantity, setOrderQuantity] = useState<number>(1);
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [cardType, setCardType] = useState<string>("Visa");
    const [cardNumber, setCardNumber] = useState<string>("");
    const [cardHolder, setCardHolder] = useState<string>("");
    const [cardExpiry, setCardExpiry] = useState<string>("");
    const [cardCvv, setCardCvv] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile" | "bank">("card");
    const [mobileOperator, setMobileOperator] = useState<string>("bKash");
    const [mobileWalletNumber, setMobileWalletNumber] = useState<string>("01700-000000");
    const [bankName, setBankName] = useState<string>("Eastern Bank Limited");
    const [bankAccountNumber, setBankAccountNumber] = useState<string>("EBL-10029384");

    const [isSandboxModalOpen, setIsSandboxModalOpen] = useState<boolean>(false);
    const [sandboxStep, setSandboxStep] = useState<"gateway" | "processing" | "success" | "declined">("gateway");
    const [sandboxOtp, setSandboxOtp] = useState<string>("123456");
    const [sandboxTxnId, setSandboxTxnId] = useState<string>("");
    const [sandboxAuthCode, setSandboxAuthCode] = useState<string>("");
    const [sandboxLogs, setSandboxProcessingLogs] = useState<string[]>([]);
    const [createdPaymentRecord, setCreatedPaymentRecord] = useState<any>(null);
    const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);
    const [cartToast, setCartToast] = useState<string | null>(null);
    const [isMultiCheckout, setIsMultiCheckout] = useState<boolean>(false);
    const [isDashboardRefreshing, setIsDashboardRefreshing] = useState<boolean>(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const [auditTrail, setAuditTrail] = useState<Array<{ id: number; action: string; detail: string; timestamp: string; type: "info" | "warning" | "success" }>>([]);

    const [promoCodeInput, setPromoCodeInput] = useState<string>("");
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [promoDiscountRate, setPromoDiscountRate] = useState<number>(0);
    const [promoFixedDiscount, setPromoFixedDiscount] = useState<number>(0);
    const [promoError, setPromoError] = useState<string | null>(null);

    const cartTotalItems = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
    const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + (item.product.numericPrice * item.quantity), 0), [cartItems]);

    // Volume Discount: 5% for >= 20 units, 10% for >= 50 units, 15% for >= 100 units
    const bulkDiscountRate = useMemo(() => {
        if (cartTotalItems >= 100) return 0.15;
        if (cartTotalItems >= 50) return 0.10;
        if (cartTotalItems >= 20) return 0.05;
        return 0;
    }, [cartTotalItems]);

    const bulkDiscountAmount = useMemo(() => Number((cartSubtotal * bulkDiscountRate).toFixed(2)), [cartSubtotal, bulkDiscountRate]);
    const promoDiscountAmount = useMemo(() => {
        if (promoDiscountRate > 0) return Number((cartSubtotal * promoDiscountRate).toFixed(2));
        if (promoFixedDiscount > 0) return Math.min(cartSubtotal, promoFixedDiscount);
        return 0;
    }, [cartSubtotal, promoDiscountRate, promoFixedDiscount]);

    const totalDiscountAmount = useMemo(() => Number((bulkDiscountAmount + promoDiscountAmount).toFixed(2)), [bulkDiscountAmount, promoDiscountAmount]);
    const cartTotalAmount = useMemo(() => Math.max(0, Number((cartSubtotal - totalDiscountAmount).toFixed(2))), [cartSubtotal, totalDiscountAmount]);

    const handleApplyPromoCode = (code: string) => {
        const clean = code.trim().toUpperCase();
        setPromoError(null);
        if (!clean) {
            setAppliedPromo(null);
            setPromoDiscountRate(0);
            setPromoFixedDiscount(0);
            return;
        }
        if (clean === "OIL10" || clean === "ENERGY10") {
            setAppliedPromo(clean);
            setPromoDiscountRate(0.10);
            setPromoFixedDiscount(0);
            setPromoError(null);
        } else if (clean === "PETRO20" || clean === "SAVE20") {
            setAppliedPromo(clean);
            setPromoDiscountRate(0.20);
            setPromoFixedDiscount(0);
            setPromoError(null);
        } else if (clean === "FLAT100" || clean === "BONUS100") {
            setAppliedPromo(clean);
            setPromoDiscountRate(0);
            setPromoFixedDiscount(100);
            setPromoError(null);
        } else if (clean === "WELCOME50") {
            setAppliedPromo(clean);
            setPromoDiscountRate(0);
            setPromoFixedDiscount(50);
            setPromoError(null);
        } else {
            setPromoError("Invalid promo code. Try OIL10, PETRO20, or WELCOME50");
        }
    };

    const handleRemovePromoCode = () => {
        setAppliedPromo(null);
        setPromoDiscountRate(0);
        setPromoFixedDiscount(0);
        setPromoCodeInput("");
        setPromoError(null);
    };

    const dashboardMetrics = useMemo(() => {
        const revenue = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
        const pendingOrders = orders.filter((order) => (order.status || "").toLowerCase() === "pending").length;
        const inTransitOrders = orders.filter((order) => {
            const status = (order.status || "").toLowerCase();
            return status.includes("delivery") || status.includes("transit") || status.includes("processing");
        }).length;
        const lowStockProducts = products.filter((product) => {
            const stock = Number(product.quantity ?? product.stock ?? 0);
            return Number.isFinite(stock) && stock <= 20;
        }).length;
        const totalInventory = products.reduce((sum, product) => sum + (Number(product.quantity ?? product.stock ?? 0) || 0), 0);
        const activeCustomers = allMergedUsers.filter((member) => {
            const role = (member.title || member.role || "").toLowerCase();
            return role === "customer";
        }).length;
        const partnerCount = availableSuppliers.length + availableDealers.length;

        return [
            {
                label: "Total Revenue",
                value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                detail: `${orders.length} order entries`,
                tint: "bg-emerald-50 text-emerald-700 border-emerald-200",
            },
            {
                label: "Pending Orders",
                value: String(pendingOrders),
                detail: `${inTransitOrders} in transit / processing`,
                tint: "bg-amber-50 text-amber-700 border-amber-200",
            },
            {
                label: "Low Stock Items",
                value: String(lowStockProducts),
                detail: `${totalInventory} units in stock`,
                tint: "bg-rose-50 text-rose-700 border-rose-200",
            },
            {
                label: "Network Reach",
                value: String(partnerCount || activeCustomers || 0),
                detail: `${activeCustomers} customers / ${partnerCount} partners`,
                tint: "bg-sky-50 text-sky-700 border-sky-200",
            },
        ];
    }, [orders, products, allMergedUsers, availableSuppliers, availableDealers]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("petroleum_cart");
            if (saved) setCartItems(JSON.parse(saved));
            const savedAudit = localStorage.getItem("audit_trail");
            if (savedAudit) {
                const parsedAudit = JSON.parse(savedAudit);
                if (Array.isArray(parsedAudit)) setAuditTrail(parsedAudit);
            }
        } catch { }
    }, []);

    const appendAuditEntry = (action: string, detail: string, type: "info" | "warning" | "success" = "info") => {
        const entry = {
            id: Date.now() + Math.random(),
            action,
            detail,
            timestamp: new Date().toLocaleString(),
            type,
        };

        setAuditTrail((prev) => {
            const next = [entry, ...prev].slice(0, 8);
            try {
                localStorage.setItem("audit_trail", JSON.stringify(next));
            } catch { }
            return next;
        });
    };

    const updateCartState = (newCart: CartItem[]) => {
        setCartItems(newCart);
        try {
            localStorage.setItem("petroleum_cart", JSON.stringify(newCart));
        } catch { }
    };

    const handleAddToCart = (product: Product, quantity: number = 1, sourcing: "supplier" | "dealer" = "supplier") => {
        if (user?.role === "Admin" || user?.title === "Admin") {
            alert("Admins cannot place customer orders.");
            return;
        }

        const config = getProductSourcingConfig(product, availableSuppliers, availableDealers);
        const normalizedSourcing = config.canChooseBetweenSupplierAndDealer ? (sourcing === "supplier" || sourcing === "dealer" ? sourcing : config.defaultSourcingChoice) : "supplier";
        const defaultParty = normalizedSourcing === "supplier"
            ? (config.allowedSuppliers[0]?.id ?? availableSuppliers[0]?.id ?? 1)
            : (config.allowedDealers[0]?.id ?? availableDealers[0]?.id ?? 1);
        const defaultDest = deliveryAddress.trim() || user?.address || "Main Operational Hub";

        const existingIndex = cartItems.findIndex((ci) => ci.product.id === product.id);
        let updated: CartItem[];

        if (existingIndex >= 0) {
            updated = cartItems.map((ci, idx) =>
                idx === existingIndex ? { ...ci, quantity: ci.quantity + quantity, sourcingChoice: normalizedSourcing, selectedPartyId: defaultParty } : ci
            );
        } else {
            updated = [...cartItems, { product, quantity, sourcingChoice: normalizedSourcing, selectedPartyId: defaultParty, deliveryAddress: defaultDest }];
        }

        updateCartState(updated);
        setCartToast(`Product added to cart successfully: ${product.name} (${quantity} unit${quantity > 1 ? "s" : ""})`);
        setTimeout(() => setCartToast(null), 3000);
    };

    const handleUpdateCartQty = (productId: number, newQty: number) => {
        if (newQty <= 0) {
            updateCartState(cartItems.filter((ci) => ci.product.id !== productId));
            return;
        }
        updateCartState(cartItems.map((ci) => (ci.product.id === productId ? { ...ci, quantity: newQty } : ci)));
    };

    const handleRemoveFromCart = (productId: number) => updateCartState(cartItems.filter((ci) => ci.product.id !== productId));
    const handleClearCart = () => updateCartState([]);
    const handleUpdateCartSourcing = (productId: number, sourcingChoice: "supplier" | "dealer", partyId: number | string) => {
        updateCartState(cartItems.map((ci) => (ci.product.id === productId ? { ...ci, sourcingChoice, selectedPartyId: partyId } : ci)));
    };
    const handleUpdateCartAddress = (productId: number, address: string) => {
        updateCartState(cartItems.map((ci) => (ci.product.id === productId ? { ...ci, deliveryAddress: address } : ci)));
    };

    const handleLaunchMultiCartSandbox = () => {
        if (user?.role === "Admin" || user?.title === "Admin") {
            alert("Admins cannot place customer orders.");
            return;
        }

        if (cartItems.length === 0) {
            alert("Your delivery cart is empty.");
            return;
        }
        setIsMultiCheckout(true);
        setCheckoutProduct(cartItems[0].product);
        const firstDeliveryAddress = cartItems[0].deliveryAddress?.trim();
        if (firstDeliveryAddress) {
            setDeliveryAddress(firstDeliveryAddress);
        }
        setIsCartModalOpen(false);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }

        try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setDeliveryAddress(parsed.address || "Dhaka, Bangladesh");
            setCardHolder(parsed.userName || parsed.name || parsed.email?.split("@")[0]);
            if (parsed.status) setSupplierOperationalStatus(parsed.status);
            fetchFullProfile(parsed.email, parsed.title || parsed.role);
            fetchSourcingParties();
        } catch (e) {
            console.error("Error parsing user data:", e);
            router.push("/login");
            return;
        }
        fetchCatalogProducts();
    }, []);

    const fetchCatalogProducts = async () => {
        setProductsLoading(true);
        try {
            const res = await axios.get(`${API_ENDPOINT}/product/list`, {
                withCredentials: true,
                validateStatus: (status) => status < 500,
            });
            if (res.status >= 400) {
                throw new Error(res.data?.message || "Products could not be loaded.");
            }
            const catalog = Array.isArray(res.data)
                ? res.data
                : res.data?.products || res.data?.data || res.data?.items || [];
            if (Array.isArray(catalog)) {
                const mapped: Product[] = catalog
                    .sort((a: any, b: any) => (a.id || 0) - (b.id || 0))
                    .map((p: any) => {
                        const mappedSupplier = p.suppliers?.[0] || p.supplier || (p.supplierId ? { id: p.supplierId } : undefined);
                        const mappedDealer = !mappedSupplier ? (p.dealers?.[0] || p.dealer || (p.dealerId ? { id: p.dealerId } : undefined)) : undefined;

                        return {
                            id: p.id,
                            name: p.name || `Product #${p.id}`,
                            category: p.category || (p.categories?.[0]?.name) || "Petroleum Grade",
                            price: typeof p.price === "number" ? `$${p.price.toFixed(2)}` : p.price || "$0.00",
                            numericPrice: typeof p.price === "number" ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, "")) || 0,
                            description: getProductDescription(p),
                            quantity: typeof p.quantity === "number" ? p.quantity : 1000,
                            stock: typeof p.quantity === "number" ? p.quantity : typeof p.stock === "number" ? p.stock : 1000,
                            inStock: typeof p.quantity === "number" ? p.quantity > 0 : true,
                            stockLevel: (p.quantity || 1000) <= 0 ? "Out of Stock" : (p.quantity || 1000) < 1000 ? "Low Stock" : "In Stock",
                            image: getProductImage(p.name, p.image || p.photo || p.photoUrl || p.imageUrl, p.id),
                            supplier: mappedSupplier,
                            dealer: mappedDealer,
                            user: p.user || p.owner || p.creator,
                            dealers: Array.isArray(p.dealers) ? p.dealers : [],
                        };
                    });
                setProducts(mapped);
                setDashboardError(null);
                setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            }
        } catch (err: any) {
            console.warn("Failed to fetch products:", err);
            setDashboardError(err.message || "Unable to load the latest catalog data.");
        } finally {
            setProductsLoading(false);
        }
    };

    const saveLocalOrderDetails = (orderId: number | string, details: { deliveryAddress: string; createdAt: string }) => {
        try {
            localStorage.setItem(`order_details_${orderId}`, JSON.stringify(details));
        } catch {
        }
    };

    const handleCreateAndPostProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!newProductForm.name.trim()) {
            alert("Please enter a valid product name.");
            return;
        }
        const parsedPrice = Number(newProductForm.price);
        if (!newProductForm.price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            alert("Please enter a valid price greater than $0.");
            return;
        }

        const parsedStock = Number(newProductForm.stock);
        if (!newProductForm.stock.trim() || !Number.isFinite(parsedStock) || parsedStock <= 0) {
            alert("Please enter a valid stock quantity greater than 0.");
            return;
        }

        if (!newProductForm.photo) {
            alert("Product photo is required! Please select a photo before publishing.");
            return;
        }

        setIsSubmittingNewProduct(true);
        const role = getRolePath(user.title || user.role);

        try {
            const photoBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(newProductForm.photo!);
            });

            const formData = new FormData();
            formData.append("name", newProductForm.name.trim());
            formData.append("description", newProductForm.description.trim());
            formData.append("price", String(Number(newProductForm.price)));
            formData.append("quantity", String(Number(newProductForm.stock)));
            formData.append("category", newProductForm.category);
            formData.append("photo", newProductForm.photo);
            formData.append("image", photoBase64);

            let createRes;
            try {
                createRes = await axios.post(
                    `${API_ENDPOINT}/product/create`,
                    formData,
                    {
                        withCredentials: true,
                        headers: { "Content-Type": "multipart/form-data" },
                        validateStatus: (status) => status < 500,
                    }
                );
            } catch {
                createRes = await axios.post(
                    `${API_ENDPOINT}/product/create`,
                    {
                        name: newProductForm.name.trim(),
                        description: newProductForm.description.trim(),
                        price: Number(newProductForm.price),
                        quantity: Number(newProductForm.stock),
                        category: newProductForm.category,
                        image: photoBase64,
                    },
                    { withCredentials: true, validateStatus: (status) => status < 500 }
                );
            }

            if (createRes.status < 200 || createRes.status >= 300) {
                const serverMessage = Array.isArray(createRes.data?.message)
                    ? createRes.data.message.join(", ")
                    : createRes.data?.message || `Product could not be created (${createRes.status}).`;
                throw new Error(serverMessage);
            }

            const createdProduct = createRes.data?.product || createRes.data?.data || createRes.data;
            const targetId = createdProduct?.id;

            try {
                if (targetId) {
                    localStorage.setItem(`product_description_${targetId}`, newProductForm.description.trim());
                    localStorage.setItem(`product_creator_${targetId}`, JSON.stringify({
                        id: user.id,
                        userName: user.userName || user.name,
                        email: user.email,
                        role: role,
                    }));
                    localStorage.setItem(`product_img_${targetId}`, photoBase64);
                }
                localStorage.setItem(`product_img_${newProductForm.name.trim()}`, photoBase64);
            } catch (storageErr) {
                console.warn("Could not save photo to localStorage:", storageErr);
            }

            if ((role === "supplier" || role === "dealer") && user.id && targetId) {
                try {
                    const portfolioRes = await axios.post(
                        `${API_ENDPOINT}/${role}/${user.id}/products`,
                        { productIds: [targetId] },
                        { withCredentials: true, validateStatus: (status) => status < 500 }
                    );
                    if (portfolioRes.status >= 400) {
                        throw new Error(portfolioRes.data?.message || "Could not add the product to your portfolio.");
                    }
                } catch (portfolioError: any) {
                    const message = portfolioError.response?.data?.message || portfolioError.message || "Could not add the product to your portfolio.";
                    throw new Error(`Product was created, but portfolio linking failed: ${message}`);
                }
            }

            alert(`Product "${newProductForm.name.trim()}" published successfully!`);
            appendAuditEntry("Product published", `Published ${newProductForm.name.trim()} for ${newProductForm.category}.`, "success");
            setNewProductForm({
                name: "",
                description: "",
                price: "",
                stock: "",
                category: "Octane",
                photo: null,
            });
            setIsPostProductModalOpen(false);
            await fetchCatalogProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to publish product.");
        } finally {
            setIsSubmittingNewProduct(false);
        }
    };

    const fetchSourcingParties = async () => {
        try {
            const [suppliersRes, dealersRes] = await Promise.allSettled([
                axios.get(`${apiBase}/supplier/getallsupplier`, { withCredentials: true, validateStatus: (status) => status < 500 }),
                axios.get(`${apiBase}/dealer/all`, { withCredentials: true, validateStatus: (status) => status < 500 }),
            ]);

            if (suppliersRes.status === "fulfilled" && suppliersRes.value.status === 200 && Array.isArray(suppliersRes.value.data)) {
                setAvailableSuppliers(suppliersRes.value.data);
            }
            if (dealersRes.status === "fulfilled" && dealersRes.value.status === 200 && Array.isArray(dealersRes.value.data)) {
                setAvailableDealers(dealersRes.value.data);
            }
        } catch (err) {
            console.warn("Failed to load sourcing partners:", err);
        }
    };

    const fetchFullProfile = async (email: string, title?: string) => {
        try {
            const searchRes = await axios.get(`${apiBase}/users/search?email=${encodeURIComponent(email)}`, {
                validateStatus: (status) => status < 500,
            });
            if (searchRes.status === 200 && searchRes.data?.user) {
                const match = searchRes.data.user;
                const r = searchRes.data.role || "customer";
                const storedProfile = JSON.parse(localStorage.getItem("user") || "null") as Partial<UserData> | null;
                const fullUser: UserData = {
                    id: match.id,
                    email: match.email,
                    userName: storedProfile?.userName || match.username || match.userName || email.split("@")[0],
                    name: storedProfile?.name || match.username || match.userName || email.split("@")[0],
                    phoneNumber: storedProfile?.phoneNumber || match.phoneNumber,
                    phone: storedProfile?.phone || match.phoneNumber,
                    address: storedProfile?.address || match.address,
                    title: normalizeRole(match.title || r),
                    role: normalizeRole(match.title || r),
                    status: match.status || "active",
                    photoUrl: storedProfile?.photoUrl?.startsWith("data:") || storedProfile?.photoUrl?.startsWith("/api/profile-image")
                        ? storedProfile.photoUrl
                        : (match.filename ? `/api/profile-image/${encodeURIComponent(match.filename)}` : undefined),
                };
                setUser(fullUser);
                localStorage.setItem("user", JSON.stringify(fullUser));
                fetchOrders(match.id, fullUser.title);
                if (normalizeRole(fullUser.title) === "Admin") fetchAllMergedUsers();
                return;
            }
        } catch (searchErr) {
            console.warn("User lookup error:", searchErr);
        }
    };

    const fetchAllMergedUsers = async () => {
        try {
            const res = await axios.get(`${apiBase}/admin/getallusers`, { withCredentials: true, validateStatus: (status) => status < 500 });
            if (res.status === 200 && Array.isArray(res.data)) {
                const uniqueUsers = new Map<string, SystemUser>();

                res.data.forEach((user: any) => {
                    const candidate = user as SystemUser;
                    const identity = [
                        candidate.id ?? "",
                        candidate.email ?? "",
                        candidate.userName ?? candidate.username ?? candidate.name ?? "",
                        candidate.title ?? candidate.role ?? "",
                    ].join("::");

                    if (!uniqueUsers.has(identity)) {
                        uniqueUsers.set(identity, candidate);
                    }
                });

                setAllMergedUsers(Array.from(uniqueUsers.values()));
            }
        } catch (err) {
            console.warn("Failed to fetch merged users:", err);
        }
    };

    const isAssignedToUser = (assignment: any, userId?: number) => {
        if (!assignment || !userId) return false;
        const identifiers = typeof assignment === "object"
            ? [assignment.id, assignment.userId, assignment.user?.id, assignment.supplierId, assignment.dealerId]
            : [assignment];
        return identifiers.some((identifier) => Number(identifier) === Number(userId));
    };

    const resolveOrderTotal = (order: any) => {
        const candidateValues = [
            order?.totalAmount,
            order?.amount,
            order?.payment?.amount,
            order?.payment?.totalAmount,
            order?.product?.price,
            order?.price,
            order?.unitPrice,
            order?.orderDetails?.unitPrice,
            order?.orderDetails?.payment?.amount,
            order?.orderDetails?.payment?.totalAmount,
        ];

        const validAmount = candidateValues.find((value) => {
            if (value === null || value === undefined || value === "") return false;
            const parsed = Number(String(value).replace(/[$,\s]/g, ""));
            return Number.isFinite(parsed) && parsed > 0;
        });

        const directAmount = validAmount === undefined
            ? 0
            : Number(String(validAmount).replace(/[$,\s]/g, ""));

        const quantity = Number(order?.quantity ?? order?.orderDetails?.quantity ?? 1) || 1;
        const productPriceValue = order?.product?.price ?? order?.price ?? order?.unitPrice ?? order?.orderDetails?.unitPrice ?? 0;
        const productPrice = Number(String(productPriceValue).replace(/[$,\s]/g, ""));

        if (Number.isFinite(directAmount) && directAmount > 0) {
            if (quantity > 1 && productPrice > 0 && directAmount <= productPrice) {
                return directAmount * quantity;
            }
            return directAmount;
        }
        if (Number.isFinite(productPrice) && productPrice > 0) return productPrice * quantity;
        return 0;
    };

    const fetchOrders = async (id?: number, title?: string) => {
        const r = getRolePath(title);
        const normalizeOrderFields = (order: any, fallbackAddress?: string) => {
            const details = order?.orderDetails || order?.order_details || {};
            let localDetails: any = {};
            if (typeof window !== "undefined" && order?.id) {
                try {
                    localDetails = JSON.parse(localStorage.getItem(`order_details_${order.id}`) || "{}");
                    localDetails.deliveryDate = localStorage.getItem(`order_delivery_date_${order.id}`) || localDetails.deliveryDate;
                } catch {
                }
            }
            const address = order?.address || order?.deliveryAddress || order?.delivery_address || order?.shippingAddress || order?.shipping_address || order?.destination || order?.location || order?.delivery?.address || order?.shipping?.address || order?.deliveryInfo?.address || details.address || details.deliveryAddress || details.delivery_address || details.shippingAddress || localDetails.deliveryAddress || fallbackAddress || "Local Hub";
            return {
                ...order,
                address,
                deliveryAddress: address,
                deliveryDate: order?.deliveryDate || order?.delivery_date || order?.scheduledDate || order?.scheduled_date || order?.expectedDeliveryDate || order?.expected_delivery_date || details.deliveryDate || details.delivery_date || details.scheduledDate || details.scheduled_date || localDetails.deliveryDate,
                createdAt: order?.createdAt || order?.created_at || order?.orderDate || order?.order_date || order?.placedAt || order?.placed_at || order?.orderTime || order?.order_time || order?.timestamp || details.createdAt || details.created_at || details.orderDate || details.order_date || localDetails.createdAt,
            };
        };
        if (r === "customer") {
            if (!id) return;
            try {
                const res = await axios.get(`${apiBase}/customer/${id}/orders`, { withCredentials: true, validateStatus: (status) => status < 500 });
                if (res.status === 200 && Array.isArray(res.data)) {
                    setOrders(res.data.map((o: any) => {
                        const normalizedOrder = normalizeOrderFields(o);
                        const computedTotal = resolveOrderTotal(normalizedOrder);

                        return {
                            ...normalizedOrder,
                            totalAmount: computedTotal,
                        };
                    }));
                }
            } catch (err) {
                console.warn("Failed to fetch customer orders:", err);
            }
        } else {
            try {
                const res = await axios.get(`${apiBase}/customer/getallcustomer`, { withCredentials: true, validateStatus: (status) => status < 500 });
                if (res.status === 200 && Array.isArray(res.data)) {
                    const allOrders: Order[] = [];
                    res.data.forEach((cust: any) => {
                        if (Array.isArray(cust.orders)) {
                            cust.orders.forEach((o: any) => {
                                const assignedParty = r === "supplier"
                                    ? (o.supplier ?? o.supplierId ?? o.supplier_id ?? o.supplierUser ?? o.supplier_user)
                                    : (o.dealer ?? o.dealerId ?? o.dealer_id ?? o.dealerUser ?? o.dealer_user);
                                if ((r === "supplier" || r === "dealer") && !isAssignedToUser(assignedParty, id)) {
                                    return;
                                }

                                const normalizedOrder = normalizeOrderFields(o, cust.address);
                                const computedTotal = resolveOrderTotal(normalizedOrder);

                                allOrders.push({
                                    ...normalizedOrder,
                                    id: o.id,
                                    quantity: Number(o.quantity ?? 1) || 1,
                                    status: o.status || "Pending",
                                    customerId: cust.id,
                                    customerName: cust.username || cust.userName || cust.email,
                                    customerEmail: cust.email,
                                    product: o.product || { id: 1, name: "Fuel Product" },
                                    supplier: o.supplier || (o.supplierId || o.supplier_id ? { id: o.supplierId || o.supplier_id } : undefined),
                                    dealer: o.dealer || (o.dealerId || o.dealer_id ? { id: o.dealerId || o.dealer_id } : undefined),
                                    payment: o.payment,
                                    totalAmount: computedTotal,
                                });
                            });
                        }
                    });
                    setOrders(allOrders);
                }
            } catch (err) {
                console.warn("Failed to load global orders:", err);
            }
        }
    };

    const applySandboxCardPreset = (type: "Visa" | "MasterCard" | "Amex") => {
        setPaymentMethod("card");
        if (type === "Visa") {
            setCardType("Visa");
            setCardNumber("4000-1234-5678-9010");
            setCardHolder((user?.userName || "John Doe").toUpperCase() + " / SANDBOX TEST");
            setCardExpiry("12/28");
            setCardCvv("123");
        } else if (type === "MasterCard") {
            setCardType("MasterCard");
            setCardNumber("5555-4444-3333-2222");
            setCardHolder((user?.userName || "Jane Smith").toUpperCase() + " / SANDBOX TEST");
            setCardExpiry("08/29");
            setCardCvv("456");
        } else {
            setCardType("American Express");
            setCardNumber("3782-8224-6310-005");
            setCardHolder((user?.userName || "Acme Oil Corp").toUpperCase() + " / SANDBOX TEST");
            setCardExpiry("10/27");
            setCardCvv("7890");
        }
    };

    const applySandboxMobilePreset = (op: "bKash" | "Nagad" | "Rocket") => {
        setPaymentMethod("mobile");
        setMobileOperator(op);
        setMobileWalletNumber(op === "bKash" ? "01700-000000" : op === "Nagad" ? "01800-000000" : "01900-000000");
    };

    const handleOpenCheckout = (product: Product) => {
        if (user?.role === "Admin" || user?.title === "Admin") {
            alert("Admins cannot place customer orders.");
            return;
        }

        const config = getProductSourcingConfig(product, availableSuppliers, availableDealers);

        setCheckoutProduct(product);
        setSourcingChoice(config.defaultSourcingChoice);
        setSelectedPartyId(Number(config.defaultPartyId) || "");
        setOrderQuantity(1);
        if (user?.address) setDeliveryAddress(user.address);
        applySandboxCardPreset("Visa");
        setIsSandboxModalOpen(false);
        setSandboxStep("gateway");
        setCreatedPaymentRecord(null);
        setCreatedOrderId(null);
    };

    const clearPaymentDetails = () => {
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setMobileWalletNumber("");
        setBankAccountNumber("");
    };

    const handleWholesaleOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !wholesaleProduct) return;

        const quantity = Number(wholesaleQuantity);
        const supplierId = wholesaleProduct.supplier?.id || wholesaleProduct.user?.id;
        if (!supplierId || !quantity || quantity <= 0) {
            alert("A supplier and valid wholesale quantity are required.");
            return;
        }

        setOrderingWholesale(true);
        try {
            const res = await axios.post(
                `${apiBase}/dealer/placeorder`,
                {
                    productId: wholesaleProduct.id,
                    supplierId: Number(supplierId),
                    quantity,
                    address: wholesaleAddress,
                    notes: wholesaleNotes,
                },
                { withCredentials: true, validateStatus: (status) => status < 500 }
            );

            if (res.status === 200 || res.status === 201) {
                alert("Wholesale order placed successfully.");
                setWholesaleProduct(null);
                setWholesaleAddress("");
                setWholesaleNotes("");
                fetchOrders(user.id, user.title);
                await fetchCatalogProducts();
            } else {
                alert(res.data?.message || "Wholesale order could not be placed.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Wholesale order failed.");
        } finally {
            setOrderingWholesale(false);
        }
    };

    const handleAddProductToPortfolio = async (product: Product) => {
        if (!user) {
            alert("Please sign in to add products to your profile.");
            return;
        }

        const role = getRolePath(user.title || user.role);

        if (role !== "dealer" && role !== "supplier") {
            alert("Only dealers and suppliers can link products to their profile.");
            return;
        }

        if (isProductOwner(product, user)) {
            alert("This product was posted by you and is already permanently fixed in your profile inventory.");
            return;
        }

        let effectiveUserId = user.id;
        if (!effectiveUserId && user.email) {
            try {
                const searchRes = await axios.get(
                    `${API_ENDPOINT}/users/search?email=${encodeURIComponent(user.email)}`,
                    { validateStatus: (status) => status < 500 }
                );
                if (searchRes.status === 200 && searchRes.data?.user?.id) {
                    effectiveUserId = searchRes.data.user.id;
                    const updatedUser = { ...user, id: effectiveUserId };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                }
            } catch {
            }
        }

        try {
            if (effectiveUserId) {
                try {
                    await axios.post(
                        `${API_ENDPOINT}/${role}/${effectiveUserId}/products`,
                        { productIds: [product.id] },
                        { withCredentials: true, validateStatus: (status) => status < 500 }
                    );
                } catch {
                    try {
                        await axios.post(
                            `${API_ENDPOINT}/${role}/${effectiveUserId}/products`,
                            { productId: product.id },
                            { withCredentials: true, validateStatus: (status) => status < 500 }
                        );
                    } catch {
                    }
                }
            }

            const portfolioKey = `user_portfolio_${effectiveUserId || user.email}`;
            try {
                const stored: number[] = JSON.parse(localStorage.getItem(portfolioKey) || "[]");
                if (!stored.includes(product.id)) {
                    stored.push(product.id);
                    localStorage.setItem(portfolioKey, JSON.stringify(stored));
                }

                const realOwner = product.supplier || product.user || product.dealer || null;
                const realOwnerId = realOwner && typeof realOwner === "object" ? realOwner.id : effectiveUserId || user.id;
                const isCurrentUserOwner = String(realOwnerId ?? "") === String(effectiveUserId ?? user.id ?? "");

                if (realOwner && !isCurrentUserOwner) {
                    const creatorName = (realOwner as any).userName || (realOwner as any).username || (realOwner as any).name || "";
                    const creatorEmail = (realOwner as any).email || "";
                    const creatorRole = (realOwner as any).role || (realOwner as any).title || "Supplier";
                    localStorage.setItem(`product_creator_${product.id}`, JSON.stringify({
                        id: realOwner.id,
                        userName: creatorName,
                        email: creatorEmail,
                        role: creatorRole,
                    }));
                }

                if (role === "dealer") {
                    const productDealersKey = `product_dealers_${product.id}`;
                    const existingDealers: any[] = JSON.parse(localStorage.getItem(productDealersKey) || "[]");
                    const dealerInfo = {
                        id: effectiveUserId || user.id || Date.now(),
                        userName: user.userName || user.name || "Authorized Dealer",
                        email: user.email || "Verified Dealer",
                        role: "Dealer",
                    };
                    if (!existingDealers.some((d: any) => String(d.id) === String(dealerInfo.id))) {
                        existingDealers.push(dealerInfo);
                        localStorage.setItem(productDealersKey, JSON.stringify(existingDealers));
                    }
                }
            } catch {
            }

            alert(`"${product.name}" was successfully added to your profile! Customers can now choose to buy this product from you or the original owner.`);
            await fetchCatalogProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to add product to your profile.");
        }
    };

    const handleRemoveProductFromPortfolio = async (productId: number) => {
        if (!user) return;
        const role = getRolePath(user.title || user.role);
        const effectiveUserId = user.id;

        try {
            if (effectiveUserId) {
                try {
                    await axios.delete(`${API_ENDPOINT}/${role}/${effectiveUserId}/products/${productId}`, {
                        withCredentials: true,
                        validateStatus: (status) => status < 500,
                    });
                } catch {
                }
            }

            const portfolioKey = `user_portfolio_${effectiveUserId || user.email}`;
            try {
                const stored: number[] = JSON.parse(localStorage.getItem(portfolioKey) || "[]");
                const updated = stored.filter((id) => id !== productId);
                localStorage.setItem(portfolioKey, JSON.stringify(updated));

                if (role === "dealer") {
                    const productDealersKey = `product_dealers_${productId}`;
                    const existingDealers: any[] = JSON.parse(localStorage.getItem(productDealersKey) || "[]");
                    const updatedDealers = existingDealers.filter(
                        (d: any) => String(d.id) !== String(effectiveUserId) && d.email !== user.email
                    );
                    localStorage.setItem(productDealersKey, JSON.stringify(updatedDealers));
                }
            } catch {
            }

            alert("Product was removed from your profile. Customers will now order from the original poster.");
            await fetchCatalogProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to remove product.");
        }
    };

    const handleAdminUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        if (getRolePath(user?.title || user?.role) !== "admin" && !isProductOwner(editingProduct, user)) {
            alert("Only the product owner or an admin can edit this product.");
            setEditingProduct(null);
            return;
        }

        const price = Number(editProductForm.price);
        const stock = Number(editProductForm.stock);
        if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
            alert("Enter a valid price and stock quantity.");
            return;
        }

        setIsSubmittingEditProduct(true);
        try {
            const responses = await Promise.all([
                axios.put(
                    `${API_ENDPOINT}/product/update-price/${editingProduct.id}`,
                    { price },
                    { withCredentials: true, validateStatus: (status) => status < 500 }
                ),
                axios.put(
                    `${API_ENDPOINT}/product/update-stock/${editingProduct.id}`,
                    { stock },
                    { withCredentials: true, validateStatus: (status) => status < 500 }
                ),
            ]);

            const failedResponse = responses.find((response) => response.status >= 400);
            if (failedResponse) {
                const message = Array.isArray(failedResponse.data?.message)
                    ? failedResponse.data.message.join(", ")
                    : failedResponse.data?.message || "Product could not be updated.";
                alert(message);
                return;
            }

            alert(`${editingProduct.name} updated successfully.`);
            setEditingProduct(null);
            await fetchCatalogProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update product.");
        } finally {
            setIsSubmittingEditProduct(false);
        }
    };

    const handleAdminDeleteProduct = async (productId: number, productName: string) => {
        const product = products.find((item) => item.id === productId);
        if (getRolePath(user?.title || user?.role) !== "admin" && !isProductOwner(product, user)) {
            alert("Only the product owner or an admin can delete this product.");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${productName}?`)) return;

        try {
            const role = getRolePath(user?.title || user?.role);
            const candidateUrls = [
                `${API_ENDPOINT}/product/${productId}`,
                `${API_ENDPOINT}/admin/product/${productId}`,
                `${API_ENDPOINT}/${role}/product/${productId}`,
            ];

            let res;
            let lastError: any = null;

            for (const url of candidateUrls) {
                try {
                    res = await axios.delete(url, {
                        withCredentials: true,
                        validateStatus: (status) => status < 500,
                    });
                    if (res.status === 200 || res.status === 204) {
                        break;
                    }
                    lastError = res;
                } catch (error) {
                    lastError = error;
                }
            }

            if (!res || !(res.status === 200 || res.status === 204)) {
                const message = lastError?.response?.data?.message || lastError?.message || "Product could not be deleted.";
                alert(message);
                return;
            }

            try {
                localStorage.removeItem(`product_creator_${productId}`);
                localStorage.removeItem(`product_dealers_${productId}`);
                localStorage.removeItem(`product_img_${productId}`);
                localStorage.removeItem(`product_img_${productName}`);
                if (user?.id || user?.email) {
                    const portfolioKey = `user_portfolio_${user.id || user.email}`;
                    const currentPort: number[] = JSON.parse(localStorage.getItem(portfolioKey) || "[]");
                    localStorage.setItem(portfolioKey, JSON.stringify(currentPort.filter((id) => id !== productId)));
                }
            } catch { }

            alert(`${productName} deleted successfully.`);
            await fetchCatalogProducts();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || "Failed to delete product.");
        }
    };

    const handleLaunchSandboxGateway = () => {
        if (!user || !user.id || (!checkoutProduct && !isMultiCheckout)) return;
        setSandboxTxnId((isMultiCheckout ? "SANDBOX-MULTI-" : "SB-TXN-") + Math.random().toString(36).substring(2, 9).toUpperCase());
        setSandboxAuthCode("AUTH-" + Math.floor(100000 + Math.random() * 900000));
        setSandboxOtp("123456");
        setSandboxStep("gateway");
        setIsSandboxModalOpen(true);
    };

    const handleExecuteSandboxAuthorization = async (forceSimulateDecline: boolean = false) => {
        if (!user || !user.id || !checkoutProduct) return;

        setSandboxStep("processing");
        setSandboxProcessingLogs([
            "Initializing Sandbox Payment Gateway Handshake (TLS 1.3)...",
            "Encrypting tokenized test credentials with 256-bit AES...",
        ]);

        if (forceSimulateDecline) {
            setTimeout(() => {
                setSandboxProcessingLogs((prev) => [...prev, "Sandbox Issuer simulated decline: 51_INSUFFICIENT_FUNDS_OR_EXPIRED_TOKEN"]);
                setSandboxStep("declined");
            }, 1200);
            return;
        }

        const destination = deliveryAddress.trim() || user.address || "Main Operational Hub";
        const cleanType = paymentMethod === "card" ? cardType : paymentMethod === "mobile" ? `${mobileOperator} Sandbox` : `${bankName} Wire Sandbox`;

        let totalAmount = 0;
        let singleDiscount = 0;
        if (isMultiCheckout) {
            totalAmount = cartTotalAmount;
        } else {
            const rawSub = Number((checkoutProduct.numericPrice * orderQuantity).toFixed(2));
            const singleBulkRate = orderQuantity >= 100 ? 0.15 : orderQuantity >= 50 ? 0.10 : orderQuantity >= 20 ? 0.05 : 0;
            const singleBulkDisc = Number((rawSub * singleBulkRate).toFixed(2));
            const singlePromoDisc = promoDiscountAmount > 0 ? promoDiscountAmount : 0;
            singleDiscount = Number((singleBulkDisc + singlePromoDisc).toFixed(2));
            totalAmount = Math.max(0, Number((rawSub - singleDiscount).toFixed(2)));
        }

        try {
            const paymentReference = `sandbox_${Date.now()}`;
            const paymentRes = await axios.post(`${apiBase}/payment/process`, { paymentReference, paymentMethod: cleanType, amount: totalAmount, status: "completed" }, { withCredentials: true, validateStatus: (status) => status < 500 });
            if (paymentRes.status === 200 || paymentRes.status === 201) {
                setCreatedPaymentRecord(paymentRes.data);
            }

            if (isMultiCheckout && cartItems.length > 0) {
                const createdIds: (number | string)[] = [];
                const defaultSupplierId = availableSuppliers[0]?.id ? Number(availableSuppliers[0].id) : 1;
                const defaultDealerId = availableDealers[0]?.id ? Number(availableDealers[0].id) : 1;

                // Allocate proportional discount across cart items if any
                const discountRatio = cartSubtotal > 0 ? totalDiscountAmount / cartSubtotal : 0;

                for (const item of cartItems) {
                    const itemDest = deliveryAddress.trim() || item.deliveryAddress?.trim() || destination;
                    const itemQty = Math.max(1, parseInt(String(item.quantity)) || 1);
                    const itemSubtotal = Number((item.product.numericPrice * itemQty).toFixed(2));
                    const itemDiscount = Number((itemSubtotal * discountRatio).toFixed(2));
                    const itemAmount = Math.max(0, Number((itemSubtotal - itemDiscount).toFixed(2)));
                    const partyIdNum = Number(item.selectedPartyId);

                    const itemPayload: any = {
                        quantity: itemQty,
                        address: itemDest,
                        deliveryAddress: itemDest,
                        delivery_address: itemDest,
                        status: "pending",
                        discount: itemDiscount,
                        product: { id: Number(item.product.id) || 1 },
                        payment: { paymentReference: `sandbox_${Date.now()}_${item.product.id}`, paymentMethod: cleanType, amount: itemAmount, status: "completed" },
                        sourceType: item.sourcingChoice,
                    };

                    if (item.sourcingChoice === "supplier") {
                        itemPayload.supplier = { id: (partyIdNum > 0 && !isNaN(partyIdNum)) ? partyIdNum : defaultSupplierId };
                        itemPayload.supplierId = itemPayload.supplier.id;
                    } else {
                        itemPayload.dealer = { id: (partyIdNum > 0 && !isNaN(partyIdNum)) ? partyIdNum : defaultDealerId };
                        itemPayload.dealerId = itemPayload.dealer.id;
                    }

                    try {
                        const itemRes = await axios.post(`${apiBase}/customer/${user.id}/orders`, itemPayload, { withCredentials: true, validateStatus: (status) => status < 500 });
                        if (itemRes.status === 200 || itemRes.status === 201) {
                            const createdId = itemRes.data?.id || itemRes.data?.order?.id || `ORD-${Date.now()}`;
                            createdIds.push(createdId);
                            saveLocalOrderDetails(createdId, { deliveryAddress: itemDest, createdAt: new Date().toISOString() });
                        }
                    } catch (err) {
                        console.warn("Sub-order create error:", err);
                    }
                }

                if (createdIds.length > 0) {
                    handleClearCart();
                    clearPaymentDetails();
                    setTimeout(() => {
                        setSandboxStep("success");
                        fetchOrders(user.id, user.title);
                    }, 1000);
                } else {
                    setSandboxStep("declined");
                }
                return;
            }

            const orderPayload: any = {
                quantity: orderQuantity,
                address: destination,
                deliveryAddress: destination,
                delivery_address: destination,
                status: "pending",
                discount: singleDiscount,
                product: { id: checkoutProduct.id },
                payment: { paymentReference, paymentMethod: cleanType, amount: totalAmount, status: "completed" },
                sourceType: sourcingChoice,
            };
            if (sourcingChoice === "supplier") {
                orderPayload.supplier = { id: Number(selectedPartyId) || 1 };
                orderPayload.supplierId = orderPayload.supplier.id;
            } else {
                orderPayload.dealer = { id: Number(selectedPartyId) || 1 };
                orderPayload.dealerId = orderPayload.dealer.id;
            }

            const orderRes = await axios.post(`${apiBase}/customer/${user.id}/orders`, orderPayload, { withCredentials: true, validateStatus: (status) => status < 500 });
            if (orderRes.status === 200 || orderRes.status === 201) {
                const createdId = orderRes.data?.id || orderRes.data?.order?.id || null;
                setCreatedOrderId(createdId);
                if (createdId) {
                    saveLocalOrderDetails(createdId, { deliveryAddress: destination, createdAt: new Date().toISOString() });
                }
                clearPaymentDetails();
                setTimeout(() => {
                    setSandboxStep("success");
                    fetchOrders(user.id, user.title);
                }, 1000);
            } else {
                setSandboxStep("declined");
            }
        } catch (err) {
            console.warn("Payment authorization failed:", err);
            setSandboxStep("declined");
        }
    };

    const handleFinishSandboxPayment = () => {
        setIsSandboxModalOpen(false);
        setIsMultiCheckout(false);
        setIsCartModalOpen(false);
        setCheckoutProduct(null);
        if (user && user.id) fetchOrders(user.id, user.title);
        setActiveTab("orders");
        if (createdOrderId) handleTrackOrder(createdOrderId);
    };

    const handleTrackOrder = (orderId: number, targetOrder?: Order) => {
        setTrackedOrderId(orderId);
        const matchedOrder: Order = targetOrder || orders.find((o) => o.id === orderId) || {
            id: orderId,
            quantity: 1,
            status: "In Transit",
            deliveryAddress: user?.address || "Customer Terminal Facility",
            product: { id: 1, name: "Petroleum Fuel" },
        };
        setUberTrackingOrder(matchedOrder);
        setIsUberMapOpen(true);
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!user || !user.id) return;
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            const res = await axios.delete(`${apiBase}/customer/${user.id}/orders/${orderId}`, { withCredentials: true, validateStatus: (status) => status < 500 });
            if (res.status === 200 || res.status === 204) {
                alert("Order cancelled successfully.");
                fetchOrders(user.id, user.title);
            }
        } catch (err) {
            alert("Failed to cancel order.");
        }
    };

    const handleUpdateOrderStatus = async (orderId: number, status: string) => {
        if (!user) return;
        const role = getRolePath(user.title || user.role);
        const normalizedStatus = status.trim().toLowerCase();
        const allowedStatuses = role === "customer"
            ? ["delivered"]
            : ["pending", "confirmed", "processing", "out for delivery", "cancelled", "rejected"];

        if (!allowedStatuses.includes(normalizedStatus)) {
            alert(
                role === "customer"
                    ? "Customers can only mark orders as delivered."
                    : "Suppliers and dealers can update order statuses except delivered."
            );
            return;
        }

        if (role === "supplier" || role === "dealer") {
            const targetOrder = orders.find((order) => order.id === orderId);
            const assignedParty = role === "supplier" ? targetOrder?.supplier : targetOrder?.dealer;
            if (!targetOrder || (assignedParty && !isAssignedToUser(assignedParty, user.id))) {
                alert("You can only update orders assigned to you.");
                return;
            }
        }

        try {
            const deliveredAt = normalizedStatus === "delivered" ? new Date().toISOString() : undefined;
            const res = await axios.put(
                `${apiBase}/${role}/confirmorder/${orderId}`,
                {
                    status: normalizedStatus,
                    ...(deliveredAt ? { deliveryDate: deliveredAt, delivery_date: deliveredAt } : {}),
                },
                { withCredentials: true, validateStatus: (status) => status < 500 }
            );
            if (res.status === 200 || res.status === 204) {
                const nextStatus = normalizedStatus === "delivered" ? "Delivered" : status;
                setOrders((currentOrders) => currentOrders.map((order) => (
                    order.id === orderId ? { ...order, status: nextStatus, ...(deliveredAt ? { deliveryDate: deliveredAt } : {}) } : order
                )));
                setUberTrackingOrder((currentOrder) => (
                    currentOrder?.id === orderId
                        ? { ...currentOrder, status: nextStatus, ...(deliveredAt ? { deliveryDate: deliveredAt } : {}) }
                        : currentOrder
                ));
                if (deliveredAt) {
                    saveLocalOrderDetails(orderId, {
                        deliveryAddress: orders.find((order) => order.id === orderId)?.deliveryAddress || "Local Hub",
                        createdAt: orders.find((order) => order.id === orderId)?.createdAt || deliveredAt,
                    });
                    try {
                        localStorage.setItem(`order_delivery_date_${orderId}`, deliveredAt);
                    } catch {
                    }
                }
                alert(`Order marked as ${nextStatus} successfully!`);
            } else {
                const serverMessage = res.data?.message || `Order update failed (${res.status}) at /${role}/confirmorder/${orderId}.`;
                alert(
                    res.status === 401
                        ? "Your session has expired. Please login again and retry."
                        : serverMessage
                );
            }
        } catch (err: any) {
            const status = err.response?.status;
            const serverMessage = err.response?.data?.message || `Failed to update order status at /${role}/confirmorder/${orderId}.`;
            alert(
                status === 401
                    ? "Your session has expired. Please login again and retry."
                    : serverMessage
            );
        }
    };

    const handleOpenEditOrder = (order: Order) => {
        setEditingOrder(order);
        setEditOrderForm({
            status: order.status || "Pending",
            quantity: String(order.quantity || 1),
            totalAmount: String(order.totalAmount ?? 0),
            deliveryAddress: order.deliveryAddress || order.address || "",
        });
    };

    const handleDeleteOrder = async (orderId: number) => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to delete this order?")) return;

        const targetOrder = orders.find((order) => order.id === orderId);
        const customerId = targetOrder?.customerId || user.id;
        if (!customerId) {
            alert("Order owner not found.");
            return;
        }

        try {
            const res = await axios.delete(`${apiBase}/customer/${customerId}/orders/${orderId}`, {
                withCredentials: true,
                validateStatus: (status) => status < 500,
            });

            if (res.status === 200 || res.status === 204) {
                alert("Order deleted successfully.");
                fetchOrders(customerId, user.title || user.role);
            }
        } catch (err) {
            alert("Failed to delete order.");
        }
    };

    const handleSubmitEditOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder || !user) return;

        const role = getRolePath(user.title || user.role);
        if (role === "admin") {
            alert("Admins can only delete orders. They cannot update any order.");
            return;
        }

        if (editOrderForm.status.toLowerCase() === "delivered" && role !== "customer") {
            alert("Only customers can mark an order as delivered.");
            return;
        }

        const customerId = editingOrder.customerId || user.id;
        if (!customerId) {
            alert("Order owner not found.");
            return;
        }

        try {
            const res = role === "admin"
                ? await axios.patch(
                    `${apiBase}/admin/order/${editingOrder.id}`,
                    {
                        quantity: Number(editOrderForm.quantity) || 1,
                        status: editOrderForm.status.toLowerCase(),
                    },
                    { withCredentials: true, validateStatus: (status) => status < 500 }
                )
                : await axios.patch(
                    `${apiBase}/customer/${customerId}/orders/${editingOrder.id}`,
                    {
                        quantity: Number(editOrderForm.quantity) || 1,
                        status: editOrderForm.status,
                        address: editOrderForm.deliveryAddress,
                        payment: {
                            amount: Number(editOrderForm.totalAmount) || 0,
                            status: "completed",
                        },
                    },
                    { withCredentials: true, validateStatus: (status) => status < 500 }
                );

            if (res.status === 200 || res.status === 204) {
                if (role === "admin" && editOrderForm.deliveryAddress && customerId) {
                    const addressRes = await axios.patch(
                        `${apiBase}/admin/customer/${customerId}`,
                        { address: editOrderForm.deliveryAddress },
                        { withCredentials: true, validateStatus: (status) => status < 500 }
                    );
                    if (addressRes.status >= 400) {
                        throw new Error(addressRes.data?.message || "Delivery address could not be updated.");
                    }
                }
                const updatedStatus = role === "admin"
                    ? editOrderForm.status.toLowerCase()
                    : editOrderForm.status;
                setOrders((currentOrders) => currentOrders.map((order) => (
                    order.id === editingOrder.id
                        ? {
                            ...order,
                            status: updatedStatus,
                            quantity: Number(editOrderForm.quantity) || 1,
                            address: editOrderForm.deliveryAddress,
                            deliveryAddress: editOrderForm.deliveryAddress,
                            totalAmount: Number(editOrderForm.totalAmount) || 0,
                        }
                        : order
                )));
                alert("Order updated successfully!");
                setEditingOrder(null);
                await fetchOrders(customerId, user.title || user.role);
            } else {
                alert("Failed to update order.");
            }
        } catch (err) {
            alert("Failed to update order.");
        }
    };

    const handleAdminCreateUser = async (newUser: any) => {
        const mobileNumberRegex = /^\+?[1-9][0-9\s\-().]{6,19}$/;
        if (!mobileNumberRegex.test(newUser.phone.trim())) {
            alert("Enter a valid international phone number.");
            return false;
        }
        setIsCreatingUser(true);
        try {
            const role = newUser.role.toLowerCase();
            const endpoint = role === "admin"
                ? `${apiBase}/admin/auth/register`
                : `${apiBase}/admin/${role}`;
            const payload = role === "admin"
                ? (() => {
                    const formData = new FormData();
                    formData.append("userName", newUser.name);
                    formData.append("email", newUser.email);
                    formData.append("password", newUser.password);
                    formData.append("phoneNumber", newUser.phone);
                    formData.append("address", newUser.address);
                    formData.append("title", newUser.role);
                    if (newUser.photo) formData.append("photo", newUser.photo);
                    return formData;
                })()
                : {
                    userName: newUser.name,
                    email: newUser.email,
                    password: newUser.password,
                    phoneNumber: newUser.phone,
                    address: newUser.address,
                    title: newUser.role,
                };
            const res = await axios.post(endpoint, payload, { withCredentials: true, validateStatus: (status) => status < 500 });
            if (res.status === 200 || res.status === 201) {
                appendAuditEntry("User created", `Created ${newUser.role} account for ${newUser.name}.`, "success");
                alert(`User ${newUser.name} created!`);
                fetchAllMergedUsers();
                return true;
            } else {
                const message = Array.isArray(res.data?.message)
                    ? res.data.message.join(", ")
                    : res.data?.message || `Failed to create ${newUser.role.toLowerCase()} account (${res.status}).`;
                alert(message);
                return false;
            }
        } catch (err: any) {
            const message = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(", ")
                : err.response?.data?.message || "Failed to create user.";
            alert(message);
            return false;
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleAdminDeleteUser = async (id: number) => {
        const resolveTargetUser = () => {
            const matches = allMergedUsers.filter((user) => Number(user.id) === Number(id));
            if (matches.length === 0) return null;
            return matches.find((user) => {
                const title = String(user.title || user.role || "").trim().toLowerCase();
                return !title.includes("admin");
            }) || matches[0];
        };

        const targetUser = resolveTargetUser();
        const targetTitle = String(targetUser?.title || targetUser?.role || "").trim().toLowerCase();
        if (targetTitle === "admin" || targetTitle.includes("admin")) {
            alert("Admin accounts cannot be deleted from this panel.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user?")) return;

        const detectedRole = getRolePath(targetUser?.title || targetUser?.role || "") || "customer";
        const matchesTarget = (candidate: any) => {
            if (!candidate) return false;
            if (candidate.id !== undefined && Number(candidate.id) === Number(id)) return true;
            if (candidate.userId !== undefined && Number(candidate.userId) === Number(id)) return true;
            if (candidate.email && targetUser?.email && candidate.email.toLowerCase() === targetUser.email.toLowerCase()) return true;
            return false;
        };

        const deleteResource = async (urls: string[], resourceName: string) => {
            let lastStatus = 0;
            for (const url of urls) {
                const response = await axios.delete(url, {
                    withCredentials: true,
                    validateStatus: (status) => status < 500,
                });
                lastStatus = response.status;
                if (response.status === 200 || response.status === 204) return;
            }
            if (lastStatus === 404) return;
            throw new Error(`${resourceName} could not be deleted (${lastStatus || "request failed"}).`);
        };

        const deleteUrls = [
            `${apiBase}/admin/${detectedRole}/${id}`,
            `${apiBase}/${detectedRole}/${id}`,
        ];

        let lastError: any = null;

        try {
            const customersRes = await axios.get(`${apiBase}/customer/getallcustomer`, {
                withCredentials: true,
                validateStatus: (status) => status < 500,
            });
            if (customersRes.status !== 200 || !Array.isArray(customersRes.data)) {
                throw new Error("Could not load customer orders for deletion.");
            }
            const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
            const targetCustomer = customers.find((customer: any) => Number(customer.id) === Number(id));
            if (detectedRole === "customer" && !targetCustomer) {
                throw new Error("Could not find the customer's orders for deletion.");
            }
            const targetOrders = customers.flatMap((customer: any) => {
                const customerOrders = Array.isArray(customer.orders) ? customer.orders : [];
                if (detectedRole === "customer") {
                    return Number(customer.id) === Number(id) ? customerOrders : [];
                }

                return customerOrders.filter((order: any) => {
                    const assignedParty = detectedRole === "supplier"
                        ? (order.supplier || order.supplierId || order.supplier_id || order.supplierUser || order.supplier_user)
                        : (order.dealer || order.dealerId || order.dealer_id || order.dealerUser || order.dealer_user);
                    return matchesTarget(assignedParty);
                });
            });

            for (const order of targetOrders) {
                if (order?.id === undefined || order?.id === null) continue;
                await deleteResource(
                    [`${apiBase}/customer/${id}/orders/${order.id}`],
                    `Order ${order.id}`
                );
            }

            const productsRes = await axios.get(`${apiBase}/product/list`, {
                withCredentials: true,
                validateStatus: (status) => status < 500,
            });
            if (productsRes.status !== 200 || !Array.isArray(productsRes.data)) {
                throw new Error("Could not load products for deletion.");
            }
            const ownedProducts = Array.isArray(productsRes.data)
                ? productsRes.data.filter((product: any) => {
                    const owners = [
                        product.supplier,
                        product.user,
                        product.owner,
                        product.creator,
                        product.dealer,
                        ...(Array.isArray(product.suppliers) ? product.suppliers : []),
                    ];
                    return owners.some(matchesTarget);
                })
                : [];

            for (const product of ownedProducts) {
                if (product?.id === undefined || product?.id === null) continue;
                await deleteResource(
                    [
                        `${apiBase}/product/${product.id}`,
                        `${apiBase}/admin/product/${product.id}`,
                    ],
                    `Product ${product.id}`
                );
            }

            for (const url of deleteUrls) {
                try {
                    const res = await axios.delete(url, {
                        withCredentials: true,
                        validateStatus: (status) => status < 500,
                    });

                    if (res.status === 200 || res.status === 204) {
                        await fetchAllMergedUsers();
                        const refreshed = await axios.get(`${apiBase}/admin/getallusers`, {
                            withCredentials: true,
                            validateStatus: (status) => status < 500,
                        });

                        const stillExists = Array.isArray(refreshed.data) && refreshed.data.some((user: any) => Number(user.id) === Number(id));

                        if (stillExists) {
                            appendAuditEntry("User deletion requested", `Removal request submitted for user ID ${id}.`, "warning");
                            alert("Delete request success");
                            return;
                        }

                        appendAuditEntry("User deleted", `Deleted user account ID ${id}.`, "warning");
                        alert("User deleted successfully.");
                        return;
                    }

                    lastError = res;
                } catch (error) {
                    lastError = error;
                }
            }

            const message = Array.isArray(lastError?.response?.data?.message)
                ? lastError.response.data.message.join(", ")
                : lastError?.response?.data?.message || "Failed to delete user.";
            alert(message);
        } catch (err: any) {
            const message = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(", ")
                : err.response?.data?.message || "Failed to delete user.";
            alert(message);
        }
    };

    const handleAdminUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const phone = editUserForm.phone.trim();
        if (!isValidPhoneNumber(phone)) {
            alert("Enter an international mobile number, such as +8801712345678.");
            return;
        }

        const normalizedName = editUserForm.name.trim();
        const normalizedEmail = editUserForm.email.trim();
        const normalizedAddress = editUserForm.address.trim();

        setIsEditingUserSubmitting(true);
        try {
            const role = getRolePath(editingUser.title || editingUser.role);
            const candidateUrls = [
                `${apiBase}/${role}/${editingUser.id}`,
                `${apiBase}/admin/${role}/${editingUser.id}`,
            ];

            let lastError: any = null;
            let successResponse: any = null;

            for (const url of candidateUrls) {
                try {
                    const res = await axios.patch(
                        url,
                        {
                            userName: normalizedName,
                            email: normalizedEmail,
                            phoneNumber: phone,
                            address: normalizedAddress,
                        },
                        { withCredentials: true, validateStatus: (status) => status < 500 }
                    );

                    if (res.status === 200 || res.status === 204) {
                        successResponse = res;
                        break;
                    }

                    lastError = res;
                } catch (err) {
                    lastError = err;
                }
            }

            if (successResponse) {
                const updatedUser = {
                    ...editingUser,
                    name: normalizedName,
                    userName: normalizedName,
                    email: normalizedEmail,
                    phoneNumber: phone,
                    phone: phone,
                    address: normalizedAddress,
                };

                setAllMergedUsers((prev) =>
                    prev.map((user) => (user.id === editingUser.id ? updatedUser : user))
                );
                setEditingUser(null);
                await fetchAllMergedUsers();
                appendAuditEntry("User updated", `${normalizedName} was updated in the admin registry.`, "success");
                alert(`${normalizedName} updated successfully.`);
                return;
            }

            const message = Array.isArray(lastError?.response?.data?.message)
                ? lastError.response.data.message.join(", ")
                : lastError?.response?.data?.message || "User could not be updated.";
            alert(message);
        } catch (err: any) {
            const message = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join(", ")
                : err.response?.data?.message || "Failed to update user.";
            alert(message);
        } finally {
            setIsEditingUserSubmitting(false);
        }
    };

    const handleUpdateProfile = async (updated: Partial<UserData>) => {
        if (!user) return;
        const r = getRolePath(user.title || user.role);
        const phone = String(updated.phoneNumber ?? user.phoneNumber ?? user.phone ?? "").trim();
        if (!isValidPhoneNumber(phone)) {
            alert("Enter a valid local or international mobile number (e.g. 01952597587 or +8801952597587).");
            return;
        }
        try {
            if (user.id) {
                const payload: any = {
                    userName: updated.userName || user.userName || user.name,
                    username: updated.userName || user.userName || user.name,
                    phoneNumber: phone,
                    address: updated.address !== undefined ? updated.address : user.address,
                };

                if (updated.password && updated.password.trim().length > 0) {
                    payload.password = updated.password.trim();
                }

                const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
                const headers: any = {};
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`;
                }

                const response = await axios.patch(
                    `${apiBase}/${r}/${user.id}`,
                    payload,
                    {
                        headers,
                        withCredentials: true,
                        validateStatus: (status) => status < 500
                    }
                );

                if (response.status >= 400) {
                    throw new Error(response.data?.message || "Profile update was rejected by server.");
                }
            }
            const mergedUser: UserData = { ...user, ...updated, phoneNumber: phone, phone };
            setUser(mergedUser);
            localStorage.setItem("user", JSON.stringify(mergedUser));
            appendAuditEntry("Profile updated", `Updated profile information for ${mergedUser.userName || mergedUser.name || user.email}.`, "success");
            alert("Profile updated successfully!");
        } catch (err: any) {
            console.warn("Failed to persist profile to backend:", err);
            const mergedUser: UserData = { ...user, ...updated, phoneNumber: phone, phone };
            setUser(mergedUser);
            localStorage.setItem("user", JSON.stringify(mergedUser));
            alert(err.message || "Profile updated locally.");
        }
    };

    const handleDeleteOwnAccount = async () => {
        if (!user) return;
        if (!window.confirm(`Are you sure you want to permanently delete your ${user.title || user.role || "user"} account?`)) return;
        const r = getRolePath(user.title || user.role);
        try {
            let url = `${apiBase}/customer/${user.userName}`;
            if (r === "supplier" || r === "dealer" || r === "admin") {
                url = `${apiBase}/${r}/${user.id || 1}`;
            }
            await axios.delete(url, { withCredentials: true, validateStatus: (status) => status < 500 });
            localStorage.removeItem("user");
            alert("Account deleted successfully.");
            router.push("/login");
        } catch (err) {
            alert("Failed to delete account.");
        }
    };

    const refreshDashboard = async () => {
        if (!user?.id) return;

        setIsDashboardRefreshing(true);
        setDashboardError(null);
        try {
            await Promise.all([
                fetchCatalogProducts(),
                fetchOrders(user.id, user.title || user.role),
                fetchSourcingParties(),
            ]);
            setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (err: any) {
            setDashboardError(err.message || "The dashboard could not refresh. Please try again.");
        } finally {
            setIsDashboardRefreshing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4 text-center">
                <h2 className="text-[#DC2626] text-xl font-bold mb-4">Access Denied</h2>
                <button onClick={() => router.push("/login")} className="btn btn-primary font-bold rounded-xl px-6">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#1E293B] flex flex-col w-full max-w-[100vw] overflow-x-hidden">
            <MyHeader name="Dashboard" message="Oil Supply & Delivery Operations Portal" />
            <MyNavigation />

            {cartToast && (
                <div
                    role="status"
                    className="fixed right-3 sm:right-5 top-5 z-[70] rounded-xl border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm max-w-[90vw]"
                >
                    {cartToast}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center px-2 sm:px-6 w-full max-w-full overflow-x-hidden">
                {/* User Info Bar */}
                <div className="w-full max-w-[1200px] card bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-6 text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4 sm:pb-6">
                        <div className="flex items-center gap-3">
                            {user.photoUrl ? (
                                <img
                                    src={user.photoUrl}
                                    alt="User photo"
                                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-sm shrink-0"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[#0F2747] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0">
                                    {(user.userName || user.name || user.email || "U")[0].toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-xl font-extrabold text-[#0F2747] truncate">
                                        {user.userName || user.name}
                                    </h2>
                                    <span className={`badge border-none font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 ${getRoleBadgeColor(user.title || user.role || "")}`}>
                                        {user.title || user.role || "User"}
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-secondary-gray mt-0.5 truncate max-w-[240px] sm:max-w-none">
                                    {user.email} {user.address ? `• ${user.address}` : ""}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap pt-2 sm:pt-0">
                            {user.role === "Customer" && (
                                <button
                                    type="button"
                                    onClick={() => setIsCartModalOpen(true)}
                                    className="btn btn-accent btn-xs sm:btn-sm rounded-xl font-bold flex items-center gap-1.5"
                                >
                                    <span>Delivery Cart</span>
                                    {cartTotalItems > 0 && (
                                        <span className="badge badge-xs bg-[#0F2747] text-white border-none font-bold">
                                            {cartTotalItems}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={refreshDashboard}
                                className="btn btn-ghost btn-xs sm:btn-sm text-[#0F2747] hover:bg-slate-100 rounded-xl font-bold"
                                disabled={isDashboardRefreshing}
                            >
                                {isDashboardRefreshing ? "Refreshing..." : "Refresh"}
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn btn-ghost btn-xs sm:btn-sm text-[#DC2626] hover:bg-rose-50 rounded-xl font-bold"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {(dashboardError || isDashboardRefreshing || lastSyncedAt) && (
                        <div className={`mt-4 flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm ${dashboardError ? "border-amber-200 bg-amber-50 text-amber-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>
                            {isDashboardRefreshing && (
                                <div className="flex items-center gap-2">
                                    <span className="loading loading-spinner loading-xs" />
                                    Refreshing dashboard data and sourcing partners...
                                </div>
                            )}
                            {dashboardError && <div>{dashboardError}</div>}
                            {!dashboardError && !isDashboardRefreshing && (
                                <div>Last synced at {lastSyncedAt}</div>
                            )}
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                        {dashboardMetrics.map((metric) => (
                            <div key={metric.label} className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 shadow-sm ${metric.tint}`}>
                                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.08em] opacity-80 truncate">{metric.label}</div>
                                <div className="mt-1.5 sm:mt-3 text-lg sm:text-2xl font-black leading-none">{metric.value}</div>
                                <div className="mt-1.5 text-[10px] sm:text-xs font-medium opacity-80 line-clamp-1">{metric.detail}</div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-4 pb-1 no-scrollbar w-full">
                        <button
                            type="button"
                            onClick={() => setActiveTab("overview")}
                            className={`btn btn-xs sm:btn-sm rounded-xl font-bold transition-all text-xs shrink-0 ${activeTab === "overview"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("products")}
                            className={`btn btn-xs sm:btn-sm rounded-xl font-bold transition-all text-xs shrink-0 ${activeTab === "products"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Products ({products.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("orders")}
                            className={`btn btn-xs sm:btn-sm rounded-xl font-bold transition-all text-xs shrink-0 ${activeTab === "orders"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Orders ({orders.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("tracking")}
                            className={`btn btn-sm rounded-xl font-bold transition-all ${activeTab === "tracking"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Live Tracking
                        </button>
                        {(user.role === "Dealer" || user.title === "Dealer" || user.role === "Supplier" || user.title === "Supplier") && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("inventory")}
                                className={`btn btn-sm rounded-xl font-bold transition-all ${activeTab === "inventory"
                                    ? "btn-primary shadow-sm"
                                    : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                    }`}
                            >
                                Stock Reserve
                            </button>
                        )}
                        {(user.role === "Admin" || user.title === "Admin") && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("admin-monitoring")}
                                className={`btn btn-sm rounded-xl font-bold transition-all ${activeTab === "admin-monitoring"
                                    ? "btn-primary shadow-sm"
                                    : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                    }`}
                            >
                                Admin Monitoring
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setActiveTab("chat")}
                            className={`btn btn-sm rounded-xl font-bold transition-all ${activeTab === "chat"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Realtime Chat
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className={`btn btn-sm rounded-xl font-bold transition-all ${activeTab === "profile"
                                ? "btn-primary shadow-sm"
                                : "btn-ghost text-secondary-gray hover:text-[#0F2747]"
                                }`}
                        >
                            Profile
                        </button>
                    </div>
                </div>

                { }
                <div className="w-full max-w-[1200px] mb-12">
                    {activeTab === "overview" && (
                        <OverviewTab
                            userData={user}
                            orders={orders}
                            products={products}
                            auditTrail={auditTrail}
                            setActiveTab={setActiveTab}
                            onOpenCart={() => setIsCartModalOpen(true)}
                            onOpenLiveTrack={(ord) => handleTrackOrder(ord.id, ord)}
                        />
                    )}

                    {activeTab === "products" && (
                        <ProductsTab
                            products={products}
                            userData={user}
                            loadingProducts={productsLoading}
                            onAddToCart={handleAddToCart}
                            onInstantOrder={handleOpenCheckout}
                            onWholesaleOrder={(prod) => {
                                setWholesaleProduct(prod);
                                setWholesaleQuantity("50");
                            }}
                            onAddToPortfolio={handleAddProductToPortfolio}
                            onRemoveFromPortfolio={handleRemoveProductFromPortfolio}
                            onEditProduct={(product) => {
                                setEditingProduct(product);
                                setEditProductForm({
                                    price: String(product.numericPrice || ""),
                                    stock: String(product.quantity ?? product.stock ?? ""),
                                });
                            }}
                            onDeleteProduct={handleAdminDeleteProduct}
                            onOpenPostProductModal={() => setIsPostProductModalOpen(true)}
                        />
                    )}

                    {activeTab === "orders" && (
                        <OrdersTab
                            orders={orders}
                            userData={user}
                            loadingOrders={false}
                            onOpenLiveTrack={(ord) => handleTrackOrder(ord.id, ord)}
                            onCancelOrder={handleCancelOrder}
                            onUpdateOrderStatus={handleUpdateOrderStatus}
                            onEditOrder={handleOpenEditOrder}
                            onDeleteOrder={handleDeleteOrder}
                        />
                    )}

                    {activeTab === "tracking" && (
                        <TrackingTab
                            selectedTrackingOrder={uberTrackingOrder || orders.find((order) => {
                                const status = (order.status || "").toLowerCase();
                                return status !== "delivered" && status !== "completed" && status !== "cancelled" && status !== "rejected";
                            }) || null}
                            orders={orders}
                            onSelectOrder={(ord) => setUberTrackingOrder(ord)}
                            userRole={user.title || user.role}
                            onClose={() => {
                                setIsUberMapOpen(false);
                                setUberTrackingOrder(null);
                                setActiveTab("orders");
                            }}
                        />
                    )}

                    {activeTab === "inventory" && (
                        <InventoryTab
                            products={products}
                            userData={user}
                            onWholesaleOrder={(prod) => {
                                setWholesaleProduct(prod);
                                setWholesaleQuantity("50");
                            }}
                            onOpenPostProductModal={() => setIsPostProductModalOpen(true)}
                            onRemoveFromPortfolio={handleRemoveProductFromPortfolio}
                            onEditProduct={(product) => {
                                setEditingProduct(product);
                                setEditProductForm({
                                    price: String(product.numericPrice || ""),
                                    stock: String(product.quantity ?? product.stock ?? ""),
                                });
                            }}
                            onDeleteProduct={handleAdminDeleteProduct}
                        />
                    )}

                    {activeTab === "admin-monitoring" && (
                        <AdminMonitoringTab
                            users={allMergedUsers}
                            loadingUsers={false}
                            onEditUser={(u) => {
                                setEditingUser(u);
                                setEditUserForm({
                                    name: u.name || u.userName || u.username || "",
                                    email: u.email || "",
                                    role: u.title || u.role || "Customer",
                                    phone: u.phone || u.phoneNumber || "",
                                    address: u.address || "",
                                });
                            }}
                            onDeleteUser={handleAdminDeleteUser}
                            onCreateUser={handleAdminCreateUser}
                            creatingUser={isCreatingUser}
                        />
                    )}

                    {activeTab === "chat" && <LiveChatTab userData={user} />}

                    {activeTab === "profile" && (
                        <ProfileTab
                            userData={user}
                            onUpdateProfile={handleUpdateProfile}
                            onDeleteAccount={handleDeleteOwnAccount}
                        />
                    )}
                </div>
            </div>

            { }
            <CartDrawerModal
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
                cartItems={cartItems}
                cartTotalItems={cartTotalItems}
                cartSubtotal={cartSubtotal}
                cartTotalAmount={cartTotalAmount}
                bulkDiscountAmount={bulkDiscountAmount}
                bulkDiscountRate={bulkDiscountRate}
                promoDiscountAmount={promoDiscountAmount}
                appliedPromo={appliedPromo}
                promoCodeInput={promoCodeInput}
                setPromoCodeInput={setPromoCodeInput}
                promoError={promoError}
                onApplyPromo={handleApplyPromoCode}
                onRemovePromo={handleRemovePromoCode}
                availableSuppliers={availableSuppliers}
                availableDealers={availableDealers}
                deliveryAddress={deliveryAddress}
                onUpdateQty={handleUpdateCartQty}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onUpdateSourcing={handleUpdateCartSourcing}
                onUpdateAddress={handleUpdateCartAddress}
                onProceedToPayment={handleLaunchMultiCartSandbox}
                onBrowseCatalog={() => {
                    setIsCartModalOpen(false);
                    setActiveTab("products");
                }}
            />

            <CheckoutPaymentModal
                isOpen={Boolean(checkoutProduct) && !isSandboxModalOpen}
                onClose={() => {
                    setCheckoutProduct(null);
                    setIsMultiCheckout(false);
                    clearPaymentDetails();
                }}
                isMultiCheckout={isMultiCheckout}
                checkoutProduct={checkoutProduct}
                cartItems={cartItems}
                cartTotalItems={cartTotalItems}
                cartTotalAmount={cartTotalAmount}
                bulkDiscountAmount={bulkDiscountAmount}
                bulkDiscountRate={bulkDiscountRate}
                promoDiscountAmount={promoDiscountAmount}
                appliedPromo={appliedPromo}
                promoCodeInput={promoCodeInput}
                setPromoCodeInput={setPromoCodeInput}
                promoError={promoError}
                onApplyPromo={handleApplyPromoCode}
                onRemovePromo={handleRemovePromoCode}
                orderQuantity={orderQuantity}
                setOrderQuantity={setOrderQuantity}
                sourcingChoice={sourcingChoice}
                setSourcingChoice={setSourcingChoice}
                selectedPartyId={selectedPartyId}
                setSelectedPartyId={(id) => setSelectedPartyId(id === "" ? "" : (Number(id) || ""))}
                availableSuppliers={availableSuppliers}
                availableDealers={availableDealers}
                deliveryAddress={deliveryAddress}
                setDeliveryAddress={setDeliveryAddress}
                user={user}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cardType={cardType}
                setCardType={setCardType}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardHolder={cardHolder}
                setCardHolder={setCardHolder}
                cardExpiry={cardExpiry}
                setCardExpiry={setCardExpiry}
                cardCvv={cardCvv}
                setCardCvv={setCardCvv}
                mobileOperator={mobileOperator}
                setMobileOperator={setMobileOperator}
                mobileWalletNumber={mobileWalletNumber}
                setMobileWalletNumber={setMobileWalletNumber}
                bankName={bankName}
                setBankName={setBankName}
                bankAccountNumber={bankAccountNumber}
                setBankAccountNumber={setBankAccountNumber}
                onApplyCardPreset={applySandboxCardPreset}
                onApplyMobilePreset={applySandboxMobilePreset}
                onLaunchSandboxGateway={handleLaunchSandboxGateway}
                onReturnToCart={() => {
                    setCheckoutProduct(null);
                    setIsMultiCheckout(false);
                    setIsCartModalOpen(true);
                }}
            />

            <SandboxGatewayModal
                isOpen={isSandboxModalOpen}
                onClose={() => setIsSandboxModalOpen(false)}
                sandboxStep={sandboxStep}
                setSandboxStep={setSandboxStep}
                isMultiCheckout={isMultiCheckout}
                checkoutProduct={checkoutProduct}
                cartItems={cartItems}
                cartTotalItems={cartTotalItems}
                cartTotalAmount={cartTotalAmount}
                orderQuantity={orderQuantity}
                paymentMethod={paymentMethod}
                cardType={cardType}
                cardNumber={cardNumber}
                mobileOperator={mobileOperator}
                mobileWalletNumber={mobileWalletNumber}
                bankName={bankName}
                bankAccountNumber={bankAccountNumber}
                deliveryAddress={deliveryAddress}
                sandboxTxnId={sandboxTxnId}
                sandboxAuthCode={sandboxAuthCode}
                sandboxOtp={sandboxOtp}
                setSandboxOtp={setSandboxOtp}
                sandboxProcessingLogs={sandboxLogs}
                createdPaymentRecord={createdPaymentRecord}
                createdOrderId={createdOrderId}
                onExecuteAuthorization={handleExecuteSandboxAuthorization}
                onFinishPayment={handleFinishSandboxPayment}
                onReturnToCart={() => {
                    setIsSandboxModalOpen(false);
                    setIsCartModalOpen(true);
                }}
            />

            <WholesaleOrderModal
                isOpen={Boolean(wholesaleProduct)}
                onClose={() => setWholesaleProduct(null)}
                product={wholesaleProduct}
                wholesaleQuantity={wholesaleQuantity}
                setWholesaleQuantity={setWholesaleQuantity}
                wholesaleAddress={wholesaleAddress}
                setWholesaleAddress={setWholesaleAddress}
                wholesaleNotes={wholesaleNotes}
                setWholesaleNotes={setWholesaleNotes}
                onSubmit={handleWholesaleOrder}
                orderingWholesale={orderingWholesale}
            />

            <PostProductModal
                isOpen={isPostProductModalOpen}
                onClose={() => setIsPostProductModalOpen(false)}
                newProduct={newProductForm}
                setNewProduct={setNewProductForm}
                onSubmit={handleCreateAndPostProduct}
                submitting={isSubmittingNewProduct}
            />

            <EditProductModal
                isOpen={Boolean(editingProduct)}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                editProductForm={editProductForm}
                setEditProductForm={setEditProductForm}
                onSubmit={handleAdminUpdateProduct}
                submitting={isSubmittingEditProduct}
            />

            <EditUserModal
                isOpen={Boolean(editingUser)}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                editUserForm={editUserForm}
                setEditUserForm={setEditUserForm}
                onSubmit={handleAdminUpdateUser}
                submitting={isEditingUserSubmitting}
            />

            <EditOrderModal
                isOpen={Boolean(editingOrder)}
                onClose={() => setEditingOrder(null)}
                order={editingOrder}
                editOrderForm={editOrderForm}
                setEditOrderForm={setEditOrderForm}
                onSubmit={handleSubmitEditOrder}
                submitting={isEditingOrderSubmitting}
            />

            {isUberMapOpen && uberTrackingOrder && (
                <UberMapTracker
                    order={uberTrackingOrder as any}
                    userRole={user?.title || user?.role || "customer"}
                    onClose={() => {
                        setIsUberMapOpen(false);
                        setUberTrackingOrder(null);
                    }}
                />
            )}
        </div>
    );
}
