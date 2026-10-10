"use client";

import React, { useState } from "react";
import { UserData } from "../types";
import { getRoleBadgeColor, isValidPhoneNumber } from "../utils";
import { convertToWebP } from "@/lib/image-optimizer";

interface ProfileTabProps {
  userData: UserData | null;
  onUpdateProfile?: (updated: Partial<UserData> & { photoFile?: File | null }) => void;
  onDeleteAccount?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userData,
  onUpdateProfile,
  onDeleteAccount,
}) => {
  const [name, setName] = useState(userData?.userName || userData?.name || "");
  const [phone, setPhone] = useState(userData?.phoneNumber || userData?.phone || "");
  const [address, setAddress] = useState(userData?.address || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(userData?.photoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (userData) {
      setName(userData.userName || userData.name || "");
      setPhone(userData.phoneNumber || userData.phone || "");
      setAddress(userData.address || "");
      if (userData.photoUrl && !photoFile) {
        setPhotoPreview(userData.photoUrl);
      }
    }
  }, [userData]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Automatically convert uploaded photo to optimized WebP format
    const optimizedWebpFile = await convertToWebP(rawFile, 800, 800, 0.85);

    setPhotoFile(optimizedWebpFile);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(optimizedWebpFile);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      alert("Enter a valid local or international mobile number.");
      return;
    }
    if (password && password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (password && password !== confirmPassword) {
      alert("Passwords do not match. Please verify your new password.");
      return;
    }

    setIsUploading(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          userName: name,
          name: name,
          phoneNumber: phone,
          phone: phone,
          address,
          photoUrl: photoPreview,
          photoFile: photoFile,
          password: password.trim() ? password.trim() : undefined,
        });
      }
      setPassword("");
      setConfirmPassword("");
      setPhotoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full text-left animate-fadeIn max-w-4xl mx-auto space-y-6">
      <div className="card bg-card-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile photo"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-md"
                onError={(e) => {
                  setPhotoPreview(undefined);
                }}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0F2747] text-white flex items-center justify-center font-black text-4xl shadow-md">
                {(userData?.userName || userData?.name || userData?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] px-3 py-1.5 rounded-lg cursor-pointer shadow-lg transition-transform hover:scale-105 text-[11px] font-bold whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Change photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h3 className="text-2xl font-black text-[#0F2747]">
                {userData?.userName || userData?.name || "System User"}
              </h3>
              <span className={`badge border-none font-bold text-xs px-3 py-1 ${getRoleBadgeColor(userData?.title || userData?.role || "")}`}>
                {userData?.title || userData?.role || "Customer"}
              </span>
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[10px] px-2.5 py-0.5">
                ✓ Govt Energy Board Verified
              </span>
            </div>
            <p className="text-sm font-medium text-secondary-gray">{userData?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-secondary-gray">
              <span>📍 {userData?.address || "Address not registered"}</span>
              <span>📞 {userData?.phoneNumber || userData?.phone || "Phone not registered"}</span>
            </div>
          </div>
        </div>

        {/* Enterprise Role Specification Card */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enterprise Role</span>
            <strong className="text-xs text-[#0F2747] font-extrabold">{userData?.title || userData?.role || "Customer"}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Compliance Standard</span>
            <strong className="text-xs text-emerald-700 font-extrabold">ISO 9001 & ASTM-D Grade</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security & Access</span>
            <strong className="text-xs text-[#0F2747] font-extrabold">256-bit TLS Encrypted Session</strong>
          </div>
        </div>
      </div>

      <div className="card bg-card-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#0F2747] mb-4">Update Profile & Security Details</h3>

        {saved && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-fadeIn">
            Profile details updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1E293B] mb-1">Username / Legal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full text-sm bg-white text-[#1E293B] rounded-xl border-[#E2E8F0] focus:border-[#F59E0B]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E293B] mb-1">
              Registered Email (Account Identifier)
            </label>
            <input
              type="email"
              disabled
              value={userData?.email || ""}
              className="input input-bordered w-full text-sm bg-slate-100 text-secondary-gray rounded-xl border-[#E2E8F0] cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your mobile number"
                inputMode="tel"
                className="input input-bordered w-full text-sm bg-white text-[#1E293B] rounded-xl border-[#E2E8F0] focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">Primary Operational Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                className="input input-bordered w-full text-sm bg-white text-[#1E293B] rounded-xl border-[#E2E8F0] focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#0F2747]">
                Change Password <span className="text-secondary-gray font-normal">(Leave blank to keep existing password)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[11px] font-bold text-primary-gold hover:underline"
              >
                {showPassword ? "Hide Passwords" : "Show Passwords"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  autoComplete="new-password"
                  className="input input-bordered w-full pr-10 text-sm bg-white text-[#1E293B] rounded-xl border-[#E2E8F0] focus:border-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="input input-bordered w-full pr-10 text-sm bg-white text-[#1E293B] rounded-xl border-[#E2E8F0] focus:border-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
            {onDeleteAccount ? (
              <button
                type="button"
                onClick={onDeleteAccount}
                className="text-xs text-[#DC2626] hover:underline font-bold cursor-pointer"
              >
                Permanently Delete Account
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={isUploading}
              className="btn btn-primary font-bold text-xs rounded-xl shadow-sm px-6"
            >
              {isUploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
