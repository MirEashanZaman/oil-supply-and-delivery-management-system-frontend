export type UserData = {
    id?: number;
    email: string;
    userName?: string;
    name?: string;
    phoneNumber?: string;
    phone?: string;
    address?: string;
    title?: string;
    role?: string;
    status?: string;
    photoUrl?: string;
    password?: string;
};

export type PaymentInfo = {
    id?: number;
    paymentReference?: string;
    cardType?: string;
    amount?: number;
    status?: string;
};

export type Order = {
    id: number;
    quantity: number;
    status: string;
    address?: string;
    deliveryAddress?: string;
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    user?: {
        name?: string;
        email?: string;
    };
    totalAmount?: number | string;
    deliveryDate?: string;
    createdAt?: string;
    product?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        userName?: string;
        username?: string;
        name?: string;
    };
    dealer?: {
        id: number;
        userName?: string;
        username?: string;
        name?: string;
    };
    payment?: PaymentInfo;
};

export type Product = {
    id: number;
    name: string;
    category: string;
    price: string;
    numericPrice: number;
    description: string;
    quantity?: number;
    stock?: number | string;
    inStock: boolean;
    stockLevel: "In Stock" | "Low Stock" | "Out of Stock";
    image: string;
    supplier?: {
        id?: number;
        name?: string;
        userName?: string;
        username?: string;
        email?: string;
    };
    dealer?: {
        id?: number;
        name?: string;
        userName?: string;
        username?: string;
        email?: string;
    };
    user?: {
        id?: number;
        name?: string;
        userName?: string;
        username?: string;
    };
};

export type CartItem = {
    product: Product;
    quantity: number;
    sourcingChoice: "supplier" | "dealer";
    selectedPartyId: number | string;
    deliveryAddress?: string;
};

export type SystemUser = {
    id: number;
    username?: string;
    userName?: string;
    name?: string;
    email: string;
    phoneNumber?: string;
    phone?: string;
    address?: string;
    title?: string;
    role?: string;
    status?: string;
    createdAt?: string;
    joiningDate?: string;
};

export type DashboardTab =
    | "overview"
    | "products"
    | "orders"
    | "tracking"
    | "inventory"
    | "admin-monitoring"
    | "users_crud"
    | "monitoring"
    | "chat"
    | "messages"
    | "profile";
