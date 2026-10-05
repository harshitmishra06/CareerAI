import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List paginated notifications for authenticated user
   */
  static async getNotifications(req, res, next) {
    try {
      const result = await NotificationService.getNotifications(req.user._id, req.query);
      res.status(200).json({
        success: true,
        data: result.notifications,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification badge count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const result = await NotificationService.getUnreadCount(req.user._id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.user._id, req.params.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications as read
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user._id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default NotificationController;
