import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import healthCheck from './health-check.js';
import { createOrder, verifyPayment } from './razorpay.js';
import { requireAdminCredentials } from '../middleware/admin-auth.js';
import {
  adminLogin,
  listOrders,
  getOrder,
  listReviews,
  patchReview,
  deleteReview,
  verifyReviewPurchase,
  submitReview,
} from './admin.js';
import {
  status as delhiveryStatus,
  registerWarehouse as delhiveryWarehouse,
  getRate as delhiveryRate,
  createShipment,
  getLabel,
  bookPickup,
  cancelShipment,
  trackOrder as delhiveryTrack,
  getPod as delhiveryPod,
} from './delhivery.js';

const router = Router();

const quoteLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many shipping-rate requests. Please try again shortly.' },
  validate: { trustProxy: false },
});

const reviewSubmitLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many review submissions. Try again later.' },
  validate: { trustProxy: false },
});

const adminLoginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again later.' },
  validate: { trustProxy: false },
});

export default () => {
  router.get('/health', healthCheck);
  router.post('/razorpay/create-order', createOrder);
  router.post('/razorpay/verify-payment', verifyPayment);

  router.post('/admin/login', adminLoginLimit, adminLogin);
  router.get('/admin/orders', requireAdminCredentials, listOrders);
  router.get('/admin/orders/:id', requireAdminCredentials, getOrder);
  router.get('/admin/reviews', requireAdminCredentials, listReviews);
  router.patch('/admin/reviews/:id', requireAdminCredentials, patchReview);
  router.delete('/admin/reviews/:id', requireAdminCredentials, deleteReview);
  router.post('/admin/reviews/:id/verify', requireAdminCredentials, verifyReviewPurchase);

  router.post('/reviews/submit', reviewSubmitLimit, submitReview);

  router.get('/delhivery/status', delhiveryStatus);
  router.post('/delhivery/warehouse', delhiveryWarehouse);
  router.post('/delhivery/rate', quoteLimit, delhiveryRate);
  router.post('/delhivery/create', createShipment);
  router.post('/delhivery/label', getLabel);
  router.post('/delhivery/pickup', bookPickup);
  router.post('/delhivery/cancel', cancelShipment);
  router.post('/delhivery/track', delhiveryTrack);
  router.post('/delhivery/pod', delhiveryPod);

  return router;
};
