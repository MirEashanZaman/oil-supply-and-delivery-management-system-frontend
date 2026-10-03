import Link from "next/link";
import { connection } from "next/server";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";

export default async function ContactInfo() {
    await connection();

    return (
        <div className="w-full flex flex-col items-center">
            <MyHeader name="Contact Us" message="Get in touch with the Oil Supply & Delivery Management System team" />
            <MyNavigation />

            <div className="w-full max-w-5xl mt-6 space-y-6">
                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-10 text-left">
                        <div className="max-w-3xl">
                            <span className="badge bg-[#0F2747] text-[#F59E0B] font-bold uppercase tracking-wider text-xs px-3 py-1 mb-3">
                                Support & Inquiries
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight leading-tight">
                                Contact Directory & Support Operations
                            </h1>
                            <p className="mt-3 text-[#64748B] text-sm sm:text-base leading-relaxed">
                                Get in touch with our central dispatch coordinators, customer support teams, and dealership onboarding representatives across nationwide distribution channels.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/login"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold border-none shadow-sm rounded-xl px-5"
                                >
                                    Log In to Realtime Dispatch Chat
                                </Link>
                                <Link
                                    href="/registration"
                                    className="btn btn-outline text-[#0F2747] border-[#0F2747] hover:bg-[#0F2747] hover:text-white rounded-xl px-5"
                                >
                                    Register Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#0F2747]/10 text-[#0F2747] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Central Headquarters</h2>
                            <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                                Oil Supply & Delivery Operations Center, Kuril, Dhaka-1229, Bangladesh.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Direct Phone Lines</h2>
                            <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                                Support: +880 1700-000000<br />
                                Logistics: +880 1800-000000
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-10 h-10 rounded-xl bg-[#16A34A]/15 text-[#16A34A] flex items-center justify-center font-bold mb-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#1E293B]">Official Email Inquiries</h2>
                            <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                                General: support@oilsupply-delivery.com<br />
                                Orders: dispatch@oilsupply-delivery.com
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-[#FFFFFF] shadow-md border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-left">
                    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Authenticated Realtime Communication</h2>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-6">
                        To maintain secure and verified supply chain dispatches, live chat and instant inquiries are exclusively accessible to authenticated accounts (Customers, Dealers, Suppliers, Delivery Fleet, and Administrators) via the Dashboard.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <h3 className="text-sm font-bold text-[#1E293B]">Already have an account?</h3>
                            <p className="text-xs text-[#64748B] mt-1 mb-3">
                                Sign in to access the Realtime Dispatch Chat tab, track active orders, and message operations staff directly.
                            </p>
                            <Link
                                href="/login"
                                className="btn btn-sm bg-[#0F2747] text-white hover:bg-[#1E3A8A] border-none rounded-lg"
                            >
                                Sign In Now
                            </Link>
                        </div>

                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <h3 className="text-sm font-bold text-[#1E293B]">New to the platform?</h3>
                            <p className="text-xs text-[#64748B] mt-1 mb-3">
                                Register as a Customer, Dealer, or Supplier to start ordering fuel products and communicating with suppliers.
                            </p>
                            <Link
                                href="/registration"
                                className="btn btn-sm bg-[#F59E0B] text-[#1E293B] hover:bg-[#D97706] border-none rounded-lg font-bold"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}