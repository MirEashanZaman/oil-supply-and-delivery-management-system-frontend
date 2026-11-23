import Link from "next/link";
import { connection } from "next/server";
import MyNavigation from "@/components/navigation";
import MyHeader from "@/components/header";

export default async function NotFound() {
    await connection();

    return (
        <>
            <MyHeader name="404" message="Page not found" />
            <MyNavigation />

            <div className="mt-10 w-full max-w-[500px] bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center">
                <p className="font-mono tabular-nums text-[#DC2626] text-5xl font-semibold mb-3">404</p>
                <h2 className="text-[#111827] text-xl font-medium mb-3">Page not found</h2>
                <p className="text-sm text-[#4B5565] mb-6 leading-relaxed">
                    The requested route does not exist or has moved to another terminal address.
                </p>
                <Link
                    href="/"
                    className="bg-[#0F2747] text-white no-underline py-2.5 px-5 rounded-lg font-medium text-sm hover:bg-[#163860] transition-colors inline-block"
                >
                    Back to Home
                </Link>
            </div>
        </>
    );
}
