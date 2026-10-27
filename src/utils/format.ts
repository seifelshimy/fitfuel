/** Formats a price in Egyptian pounds, e.g. 3150 -> "EGP 3,150". */
export function formatPrice(amount: number): string {
  return `EGP ${Math.round(amount).toLocaleString('en-US')}`;
}

/** e.g. 412 -> "412 reviews", 1 -> "1 review". */
export function formatReviewCount(count: number): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? 'review' : 'reviews'}`;
}
