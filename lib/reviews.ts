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

export const STORAGE_KEY_REVIEWS = "osdms_authentic_order_reviews_v2";

export function getStoredReviews(): Record<number, OrderReview> {
  if (typeof window === "undefined") return {};
  try {
    // Clear old legacy key with dummy data if present in user browser
    if (localStorage.getItem("osdms_order_reviews")) {
      localStorage.removeItem("osdms_order_reviews");
    }

    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      return {};
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


