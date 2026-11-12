import React from 'react';
import { BadgeCheck, ImageIcon, Video } from 'lucide-react';
import StarRating from '@/components/StarRating';
import pb from '@/lib/pocketbaseClient';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const ReviewCard = ({ review }) => {
  const mediaUrl = review.media ? pb.files.getURL(review, review.media) : null;
  const isVideo = review.media && /\.(mp4|mov|webm)$/i.test(String(review.media));

  return (
    <article className="flex flex-col h-full bg-white rounded-[1.5rem] border border-border shadow-sm hover:shadow-xl transition-shadow duration-500 overflow-hidden">
      {mediaUrl && (
        <div className="relative h-48 bg-secondary overflow-hidden">
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              className="h-full w-full object-cover"
              preload="metadata"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={`${review.product_purchased} — customer photo`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <StarRating rating={review.rating} size={16} />
          <span className="text-xs text-muted-foreground font-light">{formatDate(review.created)}</span>
        </div>

        <p className="text-foreground text-sm leading-relaxed font-light flex-1 line-clamp-6">
          “{review.review_text}”
        </p>

        <div className="mt-5 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-primary truncate">
                {review.business_name || review.customer_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{review.product_purchased}</p>
            </div>
            {review.verified_purchase && (
              <span className="inline-flex items-center gap-1 text-[11px] text-sage whitespace-nowrap">
                <BadgeCheck className="h-4 w-4 text-gold" /> Verified Purchase
              </span>
            )}
          </div>
          <span className="inline-block mt-2 text-[10px] tracking-wider uppercase text-muted-foreground/70">
            {review.category}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ReviewCard;
