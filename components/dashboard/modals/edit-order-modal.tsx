"use client";

import React from "react";
import { Order } from "../types";

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  editOrderForm: {
    status: string;
    quantity: string;
    totalAmount: string;
    deliveryAddress: string;
  };
  setEditOrderForm: React.Dispatch<
    React.SetStateAction<{
      status: string;
      quantity: string;
      totalAmount: string;
      deliveryAddress: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  editOrderForm,
  setEditOrderForm,
  onSubmit,
  submitting,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-2xl p-6 relative text-left">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-[#111827]">Edit Order Details</h3>
            <p className="text-xs text-[#6B7487] font-mono tabular-nums mt-0.5">
              Order #{order.id} · Customer: {order.user?.name || order.customerName || "Buyer"}
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
              Order status
            </label>
            <select
              value={editOrderForm.status}
              onChange={(e) =>
                setEditOrderForm((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                Quantity (units)
              </label>
              <input
                type="number"
                min="1"
                value={editOrderForm.quantity}
                onChange={(e) =>
                  setEditOrderForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                Total price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={editOrderForm.totalAmount}
                onChange={(e) =>
                  setEditOrderForm((prev) => ({
                    ...prev,
                    totalAmount: e.target.value,
                  }))
                }
                className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Delivery address
            </label>
            <input
              type="text"
              value={editOrderForm.deliveryAddress}
              onChange={(e) =>
                setEditOrderForm((prev) => ({
                  ...prev,
                  deliveryAddress: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
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
              {submitting ? "Saving..." : "Update Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
