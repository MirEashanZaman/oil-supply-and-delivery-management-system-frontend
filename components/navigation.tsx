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
        <nav className="bg-[#0F2747] text-white rounded-2xl px-3 py-2.5 sm:px-4 sm:py-2.5 my-2 sm:my-3 w-full max-w-[1240px] mx-auto border border-[#163860]">
            <div className="flex items-center justify-between gap-2">
                <Link href="/" className="flex items-center gap-2 text-white font-black text-sm sm:text-base tracking-tight hover:opacity-95 transition-opacity">
                    <span className="w-8 h-8 rounded-lg bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-black text-xs">
                        OS
                    </span>
                    <span className="font-bold text-sm">OSDMS</span>
                </Link>

                <div className="hidden md:flex items-center gap-1.5 text-xs">
                    <Link
                        href="/"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive("/")
                                ? "bg-[#163860] text-[#F59E0B] font-bold"
                                : "text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                            }`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive("/about")
                                ? "bg-[#163860] text-[#F59E0B] font-bold"
                                : "text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                            }`}
                    >
                        About Us
                    </Link>
                    <Link
                        href="/contact"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive("/contact")
                                ? "bg-[#163860] text-[#F59E0B] font-bold"
                                : "text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                            }`}
                    >
                        Contact
                    </Link>

                    {user && (
                        <Link
                            href="/dashboard"
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive("/dashboard")
                                    ? "bg-[#F59E0B] text-[#1E293B] font-bold"
                                    : "text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                                }`}
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!user ? (
                        <div className="hidden sm:flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold rounded-lg text-xs"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/registration"
                                className="px-3 py-1.5 border border-slate-400 hover:bg-white/10 hover:border-white rounded-lg text-xs font-semibold text-white"
                            >
                                Register
                            </Link>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-medium">
                                Hi, <strong className="text-white">{user.userName || user.name || "User"}.</strong>
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-lg text-xs"
                            >
                                Logout
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="md:hidden p-2 rounded-lg bg-[#163860] text-white hover:bg-[#1E4A7D] transition"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden pt-3 pb-2 border-t border-[#163860] mt-2 flex flex-col gap-1.5">
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive("/") ? "bg-[#163860] text-[#F59E0B] font-bold" : "text-slate-200"}`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive("/about") ? "bg-[#163860] text-[#F59E0B] font-bold" : "text-slate-200"}`}
                    >
                        About Us
                    </Link>
                    <Link
                        href="/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive("/contact") ? "bg-[#163860] text-[#F59E0B] font-bold" : "text-slate-200"}`}
                    >
                        Contact
                    </Link>
                    {user && (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive("/dashboard") ? "bg-[#F59E0B] text-[#1E293B] font-bold" : "text-slate-200"}`}
                        >
                            Dashboard
                        </Link>
                    )}

                    <div className="pt-2 border-t border-[#163860]/80 flex flex-col gap-2">
                        {!user ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 bg-[#F59E0B] text-[#1E293B] font-bold rounded-lg text-sm"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/registration"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 border border-slate-400 text-white font-semibold rounded-lg text-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-slate-300">
                                    Logged in: <strong className="text-white">{user.userName || user.name || "User"}.</strong>
                                </span>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="px-3 py-1.5 bg-[#DC2626] text-white font-bold rounded-lg text-xs"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}