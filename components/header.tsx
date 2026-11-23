import Image from "next/image";

export default function MyHeader(props: { name: string; message: string }) {
    return (
        <header className="w-full max-w-[1240px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 pb-5 text-left border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
                <Image
                    src="/LOGO.webp"
                    alt="Oil Supply & Delivery Management System Logo"
                    width={48}
                    height={48}
                    priority
                    className="object-contain rounded-lg"
                />
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                        <span className="text-xs font-medium text-[#6B7487]">
                            Petroleum logistics & custody transfer
                        </span>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-[#0F2747] leading-snug">
                        Oil Supply & Delivery Management System
                    </p>
                </div>
            </div>

            <div className="sm:text-right">
                <h1 className="text-xl sm:text-2xl font-medium text-[#111827] leading-tight">
                    {props.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#4B5565] max-w-md mt-1">
                    {props.message}
                </p>
            </div>
        </header>
    );
}
