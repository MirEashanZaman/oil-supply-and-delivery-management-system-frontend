import axios from "axios";
import { API_ENDPOINT } from "./api";

export type OrderReview = {
  id?: number;
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

export function getLocalStoredReviews(): Record<number, OrderReview> {
  if (typeof window === "undefined") return {};
  try {
    localStorage.removeItem("osdms_order_reviews");
    localStorage.removeItem("osdms_authentic_order_reviews_v2");

    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (!raw) return {};
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

export function saveLocalOrderReview(review: OrderReview): Record<number, OrderReview> {
  const current = getLocalStoredReviews();
  const updated = { ...current, [review.orderId]: review };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export async function fetchAllServerReviews(): Promise<Record<number, OrderReview>> {
  const map: Record<number, OrderReview> = {};
  const dummyIds = [101, 104, 109, 115];

  const candidateUrls = [
    `${API_ENDPOINT}/review/list`,
    "/api/reviews",
  ];

  for (const url of candidateUrls) {
    try {
      const res = await axios.get(url, {
        validateStatus: (status) => status < 500,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        res.data.forEach((item: any) => {
          if (item?.orderId && !dummyIds.includes(Number(item.orderId))) {
            map[Number(item.orderId)] = {
              id: item.id,
              orderId: Number(item.orderId),
              productId: item.productId ? Number(item.productId) : undefined,
              productName: item.productName || "Petroleum Grade",
              rating: Number(item.rating) || 5,
              comment: item.comment || "",
              createdAt: item.createdAt || new Date().toISOString(),
              reviewerName: item.reviewerName || "Verified Buyer",
              reviewerRole: item.reviewerRole || "Commercial Buyer",
              deliveryAddress: item.deliveryAddress || "Destination Depot",
            };
          }
        });
        break;
      }
    } catch {}
  }

  const local = getLocalStoredReviews();
  const merged = { ...local, ...map };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(merged));
    } catch {}
  }
  return merged;
}

export async function submitServerOrderReview(review: OrderReview): Promise<Record<number, OrderReview>> {
  const previousState = getLocalStoredReviews();
  const optimisticMap = saveLocalOrderReview(review);

  const payload = {
    orderId: review.orderId,
    productId: review.productId,
    productName: review.productName,
    rating: review.rating,
    comment: review.comment,
    reviewerName: review.reviewerName,
    reviewerRole: review.reviewerRole,
    deliveryAddress: review.deliveryAddress,
  };

  let synced = false;

  try {
    const backendRes = await axios.post(`${API_ENDPOINT}/review/submit`, payload, {
      validateStatus: (status) => status < 500,
    });
    if (backendRes.status >= 200 && backendRes.status < 300) {
      synced = true;
    }
  } catch (backendErr) {
    console.warn("Backend review submission failed, falling back to Next.js API route:", backendErr);
  }

  if (!synced) {
    try {
      const routeRes = await axios.post("/api/reviews", payload, {
        validateStatus: (status) => status < 500,
      });
      if (routeRes.status >= 200 && routeRes.status < 300) {
        synced = true;
      }
    } catch (routeErr) {
      console.warn("Next.js review route submission notice:", routeErr);
    }
  }

  if (!synced && typeof window !== "undefined") {
    // If backend and server fallback both reject (e.g. order not delivered), rollback client storage
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(previousState));
    } catch {}
    return previousState;
  }

  return optimisticMap;
}

export const getStoredReviews = getLocalStoredReviews;
export const saveOrderReview = saveLocalOrderReview;
