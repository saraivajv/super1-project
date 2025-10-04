import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';

const router = Router();

router.post('/bookings/:bookingId/review', authMiddleware, roleMiddleware('client'), reviewController.createReview);

router.get('/services/:serviceId/reviews', reviewController.getServiceReviews);

export default router;
