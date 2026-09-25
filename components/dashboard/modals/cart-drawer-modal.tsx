"use client";

import React from "react";
import { CartItem, Product, SystemUser } from "../types";
import { getProductImage, getProductSourcingConfig } from "../utils";

interface CartDrawerModalProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    cartTotalItems: number;
    cartSubtotal: number;
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
    availableSuppliers: SystemUser[];
    availableDealers: SystemUser[];
    deliveryAddress: string;
    onUpdateQty: (productId: number, newQty: number) => void;
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    onUpdateSourcing: (productId: number, choice: "supplier" | "dealer", partyId: number | string) => void;
    onUpdateAddress: (productId: number, address: string) => void;
    onProceedToPayment: () => void;
    onBrowseCatalog: () => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
    isOpen,
    onClose,
    cartItems,
    cartTotalItems,
    cartSubtotal,
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
    availableSuppliers,
    availableDealers,
    deliveryAddress,
    onUpdateQty,
    onRemoveItem,
    onClearCart,
    onUpdateSourcing,
    onUpdateAddress,
    onProceedToPayment,
    onBrowseCatalog,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
            <div className="bg-card-white rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-left">
                { }
                <div className="bg-[#0F2747] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-950">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                                    Petroleum Delivery Cart
                                </h3>
                                <span className="bg-[#F59E0B] text-[#1E293B] text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">
                                    {cartTotalItems} Barrels / Units
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Multi-product bulk procurement with dedicated pipeline & tanker routing
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-secondary-gray">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-dark-slate">Your Delivery Cart is Empty</h4>
                                <p className="text-xs text-secondary-gray mt-1">
                                    Add multiple fuel grades from the catalog to place consolidated multi-product dispatches.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onBrowseCatalog}
                                className="px-5 py-2.5 bg-primary hover:bg-[#163860] text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                                Browse Petroleum Catalog
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-secondary-gray border-b border-[#E2E8F0] pb-2">
                                <span className="font-bold text-dark-slate uppercase tracking-wider text-[11px]">
                                    Selected Fuel Items ({cartItems.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={onClearCart}
                                    className="text-error-red hover:underline font-bold cursor-pointer text-xs"
                                >
                                    Clear Cart
                                </button>
                            </div>

                            {cartItems.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="p-3.5 sm:p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-primary/40 transition-all shadow-xs space-y-3"
                                >
                                    { }
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                <img
                                                    src={item.product.image || getProductImage(item.product.name, item.product.image, item.product.id)}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-bold text-secondary-gray bg-slate-50 px-2 py-0.5 rounded border border-[#E2E8F0]">
                                                    {item.product.category || "Petroleum Grade"}
                                                </span>
                                                <h4 className="text-sm font-bold text-dark-slate truncate mt-0.5">{item.product.name}</h4>
                                                <p className="text-xs font-semibold text-primary">{item.product.price} / unit</p>
                                            </div>
                                        </div>

                                        { }
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-200 text-dark-slate font-bold cursor-pointer transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 sm:w-9 text-center text-xs font-bold text-dark-slate">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-200 text-dark-slate font-bold cursor-pointer transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="text-right min-w-[70px]">
                                                <span className="text-xs sm:text-sm font-black text-primary block">
                                                    ${(item.product.numericPrice * item.quantity).toFixed(2)}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onRemoveItem(item.product.id)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-error-red hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                                                title="Remove from cart"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    { }
                                    {(() => {
                                        const config = getProductSourcingConfig(item.product, availableSuppliers, availableDealers);
                                        return (
                                            <div className="bg-[#FAFBFD] p-2.5 sm:p-3 rounded-lg border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary-gray uppercase mb-1">
                                                        Sourcing Origin:
                                                    </label>
                                                    {config.canChooseBetweenSupplierAndDealer ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                            <select
                                                                value={item.sourcingChoice}
                                                                onChange={(e) => {
                                                                    const choice = e.target.value as "supplier" | "dealer";
                                                                    const defaultParty = choice === "supplier" ? (config.allowedSuppliers[0]?.id || 1) : (config.allowedDealers[0]?.id || 1);
                                                                    onUpdateSourcing(item.product.id, choice, defaultParty);
                                                                }}
                                                                className="w-full p-1.5 sm:p-2 border border-secondary-gray rounded-lg bg-white text-dark-slate text-xs font-medium outline-none focus:border-primary"
                                                            >
                                                                <option value="supplier">Refinery Supplier</option>
                                                                <option value="dealer">Profile Dealer</option>
                                                            </select>
                                                            <select
                                                                value={item.selectedPartyId}
                                                                onChange={(e) => onUpdateSourcing(item.product.id, item.sourcingChoice, e.target.value)}
                                                                className="w-full p-1.5 sm:p-2 border border-secondary-gray rounded-lg bg-white text-dark-slate text-xs font-medium outline-none focus:border-primary truncate"
                                                            >
                                                                {item.sourcingChoice === "supplier"
                                                                    ? config.allowedSuppliers.map((s) => (
                                                                        <option key={s.id} value={s.id}>
                                                                            {s.userName || `Supplier #${s.id}`}
                                                                        </option>
                                                                    ))
                                                                    : config.allowedDealers.map((d) => (
                                                                        <option key={d.id} value={d.id}>
                                                                            {d.userName || `Dealer #${d.id}`}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                                                            <span className="font-bold text-dark-slate block text-[11px]">
                                                                {config.posterRole === "supplier" ? "Refinery Supplier:" : "Exclusive Dealer:"}{" "}
                                                                {config.posterParty.userName}
                                                            </span>
                                                            <span className="text-[10px] text-secondary-gray block">
                                                                {config.posterRole === "supplier" ? "Direct supplier fulfillment (no dealers linked)" : "Direct dealer fulfillment"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary-gray uppercase mb-1">
                                                        Delivery Site:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.deliveryAddress || deliveryAddress || ""}
                                                        onChange={(e) => onUpdateAddress(item.product.id, e.target.value)}
                                                        placeholder="Enter your delivery address"
                                                        className="w-full p-1.5 sm:p-2 border border-secondary-gray rounded-lg bg-white text-dark-slate text-xs font-medium outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}

                    { }
                    {cartItems.length > 0 && (
                        <div className="bg-[#FAFBFD] p-4 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
                            <h4 className="font-bold text-dark-slate text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                                Consolidated Multi-Delivery Logistics Summary
                            </h4>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-secondary-gray">
                                    <span>Procurement Items:</span>
                                    <span className="font-bold text-dark-slate">{cartItems.length} Petroleum Grades</span>
                                </div>
                                <div className="flex justify-between text-secondary-gray">
                                    <span>Total Fuel Quantity:</span>
                                    <span className="font-bold text-dark-slate">{cartTotalItems} Barrels / Units</span>
                                </div>
                                <div className="flex justify-between text-secondary-gray">
                                    <span>Subtotal:</span>
                                    <span className="font-bold text-dark-slate">${cartSubtotal.toFixed(2)} USD</span>
                                </div>

                                {bulkDiscountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium border border-emerald-200">
                                        <span>Bulk Volume Discount ({Math.round(bulkDiscountRate * 100)}% off {cartTotalItems}+ units):</span>
                                        <span className="font-bold">-${bulkDiscountAmount.toFixed(2)} USD</span>
                                    </div>
                                )}

                                {promoDiscountAmount > 0 && (
                                    <div className="flex justify-between text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg font-medium border border-amber-200">
                                        <span>Promo Discount ({appliedPromo}):</span>
                                        <span className="font-bold">-${promoDiscountAmount.toFixed(2)} USD</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-secondary-gray">
                                    <span>Enterprise Road Tanker Logistics:</span>
                                    <span className="font-bold text-success-green">FREE (Institutional Promo)</span>
                                </div>
                                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 text-sm">
                                    <span className="font-bold text-dark-slate">Total Amount Due:</span>
                                    <span className="font-black text-primary">${cartTotalAmount.toFixed(2)} USD</span>
                                </div>
                            </div>

                            {/* Promo Code Input Box */}
                            <div className="pt-2 border-t border-[#E2E8F0]">
                                <label className="block text-[11px] font-bold text-dark-slate mb-1">
                                    Have a Promo Code? <span className="font-normal text-secondary-gray">(e.g. OIL10, PETRO20, WELCOME50)</span>
                                </label>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <span>✓ Coupon applied: <strong>{appliedPromo}</strong></span>
                                        </div>
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
                        </div>
                    )}
                </div>

                { }
                {cartItems.length > 0 && (
                    <div className="p-4 sm:p-5 bg-white border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] text-secondary-gray block font-medium">Consolidated Grand Total:</span>
                            <span className="text-lg font-black text-primary">${cartTotalAmount.toFixed(2)} USD</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-1/3 sm:w-auto px-4 py-3 rounded-xl border border-secondary-gray text-dark-slate font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Keep Browsing
                            </button>

                            <button
                                type="button"
                                onClick={onProceedToPayment}
                                className="w-2/3 sm:w-auto px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Proceed to Payment Options (${cartTotalAmount.toFixed(2)})</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
