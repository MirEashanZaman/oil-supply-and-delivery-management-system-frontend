"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                setUser(null);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="navbar bg-[#0F2747] text-white shadow-none rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 my-2 sm:my-3 w-full max-w-[1240px] flex items-center justify-between gap-2 border border-[#163860]">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
                <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-white font-black text-xs sm:text-base tracking-tight hover:opacity-95 transition-opacity">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-black text-xs shadow-none">
                        OS
                    </span>
                    <span className="hidden sm:inline font-bold">Oil Supply & Delivery Management System</span>
                    <span className="sm:hidden font-bold text-xs">OSDMS</span>
                </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                <Link
                    href="/"
                    className={`btn btn-sm shadow-none rounded-lg text-xs sm:text-sm font-semibold border-none transition-colors ${isActive("/")
                            ? "bg-[#163860] text-[#F59E0B] font-bold"
                            : "btn-ghost text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                        }`}
                >
                    Home
                </Link>
                <Link
                    href="/about"
                    className={`btn btn-sm shadow-none rounded-lg text-xs sm:text-sm font-semibold border-none transition-colors ${isActive("/about")
                            ? "bg-[#163860] text-[#F59E0B] font-bold"
                            : "btn-ghost text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                        }`}
                >
                    About Us
                </Link>
                <Link
                    href="/contact"
                    className={`btn btn-sm shadow-none rounded-lg text-xs sm:text-sm font-semibold border-none transition-colors ${isActive("/contact")
                            ? "bg-[#163860] text-[#F59E0B] font-bold"
                            : "btn-ghost text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                        }`}
                >
                    Contact
                </Link>

                {user && (
                    <Link
                        href="/dashboard"
                        className={`btn btn-sm shadow-none rounded-lg text-xs sm:text-sm font-semibold border-none transition-colors ${isActive("/dashboard")
                                ? "bg-[#F59E0B] text-[#1E293B] font-bold"
                                : "btn-ghost text-slate-200 hover:bg-[#163860]/70 hover:text-white"
                            }`}
                    >
                        Dashboard
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-2">
                {!user ? (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className="btn btn-sm shadow-none bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold rounded-lg border-none text-xs sm:text-sm"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/registration"
                            className="btn btn-sm btn-outline text-white border-slate-400 hover:bg-white/10 hover:border-white rounded-lg text-xs sm:text-sm font-semibold"
                        >
                            Register
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="badge bg-[#163860] text-[#F59E0B] border border-[#F59E0B]/30 font-bold text-xs px-2.5 py-1 hidden md:inline-flex">
                            {user.title || "User"}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="btn btn-sm btn-ghost text-red-300 hover:bg-red-950/40 hover:text-red-200 rounded-lg font-bold text-xs sm:text-sm cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}