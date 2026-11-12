import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate } from 'react-router-dom';
import {
  Check, X, Star, BadgeCheck, Trash2, Edit3, Save, Loader2, ShieldCheck, Sparkles,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/StarRating';
import { REVIEW_STATUS_LABELS } from '@/lib/reviews';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

const AdminReviewsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await pb.collection('reviews').getList(1, 50, {
        filter: pb.filter('status = {:s}', { s: status }),
        sort: '-created',
      });
      setReviews(res.items || []);
    } catch (err) {
      toast.error('Could not load reviews. ' + (err?.message || ''));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load(tab);
  }, [tab, isAdmin, load]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin/reviews' }} />;
  if (!isAdmin) {
    return (
      <div className="pt-32 pb-24 text-center px-6">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl text-primary mt-5">Admins Only</h1>
        <p className="text-muted-foreground mt-2">
          You need an administrator account to access the review moderation panel.
        </p>
      </div>
    );
  }

  const update = async (id, patch) => {
    try {
      const updated = await pb.collection('reviews').update(id, patch);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      toast.error('Update failed. ' + (err?.message || ''));
      throw err;
    }
  };

  const approve = (id) => update(id, { status: 'approved' }).then(() => toast.success('Review approved.'));
  const reject = (id) => update(id, { status: 'rejected' }).then(() => toast.success('Review rejected.'));
  const toggleFeature = (r) =>
    update(r.id, { featured: !r.featured }).then(() =>
      toast.success(!r.featured ? 'Marked as featured.' : 'Removed from featured.'),
    );
  const remove = async (id) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    try {
      await pb.collection('reviews').delete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Review deleted.');
    } catch (err) {
      toast.error('Delete failed. ' + (err?.message || ''));
    }
  };

  const verifyPurchase = async (review) => {
    if (!review.order_number) {
      toast.error('This review has no order number to verify.');
      return;
    }
    setVerifyingId(review.id);
    try {
      const order = await pb.collection('orders').getFirstListItem(
        pb.filter('order_number = {:n}', { n: review.order_number }),
      );
      if (String(order.status) === 'paid') {
        await update(review.id, { verified_purchase: true });
        toast.success('Purchase verified — order found and paid.');
      } else {
        toast.error(`Order found but status is "${order.status}". Not marked verified.`);
      }
    } catch (err) {
      const msg = err?.status === 404
        ? 'No matching order found for this order number.'
        : 'Could not verify order. ' + (err?.message || '');
      toast.error(msg);
    } finally {
      setVerifyingId(null);
    }
  };

  const startEdit = (r) => { setEditingId(r.id); setEditText(r.review_text); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };
  const saveEdit = async (id) => {
    try {
      await update(id, { review_text: editText.trim() });
      setEditingId(null);
      toast.success('Review text updated.');
    } catch { /* update() already toasted */ }
  };

  return (
    <>
      <Helmet>
        <title>Review Moderation — Iconic Handicraft Admin</title>
      </Helmet>
      <section className="pt-28 pb-24 min-h-screen bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-[90rem] px-6">
          <div className="mb-8">
            <span className="text-gold tracking-[0.35em] uppercase text-xs">Admin</span>
            <h1 className="font-display text-primary text-3xl md:text-4xl mt-3">Review Moderation</h1>
            <p className="text-muted-foreground mt-2 text-sm font-light">
              Reviews are published automatically when submitted. Use this panel
              to feature, verify purchases, reject spam, edit, or remove reviews.
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border border-border">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-20 font-light">
                  No {REVIEW_STATUS_LABELS[tab]?.toLowerCase()} reviews.
                </p>
              ) : (
                <div className="grid gap-5">
                  {reviews.map((r) => (
                    <ReviewAdminRow
                      key={r.id}
                      review={r}
                      editing={editingId === r.id}
                      editText={editText}
                      onEditText={setEditText}
                      onStartEdit={() => startEdit(r)}
                      onCancelEdit={cancelEdit}
                      onSaveEdit={() => saveEdit(r.id)}
                      onApprove={() => approve(r.id)}
                      onReject={() => reject(r.id)}
                      onFeature={() => toggleFeature(r)}
                      onVerify={() => verifyPurchase(r)}
                      onDelete={() => remove(r.id)}
                      verifying={verifyingId === r.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
};

const mediaUrl = (r) => (r.media ? pb.files.getURL(r, r.media) : null);

const ReviewAdminRow = ({
  review: r, editing, editText, onEditText, onStartEdit, onCancelEdit, onSaveEdit,
  onApprove, onReject, onFeature, onVerify, onDelete, verifying,
}) => {
  const url = mediaUrl(r);
  const isVideo = r.media && /\.(mp4|mov|webm)$/i.test(String(r.media));
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6">
      <div className="flex flex-col md:flex-row gap-5">
        {url && (
          <div className="md:w-48 flex-shrink-0">
            {isVideo ? (
              <video src={url} controls className="w-full h-32 object-cover rounded-lg" preload="metadata" />
            ) : (
              <img src={url} alt="customer media" className="w-full h-32 object-cover rounded-lg" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <StarRating rating={r.rating} size={14} />
            <span className="text-xs text-muted-foreground">{formatDate(r.created)}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
              r.status === 'approved' ? 'bg-sage/20 text-sage' :
              r.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
              'bg-gold/20 text-gold'
            }`}>
              {REVIEW_STATUS_LABELS[r.status]}
            </span>
            {r.verified_purchase && (
              <span className="inline-flex items-center gap-1 text-[11px] text-sage">
                <BadgeCheck className="h-4 w-4 text-gold" /> Verified
              </span>
            )}
            {r.featured && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gold">
                <Sparkles className="h-3.5 w-3.5" /> Featured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
            <p><span className="text-muted-foreground">Name:</span> <span className="text-primary font-medium">{r.customer_name}</span></p>
            <p><span className="text-muted-foreground">Product:</span> {r.product_purchased}</p>
            <p><span className="text-muted-foreground">Category:</span> {r.category}</p>
            <p><span className="text-muted-foreground">Order #:</span> {r.order_number || '—'}</p>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea value={editText} onChange={(e) => onEditText(e.target.value)} rows={4} maxLength={2000} />
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveEdit} className="rounded-full bg-primary text-primary-foreground">
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEdit} className="rounded-full">Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground font-light leading-relaxed">“{r.review_text}”</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {r.status !== 'approved' && (
              <Button size="sm" onClick={onApprove} className="rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
            )}
            {r.status !== 'rejected' && (
              <Button size="sm" variant="outline" onClick={onReject} className="rounded-full">
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            )}
            {!editing && (
              <Button size="sm" variant="outline" onClick={onStartEdit} className="rounded-full">
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
            {r.status === 'approved' && (
              <Button size="sm" variant="outline" onClick={onFeature} className="rounded-full">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> {r.featured ? 'Unfeature' : 'Feature'}
              </Button>
            )}
            {r.order_number && !r.verified_purchase && (
              <Button size="sm" variant="outline" onClick={onVerify} disabled={verifying} className="rounded-full">
                {verifying ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1" />}
                Verify Purchase
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onDelete} className="rounded-full text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
