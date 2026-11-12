import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, size = 16, className = '', interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {stars.map((n) => {
        const filled = n <= Math.round(rating);
        const StarTag = interactive ? 'button' : 'span';
        return (
          <StarTag
            key={n}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''} ${filled ? 'text-gold' : 'text-border'}`}
            aria-hidden={!interactive}
            aria-label={interactive ? `${n} star${n > 1 ? 's' : ''}` : undefined}
          >
            <Star
              className={filled ? 'fill-current' : ''}
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
          </StarTag>
        );
      })}
    </div>
  );
};

export default StarRating;
