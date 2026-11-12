import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, ArrowRight, MessageSquareQuote } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import ReviewCard from '@/components/ReviewCard';
import WriteReviewDialog from '@/components/WriteReviewDialog';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let active = true;
    pb.collection('reviews')
      .getList(1, 6, {
        filter: "status = 'approved'",
        sort: '-featured,-created',
      })
      .then((res) => {
        if (active) setReviews(res.items || []);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <section id="reviews" className="py-24 md:py-32 bg-[hsl(var(--secondary))]">
      <div className="mx-auto max-w-[90rem] px-6">
        <div className="max-w-2xl mb-14">
          <span className="text-gold tracking-[0.35em] uppercase text-xs">Testimonials</span>
          <h2 className="font-display text-primary text-4xl md:text-6xl mt-4 leading-tight">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground mt-5 text-lg font-light">
            Real feedback from customers who trust ICONIC Handicraft for their
            gifting and custom packaging needs.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-[1.5rem] bg-white/60 border border-border animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-[1.5rem] border border-border">
            <MessageSquareQuote className="mx-auto h-12 w-12 text-gold/60" />
            <p className="mt-5 text-muted-foreground font-light">
              No reviews yet. Be the first to share your experience.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm hover:bg-[hsl(133_23%_33%)] transition-colors"
            >
              <PenLine className="h-4 w-4" /> Be the first to review
            </button>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                className="h-full"
              >
                <ReviewCard review={r} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm tracking-wide hover:bg-[hsl(133_23%_33%)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <PenLine className="h-4 w-4" /> Write a Review
          </button>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-primary text-primary text-sm tracking-wide hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View All Reviews <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <WriteReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
};

export default Reviews;
