import { NextResponse } from "next/server";
import { API_ENDPOINT, fetchWithTimeout } from "@/lib/api";

export const DEFAULT_FALLBACK_PRODUCTS = [
    {
        id: 1,
        name: "Brent Crude Oil",
        category: "Crude Oil",
        price: 82.50,
        quantity: 5000,
        description: "Sweet light crude benchmark extracted from the North Sea, ideal for refining automotive gasoline and middle distillates.",
        image: "/Brent Crude Oil.jpg",
    },
    {
        id: 2,
        name: "Ultra-Low Sulfur Diesel",
        category: "Diesel",
        price: 94.20,
        quantity: 3500,
        description: "Clean-burning commercial automotive diesel fuel compliant with Euro VI emission standards for heavy commercial transport fleets.",
        image: "/Ultra-Low Sulfur Diesel.jpg",
    },
    {
        id: 3,
        name: "Premium Unleaded Gasoline",
        category: "Octane",
        price: 88.75,
        quantity: 4200,
        description: "High-octane RON 95 motor spirit designed for modern high-compression engines, delivering optimal combustion efficiency.",
        image: "/Premium Unleaded Gasoline.jpg",
    },
    {
        id: 4,
        name: "Aviation Turbine Fuel (Jet A-1)",
        category: "Aviation Fuel",
        price: 112.00,
        quantity: 2800,
        description: "Standard kerosene-grade aviation fuel formulated with anti-icing and antioxidant additives for international civil aviation.",
        image: "/Aviation Turbine Fuel (Jet A-1).jpg",
    },
    {
        id: 5,
        name: "Liquefied Petroleum Gas (LPG)",
        category: "LPG",
        price: 45.00,
        quantity: 6000,
        description: "Pressurized propane-butane blend for industrial heating, commercial kitchens, and localized energy distribution grids.",
        image: "/images.jpg",
    },
    {
        id: 6,
        name: "Heavy Marine Fuel Oil (HFO)",
        category: "Fuel Oil",
        price: 68.30,
        quantity: 1800,
        description: "High-viscosity residual fuel oil blended specifically for ocean vessel propulsion and heavy thermal power generation.",
        image: "/Heavy Marine Fuel Oil (HFO).jpg",
    },
];

export async function GET() {
    try {
        const response = await fetchWithTimeout(`${API_ENDPOINT}/product/list`, {
            cache: "no-store",
        }, 4000);
        
        if (response.ok) {
            const data = await response.json();
            const list = Array.isArray(data) ? data : data?.products || data?.data || data?.items;
            if (Array.isArray(list) && list.length > 0) {
                return NextResponse.json(list, { status: 200 });
            }
        }
        return NextResponse.json(DEFAULT_FALLBACK_PRODUCTS, { status: 200 });
    } catch {
        // Return default catalog fallback gracefully so home carousel is always populated
        return NextResponse.json(DEFAULT_FALLBACK_PRODUCTS, { status: 200 });
    }
}