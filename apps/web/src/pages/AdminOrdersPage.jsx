import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Loader2, Package, LogOut, Star } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { adminApiJson, AdminUnauthorizedError } from '@/lib/adminAuth';
import AdminGate from '@/components/AdminGate';
import OrderListCard from '@/components/OrderListCard';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

const AdminOrdersPage = () => {
  const { session, logout } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadSeq = useRef(0);

  const onUnauthorized = useCallback(() => {
    logout();
    window.location.assign('/admin/login');
  }, [logout]);

  const load = useCallback(async (p) => {
    if (!session) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    setLoadError('');
    try {
      const data = await adminApiJson(
        session,
        `/admin/orders?page=${p}&perPage=${PAGE_SIZE}`,
        {},
        onUnauthorized,
      );
      if (seq !== loadSeq.current) return;
      const pages = Math.max(1, Number(data.totalPages) || 1);
      setOrders(data.items || []);
      setTotalPages(pages);
      setPage(Math.min(Number(data.page) || p, pages));
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (err instanceof AdminUnauthorizedError) return;
      const msg = err?.message || 'Could not load orders.';
      setLoadError(msg);
      toast.error(msg);
      setOrders([]);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [session, onUnauthorized]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleLogout = () => {
    logout();
    window.location.assign('/admin/login');
  };

  return (
    <AdminGate>
      <Helmet>
        <title>Orders — Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="pt-32 md:pt-40 pb-20 bg-[hsl(var(--background))]">
        <div className="mx-auto max-w-[90rem] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-gold tracking-[0.35em] uppercase text-xs block">Administration</span>
              <h1 className="font-display text-primary text-4xl md:text-5xl mt-4">All Orders</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/admin/reviews"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-border hover:border-gold transition-colors"
              >
                <Star className="h-4 w-4" /> Review moderation
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : loadError ? (
              <div className="text-center py-12 text-destructive text-sm">{loadError}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.25} />
                <p className="font-display text-xl text-primary">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <OrderListCard
                    key={o.id}
                    order={o}
                    detailPath={`/admin/orders/${o.id}`}
                    showCustomer
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => load(page - 1)}
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
                  onClick={() => load(page + 1)}
                  className="text-sm px-4 py-2 rounded-full border border-border disabled:opacity-40 hover:border-gold transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminGate>
  );
};

export default AdminOrdersPage;
