"use client";

import React from "react";
import { Product, CartItem, SystemUser, UserData } from "../types";
import { getProductImage, getProductSourcingConfig } from "../utils";

interface CheckoutPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMultiCheckout: boolean;
    checkoutProduct: Product | null;
    cartItems: CartItem[];
    cartTotalItems: number;
    cartTotalAmount: number;
    bulkDiscountAmount?: number;
    bulkDiscountRate?: number;
    promoDiscountAmount?: number;
    appliedPromo?: string | null;
    promoCodeInput?: string;
    setPromoCodeInput?: (val: string) => void;
    promoError?: string | null;
    onApplyPromo?: (code: string) => void;
    onRemovePromo?: () => void;
    orderQuantity: number;
    setOrderQuantity: (qty: number) => void;
    sourcingChoice: "supplier" | "dealer";
    setSourcingChoice: (choice: "supplier" | "dealer") => void;
    selectedPartyId: number | string;
    setSelectedPartyId: (id: number | string) => void;
    availableSuppliers: SystemUser[];
    availableDealers: SystemUser[];
    deliveryAddress: string;
    setDeliveryAddress: (addr: string) => void;
    user: UserData | null;
    paymentMethod: "card" | "mobile" | "bank";
    setPaymentMethod: (m: "card" | "mobile" | "bank") => void;
    cardType: string;
    setCardType: (t: string) => void;
    cardNumber: string;
    setCardNumber: (n: string) => void;
    cardExpiry: string;
    setCardExpiry: (e: string) => void;
    cardCvv: string;
    setCardCvv: (c: string) => void;
    cardHolder: string;
    setCardHolder: (h: string) => void;
    mobileOperator: string;
    setMobileOperator: (op: string) => void;
    mobileWalletNumber: string;
    setMobileWalletNumber: (w: string) => void;
    bankName: string;
    setBankName: (b: string) => void;
    bankAccountNumber: string;
    setBankAccountNumber: (a: string) => void;
    onApplyCardPreset: (type: "Visa" | "MasterCard" | "Amex") => void;
    onApplyMobilePreset: (op: "bKash" | "Nagad" | "Rocket") => void;
    onLaunchSandboxGateway: () => void;
    onReturnToCart: () => void;
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
    isOpen,
    onClose,
    isMultiCheckout,
    checkoutProduct,
    cartItems,
    cartTotalItems,
    cartTotalAmount,
    bulkDiscountAmount = 0,
    bulkDiscountRate = 0,
    promoDiscountAmount = 0,
    appliedPromo = null,
    promoCodeInput = "",
    setPromoCodeInput,
    promoError = null,
    onApplyPromo,
    onRemovePromo,
    orderQuantity,
    setOrderQuantity,
    sourcingChoice,
    setSourcingChoice,
    selectedPartyId,
    setSelectedPartyId,
    availableSuppliers,
    availableDealers,
    deliveryAddress,
    setDeliveryAddress,
    user,
    paymentMethod,
    setPaymentMethod,
    cardType,
    setCardType,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCvv,
    setCardCvv,
    cardHolder,
    setCardHolder,
    mobileOperator,
    setMobileOperator,
    mobileWalletNumber,
    setMobileWalletNumber,
    bankName,
    setBankName,
    bankAccountNumber,
    setBankAccountNumber,
    onApplyCardPreset,
    onApplyMobilePreset,
    onLaunchSandboxGateway,
    onReturnToCart,
}) => {
    if (!isOpen) return null;

    const sourcingConfig = getProductSourcingConfig(checkoutProduct, availableSuppliers, availableDealers);
    const {
        allowedSuppliers,
        allowedDealers,
        canChooseBetweenSupplierAndDealer,
        sourcingNotice,
        posterParty,
        posterRole,
    } = sourcingConfig;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-[650px] max-h-[90vh] overflow-y-auto text-left p-6 md:p-8">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4 mb-5">
                    <div>
                        <h2 className="text-xl font-medium text-[#111827]">
                            {isMultiCheckout ? "Multi-Product Consolidated Checkout" : "Petroleum Checkout & Sourcing"}
                        </h2>
                        <p className="text-xs text-[#4B5565] mt-0.5">
                            {isMultiCheckout
                                ? `Select payment method for ${cartItems.length} petroleum items (${cartTotalItems} total units).`
                                : "Select preferred payment option and verified distribution sourcing."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#7A8395] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isMultiCheckout ? (
                    <div className="bg-[#F8F9FB] p-4 rounded-xl border border-[#E2E8F0] mb-5 space-y-3">
                        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                            <span className="text-xs font-medium text-[#111827]">
                                Selected Cart Items ({cartItems.length})
                            </span>
                            <button
                                type="button"
                                onClick={onReturnToCart}
                                className="text-[#0F2747] hover:underline font-medium text-xs cursor-pointer"
                            >
                                ← Edit Cart & Sourcing
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {cartItems.map((ci) => (
                                <div key={ci.product.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F2F4F7] shrink-0 border border-[#E2E8F0]">
                                            <img
                                                src={ci.product.image || getProductImage(ci.product.name, ci.product.image, ci.product.id)}
                                                alt={ci.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-medium text-[#111827] truncate">{ci.product.name}</h5>
                                            <p className="text-xs text-[#4B5565] truncate">
                                                From: <strong className="text-[#111827] font-medium">{ci.sourcingChoice === "supplier" ? "Refinery Supplier" : "Local Dealer"}</strong> · Site: <strong className="text-[#111827] font-medium">{deliveryAddress || ci.deliveryAddress || user?.address || "Main Depot"}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 font-mono tabular-nums">
                                        <span className="font-medium text-[#111827] block">{ci.quantity} × {ci.product.price}</span>
                                        <span className="font-semibold text-[#0F2747] text-xs">${(ci.product.numericPrice * ci.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {bulkDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium border border-emerald-200 mt-2">
                                <span>Bulk volume discount ({Math.round(bulkDiscountRate * 100)}% off)</span>
                                <span className="font-mono tabular-nums font-medium">-${bulkDiscountAmount.toFixed(2)} USD</span>
                            </div>
                        )}
                        {promoDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg font-medium border border-amber-200 mt-1">
                                <span>Promo discount ({appliedPromo})</span>
                                <span className="font-mono tabular-nums font-medium">-${promoDiscountAmount.toFixed(2)} USD</span>
                            </div>
                        )}
                        <div className="border-t border-[#E2E8F0] pt-2 mt-2 flex justify-between items-center text-xs">
                            <span className="font-medium text-[#111827]">Total consolidated amount</span>
                            <span className="text-base font-mono tabular-nums font-semibold text-[#0F2747]">${cartTotalAmount.toFixed(2)} USD</span>
                        </div>
                    </div>
                ) : (
                    checkoutProduct && (
                        <>
                            <div className="bg-[#F8F9FB] p-4 rounded-xl border border-[#E2E8F0] mb-5 flex flex-col gap-3">
                                <div className="flex gap-4 items-center">
                                    <img
                                        src={checkoutProduct.image || getProductImage(checkoutProduct.name, checkoutProduct.image, checkoutProduct.id)}
                                        alt={checkoutProduct.name}
                                        className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src = getProductImage(checkoutProduct.name, undefined, checkoutProduct.id);
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-medium text-[#4B5565]">{checkoutProduct.category}</span>
                                                <h3 className="text-base font-medium text-[#111827]">{checkoutProduct.name}</h3>
                                                <p className="text-xs font-mono tabular-nums text-[#4B5565]">{checkoutProduct.price}</p>
                                            </div>
                                            <div className="text-right">
                                                <label className="block text-xs font-medium text-[#111827] mb-1">
                                                    Quantity {checkoutProduct.quantity !== undefined ? `(Stock: ${checkoutProduct.quantity})` : ""}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={checkoutProduct.quantity !== undefined ? String(checkoutProduct.quantity) : "100"}
                                                    value={orderQuantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 1;
                                                        const stock = Number(checkoutProduct.quantity ?? checkoutProduct.stock ?? 100);
                                                        if (val > stock) {
                                                            alert("Not enough stock");
                                                            setOrderQuantity(Math.max(1, stock));
                                                        } else {
                                                            setOrderQuantity(Math.max(1, val));
                                                        }
                                                    }}
                                                    className="w-20 p-1.5 border border-[#E2E8F0] rounded-lg text-center font-mono tabular-nums font-medium bg-white text-[#111827] outline-none focus:border-[#0F2747]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const singleSubtotal = checkoutProduct.numericPrice * orderQuantity;
                                    const singleBulkRate = orderQuantity >= 100 ? 0.15 : orderQuantity >= 50 ? 0.10 : orderQuantity >= 20 ? 0.05 : 0;
                                    const singleBulkDisc = Number((singleSubtotal * singleBulkRate).toFixed(2));
                                    const singlePromoDisc = promoDiscountAmount > 0 ? promoDiscountAmount : 0;
                                    const singleTotal = Math.max(0, singleSubtotal - singleBulkDisc - singlePromoDisc);

                                    return (
                                        <div className="border-t border-[#E2E8F0] pt-2 space-y-1.5 text-xs">
                                            <div className="flex justify-between text-[#4B5565]">
                                                <span>Subtotal</span>
                                                <span className="font-mono tabular-nums font-medium text-[#111827]">${singleSubtotal.toFixed(2)} USD</span>
                                            </div>
                                            {singleBulkDisc > 0 && (
                                                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-200">
                                                    <span>Bulk volume discount ({Math.round(singleBulkRate * 100)}% off {orderQuantity}+ units)</span>
                                                    <span className="font-mono tabular-nums font-medium">-${singleBulkDisc.toFixed(2)} USD</span>
                                                </div>
                                            )}
                                            {singlePromoDisc > 0 && (
                                                <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-200">
                                                    <span>Promo discount ({appliedPromo})</span>
                                                    <span className="font-mono tabular-nums font-medium">-${singlePromoDisc.toFixed(2)} USD</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                                                <span className="text-xs font-medium text-[#111827]">Total payable</span>
                                                <span className="text-base font-mono tabular-nums font-semibold text-[#0F2747]">
                                                    ${singleTotal.toFixed(2)} USD
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mb-4 bg-[#F8F9FB] p-3 rounded-xl border border-[#E2E8F0] text-xs">
                                <label className="block text-xs font-medium text-[#111827] mb-1">
                                    Promo code <span className="font-normal text-[#4B5565]">(OIL10, PETRO20, WELCOME50)</span>
                                </label>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-medium">
                                        <span>Coupon applied: <strong>{appliedPromo}</strong></span>
                                        {onRemovePromo && (
                                            <button
                                                type="button"
                                                onClick={onRemovePromo}
                                                className="text-red-600 hover:text-red-800 underline text-xs font-medium cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput && setPromoCodeInput(e.target.value)}
                                            placeholder="OIL10"
                                            className="flex-1 p-2 border border-[#E2E8F0] rounded-lg text-xs font-mono font-medium bg-white text-[#111827] focus:border-[#0F2747] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onApplyPromo && onApplyPromo(promoCodeInput)}
                                            className="px-4 py-2 bg-[#0F2747] hover:bg-[#163860] text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                                {promoError && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{promoError}</p>
                                )}
                            </div>

                            <div className="mb-5">
                                <label className="block text-xs font-medium text-[#111827] mb-1">
                                    Sourcing channel & distribution origin
                                </label>

                                {canChooseBetweenSupplierAndDealer ? (
                                    <>
                                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-3 font-medium">
                                            {sourcingNotice}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSourcingChoice("supplier");
                                                    if (allowedSuppliers.length > 0) setSelectedPartyId(allowedSuppliers[0].id);
                                                }}
                                                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${sourcingChoice === "supplier"
                                                    ? "border-[#0F2747] bg-blue-50/50"
                                                    : "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB]"
                                                    }`}
                                            >
                                                <span className="block font-medium text-xs text-[#111827]">Refinery Supplier</span>
                                                <span className="block text-xs text-[#4B5565]">{allowedSuppliers[0]?.userName || "Refinery Direct"}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSourcingChoice("dealer");
                                                    if (allowedDealers.length > 0) setSelectedPartyId(allowedDealers[0].id);
                                                }}
                                                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${sourcingChoice === "dealer"
                                                    ? "border-[#0F2747] bg-blue-50/50"
                                                    : "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB]"
                                                    }`}
                                            >
                                                <span className="block font-medium text-xs text-[#111827]">Authorized Dealer</span>
                                                <span className="block text-xs text-[#4B5565]">{allowedDealers.length} profile dealer(s)</span>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-[#4B5565] mb-1">
                                                Selected {sourcingChoice === "supplier" ? "supplier partner" : "dealer profile"}
                                            </label>
                                            <select
                                                value={selectedPartyId}
                                                onChange={(e) => setSelectedPartyId(Number(e.target.value))}
                                                className="w-full p-2.5 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                            >
                                                {sourcingChoice === "supplier" ? (
                                                    allowedSuppliers.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.userName || s.username || `Supplier #${s.id}`} ({s.email || "Verified"})
                                                        </option>
                                                    ))
                                                ) : (
                                                    allowedDealers.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.userName || d.username || `Dealer #${d.id}`} ({d.email || "Profile Verified"})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FB] space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-[#111827] flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                {posterRole === "supplier" ? "Direct Refinery Supplier Fulfillment" : "Direct Dealer Lot Fulfillment"}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                                {posterRole === "supplier" ? "Refinery Direct" : "Dealer Original"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#4B5565] leading-relaxed">
                                            {sourcingNotice}
                                        </p>
                                        <p className="text-xs font-medium text-[#0F2747] pt-1">
                                            Fulfilling party: {posterParty.userName} ({posterParty.email})
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-5">
                                <label className="block text-xs font-medium text-[#111827] mb-1">Delivery destination address</label>
                                <input
                                    type="text"
                                    value={deliveryAddress}
                                    placeholder="Delivery address"
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full p-2.5 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                />
                            </div>
                        </>
                    )
                )}

                <div className="border-t border-[#E2E8F0] pt-4 mb-5">
                    <div className="bg-[#F8F9FB] border border-[#E2E8F0] p-3 rounded-xl mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0"></span>
                            <div>
                                <span className="text-xs font-medium text-[#111827] block">Sandbox Payment Gateway Active</span>
                                <span className="text-xs text-[#4B5565] block">Safe test environment. Simulates real-time card and mobile banking authorization.</span>
                            </div>
                        </div>
                        <span className="text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                            Sandbox
                        </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${paymentMethod === "card"
                                ? "bg-[#0F2747] text-white"
                                : "bg-[#F2F4F7] text-[#4B5565] hover:bg-[#E2E8F0] hover:text-[#111827]"
                                }`}
                        >
                            Credit / Debit Card
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("mobile")}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${paymentMethod === "mobile"
                                ? "bg-[#0F2747] text-white"
                                : "bg-[#F2F4F7] text-[#4B5565] hover:bg-[#E2E8F0] hover:text-[#111827]"
                                }`}
                        >
                            Mobile Banking
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("bank")}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${paymentMethod === "bank"
                                ? "bg-[#0F2747] text-white"
                                : "bg-[#F2F4F7] text-[#4B5565] hover:bg-[#E2E8F0] hover:text-[#111827]"
                                }`}
                        >
                            Bank Transfer
                        </button>
                    </div>

                    {paymentMethod === "card" && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F8F9FB] rounded-xl border border-[#E2E8F0]">
                                <span className="text-xs font-medium text-[#4B5565] mr-1">Autofill test cards:</span>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("Visa")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    Visa Test Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("MasterCard")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    MasterCard Test
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("Amex")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    Amex Test
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Card network</label>
                                    <select
                                        value={cardType}
                                        onChange={(e) => setCardType(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                    >
                                        <option value="Visa">Visa (Sandbox)</option>
                                        <option value="MasterCard">MasterCard (Sandbox)</option>
                                        <option value="American Express">American Express (Sandbox)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Cardholder name</label>
                                    <input
                                        type="text"
                                        value={cardHolder}
                                        placeholder="Cardholder name"
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#4B5565] mb-1">Sandbox card number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    placeholder="4242 4242 4242 4242"
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none font-mono tabular-nums focus:border-[#0F2747]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Expiry date</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        placeholder="MM/YY"
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none text-center font-mono tabular-nums focus:border-[#0F2747]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">CVV security code</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={cardCvv}
                                        placeholder="CVV"
                                        onChange={(e) => setCardCvv(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none text-center font-mono tabular-nums focus:border-[#0F2747]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === "mobile" && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F8F9FB] rounded-xl border border-[#E2E8F0]">
                                <span className="text-xs font-medium text-[#4B5565] mr-1">Autofill test wallets:</span>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("bKash")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    bKash Sandbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("Nagad")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    Nagad Sandbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("Rocket")}
                                    className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:border-[#0F2747] text-[#111827] rounded-lg text-xs font-medium cursor-pointer"
                                >
                                    Rocket Sandbox
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">MFS provider</label>
                                    <select
                                        value={mobileOperator}
                                        onChange={(e) => setMobileOperator(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                    >
                                        <option value="bKash">bKash (Sandbox)</option>
                                        <option value="Nagad">Nagad (Sandbox)</option>
                                        <option value="Rocket">Rocket (Sandbox)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Test wallet number</label>
                                    <input
                                        type="text"
                                        value={mobileWalletNumber}
                                        placeholder="017XXXXXXXX"
                                        onChange={(e) => setMobileWalletNumber(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none font-mono tabular-nums focus:border-[#0F2747]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === "bank" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Issuing bank</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none focus:border-[#0F2747]"
                                    >
                                        <option value="Eastern Bank Limited">Eastern Bank Limited</option>
                                        <option value="City Bank Bangladesh">City Bank Bangladesh</option>
                                        <option value="BRAC Bank Limited">BRAC Bank Limited</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#4B5565] mb-1">Corporate account number</label>
                                    <input
                                        type="text"
                                        value={bankAccountNumber}
                                        placeholder="Account number"
                                        onChange={(e) => setBankAccountNumber(e.target.value)}
                                        className="w-full p-2 border border-[#E2E8F0] rounded-lg bg-white text-[#111827] text-xs outline-none font-mono tabular-nums focus:border-[#0F2747]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={isMultiCheckout ? onReturnToCart : onClose}
                        className="w-1/3 py-3 rounded-lg border border-[#E2E8F0] text-[#111827] font-medium text-xs sm:text-sm hover:bg-[#F8F9FB] transition-colors cursor-pointer"
                    >
                        {isMultiCheckout ? "Return to Cart" : "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={onLaunchSandboxGateway}
                        className="w-2/3 py-3 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#111827] font-medium text-xs sm:text-sm transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>
                            Proceed to Sandbox Payment (<span className="font-mono tabular-nums">${(isMultiCheckout ? cartTotalAmount : (checkoutProduct ? checkoutProduct.numericPrice * orderQuantity : 0)).toFixed(2)}</span>)
                        </span>
                    </button>
                </div>

                <p className="text-xs text-center text-[#4B5565] pt-2">
                    By confirming this order, you agree to our{" "}
                    <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0F2747] font-medium underline hover:text-[#163860]"
                    >
                        Terms of Supply & Delivery
                    </a>{" "}
                    and 4-digit e-POD custody transfer protocols.
                </p>
            </div>
        </div>
    );
};
