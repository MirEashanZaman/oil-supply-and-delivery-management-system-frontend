"use client";

import React, { useState } from "react";
import { SystemUser } from "../types";
import { getRoleBadgeColor } from "../utils";

interface AdminMonitoringTabProps {
  users: SystemUser[];
  loadingUsers: boolean;
  onEditUser: (user: SystemUser) => void;
  onDeleteUser: (id: number) => void;
  onCreateUser: (newUser: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    address: string;
    photo: File | null;
  }) => Promise<boolean>;
  creatingUser: boolean;
}

export const AdminMonitoringTab: React.FC<AdminMonitoringTabProps> = ({
  users,
  loadingUsers,
  onEditUser,
  onDeleteUser,
  onCreateUser,
  creatingUser,
}) => {
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("All");
  const [selectedJoiningDate, setSelectedJoiningDate] = useState("");
  const [dateSearchResults, setDateSearchResults] = useState<SystemUser[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
    phone: "",
    address: "",
    photo: null as File | null,
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.role === "Admin" && !newUserForm.photo) {
      alert("Please select a profile photo.");
      return;
    }
    const created = await onCreateUser(newUserForm);
    if (created) {
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        role: "Customer",
        phone: "",
        address: "",
        photo: null,
      });
      setIsCreateUserModalOpen(false);
    }
  };

  const handleSearchJoiningDate = () => {
    if (!selectedJoiningDate) {
      alert("Please select a date to search.");
      return;
    }
    const matched = users.filter((u) => u.createdAt && u.createdAt.startsWith(selectedJoiningDate));
    setDateSearchResults(matched);
  };

  const filteredUsers = users.filter((u) => {
    const uName = (u.userName || u.username || u.name || "").toLowerCase();
    const uEmail = (u.email || "").toLowerCase();
    const query = userSearchQuery.trim().toLowerCase();
    const matchesQuery = !query || uName.includes(query) || uEmail.includes(query);
    const role = (u.title || u.role || "user").toLowerCase();
    const matchesRole = selectedUserRole === "All" || role === selectedUserRole.toLowerCase();
    return matchesQuery && matchesRole;
  });

  return (
    <div className="w-full text-left animate-fadeIn space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-slate">Global User Management & Search</h1>
          <p className="text-sm text-secondary-gray">
            Search users by username across all system roles, create new users, and manage account details.
          </p>
        </div>
        <button
          onClick={() => setIsCreateUserModalOpen(true)}
          className="bg-[#0F2747] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163860] transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          + Create New User
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search users by username or email..."
              className="w-full pl-10 pr-10 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] text-dark-slate placeholder-secondary-gray focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
            />
            {userSearchQuery && (
              <button
                type="button"
                onClick={() => setUserSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-dark-slate cursor-pointer"
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="font-semibold text-secondary-gray whitespace-nowrap">
              Showing <span className="font-bold text-dark-slate">{filteredUsers.length}</span> of <span className="font-bold text-dark-slate">{users.length}</span> users
            </span>
            {(userSearchQuery || selectedUserRole !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setUserSearchQuery("");
                  setSelectedUserRole("All");
                }}
                className="text-xs text-error-red hover:underline font-bold cursor-pointer whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#F1F5F9]">
          <span className="text-xs font-bold text-secondary-gray mr-1">Filter by Role:</span>
          {["All", "Customer", "Dealer", "Supplier", "Deliveryman", "Admin"].map((roleOption) => (
            <button
              key={roleOption}
              type="button"
              onClick={() => setSelectedUserRole(roleOption)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedUserRole === roleOption
                ? "bg-[#0F2747] text-white shadow-sm"
                : "bg-[#F1F5F9] text-secondary-gray hover:bg-[#E2E8F0] hover:text-dark-slate"
                }`}
            >
              {roleOption}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table w-full text-left">
            <thead className="bg-[#F8FAFC] text-dark-slate border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Username</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Phone</th>
                <th className="py-3 px-4 font-bold">Address / Hub</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary-gray">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary-gray">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const role = u.title || u.role || "User";
                  const isTargetAdmin = role.toLowerCase() === "admin";
                  const isDelivery = role.toLowerCase().includes("delivery");
                  const userStatus = (u.status || "active").toLowerCase();
                  const isPendingApproval = isDelivery && (userStatus === "pending_approval" || userStatus === "pending");
                  const rowKey = `${u.id ?? "unknown"}-${index}-${role}-${u.email || "no-email"}-${u.userName || u.username || u.name || "no-name"}`;

                  return (
                    <tr key={rowKey} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`badge border-none font-bold text-xs uppercase px-2.5 py-1 ${getRoleBadgeColor(role)}`}>
                          {role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-dark-slate">{u.userName || u.username || u.name}</td>
                      <td className="py-3 px-4 text-secondary-gray text-xs">{u.email}</td>
                      <td className="py-3 px-4 text-secondary-gray text-xs">{u.phoneNumber || u.phone || "—"}</td>
                      <td className="py-3 px-4 text-secondary-gray text-xs">{u.address || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isPendingApproval ? "bg-amber-100 text-amber-800 border border-amber-300" : userStatus === "active" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-700"}`}>
                          {isPendingApproval ? "Pending Approval" : u.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isTargetAdmin && (
                          <div className="flex justify-end gap-2 items-center">
                            {isPendingApproval && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/backend/admin/deliveryman/${u.id}/approve`, {
                                      method: "PUT",
                                      credentials: "include",
                                    });
                                    if (res.ok) {
                                      alert(`Deliveryman ${u.userName || u.username || u.name || u.email} approved successfully!`);
                                      window.location.reload();
                                    } else {
                                      alert("Failed to approve deliveryman.");
                                    }
                                  } catch {
                                    alert("Approval request failed.");
                                  }
                                }}
                                className="btn btn-xs bg-[#16A34A] hover:bg-[#15803D] text-white font-bold border-none rounded-lg cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => onEditUser(u)}
                              className="btn btn-xs bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                            >
                              Edit (PATCH)
                            </button>
                            <button
                              onClick={() => onDeleteUser(u.id)}
                              className="btn btn-xs bg-error-red hover:bg-error-red/90 text-white font-bold border-none rounded-lg cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#EAF0F6]/90">
          <div className="w-full max-w-[1400px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
              <div>
                <h2 className="text-4xl font-extrabold leading-none tracking-[-0.04em] text-[#0F2747]">Create New User</h2>
                <p className="mt-2 text-sm text-[#64748B]">Add a new account for any role in the system.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-[#64748B] transition hover:bg-[#E2E8F0] hover:text-[#0F2747] cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-1">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Username</span>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#64748B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                    placeholder="Enter your username"
                    required={newUserForm.role === "Admin"}
                  />
                </label>

                <label className="block text-sm sm:col-span-1">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Role</span>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                  >
                    <option>Customer</option>
                    <option>Dealer</option>
                    <option>Supplier</option>
                    <option>Deliveryman</option>
                    <option>Admin</option>
                  </select>
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Email</span>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#64748B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                    placeholder="Enter your email"
                    required
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Password</span>
                  <div className="relative w-full">
                    <input
                      type={showNewUserPassword ? "text" : "password"}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 pr-10 text-sm text-[#1E293B] placeholder:text-[#64748B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
                      aria-label={showNewUserPassword ? "Hide password" : "Show password"}
                    >
                      {showNewUserPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, photo: e.target.files?.[0] || null }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F2747] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                    required
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Phone Number</span>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#64748B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                    placeholder="Enter your phone number"
                    pattern="^\+?[1-9][0-9\s\-().]{6,19}$"
                    title="Enter a valid international phone number"
                    required
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">Address</span>
                  <textarea
                    value={newUserForm.address}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="min-h-[88px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#64748B] transition focus:border-[#0F2747] focus:bg-white focus:outline-none"
                    placeholder="Enter your address"
                    required
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="rounded-xl border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-bold text-[#475569] transition hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="rounded-xl bg-[#0F2747] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#163860] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
