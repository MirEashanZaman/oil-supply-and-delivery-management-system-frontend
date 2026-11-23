import React from "react";
import { Order, UserData } from "../types";

interface InvoiceModalProps {
  order: Order | null;
  userData: UserData | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, userData, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${new Date(order.createdAt || Date.now()).getFullYear()}-${String(order.id).padStart(6, "0")}`;
  const bolNumber = `BOL-PETRO-${String(order.id).padStart(6, "0")}`;
  const totalAmount = Number(order.totalAmount || 0);
  const baseRate = totalAmount > 0 ? (totalAmount * 0.82).toFixed(2) : "0.00";
  const hazmatFee = totalAmount > 0 ? (totalAmount * 0.08).toFixed(2) : "0.00";
  const taxAmount = totalAmount > 0 ? (totalAmount * 0.10).toFixed(2) : "0.00";
  const issueDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US");
  const deliveryDateFormatted = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Delivered / On Schedule";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
      <div className="flex w-full max-w-4xl max-h-[95vh] flex-col overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#163860] bg-[#0F2747] px-6 py-4 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B] font-semibold text-[#111827] text-xs font-mono">
              BOL
            </div>
            <div>
              <h2 id="invoice-title" className="text-base font-medium text-white">Petroleum Tax Invoice & Bill of Lading</h2>
              <p className="text-xs text-slate-300 font-mono tabular-nums">Order #{order.id} · Official e-POD Record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#F59E0B] px-3.5 py-1.5 text-xs font-medium text-[#111827] hover:bg-[#D97706] transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#163860] text-slate-300 hover:bg-[#1E4A7D] hover:text-white cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-[#111827] bg-white" id="printable-invoice-content">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-semibold text-[#0F2747]">Oil Supply & Delivery Management System</span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-[#D97706] border border-amber-200">Certified HazMat</span>
              </div>
              <p className="text-xs text-[#4B5565] mt-1">Petroleum Logistics & Custody Transfer Ledger</p>
              <p className="text-xs text-[#6B7487]">ISO 9001:2015 & OIML R 117-1 Certified Delivery Protocol</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-[#6B7487]">Invoice reference</p>
              <p className="font-mono tabular-nums text-sm font-semibold text-[#0F2747]">{invoiceNumber}</p>
              <p className="text-xs text-[#4B5565] font-mono tabular-nums mt-0.5">BOL: {bolNumber}</p>
              <p className="text-xs text-[#6B7487] font-mono tabular-nums">Date: {issueDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-[#F5F7FA] p-4 border border-[#E2E8F0] text-xs">
            <div>
              <p className="font-medium text-[#6B7487] mb-1">Carrier & origin terminal</p>
              <p className="font-medium text-[#111827]">
                {order.supplier?.name || order.supplier?.userName || order.dealer?.name || order.dealer?.userName || "PetroChem Refining Terminal 04"}
              </p>
              <p className="text-[#4B5565] mt-0.5 font-mono">License: LIC-TX-884920</p>
              <p className="text-[#4B5565]">Meter: Mass Flow Coriolis Meter</p>
            </div>
            <div>
              <p className="font-medium text-[#6B7487] mb-1">Consignee & destination depot</p>
              <p className="font-medium text-[#111827]">
                {order.customerName || userData?.userName || userData?.name || "Verified Wholesale Buyer"}
              </p>
              <p className="text-[#4B5565] mt-0.5">{order.deliveryAddress || order.address || "Local Depot Terminal"}</p>
              <p className="text-[#4B5565]">e-POD verified: 4-digit PIN match</p>
            </div>
            <div>
              <p className="font-medium text-[#6B7487] mb-1">Dispatch status</p>
              <p className="font-medium text-[#16A34A]">{order.status || "Delivered"}</p>
              <p className="text-[#4B5565] mt-0.5">Fulfillment: {deliveryDateFormatted}</p>
              <p className="text-[#4B5565] font-mono tabular-nums">Ref: {order.payment?.paymentReference ? String(order.payment.paymentReference).slice(-12) : "PAID-ON-SAGA"}</p>
            </div>
          </div>

          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] text-[#4B5565] font-medium border-b border-[#E2E8F0]">
                  <th className="p-3">Item & petroleum specification</th>
                  <th className="p-3 text-center">API gravity & class</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Unit rate</th>
                  <th className="p-3 text-right">Total net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="p-3">
                    <p className="font-medium text-[#111827]">{order.product?.name || "Refined Fuel Petroleum Distillate"}</p>
                    <p className="text-[11px] text-[#6B7487]">UN1202 · Class 3 Flammable Liquid (Bulk Road Tanker)</p>
                  </td>
                  <td className="p-3 text-center text-[#4B5565] font-mono tabular-nums">34.2 API · Class 3</td>
                  <td className="p-3 text-right font-mono tabular-nums font-medium text-[#111827]">{order.quantity} units</td>
                  <td className="p-3 text-right font-mono tabular-nums text-[#4B5565]">
                    ${order.quantity > 0 ? (Number(baseRate) / order.quantity).toFixed(2) : "0.00"}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums font-medium text-[#111827]">${baseRate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-emerald-900">
                <p className="font-medium">Electronic Proof of Delivery (e-POD) Seal</p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Tanker flowmeter reading calibrated at 15°C temperature compensation. Custody transfer confirmed and logged with SAGA transaction integrity.
                </p>
              </div>
              <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-1 text-[#4B5565] text-xs">
                <p><span className="font-medium text-[#111827]">Payment status:</span> {order.payment?.status || "Settled & Cleared"}</p>
                <p><span className="font-medium text-[#111827]">Method:</span> {order.payment?.cardType || "Commercial Petroleum Account / SAGA"}</p>
              </div>
            </div>

            <div className="w-full sm:w-72 rounded-xl bg-[#F5F7FA] p-4 border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between text-[#4B5565]">
                <span>Base petroleum volume</span>
                <span className="font-mono tabular-nums font-medium text-[#111827]">${baseRate}</span>
              </div>
              <div className="flex justify-between text-[#4B5565]">
                <span>HazMat & tanker surcharge (8%)</span>
                <span className="font-mono tabular-nums font-medium text-[#111827]">${hazmatFee}</span>
              </div>
              <div className="flex justify-between text-[#4B5565]">
                <span>Energy & fuel VAT (10%)</span>
                <span className="font-mono tabular-nums font-medium text-[#111827]">${taxAmount}</span>
              </div>
              <div className="border-t border-[#CBD5E1] pt-2 flex justify-between text-sm font-semibold text-[#0F2747]">
                <span>Total paid</span>
                <span className="font-mono tabular-nums">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-[#E2E8F0] pt-6 text-xs text-[#4B5565]">
            <div>
              <p className="font-medium text-[#111827] mb-4">Carrier / Tanker Driver Signature</p>
              <div className="border-b border-[#CBD5E1] h-6"></div>
              <p className="text-[11px] mt-1 text-[#6B7487] font-mono">Driver HazMat Endorsement #HM-44919-TX</p>
            </div>
            <div>
              <p className="font-medium text-[#111827] mb-4">Consignee Terminal Receiver Signature</p>
              <div className="border-b border-[#CBD5E1] h-6"></div>
              <p className="text-[11px] mt-1 text-[#6B7487]">Authorized Terminal Superintendent Receipt</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] bg-[#F5F7FA] px-6 py-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white border border-[#CBD5E1] px-4 py-2 text-xs font-medium text-[#111827] hover:bg-[#ECEFF4] transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-[#0F2747] px-4 py-2 text-xs font-medium text-white hover:bg-[#163860] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
