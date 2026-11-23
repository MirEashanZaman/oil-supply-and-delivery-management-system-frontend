"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, LogOut, ArrowRight, Compass } from "lucide-react";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    { href: "/terms", label: "Terms" },
];

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

    const allLinks = user ? [...NAV_LINKS, { href: "/dashboard", label: "Dashboard" }] : NAV_LINKS;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0F2747] text-white rounded-xl px-4 py-2 my-3 w-full max-w-[1240px] mx-auto border border-[#163860]"
        >
            <div className="flex items-center justify-between gap-3 min-h-10">
                <Link href="/" className="flex items-center gap-2.5 text-white font-semibold text-sm sm:text-base group">
                    <motion.span
                        whileHover={{ rotate: 12, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="w-7 h-7 rounded-md bg-[#F59E0B] text-[#111827] flex items-center justify-center font-semibold text-xs"
                    >
                        <Compass className="w-4 h-4 stroke-[2]" />
                    </motion.span>
                    <span className="font-medium text-sm tracking-tight">OSDMS</span>
                </Link>

                <div className="hidden md:flex items-center gap-1 text-sm relative">
                    {allLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-3.5 h-9 inline-flex items-center rounded-lg text-xs font-medium transition-colors z-10 ${
                                    active
                                        ? link.href === "/dashboard"
                                            ? "text-[#111827] font-semibold"
                                            : "text-[#F59E0B]"
                                        : "text-slate-200 hover:text-white"
                                }`}
                            >
                                {active && (
                                    <motion.span
                                        layoutId="navbar-active-pill"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        className={`absolute inset-0 rounded-lg -z-10 ${
                                            link.href === "/dashboard" ? "bg-[#F59E0B]" : "bg-[#163860]"
                                        }`}
                                    />
                                )}
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2.5">
                    {!user ? (
                        <div className="hidden sm:flex items-center gap-2.5">
                            <Link
                                href="/login"
                                className="px-3 h-8 inline-flex items-center text-slate-200 hover:text-white text-xs font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Link
                                    href="/registration"
                                    className="px-3.5 h-8 inline-flex items-center gap-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium rounded-lg text-xs transition-colors"
                                >
                                    <span>Register</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-xs text-slate-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {user.userName || user.name || "User"}
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleLogout}
                                className="px-3 h-8 inline-flex items-center gap-1.5 bg-[#163860] hover:bg-[#1E4A7D] text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign out</span>
                            </motion.button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="md:hidden p-2 rounded-lg bg-[#163860] text-white hover:bg-[#1E4A7D] transition-colors"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="md:hidden overflow-hidden"
                    >
                        <div className="pt-3 pb-2 border-t border-[#163860] mt-2 flex flex-col gap-1">
                            {allLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(link.href)
                                            ? "bg-[#163860] text-[#F59E0B]"
                                            : "text-slate-200 hover:bg-[#163860]/50"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

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
                                            className="px-3 py-1.5 bg-[#163860] text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
