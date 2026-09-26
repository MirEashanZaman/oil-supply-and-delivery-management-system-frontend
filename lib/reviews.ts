export type OrderReview = {
  orderId: number;
  productId?: number;
  productName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerRole?: string;
  deliveryAddress?: string;
};

export const INITIAL_FEATURED_REVIEWS: OrderReview[] = [
  {
    orderId: 101,
    productId: 1,
    productName: "Ultra-Low Sulfur Diesel",
    rating: 5,
    comment: "Prompt tanker delivery right on schedule. Fuel density and quality test passed standard compliance with zero issues.",
    createdAt: "2026-03-12T10:30:00Z",
    reviewerName: "Rashid Chowdhury",
    reviewerRole: "Commercial Fleet Manager",
    deliveryAddress: "Dhaka Central Transport Depot",
  },
  {
    orderId: 104,
    productId: 2,
    productName: "Octane 95 (Premium)",
    rating: 5,
    comment: "Excellent logistics coordination from the regional dealer. Dispensing meters were accurate and unloading was handled safely.",
    createdAt: "2026-03-18T14:15:00Z",
    reviewerName: "Nafis Anam",
    reviewerRole: "Regional Station Owner",
    deliveryAddress: "Chittagong Port Expressway Outlet",
  },
  {
    orderId: 109,
    productId: 3,
    productName: "Heavy Marine Fuel Oil (HFO)",
    rating: 5,
    comment: "Seamless bulk delivery to our maritime terminal. Real-time driver updates and transparent electronic verification invoice.",
    createdAt: "2026-03-22T09:45:00Z",
    reviewerName: "Syed Tanvir Ahmed",
    reviewerRole: "Logistics Director",
    deliveryAddress: "Mongla Industrial Pier #4",
  },
  {
    orderId: 115,
    productId: 1,
    productName: "Ultra-Low Sulfur Diesel",
    rating: 4,
    comment: "Great quality petroleum fuel with verified lab test certifications. Tanker arrived safely within the scheduled delivery window.",
    createdAt: "2026-03-24T16:20:00Z",
    reviewerName: "Kamrul Hassan",
    reviewerRole: "Factory Operations Lead",
    deliveryAddress: "Gazipur Industrial Zone Hub",
  },
];

export const STORAGE_KEY_REVIEWS = "osdms_order_reviews";

export function getStoredReviews(): Record<number, OrderReview> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      const initialMap: Record<number, OrderReview> = {};
      INITIAL_FEATURED_REVIEWS.forEach((rev) => {
        initialMap[rev.orderId] = rev;
      });
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(initialMap));
      return initialMap;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOrderReview(review: OrderReview): Record<number, OrderReview> {
  const current = getStoredReviews();
  const updated = { ...current, [review.orderId]: review };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}
