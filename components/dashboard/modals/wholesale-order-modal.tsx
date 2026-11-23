"use client";

import React from "react";
import { Product } from "../types";

interface WholesaleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  wholesaleQuantity: string;
  setWholesaleQuantity: (val: string) => void;
  wholesaleAddress: string;
  setWholesaleAddress: (val: string) => void;
  wholesaleNotes: string;
  setWholesaleNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  orderingWholesale: boolean;
}

export const WholesaleOrderModal: React.FC<WholesaleOrderModalProps> = ({
  isOpen,
  onClose,
  product,
  wholesaleQuantity,
  setWholesaleQuantity,
  wholesaleAddress,
  setWholesaleAddress,
  wholesaleNotes,
  setWholesaleNotes,
  onSubmit,
  orderingWholesale,
}) => {
  if (!isOpen || !product) return null;

  const numericPrice = Number(String(product.price || 0).replace(/[$,\s]/g, "")) || product.numericPrice || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-2xl p-6 relative text-left">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-[#111827]">
              Wholesale Sourcing Order
            </h3>
            <p className="text-xs text-[#6B7487] mt-0.5">
              Procure bulk petroleum lots directly from refinery terminals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg bg-[#F5F7FA] hover:bg-[#ECEFF4] text-[#4B5565] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl space-y-1">
            <div className="text-xs text-[#6B7487]">Selected grade</div>
            <div className="text-sm font-medium text-[#111827]">
              {product.name}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4B5565] pt-1">
              <span>
                Supplier: {product.supplier?.name || product.user?.name || "Refinery Partner"}
              </span>
              <span className="font-mono tabular-nums font-semibold text-[#0F2747]">
                {typeof product.price === "string" && product.price.startsWith("$") ? product.price : `$${numericPrice.toFixed(2)}`} / unit
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Quantity (barrels / units)
            </label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={wholesaleQuantity}
              onChange={(e) => setWholesaleQuantity(e.target.value)}
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              placeholder="Quantity"
              required
            />
            {product.stock !== undefined && (
              <span className="font-mono tabular-nums text-xs text-[#6B7487] mt-1 block">
                Available supplier stock: {product.stock}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Delivery depot address
            </label>
            <input
              type="text"
              value={wholesaleAddress}
              onChange={(e) => setWholesaleAddress(e.target.value)}
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              placeholder="Receiving depot address"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Handling & tanker notes (optional)
            </label>
            <textarea
              value={wholesaleNotes}
              onChange={(e) => setWholesaleNotes(e.target.value)}
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] resize-none h-20 transition-colors"
              placeholder="Discharge manifold or scheduling notes"
            />
          </div>

          {wholesaleQuantity && Number(wholesaleQuantity) > 0 && (
            <div className="flex justify-between items-center bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-3.5 text-xs">
              <span className="text-[#4B5565] font-medium">
                Estimated sourcing total
              </span>
              <span className="font-mono tabular-nums text-[#0F2747] font-semibold text-base">
                ${(Number(wholesaleQuantity) * numericPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#111827] hover:bg-[#F5F7FA] rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={orderingWholesale}
              className="px-5 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {orderingWholesale ? "Processing..." : "Confirm Wholesale Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
