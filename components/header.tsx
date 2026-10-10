import Image from "next/image";

export default function MyHeader(props: { name: string; message: string }) {
    return (
        <header className="w-full flex flex-col items-center justify-center pt-2 pb-6 text-center">
            <div className="flex items-center gap-3 mb-2">
                <Image
                    src="/LOGO.png"
                    alt="Oil Supply & Delivery Management System Logo"
                    width={56}
                    height={56}
                    priority
                    className="object-contain"
                />
                <div className="text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] block">
                        Enterprise Portal
                    </span>
                    <p className="text-lg sm:text-xl font-black text-[#0F2747] leading-tight">
                        Oil Supply & Delivery Management System
                    </p>
                </div>
            </div>

            <div className="mt-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                    {props.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mt-1">
                    {props.message}
                </p>
            </div>
        </header>
    );
}