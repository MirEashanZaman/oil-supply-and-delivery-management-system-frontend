"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                setUser(null);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        setUser(null);
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-[#0F2747] text-white rounded-xl px-4 py-2 my-3 w-full max-w-[1240px] mx-auto border border-[#163860]">
            <div className="flex items-center justify-between gap-3 min-h-10">
                <Link href="/" className="flex items-center gap-2 text-white font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity">
                    <span className="w-7 h-7 rounded-md bg-[#F59E0B] text-[#111827] flex items-center justify-center font-semibold text-xs">
                        OS
                    </span>
                    <span className="font-medium text-sm">OSDMS</span>
                </Link>

                <div className="hidden md:flex items-center gap-1 text-sm">
                    <Link
                        href="/"
                        className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/")
                            ? "bg-[#163860] text-[#F59E0B]"
                            : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                            }`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/about")
                            ? "bg-[#163860] text-[#F59E0B]"
                            : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                            }`}
                    >
                        About
                    </Link>
                    <Link
                        href="/faq"
                        className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/faq")
                            ? "bg-[#163860] text-[#F59E0B]"
                            : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                            }`}
                    >
                        FAQ
                    </Link>
                    <Link
                        href="/contact"
                        className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/contact")
                            ? "bg-[#163860] text-[#F59E0B]"
                            : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                            }`}
                    >
                        Contact
                    </Link>
                    <Link
                        href="/terms"
                        className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/terms")
                            ? "bg-[#163860] text-[#F59E0B]"
                            : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                            }`}
                    >
                        Terms
                    </Link>

                    {user && (
                        <Link
                            href="/dashboard"
                            className={`px-3 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors ${isActive("/dashboard")
                                ? "bg-[#F59E0B] text-[#111827]"
                                : "text-slate-200 hover:bg-[#163860]/80 hover:text-white"
                                }`}
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {!user ? (
                        <div className="hidden sm:flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-3 h-8 inline-flex items-center text-slate-200 hover:text-white text-xs font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/registration"
                                className="px-4 h-8 inline-flex items-center bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium rounded-lg text-xs transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-xs text-slate-300">
                                {user.userName || user.name || "User"}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-3 h-8 inline-flex items-center bg-[#163860] hover:bg-[#1E4A7D] text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                            >
                                Sign out
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="md:hidden p-2 rounded-lg bg-[#163860] text-white hover:bg-[#1E4A7D] transition-colors"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden pt-3 pb-2 border-t border-[#163860] mt-2 flex flex-col gap-1">
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/") ? "bg-[#163860] text-[#F59E0B]" : "text-slate-200"}`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/about") ? "bg-[#163860] text-[#F59E0B]" : "text-slate-200"}`}
                    >
                        About
                    </Link>
                    <Link
                        href="/faq"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/faq") ? "bg-[#163860] text-[#F59E0B]" : "text-slate-200"}`}
                    >
                        FAQ
                    </Link>
                    <Link
                        href="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/contact") ? "bg-[#163860] text-[#F59E0B]" : "text-slate-200"}`}
                    >
                        Contact
                    </Link>
                    <Link
                        href="/terms"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/terms") ? "bg-[#163860] text-[#F59E0B]" : "text-slate-200"}`}
                    >
                        Terms & Conditions
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/dashboard") ? "bg-[#F59E0B] text-[#111827]" : "text-slate-200"}`}
                        >
                            Dashboard
                        </Link>
                    )}

                    <div className="pt-2 border-t border-[#163860] flex flex-col gap-2">
                        {!user ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 border border-slate-400 text-white font-medium rounded-lg text-sm"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/registration"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 bg-[#F59E0B] text-[#111827] font-medium rounded-lg text-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-slate-300">
                                    {user.userName || user.name || "User"}
                                </span>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="px-3 py-1.5 bg-[#163860] text-white font-medium rounded-lg text-xs"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
