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

export const STORAGE_KEY_REVIEWS = "osdms_authentic_order_reviews_v3";

export function getStoredReviews(): Record<number, OrderReview> {
  if (typeof window === "undefined") return {};
  try {
    localStorage.removeItem("osdms_order_reviews");
    localStorage.removeItem("osdms_authentic_order_reviews_v2");

    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    
    const valid: Record<number, OrderReview> = {};
    const dummyIds = [101, 104, 109, 115];
    for (const [key, val] of Object.entries(parsed)) {
      const numKey = Number(key);
      if (val && typeof val === "object" && !dummyIds.includes(numKey) && !dummyIds.includes((val as any).orderId)) {
        valid[numKey] = val as OrderReview;
      }
    }
    return valid;
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
