/**
 * Notification Service
 * Handles local and push notifications for the app
 * Supports both web notifications and native (iOS/Android) via Capacitor
 */

import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
  actions?: Array<{
    id: string;
    title: string;
  }>;
}

export interface ScheduledNotification extends NotificationPayload {
  scheduledAt: Date;
}

class NotificationService {
  private permissionStatus: NotificationPermission = 'default';
  private isNativePlatform: boolean;
  private localNotifications: any = null;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
    this.initialize();
  }

  /**
   * Initialize notification service
   */
  private async initialize() {
    if (this.isNativePlatform) {
      // Import Capacitor Local Notifications only on native platforms
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        this.localNotifications = LocalNotifications;
        console.log('📱 Native notifications initialized');
      } catch (error) {
        console.error('Failed to load native notifications:', error);
      }
    } else {
      // Web notifications
      if ('Notification' in window) {
        this.permissionStatus = Notification.permission;
        console.log('🌐 Web notifications initialized');
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (this.isNativePlatform && this.localNotifications) {
      try {
        const permission = await this.localNotifications.requestPermissions();
        return permission.display === 'granted';
      } catch (error) {
        console.error('Error requesting native notification permission:', error);
        return false;
      }
    } else if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermission(): Promise<boolean> {
    if (this.isNativePlatform && this.localNotifications) {
      try {
        const permission = await this.localNotifications.checkPermissions();
        return permission.display === 'granted';
      } catch (error) {
        console.error('Error checking native notification permission:', error);
        return false;
      }
    } else if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  /**
   * Send an immediate notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    if (this.isNativePlatform && this.localNotifications) {
      // Native notification
      await this.localNotifications.schedule({
        notifications: [
          {
            id: parseInt(payload.id.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 100000),
            title: payload.title,
            body: payload.body,
            schedule: { at: new Date(Date.now() + 1000) }, // Send immediately (1 second delay)
            extra: payload.data,
            actionTypeId: payload.actions ? 'journey_actions' : undefined,
          },
        ],
      });

      console.log('📱 Native notification sent:', payload.title);
    } else if ('Notification' in window) {
      // Web notification
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/ICON_APP.png',
        badge: '/ICON_APP.png',
        data: payload.data,
        tag: payload.id,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      console.log('🌐 Web notification sent:', payload.title);
    }
  }

  /**
   * Schedule a notification for a specific time
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    if (this.isNativePlatform && this.localNotifications) {
      // Native scheduled notification
      await this.localNotifications.schedule({
        notifications: [
          {
            id: parseInt(notification.id.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 100000),
            title: notification.title,
            body: notification.body,
            schedule: { at: notification.scheduledAt },
            extra: notification.data,
            actionTypeId: notification.actions ? 'journey_actions' : undefined,
          },
        ],
      });

      console.log('📱 Native notification scheduled:', notification.title, 'at', notification.scheduledAt);
    } else {
      // For web, we'll use a timeout (not ideal for long delays, but works for short ones)
      const delay = notification.scheduledAt.getTime() - Date.now();
      
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Max 24 hours
        setTimeout(() => {
          this.sendNotification(notification);
        }, delay);

        console.log('🌐 Web notification scheduled:', notification.title, 'in', Math.round(delay / 1000), 'seconds');
      } else {
        console.warn('Scheduled time is too far in the future for web notifications');
      }
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id: string): Promise<void> {
    if (this.isNativePlatform && this.localNotifications) {
      const numericId = parseInt(id.replace(/\D/g, '').slice(0, 9)) || 0;
      await this.localNotifications.cancel({
        notifications: [{ id: numericId }],
      });
      console.log('📱 Cancelled notification:', id);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (this.isNativePlatform && this.localNotifications) {
      const pending = await this.localNotifications.getPending();
      if (pending.notifications.length > 0) {
        await this.localNotifications.cancel({
          notifications: pending.notifications,
        });
      }
      console.log('📱 Cancelled all notifications');
    }
  }

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    if (this.isNativePlatform && this.localNotifications) {
      const pending = await this.localNotifications.getPending();
      return pending.notifications;
    }
    return [];
  }

  /**
   * Schedule departure notification
   * Notifies user when to leave based on journey time
   */
  async scheduleDepartureNotification(
    journeyId: string,
    departureTime: Date,
    origin: string,
    destination: string,
    advanceMinutes: number = 10
  ): Promise<void> {
    const notificationTime = new Date(departureTime.getTime() - advanceMinutes * 60 * 1000);

    await this.scheduleNotification({
      id: `departure-${journeyId}`,
      title: '🚀 Timp de plecare!',
      body: `Pleacă în ${advanceMinutes} minute spre ${destination}`,
      scheduledAt: notificationTime,
      data: {
        type: 'departure',
        journeyId,
        origin,
        destination,
      },
      actions: [
        { id: 'view', title: 'Vezi călătoria' },
        { id: 'dismiss', title: 'Renunță' },
      ],
    });

    console.log(`⏰ Departure notification scheduled for ${notificationTime.toLocaleString()}`);
  }

  /**
   * Schedule pre-departure notification
   * Warns user about upcoming departure
   */
  async schedulePreDepartureNotification(
    journeyId: string,
    departureTime: Date,
    destination: string,
    advanceMinutes: number = 30
  ): Promise<void> {
    const notificationTime = new Date(departureTime.getTime() - advanceMinutes * 60 * 1000);

    await this.scheduleNotification({
      id: `pre-departure-${journeyId}`,
      title: '⏰ Nu uita!',
      body: `Plecare în ${advanceMinutes} minute spre ${destination}`,
      scheduledAt: notificationTime,
      data: {
        type: 'pre-departure',
        journeyId,
        destination,
      },
    });

    console.log(`⏰ Pre-departure notification scheduled for ${notificationTime.toLocaleString()}`);
  }

  /**
   * Send delay alert notification
   */
  async sendDelayAlert(routeName: string, delayMinutes: number): Promise<void> {
    await this.sendNotification({
      id: `delay-${Date.now()}`,
      title: '⚠️ Întârziere detectată',
      body: `${routeName} întârzie cu ${delayMinutes} minute`,
      data: {
        type: 'delay',
        routeName,
        delayMinutes,
      },
    });
  }

  /**
   * Send crowding alert notification
   */
  async sendCrowdingAlert(routeName: string, crowdingLevel: string): Promise<void> {
    await this.sendNotification({
      id: `crowding-${Date.now()}`,
      title: '👥 Aglomerație',
      body: `${routeName} este ${crowdingLevel}`,
      data: {
        type: 'crowding',
        routeName,
        crowdingLevel,
      },
    });
  }

  /**
   * Send route change notification
   */
  async sendRouteChangeAlert(routeName: string, change: string): Promise<void> {
    await this.sendNotification({
      id: `route-change-${Date.now()}`,
      title: '🔄 Modificare rută',
      body: `${routeName}: ${change}`,
      data: {
        type: 'route-change',
        routeName,
        change,
      },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

