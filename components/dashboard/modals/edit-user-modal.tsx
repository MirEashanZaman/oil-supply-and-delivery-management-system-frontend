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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >

        </button>
        <h3 className="text-xl font-bold text-white mb-4">Edit User Account</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editUserForm.name}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={editUserForm.email}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Role (managed by the backend)
            </label>
            <select
              value={editUserForm.role}
              disabled
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
            >
              <option value="Customer">Customer</option>
              <option value="Dealer">Dealer</option>
              <option value="Supplier">Supplier</option>
              <option value="Deliveryman">Deliveryman</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={editUserForm.phone}
              onChange={(e) =>
                setEditUserForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 rounded-xl text-sm font-bold transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
