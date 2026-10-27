// View: Review screen (Seif Elshimy).
// Opened from the Wishlist with /review/<productId>. Shows a review form
// and the product's existing reviews.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputInstance } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Review } from '@/models/review';
import { colors, radius, spacing, typography } from '@/theme';
import { useReviewViewModel } from '@/viewmodels/useReviewViewModel';

const STARS = [1, 2, 3, 4, 5];

export default function ReviewScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const vm = useReviewViewModel(productId);
  const commentRef = useRef<TextInputInstance>(null);

  if (vm.productStatus === 'loading') return <LoadingState message="Loading product…" />;
  if (vm.productStatus === 'error' || !vm.product) {
    return <ErrorState message={vm.productError ?? 'This product could not be loaded.'} onRetry={vm.retryProduct} />;
  }

  // Same idea as Lab 02's form: if the comment is wrong, move the cursor to it.
  const onSubmit = async () => {
    const found = await vm.submit();
    if (found.comment) commentRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Reviews' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={typography.label}>{vm.product.brand}</Text>
        <Text style={typography.title}>{vm.product.name}</Text>

        {/* Form */}
        <View style={styles.card}>
          <Text style={typography.subtitle}>Write a review</Text>

          <Text style={[typography.label, styles.fieldLabel]}>Your rating</Text>
          <View style={styles.stars}>
            {STARS.map((n) => (
              <Pressable
                key={n}
                onPress={() => vm.setRating(n)}
                accessibilityRole="button"
                accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                accessibilityState={{ selected: vm.rating === n }}
                hitSlop={4}
              >
                <Ionicons name={n <= vm.rating ? 'star' : 'star-outline'} size={30} color={colors.star} />
              </Pressable>
            ))}
          </View>
          {vm.errors.rating ? <Text style={styles.error}>{vm.errors.rating}</Text> : null}

          <Text style={[typography.label, styles.fieldLabel]}>Your review</Text>
          <TextInput
            ref={commentRef}
            value={vm.comment}
            onChangeText={vm.setComment}
            placeholder="What did you like or dislike? How did it taste?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={vm.maxLength}
            style={[styles.input, vm.errors.comment && styles.inputError]}
            accessibilityLabel="Your review"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.error}>{vm.errors.comment ?? ''}</Text>
            <Text style={typography.caption}>
              {vm.comment.length}/{vm.maxLength}
            </Text>
          </View>

          {vm.submitError ? <Text style={styles.error}>{vm.submitError}</Text> : null}
          {vm.posted ? (
            <View style={styles.success} accessibilityRole="alert">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.successText}>Thanks! Your review was posted.</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={vm.submitting ? 'Posting…' : 'Post review'}
            onPress={onSubmit}
            variant="accent"
            disabled={vm.submitting}
          />
        </View>

        {/* Existing reviews */}
        <Text style={[typography.title, styles.sectionTitle]}>
          What others say{vm.reviewsStatus === 'success' ? ` (${vm.reviews.length})` : ''}
        </Text>
        {vm.reviewsStatus === 'loading' ? (
          <ActivityIndicator color={colors.ink} style={styles.reviewsLoading} />
        ) : vm.reviewsStatus === 'error' ? (
          <ErrorState message={vm.reviewsError ?? ''} onRetry={vm.retryReviews} />
        ) : vm.reviews.length === 0 ? (
          <EmptyState icon="chatbubble-outline" title="No reviews yet" message="Be the first to review this product." />
        ) : (
          vm.reviews.map((r) => <ReviewItem key={r.id} review={r} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <View style={styles.review}>
      <View style={styles.reviewHeader}>
        <Text style={typography.subtitle}>{review.authorName}</Text>
        <Text style={typography.caption}>{date}</Text>
      </View>
      <View style={styles.reviewStars} accessibilityLabel={`${review.rating} out of 5 stars`}>
        {STARS.map((n) => (
          <Ionicons key={n} name={n <= review.rating ? 'star' : 'star-outline'} size={14} color={colors.star} />
        ))}
      </View>
      <Text style={typography.body}>{review.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  fieldLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  error: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E3F3E8',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  successText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  sectionTitle: { marginTop: spacing.xxl, marginBottom: spacing.md },
  reviewsLoading: { marginTop: spacing.lg },
  review: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewStars: { flexDirection: 'row', gap: 2 },
});