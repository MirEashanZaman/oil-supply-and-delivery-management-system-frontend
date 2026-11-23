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

export const TrackingTab: React.FC<TrackingTabProps> = ({
  selectedTrackingOrder,
  orders,
  onSelectOrder,
  userRole = "customer",
  onClose = () => { },
}) => {
  const activeOrders = orders.filter(
    (o) => {
      const status = (o.status || "").toLowerCase();
      return status !== "pending" && status !== "cancelled" && status !== "rejected" && status !== "delivered" && status !== "completed";
    }
  );
  const selectedOrderIsTrackable = selectedTrackingOrder
    ? activeOrders.some((order) => order.id === selectedTrackingOrder.id)
    : false;

  return (
    <div className="space-y-6 text-left">
      <div className="card bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#16A34A]"></span>
            <h3 className="text-base font-medium text-[#111827]">
              Live Fleet GPS & Telematics Dispatch
            </h3>
          </div>
          <p className="text-xs text-[#4B5565] mt-1">
            Multi-route simulation, driver telemetry, and turn-by-turn ETA
          </p>
        </div>

        {activeOrders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#4B5565] whitespace-nowrap">
              Active consignment
            </span>
            <select
              value={selectedTrackingOrder?.id || ""}
              onChange={(e) => {
                const ord = orders.find((o) => o.id === Number(e.target.value));
                if (ord) onSelectOrder(ord);
              }}
              className="select select-bordered select-sm text-xs font-medium text-[#111827] border-[#E2E8F0] focus:border-[#0F2747] rounded-lg"
            >
              {activeOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  Order #{o.id} · {o.product?.name || "Fuel"} ({o.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedTrackingOrder && selectedOrderIsTrackable ? (
        <div className="rounded-2xl overflow-hidden border border-[#E2E8F0]">
          <UberMapTracker
            order={selectedTrackingOrder as any}
            userRole={userRole}
            onClose={onClose}
            isEmbedded={true}
          />
        </div>
      ) : (
        <div className="text-center py-20 card bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <h4 className="text-base font-medium text-[#111827]">No Consignment Selected</h4>
          <p className="text-xs text-[#4B5565] mt-1 max-w-md mx-auto">
            Select an active order from the dropdown above or your orders list to view live GPS tracking and delivery telemetry
          </p>
        </div>
      )}
    </div>
  );
};
