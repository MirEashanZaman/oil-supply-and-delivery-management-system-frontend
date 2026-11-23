"use client";

import React from "react";
import { UserData, DashboardTab } from "./types";

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
        return "Operations Overview";
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
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-medium text-[#111827] flex items-center gap-2">
          {getTabTitle()}
        </h1>
        <p className="text-xs text-[#6B7487]">
          <span className="text-[#111827] font-medium">{userData?.name || userData?.userName || "User"}</span> · {userData?.role || "Account"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isCustomer && (
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] bg-[#F5F7FA] text-[#111827] hover:bg-[#ECEFF4] rounded-lg transition-colors"
          >
            <span className="text-xs font-medium hidden sm:inline">Delivery Cart</span>
            <span className="font-mono tabular-nums text-xs text-[#4B5565]">
              {cartCount}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("tracking")}
          className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] bg-[#F5F7FA] text-[#111827] hover:bg-[#ECEFF4] rounded-lg text-xs transition-colors"
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-[#16A34A]"></span>
          <span className="hidden md:inline font-medium">GPS Dispatch</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 border border-[#E2E8F0] bg-[#F5F7FA] hover:bg-[#ECEFF4] rounded-lg text-xs font-medium text-[#111827] transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-[#0F2747] text-white flex items-center justify-center text-[11px] font-medium">
            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden sm:inline">{userData?.name?.split(" ")[0] || "Profile"}</span>
        </button>
      </div>
    </header>
  );
};
