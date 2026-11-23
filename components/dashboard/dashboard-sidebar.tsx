"use client";

import React from "react";
import { UserData, DashboardTab } from "./types";
import { getRoleBadgeColor } from "./utils";

interface DashboardSidebarProps {
  userData: UserData | null;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  ordersCount: number;
  productsCount: number;
  usersCount?: number;
  supplierOrdersCount?: number;
  dealerOrdersCount?: number;
  onLogout: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userData,
  activeTab,
  setActiveTab,
  ordersCount,
  productsCount,
  usersCount = 0,
  onLogout,
}) => {
  const isCustomer = userData?.role === "Customer";
  const isAdmin = userData?.role === "Admin";
  const isSupplier = userData?.role === "Supplier";
  const isDealer = userData?.role === "Dealer";

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-[#F5F7FA] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-4 lg:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0] mb-6">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-[#0F2747] text-white flex items-center justify-center font-semibold text-base">
              {userData?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#16A34A] rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-[#111827] truncate">
              {userData?.name || "Account"}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${getRoleBadgeColor(
                  userData?.role || ""
                )}`}
              >
                {userData?.role || "User"}
              </span>
              <span className="text-[11px] text-[#6B7487] truncate">
                {userData?.email}
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "overview"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "products"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <span>{isCustomer ? "Order Petroleum" : "Products"}</span>
            {productsCount > 0 && (
              <span
                className={`font-mono tabular-nums text-xs ${activeTab === "products"
                    ? "text-slate-200"
                    : "text-[#6B7487]"
                  }`}
              >
                {productsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "orders"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <span>
              {isCustomer
                ? "My Orders"
                : isSupplier
                  ? "Refinery Orders"
                  : isDealer
                    ? "Supply Orders"
                    : "All Orders"}
            </span>
            {ordersCount > 0 && (
              <span
                className={`font-mono tabular-nums text-xs ${activeTab === "orders"
                    ? "text-slate-200"
                    : "text-[#6B7487]"
                  }`}
              >
                {ordersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("tracking")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "tracking"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#16A34A]"></span>
              <span>Live GPS Tracking</span>
            </div>
            <span
              className={`text-xs font-mono ${activeTab === "tracking"
                  ? "text-slate-200"
                  : "text-[#16A34A]"
                }`}
            >
              Live
            </span>
          </button>

          {(isSupplier || isDealer || isAdmin) && (
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "inventory"
                  ? "bg-[#0F2747] text-white"
                  : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
                }`}
            >
              <span>
                {isSupplier
                  ? "Refinery Inventory"
                  : isDealer
                    ? "Fuel Inventory & Sourcing"
                    : "Global Inventory"}
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin-monitoring")}
              className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "admin-monitoring"
                  ? "bg-[#0F2747] text-white"
                  : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
                }`}
            >
              <span>User Administration</span>
              {usersCount > 0 && (
                <span
                  className={`font-mono tabular-nums text-xs ${activeTab === "admin-monitoring"
                      ? "text-slate-200"
                      : "text-[#6B7487]"
                    }`}
                >
                  {usersCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "chat"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <span>Live Support Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full h-9 flex items-center justify-between px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile"
                ? "bg-[#0F2747] text-white"
                : "text-[#4B5565] hover:bg-white hover:text-[#111827]"
              }`}
          >
            <span>My Profile</span>
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E2E8F0] mt-6">
        <button
          onClick={onLogout}
          className="w-full h-9 flex items-center justify-center px-3 rounded-lg text-sm font-medium text-[#DC2626] bg-white hover:bg-rose-50 border border-[#E2E8F0] transition-colors"
        >
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
