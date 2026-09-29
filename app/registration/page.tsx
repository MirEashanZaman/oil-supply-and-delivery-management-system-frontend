"use client";

import { useState } from "react";
import { z } from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";
import { checkEmailUniqueness } from "@/lib/email-checker";
import { API_ENDPOINT } from "@/lib/api";

const mobileNumberRegex = /^\+?[1-9][0-9\s\-().]{6,19}$/;

const registrationSchema = z
    .object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().min(1, "Email is required").email("Invalid email address"),
        phoneNumber: z
            .string()
            .trim()
            .min(1, "Phone number is required")
            .regex(mobileNumberRegex, "Enter a valid international phone number"),
        address: z.string().min(1, "Address is required"),
        title: z.string().min(1, "Title is required"),
        photo: z.any().refine((file) => file instanceof File, "Photo is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegistrationErrors = {
    username?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    title?: string;
    photo?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
};

export default function Registration() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [title, setTitle] = useState("Customer");
    const [photo, setPhoto] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<RegistrationErrors>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{
        checking: boolean;
        isUnique: boolean | null;
        message: string;
        role?: string;
    }>({ checking: false, isUnique: null, message: "" });

    const verifyCandidateEmail = async (rawEmail: string) => {
        const trimmed = rawEmail.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
            setEmailStatus({ checking: false, isUnique: null, message: "" });
            return;
        }

        setEmailStatus({ checking: true, isUnique: null, message: "Verifying email uniqueness across system..." });
        const check = await checkEmailUniqueness(trimmed);

        if (!check.isUnique) {
            setEmailStatus({
                checking: false,
                isUnique: false,
                role: check.existingRole,
                message: `This email is already registered to a ${check.existingRole} account. Only one account per email is allowed.`,
            });
            setErrors((prev) => ({
                ...prev,
                email: `Email already registered to a ${check.existingRole} account. There can be only one account per email address.`,
            }));
        } else {
            setEmailStatus({
                checking: false,
                isUnique: true,
                message: "Email address is available for registration.",
            });
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated.email;
                return updated;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");

        const result = registrationSchema.safeParse({
            username,
            email,
            phoneNumber,
            address,
            title,
            photo,
            password,
            confirmPassword,
        });

        if (!result.success) {
            const formattedErrors: RegistrationErrors = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof RegistrationErrors;
                formattedErrors[path] = issue.message;
            });
            setErrors(formattedErrors);
            return;
        }

        setIsSubmitting(true);

        const emailCheck = await checkEmailUniqueness(result.data.email);
        if (!emailCheck.isUnique) {
            setIsSubmitting(false);
            const role = emailCheck.existingRole || "existing";
            const duplicateMsg = `An account with this email (${result.data.email}) already exists as a ${role}. Only one account per email is allowed.`;
            setErrors({
                email: `Email already registered to a ${role} account. Only one account per email is permitted.`,
                form: duplicateMsg,
            });
            setEmailStatus({
                checking: false,
                isUnique: false,
                role: role,
                message: duplicateMsg,
            });
            return;
        }

        const formData = new FormData();
        formData.append("userName", result.data.username);
        formData.append("email", result.data.email);
        formData.append("phoneNumber", result.data.phoneNumber);
        formData.append("address", result.data.address);
        formData.append("title", result.data.title);
        formData.append("password", result.data.password);
        formData.append("photo", result.data.photo);

        const rolePath = result.data.title.toLowerCase();
        try {
            const res = await axios.post(
                `${API_ENDPOINT}/${rolePath}/auth/register`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    validateStatus: (status) => status < 500,
                }
            );

            if (res.status === 200 || res.status === 201) {
                if (result.data.title === "Deliveryman") {
                    setSuccessMessage("Deliveryman registration submitted successfully! Your account is pending administrator approval before you can log in. Redirecting...");
                } else {
                    setSuccessMessage("Registration successful! Redirecting to login page...");
                }

                setUsername("");
                setEmail("");
                setPhoneNumber("");
                setAddress("");
                setTitle("");
                setPhoto(null);
                setPassword("");
                setConfirmPassword("");
                setEmailStatus({ checking: false, isUnique: null, message: "" });

                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else if (res.status === 409) {
                setErrors({
                    email: `An account with this email (${result.data.email}) already exists. There can be only one account per email address.`,
                    form: `An account with this email (${result.data.email}) already exists. Only one account per email address is permitted in the system. Please sign in with this email or use a different email.`,
                });
                setEmailStatus({
                    checking: false,
                    isUnique: false,
                    message: "Email already registered.",
                });
            } else {
                const apiMessage = res.data?.message || "Registration failed. Please check your backend connection.";
                setErrors({
                    form: Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage,
                });
            }
        } catch (error: any) {
            console.warn("Registration request error:", error);
            const apiMessage = error.response?.data?.message || "Registration failed. Please check your backend connection.";
            setErrors({
                form: Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Registration" message="Create your account for the Oil Supply & Delivery Management System" />
            <MyNavigation />

            <div className="mt-6 w-full max-w-2xl">
                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-[#0F2747]/10 text-[#0F2747] rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">Create Account</h1>
                                <p className="text-xs text-[#64748B]">Choose your role and register to begin trading or ordering</p>
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
                            <div role="alert" className="alert bg-[#DC2626] text-white shadow-sm mb-5 text-sm py-3 rounded-xl border-none flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold">{errors.form}</span>
                                </div>
                                {(errors.form.includes("already") || errors.form.includes("exists")) && (
                                    <a
                                        href="/login"
                                        className="text-white underline font-bold text-xs mt-1 hover:text-amber-200 transition-colors"
                                    >
                                        Click here to sign in with your registered account
                                    </a>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="title">
                                        <span className="label-text font-semibold text-[#1E293B]">Account Role</span>
                                    </label>
                                    <select
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="select select-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl"
                                    >
                                        <option value="Customer">Customer</option>
                                        <option value="Supplier">Supplier</option>
                                        <option value="Dealer">Dealer</option>
                                        <option value="Deliveryman">Deliveryman (Delivery Personnel)</option>
                                    </select>
                                    {errors.title && (
                                        <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.title}</span>
                                    )}
                                </div>

                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="username">
                                        <span className="label-text font-semibold text-[#1E293B]">Username</span>
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        placeholder="Enter your username"
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.username ? "border-[#DC2626]" : ""}`}
                                    />
                                    {errors.username && (
                                        <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.username}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="email">
                                        <span className="label-text font-semibold text-[#1E293B]">Email Address</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        placeholder="Enter your email"
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailStatus.isUnique !== null) {
                                                setEmailStatus({ checking: false, isUnique: null, message: "" });
                                            }
                                        }}
                                        onBlur={(e) => verifyCandidateEmail(e.target.value)}
                                        className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.email || emailStatus.isUnique === false ? "border-[#DC2626]" : emailStatus.isUnique === true ? "border-[#16A34A]" : ""}`}
                                    />
                                    {emailStatus.checking && (
                                        <span className="text-[#64748B] text-xs font-medium mt-1 flex items-center gap-1.5">
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Verifying email uniqueness across all tables...
                                        </span>
                                    )}
                                    {!emailStatus.checking && emailStatus.isUnique === true && (
                                        <span className="text-[#16A34A] text-xs font-medium mt-1">
                                            {emailStatus.message}
                                        </span>
                                    )}
                                    {!emailStatus.checking && emailStatus.isUnique === false && (
                                        <div className="mt-1 text-xs text-[#DC2626] font-medium flex flex-col gap-0.5">
                                            <span>{emailStatus.message}</span>
                                            <a href="/login" className="text-[#0F2747] underline font-bold hover:text-primary">
                                                Click here to sign in with this email instead
                                            </a>
                                        </div>
                                    )}
                                    {errors.email && emailStatus.isUnique !== false && (
                                        <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.email}</span>
                                    )}
                                </div>

                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="phoneNumber">
                                        <span className="label-text font-semibold text-[#1E293B]">Phone Number</span>
                                    </label>
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        value={phoneNumber}
                                        placeholder="Enter your phone number"
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.phoneNumber ? "border-[#DC2626]" : ""}`}
                                    />
                                    {errors.phoneNumber && (
                                        <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.phoneNumber}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-control w-full">
                                <label className="label pb-1" htmlFor="address">
                                    <span className="label-text font-semibold text-[#1E293B]">Delivery / Office Address</span>
                                </label>
                                <input
                                    id="address"
                                    type="text"
                                    value={address}
                                    placeholder="Enter your address"
                                    onChange={(e) => setAddress(e.target.value)}
                                    className={`input input-bordered w-full bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.address ? "border-[#DC2626]" : ""}`}
                                />
                                {errors.address && (
                                    <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.address}</span>
                                )}
                            </div>

                            <div className="form-control w-full">
                                <label className="label pb-1" htmlFor="photo">
                                    <span className="label-text font-semibold text-[#1E293B]">Profile Photo</span>
                                </label>
                                <input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                                    className="file-input file-input-bordered w-full bg-[#FFFFFF] border-[#CBD5E1] text-[#1E293B] rounded-xl"
                                />
                                {errors.photo && (
                                    <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.photo}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="password">
                                        <span className="label-text font-semibold text-[#1E293B]">Password</span>
                                    </label>
                                    <div className="relative w-full">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            placeholder="Enter your password"
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`input input-bordered w-full pr-10 bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.password ? "border-[#DC2626]" : ""}`}
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

                                <div className="form-control w-full">
                                    <label className="label pb-1" htmlFor="confirmPassword">
                                        <span className="label-text font-semibold text-[#1E293B]">Confirm Password</span>
                                    </label>
                                    <div className="relative w-full">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            placeholder="Enter your password again"
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`input input-bordered w-full pr-10 bg-[#FFFFFF] text-[#1E293B] border-[#CBD5E1] focus:border-[#0F2747] focus:outline-none rounded-xl ${errors.confirmPassword ? "border-[#DC2626]" : ""}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? (
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
                                    {errors.confirmPassword && (
                                        <span className="text-[#DC2626] text-xs font-medium mt-1">{errors.confirmPassword}</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold w-full border-none shadow-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Registration</span>
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
                                Already have an account?{" "}
                                <a href="/login" className="text-[#0F2747] font-bold hover:underline">
                                    Sign in here
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
