export type ApprovedReview = {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  customerName: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type ReviewsSummary = {
  averageRating: number;
  totalReviews: number;
  approvedReviewsPreview: ApprovedReview[];
};

export type ReviewsListResponse = {
  items: ApprovedReview[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  averageRating: number;
};

export type VerifiedReviewCreateInput = {
  orderNumber: string;
  email?: string;
  phone?: string;
  productId: number;
  rating: number;
  title?: string;
  body: string;
  customerName: string;
};

export type VerifiedReviewCreateResponse = {
  id: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type ReviewInvitationStatus = "pending" | "submitted" | "expired";

export type ReviewInvitationProductOption = {
  productId: number;
  productName: string;
  productSlug: string | null;
};

export type ReviewInvitation = {
  id: number;
  token: string;
  status: ReviewInvitationStatus;
  orderNumber: string;
  customerName: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  selectedProductId: number | null;
  items: ReviewInvitationProductOption[];
};

export type ReviewInvitationSubmitInput = {
  productId?: number;
  rating: number;
  title?: string;
  body: string;
  customerName?: string;
};

export type ReviewInvitationSubmitResponse = {
  reviewId: number;
  reviewStatus: "pending" | "approved" | "rejected";
  submittedAt: string;
  createdAt: string;
};

export function createEmptyReviewsSummary(): ReviewsSummary {
  return {
    averageRating: 0,
    totalReviews: 0,
    approvedReviewsPreview: [],
  };
}

export function createEmptyReviewsList(page = 1, pageSize = 12): ReviewsListResponse {
  return {
    items: [],
    page,
    pageSize,
    total: 0,
    totalPages: 1,
    averageRating: 0,
  };
}
