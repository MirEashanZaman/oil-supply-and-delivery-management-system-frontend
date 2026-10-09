"use client";

import { useState } from "react";
import { z } from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import { normalizeRole } from "@/components/dashboard/utils";
import { API_ENDPOINT } from "@/lib/api";

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginErrors = {
    email?: string;
    password?: string;
    form?: string;
};

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState<"EMAIL" | "OTP_NEW_PASSWORD">("EMAIL");
    const [forgotEmail, setForgotEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");

        const result = loginSchema.safeParse({ email, password });

        if (!result.success) {
            const formattedErrors: LoginErrors = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof LoginErrors;
                formattedErrors[path] = issue.message;
            });
            setErrors(formattedErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const signInEmail = result.data.email;
            const roles = ["admin", "customer", "dealer", "supplier", "deliveryman"];
            let loginSuccess = false;
            let matchedRole = "Customer";
            let lastErrorMessage = "";
            let apiUserData: any = null;

            for (const r of roles) {
                try {
                    const response = await axios.post(
                        `${API_ENDPOINT}/${r}/auth/signIn`,
                        {
                            email: result.data.email,
                            password: result.data.password,
                        },
                        {
                            headers: { "Content-Type": "application/json" },
                            withCredentials: true,
                            timeout: 15000,
                            validateStatus: (status) => status < 500,
                        }
                    );
                    if ((response.status === 200 || response.status === 201) && response.data) {
                        loginSuccess = true;
                        matchedRole = r.charAt(0).toUpperCase() + r.slice(1);
                        apiUserData = response.data;
                        break;
                    } else if (response.status === 401) {
                        lastErrorMessage = "Invalid email or password. Please verify your credentials or register a new account.";
                    } else if (response.status === 429) {
                        lastErrorMessage = response.data?.message || "Too many failed attempts. Please try again shortly.";
                    } else if (response.status === 400 && response.data?.message) {
                        lastErrorMessage = Array.isArray(response.data.message)
                            ? response.data.message.join(", ")
                            : response.data.message;
                    }
                } catch (err: any) {
                    console.warn(`Sign-in check for ${r} error:`, err);
                }

                if (loginSuccess) break;
            }

            if (!loginSuccess) {
                const displayMsg = lastErrorMessage || "Invalid email or password. Please verify your credentials or register a new account.";
                setErrors({
                    form: Array.isArray(displayMsg) ? displayMsg.join(", ") : displayMsg,
                });
                return;
            }

            let userData: {
                id?: number;
                email: string;
                userName: string;
                title: string;
                phoneNumber?: string;
                address?: string;
                photoUrl?: string;
            } = {
                id: apiUserData?.id || apiUserData?.user?.id,
                email: apiUserData?.email || apiUserData?.user?.email || signInEmail,
                userName: apiUserData?.userName || apiUserData?.username || apiUserData?.user?.userName || signInEmail.split("@")[0],
                title: normalizeRole(apiUserData?.title || apiUserData?.role || matchedRole),
                phoneNumber: apiUserData?.phoneNumber || apiUserData?.user?.phoneNumber,
                address: apiUserData?.address || apiUserData?.user?.address,
                photoUrl: apiUserData?.photoUrl || apiUserData?.photo,
            };

            try {
                const searchRes = await axios.get(
                    `${API_ENDPOINT}/users/search?email=${encodeURIComponent(signInEmail)}`,
                    { validateStatus: (status) => status < 500 }
                );

                if (searchRes.status === 200 && searchRes.data?.user) {
                    const u = searchRes.data.user;
                    const r = searchRes.data.role || matchedRole;
                    const matchPhoto = u.filename || u.photo || u.photoUrl || u.image || u.imageUrl;
                    let resolvedLoginPhoto = userData.photoUrl;
                    if (matchPhoto && typeof matchPhoto === "string") {
                        if (matchPhoto.startsWith("data:") || matchPhoto.startsWith("http://") || matchPhoto.startsWith("https://")) {
                            resolvedLoginPhoto = matchPhoto;
                        } else {
                            resolvedLoginPhoto = `/api/profile-image/${encodeURIComponent(matchPhoto)}`;
                        }
                    }
                    userData = {
                        id: u.id || userData.id,
                        email: u.email || userData.email,
                        userName: u.username || u.userName || userData.userName,
                        phoneNumber: u.phoneNumber || userData.phoneNumber,
                        address: u.address || userData.address,
                        title: normalizeRole(u.title || r),
                        photoUrl: resolvedLoginPhoto,
                    };
                } else {
                    const rolePath = matchedRole.toLowerCase();
                    let fetchUrl = `${API_ENDPOINT}/${rolePath}/getallcustomer`;
                    if (rolePath === "supplier") {
                        fetchUrl = `${API_ENDPOINT}/supplier/getallsupplier`;
                    } else if (rolePath === "dealer") {
                        fetchUrl = `${API_ENDPOINT}/dealer/all`;
                    } else if (rolePath === "deliveryman") {
                        fetchUrl = `${API_ENDPOINT}/deliveryman/all`;
                    } else if (rolePath === "admin") {
                        fetchUrl = `${API_ENDPOINT}/admin/getallusers`;
                    }

                    const responseAll = await axios.get(fetchUrl, {
                        withCredentials: true,
                        validateStatus: (status) => status < 500,
                    });

                    if (responseAll.status === 200 && Array.isArray(responseAll.data)) {
                        const matchedUser = responseAll.data.find(
                            (c: any) => c.email === signInEmail
                        );
                        if (matchedUser) {
                            const matchPhoto = matchedUser.filename || matchedUser.photo || matchedUser.photoUrl || matchedUser.image || matchedUser.imageUrl;
                            let resolvedLoginPhoto = userData.photoUrl;
                            if (matchPhoto && typeof matchPhoto === "string") {
                                if (matchPhoto.startsWith("data:") || matchPhoto.startsWith("http://") || matchPhoto.startsWith("https://")) {
                                    resolvedLoginPhoto = matchPhoto;
                                } else {
                                    resolvedLoginPhoto = `/api/profile-image/${encodeURIComponent(matchPhoto)}`;
                                }
                            }
                            userData = {
                                id: matchedUser.id || userData.id,
                                email: matchedUser.email,
                                userName: matchedUser.username || matchedUser.userName || userData.userName,
                                phoneNumber: matchedUser.phoneNumber || userData.phoneNumber,
                                address: matchedUser.address || userData.address,
                                title: normalizeRole(matchedUser.title || matchedRole),
                                photoUrl: resolvedLoginPhoto,
                            };
                        }
                    }
                }
            } catch (fetchErr) {
                console.warn("User profile fetch notice:", fetchErr);
            }

            if (apiUserData?.access_token) {
                localStorage.setItem("access_token", apiUserData.access_token);
            }
            localStorage.setItem("user", JSON.stringify(userData));
            router.push("/dashboard");
        } catch (error: any) {
            console.warn("Login request notice:", error);
            const apiMessage = error.response?.data?.message || "Invalid credentials or backend connection error.";
            setErrors({
                form: Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");

        if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
            setForgotError("Please enter a valid email address");
            return;
        }

        setIsForgotLoading(true);
        try {
            const res = await axios.post(`${API_ENDPOINT}/customer/auth/forgot-password`, {
                email: forgotEmail.trim(),
            });

            if (res.data?.resetToken) {
                setResetToken(res.data.resetToken);
                setForgotSuccess(res.data.message || "A 6-digit OTP code was sent to your email.");
                setForgotStep("OTP_NEW_PASSWORD");
            } else {
                setForgotError("Failed to initiate password reset. Please try again.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Could not find an account with that email.";
            setForgotError(Array.isArray(msg) ? msg.join(", ") : msg);
        } finally {
            setIsForgotLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");

        if (!otpCode.trim() || otpCode.trim().length !== 6) {
            setForgotError("Please enter the 6-digit verification code sent to your email.");
            return;
        }

        if (!newPassword || newPassword.length < 8) {
            setForgotError("New password must be at least 8 characters long.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setForgotError("Passwords do not match.");
            return;
        }

        setIsForgotLoading(true);
        try {
            const res = await axios.post(`${API_ENDPOINT}/customer/auth/reset-password`, {
                email: forgotEmail.trim(),
                otp: otpCode.trim(),
                resetToken: resetToken,
                newPassword: newPassword,
            });

            if (res.data?.success) {
                setSuccessMessage("Password reset successfully! You can now log in with your new password.");
                setShowForgotPassword(false);
                setForgotStep("EMAIL");
                setForgotEmail("");
                setOtpCode("");
                setNewPassword("");
                setConfirmNewPassword("");
                setResetToken("");
            } else {
                setForgotError(res.data?.message || "Failed to reset password.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Invalid or expired OTP. Please request a new one.";
            setForgotError(Array.isArray(msg) ? msg.join(", ") : msg);
        } finally {
            setIsForgotLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Login" message="Sign in to your Oil Supply & Delivery account" />
            <MyNavigation />

            <div className="mt-6 w-full max-w-md">
                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-8">
                        {!showForgotPassword ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-[#0F2747]/10 text-[#0F2747] rounded-xl">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">Account Login</h1>
                                        <p className="text-xs text-[#64748B]">Sign in to access orders, delivery status, and inventory</p>
                                    </div>
                                </div>

                                {successMessage && (
                                    <div role="alert" className="alert bg-[#16A34A] text-white shadow-sm mb-5 text-sm py-2.5 rounded-xl border-none">
                                        <svg className="w-5 h-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                {errors.form && (
                                    <div role="alert" className="alert bg-[#DC2626] text-white shadow-sm mb-5 text-sm py-2.5 rounded-xl border-none">
                                        <svg className="w-5 h-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{errors.form}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                    <div className="form-control w-full">
                                        <label className="label pb-1" htmlFor="email">
                                            <span className="label-text font-semibold text-[#1E293B]">Email Address</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            placeholder="Enter your email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none transition rounded-xl ${errors.email ? "border-[#DC2626]" : ""}`}
                                        />
                                        {errors.email && (
                                            <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.email}</span>
                                        )}
                                    </div>

                                    <div className="form-control w-full">
                                        <div className="flex items-center justify-between pb-1">
                                            <label className="label p-0" htmlFor="password">
                                                <span className="label-text font-semibold text-[#1E293B]">Password</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(true);
                                                    setForgotEmail(email);
                                                    setForgotError("");
                                                    setForgotSuccess("");
                                                    setForgotStep("EMAIL");
                                                }}
                                                className="text-xs font-medium text-[#0F2747] hover:underline"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative w-full">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                placeholder="Enter your password"
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`input input-bordered w-full pr-10 bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none transition rounded-xl ${errors.password ? "border-[#DC2626]" : ""}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
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
                                        {errors.password && (
                                            <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.password}</span>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold w-full border-none shadow-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="divider text-xs text-[#64748B] my-4">OR</div>

                                <div className="text-center">
                                    <p className="text-xs text-[#64748B]">
                                        Don&apos;t have an account yet?{" "}
                                        <a href="/registration" className="text-[#0F2747] font-bold hover:underline">
                                            Register here
                                        </a>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-[#0F2747]/10 text-[#0F2747] rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-[#1E293B]">Reset Password</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="text-xs font-semibold text-[#64748B] hover:text-[#1E293B]"
                                    >
                                        Back to Login
                                    </button>
                                </div>

                                {forgotSuccess && (
                                    <div role="alert" className="alert bg-[#16A34A] text-white shadow-sm mb-4 text-xs py-2 rounded-xl border-none">
                                        <span>{forgotSuccess}</span>
                                    </div>
                                )}

                                {forgotError && (
                                    <div role="alert" className="alert bg-[#DC2626] text-white shadow-sm mb-4 text-xs py-2 rounded-xl border-none">
                                        <span>{forgotError}</span>
                                    </div>
                                )}

                                {forgotStep === "EMAIL" ? (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <p className="text-xs text-[#64748B]">
                                            Enter your verified email address. We will send a secure 6-digit verification code with 5-minute validity.
                                        </p>
                                        <div className="form-control w-full">
                                            <label className="label pb-1" htmlFor="forgotEmail">
                                                <span className="label-text font-semibold text-[#1E293B]">Email Address</span>
                                            </label>
                                            <input
                                                id="forgotEmail"
                                                type="email"
                                                value={forgotEmail}
                                                placeholder="e.g. user@example.com"
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] rounded-xl text-sm"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isForgotLoading}
                                            className="btn bg-[#0F2747] hover:bg-[#1E3A8A] text-white font-bold w-full border-none shadow-sm rounded-xl flex items-center justify-center gap-2"
                                        >
                                            {isForgotLoading ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                "Send Verification Code"
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="p-3 bg-[#F1F5F9] rounded-xl text-xs text-[#334155]">
                                            <span>Code sent to: <strong>{forgotEmail}</strong> (Expires in 5 mins)</span>
                                        </div>

                                        <div className="form-control w-full">
                                            <label className="label pb-1" htmlFor="otpCode">
                                                <span className="label-text font-semibold text-[#1E293B]">6-Digit OTP</span>
                                            </label>
                                            <input
                                                id="otpCode"
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                placeholder="123456"
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] rounded-xl text-center text-lg font-bold tracking-widest"
                                            />
                                        </div>

                                        <div className="form-control w-full">
                                            <label className="label pb-1" htmlFor="newPassword">
                                                <span className="label-text font-semibold text-[#1E293B]">New Password</span>
                                            </label>
                                            <div className="relative w-full">
                                                <input
                                                    id="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    placeholder="At least 8 characters"
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="input input-bordered w-full pr-10 bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] rounded-xl text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1"
                                                >
                                                    {showNewPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-control w-full">
                                            <label className="label pb-1" htmlFor="confirmNewPassword">
                                                <span className="label-text font-semibold text-[#1E293B]">Confirm Password</span>
                                            </label>
                                            <input
                                                id="confirmNewPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                value={confirmNewPassword}
                                                placeholder="Repeat new password"
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] rounded-xl text-sm"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isForgotLoading}
                                            className="btn bg-[#16A34A] hover:bg-[#15803D] text-white font-bold w-full border-none shadow-sm rounded-xl flex items-center justify-center gap-2"
                                        >
                                            {isForgotLoading ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Updating Password...
                                                </>
                                            ) : (
                                                "Set New Password"
                                            )}
                                        </button>

                                        <div className="text-center pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setForgotStep("EMAIL")}
                                                className="text-xs text-[#0F2747] hover:underline"
                                            >
                                                Resend OTP or Change Email
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
