import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Loader2, CheckCircle2, Upload, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { REVIEW_CATEGORIES } from '@/lib/reviews';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WriteReviewDialog = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    order_number: params.get('order') || '',
    product_purchased: '',
    category: '',
    review_text: '',
    // honeypot — must stay empty
    website: '',
  });
  const [consent, setConsent] = useState(false);
  const [media, setMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setForm({
      customer_name: user?.name || '',
      order_number: '',
      product_purchased: '',
      category: '',
      review_text: '',
      website: '',
    });
    setConsent(false);
    setMedia(null);
    setErrors({});
    setDone(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Please enter your name.';
    if (!form.product_purchased.trim()) e.product_purchased = 'Please name the product purchased.';
    if (!form.category) e.category = 'Please select a category.';
    if (!rating || rating < 1 || rating > 5) e.rating = 'Please select a star rating.';
    if (form.review_text.trim().length < 10) e.review_text = 'Please write at least 10 characters of feedback.';
    if (!consent) e.consent = 'Please provide consent to display your review.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    // Honeypot: silently succeed if filled (bot trap).
    if (form.website) {
      setDone(true);
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('customer_name', form.customer_name.trim());
      fd.append('order_number', form.order_number.trim());
      fd.append('product_purchased', form.product_purchased.trim());
      fd.append('category', form.category);
      fd.append('rating', String(rating));
      fd.append('review_text', form.review_text.trim());
      fd.append('consent', 'true');
      fd.append('status', 'approved');
      fd.append('verified_purchase', 'false');
      fd.append('featured', 'false');
      if (user?.id) fd.append('owner', user.id);
      if (media) fd.append('media', media);

      await pb.collection('reviews').create(fd);
      setDone(true);
      toast.success('Thank you! Your review has been published.');
    } catch (err) {
      const msg =
        err?.response?.data?.review_text?.message ||
        err?.response?.data?.rating?.message ||
        err?.message ||
        'Could not submit your review. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <div className="py-10 text-center px-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
            <h3 className="font-display text-2xl text-primary mt-5">Review Submitted</h3>
            <p className="text-muted-foreground mt-3 text-sm font-light leading-relaxed">
              Thank you for sharing your experience. Your review has been
              published and is now visible on our Reviews page.
            </p>
            <Button
              className="mt-7 rounded-full bg-primary text-primary-foreground hover:bg-[hsl(133_23%_33%)]"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">Write a Review</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Share your honest experience with ICONIC Handicraft. Your review
                is published immediately on submission.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4 pt-2">
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="space-y-2">
                <Label htmlFor="rv-name">Customer name *</Label>
                <Input
                  id="rv-name"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Your name or business name"
                />
                {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-order">Order number (optional)</Label>
                <Input
                  id="rv-order"
                  value={form.order_number}
                  onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                  placeholder="e.g. IH-20261026-1234 — required for verified badge"
                />
                <p className="text-xs text-muted-foreground">Providing your order number lets us verify your purchase.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-product">Product purchased *</Label>
                <Input
                  id="rv-product"
                  value={form.product_purchased}
                  onChange={(e) => setForm({ ...form, product_purchased: e.target.value })}
                  placeholder="Product or category name"
                />
                {errors.product_purchased && <p className="text-xs text-destructive">{errors.product_purchased}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label>Star rating *</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={(hoverRating || rating) >= n ? 'text-gold fill-current' : 'text-border'}
                        style={{ width: 26, height: 26 }}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-xs text-destructive">{errors.rating}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-text">Your review *</Label>
                <Textarea
                  id="rv-text"
                  value={form.review_text}
                  onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  maxLength={2000}
                />
                {errors.review_text && <p className="text-xs text-destructive">{errors.review_text}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-media">Photo or video (optional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    id="rv-media"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    onChange={(e) => setMedia(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-full border-border text-primary"
                  >
                    <Upload className="h-4 w-4 mr-2" /> {media ? 'Change file' : 'Upload'}
                  </Button>
                  {media && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[10rem]">{media.name}</span>
                      <button type="button" onClick={() => { setMedia(null); if (fileRef.current) fileRef.current.value = ''; }}>
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Max 10 MB. Images and short videos accepted.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I consent to ICONIC Handicraft displaying my review, name and
                  uploaded media on its website for marketing purposes.
                </span>
              </label>
              {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary text-primary-foreground hover:bg-[hsl(133_23%_33%)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewDialog;
