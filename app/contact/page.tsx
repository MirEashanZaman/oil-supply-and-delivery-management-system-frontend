import Link from "next/link";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";

export const dynamic = "force-static";

export default function ContactInfo() {
    return (
        <main className="w-full flex flex-col items-center" role="main">
            <MyHeader name="Contact" message="Central dispatch desk, terminal operations, and account support" />
            <MyNavigation />

            <div className="w-full max-w-[1240px] mt-6 space-y-6">
                <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                    <div className="card-body p-6 sm:p-8 text-left">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7487] mb-3">
                                <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                <span>Support & dispatch directory</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-[#111827] leading-tight">
                                Contact Directory & Support Operations
                            </h1>
                            <p className="mt-3 text-[#4B5565] text-sm sm:text-base leading-relaxed">
                                Reach our central dispatch coordinators, customer support engineers, and dealership onboarding desk across regional distribution terminals.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href="/login"
                                    className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium border-none rounded-lg px-5 h-11"
                                >
                                    Sign in to Dispatch Chat
                                </Link>
                                <Link
                                    href="/registration"
                                    className="btn bg-[#F5F7FA] text-[#111827] border border-[#CBD5E1] hover:bg-[#ECEFF4] rounded-lg px-5 h-11 font-medium"
                                >
                                    Register Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Central Headquarters</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1">
                                Oil Supply & Delivery Operations Center, Kuril, Dhaka-1229, Bangladesh
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Direct Phone Lines</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1 font-mono tabular-nums">
                                Support: +880 1700-000000<br />
                                Logistics: +880 1800-000000
                            </p>
                        </div>
                    </div>

                    <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl">
                        <div className="card-body p-6">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] text-[#4B5565] border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-medium text-[#111827]">Official Email Inquiries</h2>
                            <p className="text-xs text-[#4B5565] leading-relaxed mt-1">
                                General: support@oilsupply-delivery.com<br />
                                Orders: dispatch@oilsupply-delivery.com
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-left">
                    <h2 className="text-lg font-medium text-[#111827] mb-2">Authenticated Dispatch Communication</h2>
                    <p className="text-xs text-[#4B5565] leading-relaxed mb-6">
                        To keep supply chain dispatches verifiable, real-time chat and order inquiries are available to signed-in accounts (Customers, Dealers, Suppliers, Delivery Fleet, and Administrators) inside the Dashboard.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <h3 className="text-sm font-medium text-[#111827]">Existing account</h3>
                            <p className="text-xs text-[#4B5565] mt-1 mb-3">
                                Sign in to open the Realtime Dispatch Chat tab, inspect active shipments, and message terminal coordinators directly.
                            </p>
                            <Link
                                href="/login"
                                className="btn btn-sm bg-[#0F2747] text-white hover:bg-[#163860] border-none rounded-lg font-medium"
                            >
                                Sign in
                            </Link>
                        </div>

                        <div className="p-4 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
                            <h3 className="text-sm font-medium text-[#111827]">New participant</h3>
                            <p className="text-xs text-[#4B5565] mt-1 mb-3">
                                Register as a Customer, Dealer, Supplier, or Delivery Driver to place fuel orders and coordinate dispatches.
                            </p>
                            <Link
                                href="/registration"
                                className="btn btn-sm bg-[#F59E0B] text-[#111827] hover:bg-[#D97706] border-none rounded-lg font-medium"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
