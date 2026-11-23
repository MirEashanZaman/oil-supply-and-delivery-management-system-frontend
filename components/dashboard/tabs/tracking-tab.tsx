"use client";

import React from "react";
import { Order } from "../types";
import UberMapTracker from "../../uber-map-tracker";

interface TrackingTabProps {
  selectedTrackingOrder: Order | null;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  userRole?: string;
  onClose?: () => void;
}

const DEMO_FALLBACK_ORDER: Order = {
  id: 4491,
  quantity: 12,
  status: "In Transit",
  address: "408/1 Kuratoli Commercial Intake Terminal, Dhaka",
  product: {
    id: 2,
    name: "Ultra-Low Sulfur Diesel (Euro VI)",
  },
};

export const TrackingTab: React.FC<TrackingTabProps> = ({
  selectedTrackingOrder,
  orders,
  onSelectOrder,
  userRole = "customer",
  onClose = () => {},
}) => {
  const trackableOrders = orders.length > 0 ? orders : [DEMO_FALLBACK_ORDER];
  const activeOrder =
    selectedTrackingOrder ||
    orders.find((o) => {
      const s = (o.status || "").toLowerCase();
      return s.includes("delivery") || s.includes("transit") || s.includes("confirmed") || s.includes("processing");
    }) ||
    trackableOrders[0];

  return (
    <div className="space-y-5 text-left animate-fadeIn">
      <div className="card bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-radar-ripple absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]"></span>
            </span>
            <h3 className="text-base font-medium text-[#111827]">
              Live Fleet GPS & Telematics Dispatch
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#16A34A] font-mono text-[11px] font-medium">
              60fps Stream Active
            </span>
          </div>
          <p className="text-xs text-[#4B5565] mt-1">
            Real-time road tanker trajectory, interactive corridor checkpoints, and live manifold telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-[#4B5565] whitespace-nowrap">
            Consignment
          </span>
          <select
            value={activeOrder?.id || ""}
            onChange={(e) => {
              const ord = trackableOrders.find((o) => String(o.id) === e.target.value);
              if (ord) onSelectOrder(ord);
            }}
            className="select select-bordered select-sm text-xs font-medium text-[#111827] border-[#CBD5E1] focus:border-[#0F2747] rounded-lg bg-white"
          >
            {trackableOrders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.id} · {o.product?.name || "Petroleum Fuel"} ({o.status || "In Transit"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#1E293B]">
        <UberMapTracker
          order={activeOrder as any}
          userRole={userRole}
          onClose={onClose}
          isEmbedded={true}
        />
      </div>
    </div>
  );
};
