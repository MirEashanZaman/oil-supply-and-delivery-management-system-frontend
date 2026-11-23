"use client";

import React from "react";
import { Product } from "../types";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  editProductForm: { price: string; stock: string };
  setEditProductForm: React.Dispatch<
    React.SetStateAction<{ price: string; stock: string }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  editProductForm,
  setEditProductForm,
  onSubmit,
  submitting,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] w-full max-w-md rounded-2xl p-6 relative text-left">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-[#111827]">Edit Product</h3>
            <p className="text-xs text-[#6B7487] mt-0.5">
              {product.name}
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
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Unit price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editProductForm.price}
              onChange={(e) =>
                setEditProductForm((prev) => ({
                  ...prev,
                  price: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Available stock (units)
            </label>
            <input
              type="number"
              min="0"
              value={editProductForm.stock}
              onChange={(e) =>
                setEditProductForm((prev) => ({
                  ...prev,
                  stock: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              required
            />
          </div>
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
              disabled={submitting}
              className="px-5 py-2 bg-[#0F2747] hover:bg-[#163860] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
