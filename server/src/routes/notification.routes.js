import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();

// All notification operations require authentication
router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
