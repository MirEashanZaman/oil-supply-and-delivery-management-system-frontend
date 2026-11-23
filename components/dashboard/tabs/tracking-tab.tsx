"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Radio, Navigation, Truck } from "lucide-react";
import { Order } from "../types";
import UberMapTracker from "../../uber-map-tracker";
import { LiveTelemetrySpark } from "../../ui/motion-primitives";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5 text-left"
    >
      <div className="card bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative w-10 h-10 rounded-xl bg-[#0F2747] text-white flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-medium text-[#111827]">
                Live Fleet GPS & Telematics Dispatch
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[#16A34A] font-mono text-[11px] font-medium">
                <Radio className="w-3 h-3" />
                <span>60fps Stream Active</span>
              </span>
              <LiveTelemetrySpark color="#16A34A" active={true} />
            </div>
            <p className="text-xs text-[#4B5565] mt-1">
              Real-time road tanker trajectory, interactive corridor checkpoints, and live manifold telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-[#4B5565] whitespace-nowrap inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#6B7487]" />
            <span>Consignment</span>
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeOrder?.id || "default-tracker"}
          initial={{ opacity: 0, scale: 0.995 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.995 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl overflow-hidden border border-[#1E293B]"
        >
          <UberMapTracker
            order={activeOrder as any}
            userRole={userRole}
            onClose={onClose}
            isEmbedded={true}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
