import multer from 'multer';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import { credentialsMatchAdmin } from '../middleware/admin-auth.js';

const STATUSES = new Set(['pending', 'approved', 'rejected']);
const PATCH_KEYS = new Set([
  'status', 'review_text', 'featured', 'verified_purchase', 'admin_notes',
]);
const REVIEW_CATEGORIES = new Set([
  'Wedding Hampers',
  'Corporate Gifting',
  'MDF & Leatherette Baskets',
  'Jute & Cotton Canvas Bags',
  'Custom Packaging',
]);
const ALLOWED_MEDIA = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MEDIA.has(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported media type.'));
  },
});

function pageQuery(req) {
  return {
    page: Math.max(1, Number(req.query.page) || 1),
    perPage: Math.min(100, Math.max(1, Number(req.query.perPage) || 50)),
  };
}

function notFound(err, res, label) {
  if (err?.status === 404) {
    res.status(404).json({ error: `${label} not found.` });
    return true;
  }
  return false;
}

function serializeReview(record) {
  const data = typeof record?.export === 'function' ? record.export() : { ...record };
  return {
    ...data,
    media_url: data?.media ? pocketbaseClient.files.getURL(record, data.media) : null,
  };
}

export function adminLogin(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!credentialsMatchAdmin(email, password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  return res.json({ ok: true, email });
}

export async function listOrders(req, res, next) {
  try {
    const { page, perPage } = pageQuery(req);
    const result = await pocketbaseClient.collection('orders').getList(page, perPage, {
      sort: '-created',
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const record = await pocketbaseClient.collection('orders').getOne(req.params.id);
    return res.json(record);
  } catch (err) {
    if (notFound(err, res, 'Order')) return undefined;
    return next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const status = String(req.query.status || 'pending');
    if (!STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter.' });
    }
    const { page, perPage } = pageQuery(req);
    const result = await pocketbaseClient.collection('reviews').getList(page, perPage, {
      filter: `status = "${status}"`,
      sort: '-created',
    });
    return res.json({
      ...result,
      items: (result.items || []).map(serializeReview),
    });
  } catch (err) {
    return next(err);
  }
}

export async function patchReview(req, res, next) {
  try {
    const patch = {};
    for (const key of PATCH_KEYS) {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }
    if (patch.status !== undefined && !STATUSES.has(String(patch.status))) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const updated = await pocketbaseClient.collection('reviews').update(req.params.id, patch);
    return res.json(serializeReview(updated));
  } catch (err) {
    if (notFound(err, res, 'Review')) return undefined;
    return next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    await pocketbaseClient.collection('reviews').delete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    if (notFound(err, res, 'Review')) return undefined;
    return next(err);
  }
}

export async function verifyReviewPurchase(req, res, next) {
  try {
    const review = await pocketbaseClient.collection('reviews').getOne(req.params.id);
    const orderNumber = String(review.order_number || '').trim();
    if (!orderNumber) {
      return res.status(400).json({ error: 'Review has no order number.' });
    }
    let order;
    try {
      const escaped = orderNumber.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      order = await pocketbaseClient.collection('orders').getFirstListItem(
        `order_number = "${escaped}"`,
      );
    } catch {
      return res.status(404).json({ error: 'No matching order found.' });
    }
    if (String(order.status) !== 'paid') {
      return res.status(400).json({ error: `Order found but status is "${order.status}".` });
    }
    const updated = await pocketbaseClient.collection('reviews').update(review.id, {
      verified_purchase: true,
    });
    return res.json(serializeReview(updated));
  } catch (err) {
    if (notFound(err, res, 'Review')) return undefined;
    return next(err);
  }
}

function parseRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

async function submitReviewHandler(req, res, next) {
  try {
    if (req.body?.website) return res.json({ ok: true });

    const customerName = String(req.body?.customer_name || '').trim();
    const productPurchased = String(req.body?.product_purchased || '').trim();
    const category = String(req.body?.category || '').trim();
    const reviewText = String(req.body?.review_text || '').trim();
    const rating = parseRating(req.body?.rating);
    const consent = req.body?.consent === true || req.body?.consent === 'true';

    if (!customerName || !productPurchased || !REVIEW_CATEGORIES.has(category)) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    if (!rating) return res.status(400).json({ error: 'Please choose a star rating.' });
    if (reviewText.length < 10) {
      return res.status(400).json({ error: 'Review text must be at least 10 characters.' });
    }
    if (!consent) return res.status(400).json({ error: 'Consent is required to submit a review.' });

    const fd = new FormData();
    fd.append('customer_name', customerName);
    fd.append('product_purchased', productPurchased);
    fd.append('category', category);
    fd.append('rating', String(rating));
    fd.append('review_text', reviewText);
    fd.append('order_number', String(req.body?.order_number || '').trim());
    fd.append('consent', 'true');
    fd.append('status', 'pending');
    fd.append('verified_purchase', 'false');
    fd.append('featured', 'false');
    if (req.body?.owner) fd.append('owner', String(req.body.owner));
    if (req.file) {
      fd.append(
        'media',
        new Blob([req.file.buffer], { type: req.file.mimetype }),
        req.file.originalname,
      );
    }

    await pocketbaseClient.collection('reviews').create(fd);
    return res.status(201).json({ ok: true, status: 'pending' });
  } catch (err) {
    return next(err);
  }
}

function handleUploadError(err, req, res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Media file must be 10 MB or smaller.' });
  }
  if (err?.message === 'Unsupported media type.') {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
}

export const submitReview = [upload.single('media'), handleUploadError, submitReviewHandler];
