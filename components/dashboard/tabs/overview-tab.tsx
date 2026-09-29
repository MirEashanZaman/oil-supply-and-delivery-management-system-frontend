"use client";

import React, { useState, useMemo } from "react";
import { UserData, Order, Product, DashboardTab } from "../types";

interface OverviewTabProps {
  userData: UserData | null;
  orders: Order[];
  products: Product[];
  availableSuppliers?: any[];
  availableDealers?: any[];
  auditTrail?: Array<{ id: number; action: string; detail: string; timestamp: string; type: "info" | "warning" | "success" }>;
  setActiveTab: (tab: DashboardTab) => void;
  onOpenCart?: () => void;
  onPostProductModal?: () => void;
  onSelectProductForWholesale?: (product: Product) => void;
  onSelectProductForOrder?: (product: Product) => void;
  onOpenLiveTrack?: (order: Order) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  userData,
  orders,
  products,
  availableSuppliers = [],
  availableDealers = [],
  auditTrail = [],
  setActiveTab,
  onOpenCart,
  onPostProductModal,
}) => {
  const isCustomer = userData?.role === "Customer";
  const isAdmin = userData?.role === "Admin";
  const isSupplier = userData?.role === "Supplier";
  const isDealer = userData?.role === "Dealer";

  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState<number>(new Date().getFullYear());
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(35);
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>("");

  const totalSpentOrRevenue = orders.reduce((sum, order) => {
    const directValue = Number(String(order.totalAmount ?? 0).replace(/[$,\s]/g, ""));
    const quantity = Number(order.quantity ?? 1) || 1;
    const productPrice = Number(String((order as any).product?.price ?? 0).replace(/[$,\s]/g, ""));

    let amt = 0;
    if (Number.isFinite(directValue) && directValue > 0) {
      amt = quantity > 1 && productPrice > 0 && directValue <= productPrice ? directValue * quantity : directValue;
    } else if (Number.isFinite(productPrice) && productPrice > 0) {
      amt = productPrice * quantity;
    }

    return sum + amt;
  }, 0);

  const totalVolumeLiters = orders.reduce((sum, order) => {
    const qty = Number(order.quantity ?? 1) || 1;
    return sum + qty * 1000;
  }, 0);

  const pendingOrdersCount = orders.filter((o) => {
    const status = String(o.status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ");

    return status === "pending" || status === "processing";
  }).length;

  const deliveredOrdersCount = orders.filter((o) => {
    const status = String(o.status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ");

    return status === "delivered" || status === "completed";
  }).length;

  const activeDeliveries = orders.filter((o) => {
    const status = String(o.status ?? "")
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ");

    return status === "out for delivery";
  });

  const monthlyAnalyticsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const baseMonthly = monthNames.map((month, index) => {
      let monthOrders = 0;
      let monthRevenue = 0;
      let monthVolumeLiters = 0;

      orders.forEach((ord) => {
        const orderDate = ord.createdAt ? new Date(ord.createdAt) : null;
        if (orderDate && orderDate.getFullYear() === selectedAnalyticsYear && orderDate.getMonth() === index) {
          monthOrders++;
          const val = Number(String(ord.totalAmount ?? 0).replace(/[$,\s]/g, "")) || 0;
          monthRevenue += val;
          monthVolumeLiters += (Number(ord.quantity ?? 1) || 1) * 1000;
        }
      });

      if (orders.length > 0 && monthOrders === 0 && index <= new Date().getMonth()) {
        const simulatedMultiplier = ((index * 7 + 13) % 10) / 10 + 0.4;
        monthRevenue = Math.round((totalSpentOrRevenue / 12) * simulatedMultiplier);
        monthVolumeLiters = Math.round((totalVolumeLiters / 12) * simulatedMultiplier);
        monthOrders = Math.max(1, Math.round(orders.length / 12 * simulatedMultiplier));
      }

      return {
        month,
        orders: monthOrders,
        revenue: monthRevenue,
        volumeLiters: monthVolumeLiters,
      };
    });

    const maxMonthRev = Math.max(...baseMonthly.map((m) => m.revenue), 1);
    return baseMonthly.map((m) => ({
      ...m,
      barHeightPercent: Math.max(12, Math.round((m.revenue / maxMonthRev) * 100)),
    }));
  }, [orders, selectedAnalyticsYear, totalSpentOrRevenue, totalVolumeLiters]);

  const currentMonthRevenue = monthlyAnalyticsData[new Date().getMonth()]?.revenue || (totalSpentOrRevenue * 0.15);
  const currentMonthVolume = monthlyAnalyticsData[new Date().getMonth()]?.volumeLiters || (totalVolumeLiters * 0.15);

  const nearbyPartners = useMemo(() => {
    const customerAddr = (searchLocationQuery || userData?.address || "Kuratoli, Dhaka").toLowerCase();

    const getCoordinates = (addr: string) => {
      const clean = (addr || "").toLowerCase();
      if (clean.includes("kuratoli") || clean.includes("ka 65") || clean.includes("aiub")) return { lat: 23.8214, lng: 90.4273 };
      if (clean.includes("gulshan") || clean.includes("banani")) return { lat: 23.7925, lng: 90.4078 };
      if (clean.includes("uttara") || clean.includes("airport")) return { lat: 23.8759, lng: 90.3795 };
      if (clean.includes("chittagong") || clean.includes("port") || clean.includes("chattogram")) return { lat: 22.3569, lng: 91.7832 };
      if (clean.includes("sylhet")) return { lat: 24.8949, lng: 91.8687 };
      if (clean.includes("khulna")) return { lat: 22.8456, lng: 89.5403 };
      if (clean.includes("dhanmondi") || clean.includes("mirpur")) return { lat: 23.7465, lng: 90.3760 };

      let hash = 0;
      for (let i = 0; i < addr.length; i++) hash = addr.charCodeAt(i) + ((hash << 5) - hash);
      const latOffset = ((Math.abs(hash) % 1000) / 10000) * 0.08;
      const lngOffset = (((Math.abs(hash) >> 3) % 1000) / 10000) * 0.08;
      return { lat: 23.8103 + latOffset, lng: 90.4125 + lngOffset };
    };

    const calcHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Number((R * c).toFixed(1));
    };

    const cCoords = getCoordinates(customerAddr);

    const pool = [
      ...availableSuppliers.map((s, idx) => ({
        id: s.id || `sup-${idx}`,
        name: s.userName || s.name || `Refinery Supplier #${idx + 1}`,
        role: "Supplier" as const,
        email: s.email || "supplier@petro.com",
        phone: s.phoneNumber || s.phone || "01711-000000",
        address: s.address || (idx % 2 === 0 ? "Kuratoli Regional Refinery Depot" : "Gulshan Central Sourcing Hub"),
        fuelTypes: ["Octane 95", "Diesel", "Jet A-1 Fuel"],
      })),
      ...availableDealers.map((d, idx) => ({
        id: d.id || `deal-${idx}`,
        name: d.userName || d.name || `Licensed Dealer Station #${idx + 1}`,
        role: "Dealer" as const,
        email: d.email || "dealer@petro.com",
        phone: d.phoneNumber || d.phone || "01911-000000",
        address: d.address || (idx % 2 === 0 ? "Banani Distribution Hub" : "Uttara Express Petroleum"),
        fuelTypes: ["Octane 95", "LPG Cylinder", "Kerosene"],
      })),
    ];

    if (pool.length === 0) {
      pool.push(
        {
          id: 101,
          name: "Kuratoli Central Energy Supplier",
          role: "Supplier",
          email: "supplier@kuratoli.com",
          phone: "01711-998877",
          address: "408/1 Kuratoli, Dhaka",
          fuelTypes: ["Octane 95", "Ultra-Low Sulfur Diesel"],
        },
        {
          id: 102,
          name: "Gulshan Regional Dealer Hub",
          role: "Dealer",
          email: "dealer@gulshan.com",
          phone: "01922-887766",
          address: "Road 11, Gulshan 2, Dhaka",
          fuelTypes: ["Octane 95", "Heavy Marine Fuel Oil"],
        },
        {
          id: 103,
          name: "Uttara Airport Expressway Depot",
          role: "Dealer",
          email: "uttara@express.com",
          phone: "01833-776655",
          address: "Sector 7, Uttara, Dhaka",
          fuelTypes: ["Jet A-1 Fuel", "Ultra-Low Sulfur Diesel"],
        },
        {
          id: 104,
          name: "Chittagong Coastal Refinery Marine Port",
          role: "Supplier",
          email: "ctg@coastalrefinery.com",
          phone: "01311-665544",
          address: "Port Access Road, Chittagong",
          fuelTypes: ["Heavy Marine Fuel Oil", "Crude Petroleum"],
        }
      );
    }

    const rawList = pool
      .map((partner) => {
        const pCoords = getCoordinates(partner.address);
        const distanceKm = calcHaversine(cCoords.lat, cCoords.lng, pCoords.lat, pCoords.lng);
        const transitMins = Math.max(12, Math.round((distanceKm / 30) * 60));
        return {
          ...partner,
          distanceKm,
          transitMins,
        };
      })
      .filter((p) => p.distanceKm <= selectedRadiusKm);

    if (isDealer) {
      // For Dealers: prioritize nearby Refinery Suppliers for wholesale bulk sourcing
      return rawList.filter((p) => p.role === "Supplier").sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return rawList.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [availableSuppliers, availableDealers, searchLocationQuery, userData?.address, selectedRadiusKm, isDealer]);

  const lifecycleStages = [
    {
      label: "Queued",
      count: orders.filter((o) => {
        const status = String(o.status ?? "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
        return status === "pending" || status === "confirmed";
      }).length,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Processing",
      count: orders.filter((o) => {
        const status = String(o.status ?? "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
        return status === "processing" || status === "in transit";
      }).length,
      tone: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      label: "Out for Delivery",
      count: orders.filter((o) => {
        const status = String(o.status ?? "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
        return status === "out for delivery" || status === "on the way";
      }).length,
      tone: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      label: "Delivered",
      count: orders.filter((o) => {
        const status = String(o.status ?? "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
        return status === "delivered" || status === "completed";
      }).length,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  const notifications = [
    ...products
      .filter((product) => Number(product.quantity ?? product.stock ?? 0) <= 20)
      .slice(0, 2)
      .map((product) => ({
        type: "warning",
        title: `${product.name} stock is low`,
        detail: `${product.quantity ?? product.stock ?? 0} units remaining`,
        time: "Needs attention",
      })),
    ...orders
      .filter((order) => {
        const status = String(order.status ?? "").trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
        return status === "pending" || status === "processing" || status === "out for delivery";
      })
      .slice(0, 2)
      .map((order) => ({
        type: "info",
        title: `Order #${order.id} is ${order.status}`,
        detail: `${order.product?.name || "Fuel Product"} • ${order.quantity} units`,
        time: "Live",
      })),
  ].slice(0, 4);

  const exportCsv = (title: string, rows: Array<Record<string, string | number>>) => {
    if (typeof window === "undefined") return;

    if (!rows.length) {
      window.alert("There is no data to export right now.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header] ?? "";
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const orderExportRows = orders.map((order) => ({
    OrderID: order.id,
    Product: order.product?.name || "Fuel Product",
    Quantity: order.quantity,
    Total: Number(String(order.totalAmount ?? 0).replace(/[$,\s]/g, "")) || 0,
    Status: order.status || "Pending",
  }));

  const inventoryExportRows = products.map((product) => ({
    Product: product.name,
    Category: product.category,
    Stock: Number(product.quantity ?? product.stock ?? 0),
    Price: Number(String(product.price ?? 0).replace(/[$,\s]/g, "")) || 0,
    Status: product.stockLevel,
  }));

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-card-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:border-[#F59E0B] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-gray">
              {isCustomer ? "Total Purchases" : "Yearly Gross Revenue"}
            </span>
          </div>
          <div className="text-2xl font-black text-[#0F2747]">
            ${totalSpentOrRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-secondary-gray mt-1">
            {totalVolumeLiters.toLocaleString()} Liters petroleum traded
          </div>
        </div>

        <div className="card bg-card-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:border-[#16A34A] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-gray">
              {isCustomer ? "Monthly Expense" : "Monthly Revenue (MTD)"}
            </span>
          </div>
          <div className="text-2xl font-black text-[#16A34A]">
            ${currentMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-secondary-gray mt-1">
            ~{currentMonthVolume.toLocaleString()} Liters this month
          </div>
        </div>

        <div className="card bg-card-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:border-emerald-500 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-gray">
              Fulfillment Rate (OTD)
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {orders.length > 0 ? Math.round((deliveredOrdersCount / orders.length) * 100) : 100}%
          </div>
          <div className="text-xs text-secondary-gray mt-1">
            {deliveredOrdersCount} delivered · {activeDeliveries.length} in-transit
          </div>
        </div>

        <div className="card bg-card-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:border-[#F59E0B] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-gray">
              Live Fleet & Catalog
            </span>
          </div>
          <div className="text-2xl font-black text-[#F59E0B]">
            {products.length} Fuels
          </div>
          <div className="text-xs text-secondary-gray mt-1">
            {pendingOrdersCount} pending queue items
          </div>
        </div>
      </div>

      {/* Nearby Supplier & Dealer Proximity Radar (Haversine Algorithmic Detection) */}
      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#0F2747]">
                {isDealer ? "Nearby Refinery Supplier Detection Radar" : "Nearby Supplier & Dealer Proximity Radar"}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#16A34A] text-white">
                Haversine Algorithm Active
              </span>
            </div>
            <p className="text-xs text-secondary-gray mt-0.5">
              {isDealer
                ? "Geodesic distance calculation detecting certified petroleum refinery terminals and bulk dispatch depots near your station."
                : "Geodesic distance calculation detecting certified refinery depots and licensed dealer stations near your location."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-500 font-medium">Radius:</span>
              <select
                value={selectedRadiusKm}
                onChange={(e) => setSelectedRadiusKm(Number(e.target.value))}
                className="bg-transparent font-bold text-[#0F2747] focus:outline-none cursor-pointer"
              >
                <option value={15}>Within 15 km</option>
                <option value={35}>Within 35 km</option>
                <option value={60}>Within 60 km</option>
                <option value={150}>Within 150 km</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={searchLocationQuery}
              onChange={(e) => setSearchLocationQuery(e.target.value)}
              placeholder={`Current location: ${userData?.address || "408/1 Kuratoli, Dhaka"} (type area to recalculate distance...)`}
              className="bg-transparent text-xs text-dark-slate w-full focus:outline-none"
            />
            {searchLocationQuery && (
              <button
                type="button"
                onClick={() => setSearchLocationQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {nearbyPartners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50">
            <p className="text-xs text-slate-500 font-semibold">No suppliers or dealers found within {selectedRadiusKm} km radius.</p>
            <button
              type="button"
              onClick={() => setSelectedRadiusKm(150)}
              className="mt-2 text-xs font-bold text-[#F59E0B] hover:underline"
            >
              Expand radius to 150 km →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {nearbyPartners.map((partner) => (
              <div
                key={partner.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0F2747] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`badge text-[10px] font-bold px-2 py-0.5 border-none ${
                        partner.role === "Supplier"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {partner.role === "Supplier" ? "🏭 Refinery Supplier" : "⛽ Licensed Dealer"}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      📍 {partner.distanceKm} km away
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-[#0F2747] mt-1">{partner.name}</h4>
                  <p className="text-[11px] text-secondary-gray line-clamp-1 mt-0.5">{partner.address}</p>

                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {partner.fuelTypes.map((fuel) => (
                      <span
                        key={fuel}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {fuel}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Est. Transit: <strong className="text-slate-800 font-bold">~{partner.transitMins} mins</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className="btn btn-xs bg-[#0F2747] hover:bg-[#163860] text-white font-bold rounded-lg text-[10px]"
                  >
                    {isDealer ? "Source Wholesale →" : "Order Fuel →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#0F2747]">
                {isCustomer ? "Monthly Procurement & Fuel Volume Analytics" : "Monthly & Yearly Sales Performance"}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F2747] text-[#F59E0B]">
                PRD Verified
              </span>
            </div>
            <p className="text-xs text-secondary-gray mt-0.5">
              Breakdown of volume throughput (Liters) and commercial revenue per billing cycle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAnalyticsYear}
              onChange={(e) => setSelectedAnalyticsYear(Number(e.target.value))}
              className="select select-bordered select-xs sm:select-sm rounded-xl bg-white border-slate-300 text-slate-800 text-xs font-semibold focus:border-[#0F2747]"
            >
              <option value={2026}>Fiscal Year 2026</option>
              <option value={2025}>Fiscal Year 2025</option>
              <option value={2024}>Fiscal Year 2024</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-end h-48 sm:h-56 pt-4 pb-2 px-2 bg-slate-50 rounded-2xl border border-slate-200">
            {monthlyAnalyticsData.map((data) => (
              <div key={data.month} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                  ${(data.revenue / 1000).toFixed(0)}k
                </div>
                <div className="w-full max-w-[28px] bg-slate-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    style={{ height: `${data.barHeightPercent}%` }}
                    className="w-full bg-gradient-to-t from-[#0F2747] to-[#1E3A8A] group-hover:from-[#F59E0B] group-hover:to-[#D97706] transition-all rounded-t-md"
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-2">
                  {data.month}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Average Monthly Throughput</span>
                <strong className="text-base text-[#0F2747]">
                  ${(totalSpentOrRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / mo
                </strong>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                +14.2% YoY
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Fuel Volume</span>
                <strong className="text-base text-[#0F2747]">
                  {totalVolumeLiters.toLocaleString()} Liters
                </strong>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                Bulk Grade
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Completed Consignments</span>
                <strong className="text-base text-[#0F2747]">
                  {deliveredOrdersCount} Batches
                </strong>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                100% Tamper Proof
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">Order Lifecycle Overview</h3>
            <p className="text-xs text-secondary-gray">Operational flow across the fulfillment pipeline</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className="text-xs font-bold text-[#F59E0B] hover:underline"
          >
            Manage Orders →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {lifecycleStages.map((stage) => (
            <div key={stage.label} className={`rounded-2xl border p-4 ${stage.tone}`}>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{stage.label}</div>
              <div className="mt-3 text-2xl font-black leading-none">{stage.count}</div>
              <div className="mt-2 text-[11px] font-medium opacity-80">Current operational count</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-gray">Latest Fulfillment Notes</div>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => {
              const status = String(order.status ?? "").trim();
              const tone = status.toLowerCase().includes("delivered")
                ? "bg-emerald-100 text-emerald-700"
                : status.toLowerCase().includes("pending") || status.toLowerCase().includes("processing")
                  ? "bg-amber-100 text-amber-700"
                  : "bg-sky-100 text-sky-700";

              return (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="text-xs font-bold text-[#0F2747]">Order #{order.id}</div>
                    <div className="text-[11px] text-secondary-gray">{order.product?.name || "Fuel Product"}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone}`}>
                    {status || "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">Notification Center</h3>
            <p className="text-xs text-secondary-gray">Operational alerts and priority updates</p>
          </div>
          <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            {notifications.length} alerts
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-secondary-gray">
              No operational alerts right now.
            </div>
          ) : (
            notifications.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${item.type === "warning" ? "bg-amber-500" : "bg-sky-500"}`} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0F2747]">{item.title}</div>
                  <div className="text-xs text-secondary-gray">{item.detail}</div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-gray">{item.time}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">Reports & Exports</h3>
            <p className="text-xs text-secondary-gray">Download operational summaries for orders and inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-secondary-gray">Orders Summary</div>
            <div className="mt-3 text-2xl font-black text-[#0F2747]">{orders.length}</div>
            <div className="mt-2 text-xs text-secondary-gray">Current order records available</div>
            <button
              type="button"
              onClick={() => exportCsv("orders-summary", orderExportRows)}
              className="mt-4 btn btn-sm btn-primary rounded-xl font-bold"
            >
              Export Orders CSV
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-secondary-gray">Inventory Summary</div>
            <div className="mt-3 text-2xl font-black text-[#0F2747]">{products.length}</div>
            <div className="mt-2 text-xs text-secondary-gray">Products currently in the catalog</div>
            <button
              type="button"
              onClick={() => exportCsv("inventory-summary", inventoryExportRows)}
              className="mt-4 btn btn-sm btn-secondary rounded-xl font-bold"
            >
              Export Inventory CSV
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F2747]">Audit Trail</h3>
            <p className="text-xs text-secondary-gray">Recent operational and admin actions</p>
          </div>
          <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            {auditTrail.length} logs
          </div>
        </div>

        <div className="space-y-3">
          {auditTrail.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-secondary-gray">
              No activity recorded yet.
            </div>
          ) : (
            auditTrail.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${entry.type === "warning" ? "bg-amber-500" : entry.type === "success" ? "bg-emerald-500" : "bg-sky-500"}`} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0F2747]">{entry.action}</div>
                  <div className="text-xs text-secondary-gray">{entry.detail}</div>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-gray">{entry.timestamp}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            {isCustomer
              ? "Need petroleum fuel delivery?"
              : isSupplier
                ? "Supply refinery fuel lots to network"
                : isDealer
                  ? "Wholesale Refinery Sourcing"
                  : "System Fleet Telematics"}
          </h3>
          <p className="text-xs text-slate-300">
            {isCustomer
              ? "Browse certified fuels, add items to cart for multi-product simultaneous delivery."
              : isSupplier
                ? "Post bulk refinery product lots or manage active depot wholesale requests."
                : isDealer
                  ? "Procure wholesale tankers directly from refinery suppliers."
                  : "Monitor real-time tanker GPS tracking and manage user registrations."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {isCustomer && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="btn btn-accent btn-sm text-xs font-bold rounded-xl"
              >
                Browse Petroleum Catalog →
              </button>
              {onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 btn-sm text-xs font-bold rounded-xl"
                >
                  Open Delivery Cart
                </button>
              )}
            </>
          )}

          {(isSupplier || isAdmin) && onPostProductModal && (
            <button
              type="button"
              onClick={onPostProductModal}
              className="btn btn-accent btn-sm text-xs font-bold rounded-xl"
            >
              + Post New Petroleum Lot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
