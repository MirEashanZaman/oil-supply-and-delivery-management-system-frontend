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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-card-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-[650px] max-h-[90vh] overflow-y-auto text-left p-6 md:p-8">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4 mb-5">
                    <div>
                        <h2 className="text-xl font-extrabold text-dark-slate">
                            {isMultiCheckout ? "Multi-Product Consolidated Checkout" : "Petroleum Checkout & Sourcing"}
                        </h2>
                        <p className="text-xs text-secondary-gray">
                            {isMultiCheckout
                                ? `Select payment method for ${cartItems.length} petroleum items (${cartTotalItems} total units).`
                                : "Select preferred payment option and verified distribution sourcing."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-dark-slate p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                { }
                {isMultiCheckout ? (
                    <div className="bg-[#FAFBFD] p-4 rounded-xl border border-[#E2E8F0] mb-5 space-y-3">
                        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                            <span className="text-xs font-bold text-dark-slate uppercase tracking-wider">
                                Selected Cart Items ({cartItems.length})
                            </span>
                            <button
                                type="button"
                                onClick={onReturnToCart}
                                className="text-primary hover:underline font-bold text-xs cursor-pointer"
                            >
                                ← Edit Cart & Sourcing
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {cartItems.map((ci) => (
                                <div key={ci.product.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                            <img
                                                src={ci.product.image || getProductImage(ci.product.name, ci.product.image, ci.product.id)}
                                                alt={ci.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h5 className="font-bold text-dark-slate truncate">{ci.product.name}</h5>
                                            <p className="text-[11px] text-secondary-gray truncate">
                                                From: <strong className="text-dark-slate">{ci.sourcingChoice === "supplier" ? "Refinery Supplier" : "Local Dealer"}</strong> • Site: <strong className="text-dark-slate">{deliveryAddress || ci.deliveryAddress || user?.address || "Main Depot"}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-bold text-dark-slate block">{ci.quantity} × {ci.product.price}</span>
                                        <span className="font-black text-primary text-xs">${(ci.product.numericPrice * ci.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {bulkDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium border border-emerald-200 mt-2">
                                <span>Bulk Volume Discount ({Math.round(bulkDiscountRate * 100)}% off):</span>
                                <span className="font-bold">-${bulkDiscountAmount.toFixed(2)} USD</span>
                            </div>
                        )}
                        {promoDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg font-medium border border-amber-200 mt-1">
                                <span>Promo Discount ({appliedPromo}):</span>
                                <span className="font-bold">-${promoDiscountAmount.toFixed(2)} USD</span>
                            </div>
                        )}
                        <div className="border-t border-[#E2E8F0] pt-2 mt-2 flex justify-between items-center text-xs">
                            <span className="font-bold text-dark-slate">Total Consolidated Amount:</span>
                            <span className="text-base font-extrabold text-primary">${cartTotalAmount.toFixed(2)} USD</span>
                        </div>
                    </div>
                ) : (

                    checkoutProduct && (
                        <>
                            <div className="bg-[#FAFBFD] p-4 rounded-xl border border-[#E2E8F0] mb-5 flex flex-col gap-3">
                                <div className="flex gap-4 items-center">
                                    <img
                                        src={checkoutProduct.image || getProductImage(checkoutProduct.name, checkoutProduct.image, checkoutProduct.id)}
                                        alt={checkoutProduct.name}
                                        className="w-16 h-16 rounded-xl object-cover border border-[#CBD5E1] shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src = getProductImage(checkoutProduct.name, undefined, checkoutProduct.id);
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-secondary-gray uppercase">{checkoutProduct.category}</span>
                                                <h3 className="text-base font-bold text-dark-slate">{checkoutProduct.name}</h3>
                                                <p className="text-xs text-secondary-gray">{checkoutProduct.price}</p>
                                            </div>
                                            <div className="text-right">
                                                <label className="block text-xs font-bold text-dark-slate mb-1">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={orderQuantity}
                                                    onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-20 p-1.5 border border-secondary-gray rounded-lg text-center font-bold bg-white text-dark-slate outline-none"
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
                                        <div className="border-t border-gray-200 pt-2 space-y-1.5 text-xs">
                                            <div className="flex justify-between text-secondary-gray">
                                                <span>Subtotal:</span>
                                                <span className="font-bold text-dark-slate">${singleSubtotal.toFixed(2)} USD</span>
                                            </div>
                                            {singleBulkDisc > 0 && (
                                                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium border border-emerald-200">
                                                    <span>Bulk Volume Discount ({Math.round(singleBulkRate * 100)}% off {orderQuantity}+ units):</span>
                                                    <span className="font-bold">-${singleBulkDisc.toFixed(2)} USD</span>
                                                </div>
                                            )}
                                            {singlePromoDisc > 0 && (
                                                <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-200">
                                                    <span>Promo Discount ({appliedPromo}):</span>
                                                    <span className="font-bold">-${singlePromoDisc.toFixed(2)} USD</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                                <span className="text-xs font-semibold text-dark-slate">Total Payable:</span>
                                                <span className="text-base font-extrabold text-primary">
                                                    ${singleTotal.toFixed(2)} USD
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Promo Code Input in single checkout */}
                            <div className="mb-4 bg-[#FAFBFD] p-3 rounded-xl border border-[#E2E8F0] text-xs">
                                <label className="block text-[11px] font-bold text-dark-slate mb-1">
                                    Have a Promo Code? <span className="font-normal text-secondary-gray">(OIL10, PETRO20, WELCOME50)</span>
                                </label>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-bold">
                                        <span>✓ Coupon applied: <strong>{appliedPromo}</strong></span>
                                        {onRemovePromo && (
                                            <button
                                                type="button"
                                                onClick={onRemovePromo}
                                                className="text-red-600 hover:text-red-800 underline text-[11px] font-semibold cursor-pointer"
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
                                            placeholder="Enter coupon code (e.g. OIL10)"
                                            className="flex-1 p-2 border border-[#E2E8F0] rounded-lg text-xs font-medium bg-white text-dark-slate uppercase focus:border-[#F59E0B] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onApplyPromo && onApplyPromo(promoCodeInput)}
                                            className="px-4 py-2 bg-[#0F2747] hover:bg-[#163860] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                                {promoError && (
                                    <p className="text-[11px] text-red-600 mt-1 font-semibold">{promoError}</p>
                                )}
                            </div>

                            <div className="mb-5">
                                <label className="block text-xs font-bold text-dark-slate mb-1">
                                    Sourcing Channel & Distribution Origin:
                                </label>

                                {canChooseBetweenSupplierAndDealer ? (
                                    <>
                                        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-3 font-medium">
                                            {sourcingNotice}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSourcingChoice("supplier");
                                                    if (allowedSuppliers.length > 0) setSelectedPartyId(allowedSuppliers[0].id);
                                                }}
                                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${sourcingChoice === "supplier"
                                                    ? "border-primary bg-blue-50/50 ring-2 ring-primary/20"
                                                    : "border-[#E2E8F0] bg-white hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span className="block font-bold text-xs text-dark-slate">Refinery Supplier</span>
                                                <span className="block text-[11px] text-secondary-gray">{allowedSuppliers[0]?.userName || "Refinery Direct"}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSourcingChoice("dealer");
                                                    if (allowedDealers.length > 0) setSelectedPartyId(allowedDealers[0].id);
                                                }}
                                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${sourcingChoice === "dealer"
                                                    ? "border-primary bg-blue-50/50 ring-2 ring-primary/20"
                                                    : "border-[#E2E8F0] bg-white hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span className="block font-bold text-xs text-dark-slate">Authorized Dealer</span>
                                                <span className="block text-[11px] text-secondary-gray">{allowedDealers.length} profile dealer(s)</span>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-secondary-gray mb-1">
                                                Selected {sourcingChoice === "supplier" ? "Supplier Partner" : "Dealer Profile"}:
                                            </label>
                                            <select
                                                value={selectedPartyId}
                                                onChange={(e) => setSelectedPartyId(Number(e.target.value))}
                                                className="w-full p-2.5 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
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
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-dark-slate flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                                {posterRole === "supplier" ? "Direct Refinery Supplier Fulfillment" : "Direct Dealer Lot Fulfillment"}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                                {posterRole === "supplier" ? "Refinery Direct" : "Dealer Original"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-secondary-gray leading-relaxed">
                                            {sourcingNotice}
                                        </p>
                                        <p className="text-xs font-bold text-primary pt-1">
                                            Fulfilling Party: {posterParty.userName} ({posterParty.email})
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-5">
                                <label className="block text-xs font-bold text-dark-slate mb-1">Delivery Destination Address</label>
                                <input
                                    type="text"
                                    value={deliveryAddress}
                                    placeholder="Enter your delivery address"
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full p-2.5 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
                                />
                            </div>
                        </>
                    )
                )}

                <div className="border-t border-[#E2E8F0] pt-4 mb-5">
                    <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/20 p-3 rounded-xl mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0"></span>
                            <div>
                                <span className="text-xs font-bold text-[#0F172A] block">Sandbox Payment Gateway Active</span>
                                <span className="text-[11px] text-[#64748B] block">Safe test environment. Simulates real-time card and mobile banking authorization.</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30 px-2 py-0.5 rounded uppercase shrink-0">
                            Sandbox
                        </span>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${paymentMethod === "card"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-[#F1F5F9] text-secondary-gray hover:bg-[#E2E8F0] hover:text-dark-slate"
                                }`}
                        >
                            Credit / Debit Card
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("mobile")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${paymentMethod === "mobile"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-[#F1F5F9] text-secondary-gray hover:bg-[#E2E8F0] hover:text-dark-slate"
                                }`}
                        >
                            Mobile Banking
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("bank")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${paymentMethod === "bank"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-[#F1F5F9] text-secondary-gray hover:bg-[#E2E8F0] hover:text-dark-slate"
                                }`}
                        >
                            Bank Transfer
                        </button>
                    </div>

                    {paymentMethod === "card" && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                <span className="text-[11px] font-bold text-secondary-gray mr-1">Autofill Test Cards:</span>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("Visa")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    Visa Test Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("MasterCard")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    MasterCard Test
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyCardPreset("Amex")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    Amex Test
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Card Network</label>
                                    <select
                                        value={cardType}
                                        onChange={(e) => setCardType(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
                                    >
                                        <option value="Visa">Visa (Sandbox)</option>
                                        <option value="MasterCard">MasterCard (Sandbox)</option>
                                        <option value="American Express">American Express (Sandbox)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={cardHolder}
                                        placeholder="Enter your cardholder name"
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-secondary-gray mb-1">Sandbox Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    placeholder="Enter card number"
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Expiry Date</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        placeholder="Enter your expiry date"
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">CVV Security Code</label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={cardCvv}
                                        placeholder="Enter your CVV"
                                        onChange={(e) => setCardCvv(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none text-center font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === "mobile" && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                <span className="text-[11px] font-bold text-secondary-gray mr-1">Autofill Test Wallets:</span>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("bKash")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    bKash Sandbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("Nagad")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    Nagad Sandbox
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onApplyMobilePreset("Rocket")}
                                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-primary text-dark-slate rounded-lg text-[11px] font-semibold cursor-pointer"
                                >
                                    Rocket Sandbox
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">MFS Provider</label>
                                    <select
                                        value={mobileOperator}
                                        onChange={(e) => setMobileOperator(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
                                    >
                                        <option value="bKash">bKash (Sandbox)</option>
                                        <option value="Nagad">Nagad (Sandbox)</option>
                                        <option value="Rocket">Rocket (Sandbox)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Test Wallet Number</label>
                                    <input
                                        type="text"
                                        value={mobileWalletNumber}
                                        placeholder="Enter your mobile number"
                                        onChange={(e) => setMobileWalletNumber(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === "bank" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Issuing Bank</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none"
                                    >
                                        <option value="Eastern Bank Limited">Eastern Bank Limited</option>
                                        <option value="City Bank Bangladesh">City Bank Bangladesh</option>
                                        <option value="BRAC Bank Limited">BRAC Bank Limited</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-secondary-gray mb-1">Corporate Account Number</label>
                                    <input
                                        type="text"
                                        value={bankAccountNumber}
                                        placeholder="Enter your bank account number"
                                        onChange={(e) => setBankAccountNumber(e.target.value)}
                                        className="w-full p-2 border border-secondary-gray rounded-xl bg-white text-dark-slate text-xs outline-none font-mono"
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
                        className="w-1/3 py-3 rounded-xl border border-secondary-gray text-dark-slate font-semibold text-xs sm:text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {isMultiCheckout ? "Return to Cart" : "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={onLaunchSandboxGateway}
                        className="w-2/3 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm border-none flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>
                            Proceed to Sandbox Payment (${(isMultiCheckout ? cartTotalAmount : (checkoutProduct ? checkoutProduct.numericPrice * orderQuantity : 0)).toFixed(2)})
                        </span>
                    </button>
                </div>

                <p className="text-[11px] text-center text-[#64748B] pt-1">
                    By confirming this order, you agree to our{" "}
                    <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0F2747] font-bold underline hover:text-primary"
                    >
                        Terms of Supply & Delivery
                    </a>{" "}
                    and 4-digit e-POD custody transfer protocols.
                </p>
            </div>
        </div>
    );
};
