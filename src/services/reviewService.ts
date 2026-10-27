// Model layer (Seif Elshimy): the only place that knows where reviews come from.
// Phase 1 keeps reviews in memory with a short delay so loading states are visible.
// Phase 2: replace MockReviewRepository with a Firestore version that implements
// the same ReviewRepository interface. No screen has to change.

import { Review, ReviewDraft } from '@/models/review';

export interface ReviewRepository {
  getByProduct(productId: string): Promise<Review[]>;
  add(productId: string, authorName: string, draft: ReviewDraft): Promise<Review>;
}

const NETWORK_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A few starting reviews so the screen is not empty in the demo.
const mockReviews: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    authorName: 'Omar K.',
    rating: 5,
    comment: 'Mixes well and tastes great with milk. No stomach issues.',
    createdAt: '2026-10-20T18:30:00Z',
  },
  {
    id: 'r2',
    productId: 'p1',
    authorName: 'Nour A.',
    rating: 4,
    comment: 'Good protein per scoop, but the price went up recently.',
    createdAt: '2026-10-22T09:15:00Z',
  },
  {
    id: 'r3',
    productId: 'p2',
    authorName: 'Youssef M.',
    rating: 4,
    comment: 'Helped me gain weight. Very filling, so I split the serving.',
    createdAt: '2026-10-24T14:00:00Z',
  },
];

class MockReviewRepository implements ReviewRepository {
  async getByProduct(productId: string): Promise<Review[]> {
    await wait(NETWORK_DELAY_MS);
    return mockReviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
  }

  async add(productId: string, authorName: string, draft: ReviewDraft): Promise<Review> {
    await wait(NETWORK_DELAY_MS);
    const review: Review = {
      id: `r${Date.now()}`,
      productId,
      authorName,
      rating: draft.rating,
      comment: draft.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    mockReviews.push(review);
    return review;
  }
}

export const reviewRepository: ReviewRepository = new MockReviewRepository();