import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Check, X, BadgeCheck, Trash2, Edit3, Save, Loader2, ShieldCheck, Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminApiJson } from '@/lib/adminAuth';
import AdminGate from '@/components/AdminGate';
import StarRating from '@/components/StarRating';
import { REVIEW_STATUS_LABELS } from '@/lib/reviews';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';

const PER_PAGE = 50;

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
};

const AdminReviewsPage = () => {
  const { session, logout } = useAdminAuth();
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const loadSeq = useRef(0);
  const totalItemsRef = useRef(0);
  const pageRef = useRef(page);
  pageRef.current = page;

  const onUnauthorized = useCallback(() => {
    logout();
    window.location.assign('/admin/login');
  }, [logout]);

  const load = useCallback(async (status, p) => {
    if (!session) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const data = await adminApiJson(
        session,
        `/admin/reviews?status=${encodeURIComponent(status)}&page=${p}&perPage=${PER_PAGE}`,
        {},
        onUnauthorized,
      );
      if (seq !== loadSeq.current) return;
      const items = data.items || [];
      const total = Number.isFinite(Number(data.totalItems))
        ? Number(data.totalItems)
        : items.length;
      const pages = Math.max(1, Number(data.totalPages) || 1);
      totalItemsRef.current = total;
      setReviews(items);
      setTotalPages(pages);
      setPage(Math.min(Number(data.page) || p, pages));
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (err?.name === 'AdminUnauthorizedError') return;
      toast.error('Could not load reviews. ' + (err?.message || ''));
      setReviews([]);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [session, onUnauthorized]);

  useEffect(() => {
    load(tab, page);
  }, [tab, page, load]);

  const mutate = async (path, options) => {
    const data = await adminApiJson(session, path, options, onUnauthorized);
    return data;
  };

  const update = async (id, patch) => {
    try {
      const updated = await mutate(`/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      if (err?.name === 'AdminUnauthorizedError') throw err;
      toast.error('Update failed. ' + (err?.message || ''));
      throw err;
    }
  };

  const dropFromTab = (id) => {
    const nextCount = Math.max(0, totalItemsRef.current - 1);
    const pages = Math.max(1, Math.ceil(nextCount / PER_PAGE));
    const nextPage = Math.min(pageRef.current, pages);
    totalItemsRef.current = nextCount;
    setTotalPages(pages);
    if (nextPage !== pageRef.current) {
      setLoading(true);
      setPage(nextPage);
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };
  const approve = async (id) => {
    try {
      await update(id, { status: 'approved' });
      dropFromTab(id);
      toast.success('Review approved — now visible on the site.');
    } catch { /* update() already toasted */ }
  };
  const reject = async (id) => {
    try {
      await update(id, { status: 'rejected' });
      dropFromTab(id);
      toast.success('Review rejected.');
    } catch { /* update() already toasted */ }
  };
  const toggleFeature = async (r) => {
    try {
      await update(r.id, { featured: !r.featured });
      toast.success(!r.featured ? 'Marked as featured.' : 'Removed from featured.');
    } catch { /* update() already toasted */ }
  };

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this review? This cannot be undone.')) return;
    try {
      await mutate(`/admin/reviews/${id}`, { method: 'DELETE' });
      dropFromTab(id);
      toast.success('Review deleted.');
    } catch (err) {
      if (err?.name === 'AdminUnauthorizedError') return;
      toast.error('Delete failed. ' + (err?.message || ''));
    }
  };

  const verifyPurchase = async (review) => {
    setVerifyingId(review.id);
    try {
      const updated = await mutate(`/admin/reviews/${review.id}/verify`, { method: 'POST' });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
      toast.success('Purchase verified.');
    } catch (err) {
      if (err?.name === 'AdminUnauthorizedError') return;
      toast.error(err?.message || 'Could not verify purchase.');
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
    <AdminGate>
      <>
        <Helmet>
          <title>Review Moderation — Admin</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section className="pt-28 pb-24 min-h-screen bg-[hsl(var(--background))]">
          <div className="mx-auto max-w-[90rem] px-6">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-gold tracking-[0.35em] uppercase text-xs">Administration</span>
                <h1 className="font-display text-primary text-3xl md:text-4xl mt-3">Review Moderation</h1>
                <p className="text-muted-foreground mt-2 text-sm font-light">
                  New submissions stay pending until you approve them. Only approved reviews appear on the website.
                </p>
              </div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-border hover:border-gold transition-colors"
              >
                All orders
              </Link>
            </div>

            <Tabs value={tab} onValueChange={(next) => { setTab(next); setPage(1); }}>
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      type="button"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => p - 1)}
                      className="text-sm px-4 py-2 rounded-full border border-border disabled:opacity-40 hover:border-gold transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-sm px-4 py-2 rounded-full border border-border disabled:opacity-40 hover:border-gold transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </>
    </AdminGate>
  );
};

const ReviewAdminRow = ({
  review: r, editing, editText, onEditText, onStartEdit, onCancelEdit, onSaveEdit,
  onApprove, onReject, onFeature, onVerify, onDelete, verifying,
}) => {
  const url = r.media_url || null;
  const isVideo = url && /\.(mp4|mov|webm)(\?|$)/i.test(url);
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
