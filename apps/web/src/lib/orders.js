export const formatINR = (paise) =>
  `\u20b9${((paise || 0) / 100).toFixed(2)}`;

export const ORDER_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

export const formatOrderDate = (iso) => {
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

export const orderDisplayId = (order) =>
  order?.order_number || order?.razorpay_order_id || order?.id || '—';
