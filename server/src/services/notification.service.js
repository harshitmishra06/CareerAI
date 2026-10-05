import mongoose from 'mongoose';
import { Notification } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const NotificationTypes = {
  APPLICATION_STATUS_CHANGED: 'APPLICATION_STATUS_CHANGED',
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  JOB_MATCH: 'JOB_MATCH',
  RESUME_ANALYSIS_COMPLETED: 'RESUME_ANALYSIS_COMPLETED',
  SYSTEM: 'SYSTEM'
};

export class NotificationService {
  /**
   * Create an in-app notification for a user
   */
  static async createNotification({ user, type, title, message, metadata = {} }) {
    if (!user) {
      throw new AppError('Notification recipient user is required', 400);
    }

    // Optional de-duplication: avoid spamming duplicate notifications within a 5-second window
    if (metadata.applicationId || metadata.analysisId) {
      const matchCriteria = {
        user,
        type,
        createdAt: { $gte: new Date(Date.now() - 5000) }
      };
      if (metadata.applicationId) matchCriteria['metadata.applicationId'] = metadata.applicationId;
      if (metadata.analysisId) matchCriteria['metadata.analysisId'] = metadata.analysisId;

      const recentDuplicate = await Notification.findOne(matchCriteria);
      if (recentDuplicate) {
        return recentDuplicate;
      }
    }

    const notification = await Notification.create({
      user,
      type,
      title: title.trim(),
      message: message.trim(),
      metadata,
      readAt: null
    });

    return notification;
  }

  /**
   * List paginated notifications for the authenticated user
   */
  static async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { user: userId };
    if (unreadOnly === true || unreadOnly === 'true') {
      query.readAt = null;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, readAt: null }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    // Format with helper boolean isRead
    const formatted = notifications.map((n) => ({
      ...n,
      isRead: Boolean(n.readAt)
    }));

    return {
      notifications: formatted,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        unreadCount
      }
    };
  }

  /**
   * Get unread notification count for authenticated user
   */
  static async getUnreadCount(userId) {
    const unreadCount = await Notification.countDocuments({ user: userId, readAt: null });
    return { unreadCount };
  }

  /**
   * Mark a single notification as read (with strict IDOR protection)
   */
  static async markAsRead(userId, notificationId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format', 400);
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // IDOR Protection: User can only mark their own notifications as read
    if (notification.user.toString() !== userId.toString()) {
      throw new AppError('Unauthorized: You can only manage your own notifications', 403);
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    const obj = notification.toObject();
    obj.isRead = true;
    return obj;
  }

  /**
   * Mark all unread notifications as read for authenticated user
   */
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { user: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return {
      modifiedCount: result.modifiedCount || 0
    };
  }
}

export default NotificationService;
