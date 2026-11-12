import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { PenLine, ExternalLink, Loader2, MessageSquareQuote } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import ReviewCard from '@/components/ReviewCard';
import WriteReviewDialog from '@/components/WriteReviewDialog';
import { REVIEW_CATEGORIES, GOOGLE_REVIEWS_URL } from '@/lib/reviews';

const PER_PAGE = 9;

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async (pageNum, cat, replace) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const filter = cat === 'all'
        ? "status = 'approved'"
        : pb.filter("status = 'approved' && category = {:cat}", { cat });
      const res = await pb.collection('reviews').getList(pageNum, PER_PAGE, {
        filter,
        sort: '-featured,-created',
      });
      setReviews((prev) => replace ? res.items : [...prev, ...res.items]);
      setTotalPages(res.totalPages);
      setPage(pageNum);
    } catch {
      if (replace) setReviews([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1, category, true);
  }, [category, load]);

  const filters = ['all', ...REVIEW_CATEGORIES];

  return (
    <>
      <Helmet>
        <title>Customer Reviews & Testimonials — Iconic Handicraft</title>
        <meta
          name="description"
          content="Read genuine customer reviews and testimonials for Iconic Handicraft — premium gifting and custom packaging, verified and approved by our team."
        />
      </Helmet>

      <section className="pt-32 pb-24 md:pt-40 md:pb-32 bg-[hsl(var(--secondary))]">
        <div className="mx-auto max-w-[90rem] px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-gold tracking-[0.35em] uppercase text-xs">Testimonials</span>
            <h1 className="font-display text-primary text-4xl md:text-6xl mt-4 leading-tight">
              What Our Clients Say
            </h1>
            <p className="text-muted-foreground mt-5 text-lg font-light">
              Real feedback from customers who trust ICONIC Handicraft for their
              gifting and custom packaging needs.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setCategory(f)}
                  className={`px-4 py-2 rounded-full text-xs tracking-wide transition-all duration-300 ${
                    category === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white border border-border text-foreground hover:border-primary'
                  }`}
                >
                  {f === 'all' ? 'All Reviews' : f}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {GOOGLE_REVIEWS_URL && (
                <a
                  href={GOOGLE_REVIEWS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-white text-foreground text-sm hover:border-primary transition-colors"
                >
                  Google Reviews <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:bg-[hsl(133_23%_33%)] transition-colors"
              >
                <PenLine className="h-4 w-4" /> Write a Review
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-72 rounded-[1.5rem] bg-white/60 border border-border animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 bg-white/60 rounded-[1.5rem] border border-border">
              <MessageSquareQuote className="mx-auto h-12 w-12 text-gold/60" />
              <p className="mt-5 text-muted-foreground font-light">
                No approved reviews in this category yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                    className="h-full"
                  >
                    <ReviewCard review={r} />
                  </motion.div>
                ))}
              </div>

              {page < totalPages && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => load(page + 1, category, false)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-primary text-primary text-sm hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load More Reviews
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <WriteReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default ReviewsPage;
