// Validation (Seif Elshimy): checks a review before it can be submitted.
// Pure functions with no React code, so they are easy to unit test in Phase 2.

import { ReviewDraft } from '@/models/review';

export const MIN_COMMENT_LENGTH = 10;
export const MAX_COMMENT_LENGTH = 500;

export interface ReviewErrors {
  rating?: string;
  comment?: string;
}

export function validateReview(draft: ReviewDraft): ReviewErrors {
  const errors: ReviewErrors = {};
  const comment = draft.comment.trim();

  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5 stars.';
  }

  if (comment.length === 0) {
    errors.comment = 'Please write a short review.';
  } else if (comment.length < MIN_COMMENT_LENGTH) {
    errors.comment = `Your review must be at least ${MIN_COMMENT_LENGTH} characters.`;
  } else if (comment.length > MAX_COMMENT_LENGTH) {
    errors.comment = `Your review must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
  }

  return errors;
}

/** True when validateReview found no problems. */
export function isValid(errors: ReviewErrors): boolean {
  return Object.keys(errors).length === 0;
}