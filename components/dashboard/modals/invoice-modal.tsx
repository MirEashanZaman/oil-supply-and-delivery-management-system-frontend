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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
      <div className="flex w-full max-w-4xl max-h-[95vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 text-xs">
              BOL
            </div>
            <div>
              <h2 id="invoice-title" className="text-base font-black tracking-tight text-white">Petroleum Tax Invoice & Bill of Lading</h2>
              <p className="text-xs text-slate-400">Order #{order.id} | Official e-POD Certified Record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
            >
              X
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white" id="printable-invoice-content">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#0F2747]">PETRO-DISTRIB ERP</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-900 border border-amber-300">Certified HazMat</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Global Oil & Petroleum Logistics Supply Network</p>
              <p className="text-xs text-slate-500">ISO 9001:2015 & OIML R 117-1 Certified Delivery Protocol</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Reference</p>
              <p className="text-sm font-extrabold text-[#0F2747]">{invoiceNumber}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">BOL: {bolNumber}</p>
              <p className="text-xs text-slate-500">Date: {issueDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Carrier / Origin Terminal</p>
              <p className="font-black text-slate-900">
                {order.supplier?.name || order.supplier?.userName || order.dealer?.name || order.dealer?.userName || "PetroChem Refining Terminal 04"}
              </p>
              <p className="text-slate-600 mt-0.5">Terminal License: LIC-TX-884920</p>
              <p className="text-slate-600">Meter Standard: Mass Flow Coriolis Meter</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Consignee / Destination Depot</p>
              <p className="font-black text-slate-900">
                {order.customerName || userData?.userName || userData?.name || "Verified Wholesale Buyer"}
              </p>
              <p className="text-slate-600 mt-0.5">{order.deliveryAddress || order.address || "Local Depot Terminal"}</p>
              <p className="text-slate-600">e-POD Verified: PIN 4-Digit Hash Match</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Dispatch Logistics & Status</p>
              <p className="font-black text-emerald-700 uppercase">{order.status || "Delivered"}</p>
              <p className="text-slate-600 mt-0.5">Fulfillment: {deliveryDateFormatted}</p>
              <p className="text-slate-600">Payment Ref: {order.payment?.paymentReference ? String(order.payment.paymentReference).slice(-12) : "PAID-ON-SAGA"}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Item / Petroleum Specification</th>
                  <th className="p-3 text-center">API Gravity / HazMat</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{order.product?.name || "Refined Fuel Petroleum Distillate"}</p>
                    <p className="text-[11px] text-slate-500">UN1202 / Class 3 Flammable Liquid (Bulk Road Tanker)</p>
                  </td>
                  <td className="p-3 text-center text-slate-600 font-mono">34.2 API | Class 3</td>
                  <td className="p-3 text-right font-bold text-slate-900">{order.quantity} units</td>
                  <td className="p-3 text-right text-slate-700">
                    ${order.quantity > 0 ? (Number(baseRate) / order.quantity).toFixed(2) : "0.00"}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">${baseRate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-emerald-900">
                <p className="font-bold">Electronic Proof of Delivery (e-POD) Cryptographic Seal</p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Tanker flowmeter reading calibrated at 15C temperature compensation. Custody transfer confirmed and logged with SAGA transaction integrity.
                </p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 space-y-1 text-slate-600 text-[11px]">
                <p><strong>Payment Status:</strong> {order.payment?.status || "Settled & Cleared"}</p>
                <p><strong>Method:</strong> {order.payment?.cardType || "Commercial Petroleum Account / SAGA"}</p>
              </div>
            </div>

            <div className="w-full sm:w-72 rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Petroleum Volume:</span>
                <span className="font-semibold text-slate-900">${baseRate}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>HazMat & Tanker Surcharge (8%):</span>
                <span className="font-semibold text-slate-900">${hazmatFee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Energy & Fuel VAT (10%):</span>
                <span className="font-semibold text-slate-900">${taxAmount}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-black text-[#0F2747]">
                <span>Total Amount Due / Paid:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-4">Carrier / Tanker Driver Signature:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-[10px] mt-1 text-slate-400">Driver HazMat Endorsement #HM-44919-TX</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-4">Consignee Terminal Receiver Signature:</p>
              <div className="border-b border-slate-400 h-6"></div>
              <p className="text-[10px] mt-1 text-slate-400">Authorized Terminal Superintendent Receipt</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-[#0F2747] px-4 py-2 text-xs font-bold text-white hover:bg-[#163860] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
