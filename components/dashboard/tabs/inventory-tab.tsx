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
  const [inventorySearchQuery] = useState("");
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
          <h1 className="text-xl sm:text-2xl font-medium text-[#111827]">
            {isSupplier ? "My Supply Portfolio" : "Stock Inventory & Replenishment"}
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5565] mt-0.5">
            {isSupplier
              ? "Manage petroleum products you distribute to regional dealers and commercial buyers"
              : "Monitor depot storage levels, consumption rates, and wholesale reorders"}
          </p>
        </div>
        {onOpenPostProductModal && (
          <button
            onClick={onOpenPostProductModal}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] px-4 h-10 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none self-start sm:self-auto flex items-center gap-2"
          >
            <span>+</span> Post Product Lot
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-[#0F2747] p-5 text-white border border-[#163860] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
              Depot burn-rate monitor
            </span>
          </div>
          <h3 className="text-base font-medium text-white">Petroleum Replenishment Forecast</h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Tracks daily throughput and Platts benchmark movements to flag batch replenishment before depot reserves fall below the 15% threshold.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#163860] p-3 rounded-xl border border-white/15 text-xs shrink-0">
          <div>
            <p className="text-xs text-slate-300">Recommended action</p>
            <p className="font-mono tabular-nums font-medium text-[#F59E0B]">Reserve ULSD Diesel · 500 BBL</p>
          </div>
          {onWholesaleOrder && displayList.length > 0 && (
            <button
              type="button"
              onClick={() => onWholesaleOrder(displayList[0])}
              className="rounded-lg bg-[#F59E0B] px-3 py-1.5 font-medium text-[#111827] hover:bg-[#D97706] transition-colors cursor-pointer text-xs"
            >
              Reorder
            </button>
          )}
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl">
          <h3 className="text-base font-medium text-[#111827] mb-1">No products in your inventory yet</h3>
          <p className="text-xs text-[#4B5565] max-w-md mx-auto">
            {isDealer
              ? 'Post your own product lot or click "+ Add to Profile" on any refinery product to link it here'
              : 'Click "+ Post Product Lot" above to list petroleum grades under your refinery account'}
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
                className="bg-white border border-[#E2E8F0] overflow-hidden rounded-2xl flex flex-col justify-between"
              >
                <div className="h-40 w-full overflow-hidden bg-[#F5F7FA]">
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
                      <span className="text-xs font-medium text-[#4B5565] bg-[#F5F7FA] border border-[#E2E8F0] px-2.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      {isOwner ? (
                        <span className="text-xs font-medium bg-amber-50 text-[#D97706] border border-amber-200 px-2 py-0.5 rounded">
                          Posted lot
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-emerald-50 text-[#16A34A] border border-emerald-200 px-2 py-0.5 rounded">
                          In dealer catalog
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-base text-[#111827] mt-1">{item.name}</h3>
                    <p className="text-xs text-[#4B5565] mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <span className="font-mono tabular-nums font-semibold text-[#0F2747]">{item.price}</span>
                    <div className="flex items-center gap-1.5">
                      {isOwner ? (
                        <>
                          {onEditProduct && (
                            <button
                              onClick={() => onEditProduct(item)}
                              className="btn btn-xs bg-[#0F2747] hover:bg-[#163860] text-white font-medium border-none rounded-lg cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {onDeleteProduct && (
                            <button
                              onClick={() => onDeleteProduct(item.id, item.name)}
                              className="btn btn-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium border-none rounded-lg cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      ) : isLinkedToUser || localPortfolio.includes(item.id) ? (
                        onRemoveFromPortfolio && (
                          <button
                            onClick={() => onRemoveFromPortfolio(item.id)}
                            className="btn btn-xs bg-rose-50 hover:bg-rose-100 text-[#DC2626] border border-rose-200 rounded-lg cursor-pointer font-medium"
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
