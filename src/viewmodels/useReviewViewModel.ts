// ViewModel for the Review screen (Seif Elshimy).
// Loads the product and its reviews, holds the form state, validates it
// and saves the review through the repository.

import { useState } from 'react';
import { reviewRepository } from '@/services/reviewService';
import { productRepository, toUserMessage } from '@/services/productService';
import { isValid, MAX_COMMENT_LENGTH, ReviewErrors, validateReview } from '@/utils/reviewValidation';
import { useAsyncData } from './useAsyncData';

// No login yet in Phase 1. In Phase 2 this comes from the signed-in user.
const AUTHOR_NAME = 'You';

export function useReviewViewModel(productId: string | undefined) {
  const product = useAsyncData(() => {
    if (!productId) return Promise.reject(new Error('No product was selected.'));
    return productRepository.getById(productId);
  }, [productId]);

  const reviews = useAsyncData(() => {
    if (!productId) return Promise.resolve([]);
    return reviewRepository.getByProduct(productId);
  }, [productId]);

  const [rating, setRatingValue] = useState(0); // 0 means "no star chosen yet"
  const [comment, setCommentValue] = useState('');
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  // Editing a field clears its old error and the success message.
  const setRating = (value: number) => {
    setRatingValue(value);
    setErrors((e) => ({ ...e, rating: undefined }));
    setPosted(false);
  };

  const setComment = (text: string) => {
    setCommentValue(text);
    setErrors((e) => ({ ...e, comment: undefined }));
    setPosted(false);
  };

  /** Validates, then saves. Returns the errors so the screen can focus the right field. */
  const submit = async (): Promise<ReviewErrors> => {
    const found = validateReview({ rating, comment });
    setErrors(found);
    if (!isValid(found) || !productId) return found;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewRepository.add(productId, AUTHOR_NAME, { rating, comment });
      setRatingValue(0);
      setCommentValue('');
      setPosted(true);
      reviews.refresh(); // reload the list so the new review appears
    } catch (e) {
      setSubmitError(toUserMessage(e));
    } finally {
      setSubmitting(false);
    }
    return found;
  };

  return {
    productStatus: product.status,
    productError: product.error,
    product: product.data,
    retryProduct: product.reload,

    reviewsStatus: reviews.status,
    reviewsError: reviews.error,
    reviews: reviews.data ?? [],
    retryReviews: reviews.reload,

    rating,
    setRating,
    comment,
    setComment,
    maxLength: MAX_COMMENT_LENGTH,
    errors,
    submitting,
    submitError,
    posted,
    submit,
  };
}