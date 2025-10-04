import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';

const router = Router();

router.post('/bookings', authMiddleware, roleMiddleware('client'), bookingController.createBooking);

router.get('/client/bookings', authMiddleware, roleMiddleware('client'), bookingController.getClientBookings);
router.get('/provider/bookings', authMiddleware, roleMiddleware('provider'), bookingController.getProviderBookings);
router.put('/bookings/:id/status', authMiddleware, bookingController.updateBookingStatus);

export default router;
