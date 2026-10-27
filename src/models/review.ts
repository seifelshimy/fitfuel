// Model layer (Seif Elshimy): the shape of one product review.

export interface Review {
  id: string;          // unique id, like Ahmed's 'p1'
  productId: string;   // which product the review is about
  authorName: string;  // who wrote it (no login yet in Phase 1)
  rating: number;      // stars, 1 to 5
  comment: string;     // the written text
  createdAt: string;   // date as text, e.g. "2026-10-27T10:00:00Z"
}

/** What the user fills in on the review form, before it is saved. */
export interface ReviewDraft {
  rating: number;
  comment: string;
}