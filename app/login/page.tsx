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
    const [errors, setErrors] = useState<LoginErrors>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const roles = ["admin", "customer", "dealer", "supplier"];
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
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            withCredentials: true,
                            validateStatus: (status) => status < 500,
                        }
                    );
                    if ((response.status === 200 || response.status === 201) && response.data) {
                        loginSuccess = true;
                        matchedRole = r.charAt(0).toUpperCase() + r.slice(1);
                        apiUserData = response.data;
                        break;
                    } else if (response.status === 401) {
                        lastErrorMessage = "Invalid email or password. Please check your credentials or register a new account.";
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
                    userData = {
                        id: u.id || userData.id,
                        email: u.email || userData.email,
                        userName: u.username || u.userName || userData.userName,
                        phoneNumber: u.phoneNumber || userData.phoneNumber,
                        address: u.address || userData.address,
                        title: normalizeRole(u.title || r),
                        photoUrl: u.filename ? `${API_ENDPOINT}/customer/getimage/${u.filename}` : userData.photoUrl,
                    };
                } else {
                    const rolePath = matchedRole.toLowerCase();
                    let fetchUrl = `${API_ENDPOINT}/${rolePath}/getallcustomer`;
                    if (rolePath === "supplier") {
                        fetchUrl = `${API_ENDPOINT}/supplier/getallsupplier`;
                    } else if (rolePath === "dealer") {
                        fetchUrl = `${API_ENDPOINT}/dealer/all`;
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
                            userData = {
                                id: matchedUser.id || userData.id,
                                email: matchedUser.email,
                                userName: matchedUser.username || matchedUser.userName || userData.userName,
                                phoneNumber: matchedUser.phoneNumber || userData.phoneNumber,
                                address: matchedUser.address || userData.address,
                                title: normalizeRole(matchedUser.title || matchedRole),
                                photoUrl: matchedUser.photoUrl || matchedUser.photo || userData.photoUrl,
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

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Login" message="Sign in to your Oil Supply & Delivery account" />
            <MyNavigation />

            <div className="mt-6 w-full max-w-md">
                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-8">
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
                                <label className="label pb-1" htmlFor="password">
                                    <span className="label-text font-semibold text-[#1E293B]">Password</span>
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    placeholder="Enter your password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none transition rounded-xl ${errors.password ? "border-[#DC2626]" : ""}`}
                                />
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
                    </div>
                </div>
            </div>
        </div>
    );
}
