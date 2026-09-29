"use client";

import React from "react";
import { UserData, DashboardTab } from "./types";
import { getRoleBadgeColor } from "./utils";

interface DashboardHeaderProps {
  userData: UserData | null;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userData,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
}) => {
  const isCustomer = userData?.role === "Customer";

  const getTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Executive Command Center";
      case "products":
        return isCustomer ? "Petroleum Products Marketplace" : "Product Inventory Management";
      case "orders":
        return "Logistics Orders & Consignments";
      case "tracking":
        return "Live GPS Fleet & Tanker Tracking";
      case "inventory":
        return "Refinery Stock & Bulk Sourcing";
      case "admin-monitoring":
        return "System Administration & Users";
      case "chat":
        return "Logistics Support & Realtime Dispatch";
      case "profile":
        return "Account Settings & Profile";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          {getTabTitle()}
        </h1>
        <p className="text-xs text-slate-500">
          Welcome back, <span className="text-slate-800 font-semibold">{userData?.name || userData?.userName || "User"}.</span> ({userData?.role})
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isCustomer && (
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <span className="text-xs font-bold hidden sm:inline">Delivery Cart</span>
            {cartCount > 0 ? (
              <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                0
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab("tracking")}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl text-xs transition"
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="hidden md:inline font-medium">GPS Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden sm:inline">{userData?.name?.split(" ")[0] || "Profile"}</span>
        </button>
      </div>
    </header>
  );
};
