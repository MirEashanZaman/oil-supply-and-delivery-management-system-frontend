"use client";

import React from "react";
import { SystemUser } from "../types";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SystemUser | null;
  editUserForm: {
    name: string;
    email: string;
    role: string;
    phone: string;
    address: string;
  };
  setEditUserForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      role: string;
      phone: string;
      address: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  editUserForm,
  setEditUserForm,
  onSubmit,
  submitting,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-2xl p-6 relative text-left">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-[#111827]">Edit User Account</h3>
            <p className="text-xs text-[#6B7487] mt-0.5">{user.email}</p>
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
              Full name
            </label>
            <input
              type="text"
              value={editUserForm.name}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Email address
            </label>
            <input
              type="email"
              value={editUserForm.email}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Role
            </label>
            <select
              value={editUserForm.role}
              disabled
              className="w-full bg-[#ECEFF4] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#6B7487] text-sm cursor-not-allowed"
            >
              <option value="Customer">Customer</option>
              <option value="Dealer">Dealer</option>
              <option value="Supplier">Supplier</option>
              <option value="Deliveryman">Deliveryman</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Phone number
            </label>
            <input
              type="text"
              value={editUserForm.phone}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] font-mono tabular-nums text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Address
            </label>
            <input
              type="text"
              value={editUserForm.address}
              onChange={(e) =>
                setEditUserForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
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
              {submitting ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
