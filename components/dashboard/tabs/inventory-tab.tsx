"use client";

import React, { useState } from "react";
import { Product, UserData } from "../types";
import { getProductImage, getRolePath, isProductOwner, isProductLinkedToUser } from "../utils";

interface InventoryTabProps {
  products: Product[];
  userData: UserData | null;
  onWholesaleOrder?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number, name: string) => void;
  onOpenPostProductModal?: () => void;
  onRemoveFromPortfolio?: (productId: number) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  products,
  userData,
  onWholesaleOrder,
  onEditProduct,
  onDeleteProduct,
  onOpenPostProductModal,
  onRemoveFromPortfolio,
}) => {
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const role = getRolePath(userData?.title || userData?.role);
  const isSupplier = role === "supplier";
  const isDealer = role === "dealer";

  const portfolioKey = `user_portfolio_${userData?.id || userData?.email}`;
  const localPortfolio: number[] = typeof window !== "undefined"
    ? (() => {
      try {
        return JSON.parse(localStorage.getItem(portfolioKey) || "[]");
      } catch {
        return [];
      }
    })()
    : [];

  const myPortfolioProducts = products.filter((item) => {
    if (isProductOwner(item, userData)) return true;
    if (localPortfolio.includes(item.id)) return true;
    if (isSupplier) {
      return (
        item.supplier?.id === userData?.id ||
        item.supplier?.userName === userData?.userName
      );
    }
    if (isDealer) {
      return (
        item.dealer?.id === userData?.id ||
        item.dealer?.userName === userData?.userName
      );
    }
    return false;
  });

  const displayList = myPortfolioProducts;

  const filteredInventory = displayList.filter((item) => {
    const query = inventorySearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full text-left animate-fadeIn space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]">
            {isSupplier ? "My Supply Portfolio" : "My Stock Inventory & Forecasts"}
          </h1>
          <p className="text-sm text-[#64748B]">
            {isSupplier
              ? "Manage petroleum products you actively distribute to Dealers and direct Customers."
              : "Monitor fuel depot storage levels, dynamic burn rate forecasting, and automatic procurement reorders."}
          </p>
        </div>
        {onOpenPostProductModal && (
          <button
            onClick={onOpenPostProductModal}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm border-none self-start sm:self-auto flex items-center gap-2"
          >
            <span>+</span> Post Product Lot
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-[#0F2747] to-[#1E3A8A] p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
              AI Forecast Engine
            </span>
            <span className="text-xs font-bold text-sky-200">
              Depot Burn-Rate Monitor: <strong className="text-white">Active</strong>
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white">Automated Petroleum Replenishment Predictor</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Calculates daily retail consumption, seasonality factors, and Platts price spikes to recommend batch replenishment before reserve falls below the 15% safety threshold.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-xs">
          <div>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Recommended Action</p>
            <p className="font-extrabold text-amber-300">Reserve ULSD Diesel 500 BBL</p>
          </div>
          {onWholesaleOrder && displayList.length > 0 && (
            <button
              type="button"
              onClick={() => onWholesaleOrder(displayList[0])}
              className="rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer text-xs"
            >
              1-Click Reorder
            </button>
          )}
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">

          </div>
          <h3 className="text-base font-bold text-[#1E293B] mb-1">No products in your inventory yet</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto mb-4">
            {isDealer
              ? 'Post your own product lot or click "+ Add to Profile" on any refinery product to link it here.'
              : 'Click "+ Post Product Lot" above to create and list petroleum grades under your refinery account.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const isOwner = isProductOwner(item, userData);
            const isLinkedToUser = !isOwner && isProductLinkedToUser(item, userData);
            return (
              <div
                key={item.id}
                className="bg-white border border-[#E2E8F0] overflow-hidden rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <div className="h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image || getProductImage(item.name, item.image, item.id)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getProductImage(item.name, undefined, item.id);
                    }}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-secondary-gray bg-[#F1F5F9] px-2.5 py-1 rounded">
                        {item.category}
                      </span>
                      {isOwner ? (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                          Posted by You (Permanent)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                          In Dealer Catalog
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-dark-slate mt-1">{item.name}</h3>
                    <p className="text-xs text-secondary-gray mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[#0F2747]">{item.price}</span>
                    <div className="flex items-center gap-1.5">
                      {isOwner ? (
                        <>
                          {onEditProduct && (
                            <button
                              onClick={() => onEditProduct(item)}
                              className="btn btn-xs bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {onDeleteProduct && (
                            <button
                              onClick={() => onDeleteProduct(item.id, item.name)}
                              className="btn btn-xs bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      ) : isLinkedToUser || localPortfolio.includes(item.id) ? (
                        onRemoveFromPortfolio && (
                          <button
                            onClick={() => onRemoveFromPortfolio(item.id)}
                            className="btn btn-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer font-bold"
                            title="Remove from your profile. Profile-linked products cannot be edited or deleted."
                          >
                            Remove
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
