/**
 * Alert Manager for handling multi-stage proximity alerts
 * Manages notifications, vibrations, and voice announcements
 */

import { ProximityAlert } from '../navigation/proximity-detector';

export interface AlertConfig {
  enableNotifications?: boolean;
  enableVibration?: boolean;
  enableSound?: boolean;
  enableVoice?: boolean;
}

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ManagedAlert extends ProximityAlert {
  id: string;
  priority: AlertPriority;
  message: string;
  dismissed: boolean;
}

export class AlertManager {
  private config: AlertConfig;
  private activeAlerts: Map<string, ManagedAlert> = new Map();
  private alertQueue: ManagedAlert[] = [];
  private notificationPermission: NotificationPermission = 'default';

  constructor(config: AlertConfig = {}) {
    this.config = {
      enableNotifications: true,
      enableVibration: true,
      enableSound: true,
      enableVoice: false, // Voice guidance disabled by default
      ...config,
    };

    this.initializeNotifications();
  }

  /**
   * Initialize browser notifications
   */
  private async initializeNotifications(): Promise<void> {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;

      if (this.notificationPermission === 'default') {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        console.log(`🔔 Notification permission: ${permission}`);
      }
    }
  }

  /**
   * Process a proximity alert
   */
  async processAlert(alert: ProximityAlert): Promise<void> {
    const priority = this.determinePriority(alert);
    const message = this.generateMessage(alert);
    const alertId = `${alert.zone.id}-${alert.alertLevel}`;

    // Check if alert already exists
    if (this.activeAlerts.has(alertId)) {
      return;
    }

    const managedAlert: ManagedAlert = {
      ...alert,
      id: alertId,
      priority,
      message,
      dismissed: false,
    };

    this.activeAlerts.set(alertId, managedAlert);
    this.alertQueue.push(managedAlert);

    console.log(`🔔 Processing alert: ${message} (${priority} priority)`);

    // Trigger alerts based on configuration and priority
    if (this.config.enableNotifications && this.notificationPermission === 'granted') {
      this.showNotification(managedAlert);
    }

    if (this.config.enableVibration && 'vibrate' in navigator) {
      this.triggerVibration(priority);
    }

    if (this.config.enableSound) {
      this.playSound(priority);
    }

    if (this.config.enableVoice) {
      this.speakMessage(message);
    }
  }

  /**
   * Determine alert priority based on distance and type
   */
  private determinePriority(alert: ProximityAlert): AlertPriority {
    if (alert.alertLevel === 'arrived') {
      return 'critical';
    }

    if (alert.alertLevel === 'near') {
      return alert.zone.type === 'destination' ? 'critical' : 'high';
    }

    if (alert.alertLevel === 'approaching') {
      return alert.zone.type === 'stop' ? 'medium' : 'high';
    }

    return 'low';
  }

  /**
   * Generate human-readable message for alert
   */
  private generateMessage(alert: ProximityAlert): string {
    const { zone, alertLevel, distance } = alert;
    const distanceText = distance < 100 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;

    switch (alertLevel) {
      case 'arrived':
        if (zone.type === 'stop') {
          return `🔔 Coboară acum la ${zone.name}!`;
        }
        return `🎉 Ai ajuns la ${zone.name}!`;

      case 'near':
        if (zone.type === 'stop') {
          return `⚠️ Pregătește-te să cobori la ${zone.name} (${distanceText})`;
        }
        return `📍 Aproape de ${zone.name} (${distanceText})`;

      case 'approaching':
        if (zone.type === 'transfer') {
          return `🔄 Transfer în curând la ${zone.name} (${distanceText})`;
        }
        return `🚏 Te apropii de ${zone.name} (${distanceText})`;

      default:
        return `📍 ${zone.name} (${distanceText})`;
    }
  }

  /**
   * Show browser notification
   */
  private showNotification(alert: ManagedAlert): void {
    if (this.notificationPermission !== 'granted') return;

    try {
      const notification = new Notification('TransitZen Navigation', {
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.priority === 'critical',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close non-critical notifications after 5 seconds
      if (alert.priority !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Trigger device vibration based on priority
   */
  private triggerVibration(priority: AlertPriority): void {
    if (!('vibrate' in navigator)) return;

    const pattern = this.getVibrationPattern(priority);
    navigator.vibrate(pattern);
  }

  /**
   * Get vibration pattern based on priority
   */
  private getVibrationPattern(priority: AlertPriority): number[] {
    switch (priority) {
      case 'critical':
        return [200, 100, 200, 100, 200]; // Long, urgent pattern
      case 'high':
        return [100, 100, 100]; // Medium pattern
      case 'medium':
        return [100, 50, 100]; // Short pattern
      case 'low':
      default:
        return [50]; // Single short vibration
    }
  }

  /**
   * Play alert sound
   */
  private playSound(priority: AlertPriority): void {
    // Use Web Audio API or HTML5 Audio for sound playback
    // For now, use the system beep
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Different frequencies for different priorities
      const frequency = {
        critical: 880,
        high: 660,
        medium: 440,
        low: 330,
      }[priority];

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Speak message using text-to-speech
   */
  private speakMessage(message: string): void {
    if (!('speechSynthesis' in window)) return;

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'ro-RO';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking message:', error);
    }
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.dismissed = true;
      this.activeAlerts.delete(alertId);
      console.log(`🔕 Dismissed alert: ${alertId}`);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): ManagedAlert[] {
    return Array.from(this.activeAlerts.values()).filter((alert) => !alert.dismissed);
  }

  /**
   * Get alerts by priority
   */
  getAlertsByPriority(priority: AlertPriority): ManagedAlert[] {
    return this.getActiveAlerts().filter((alert) => alert.priority === priority);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.activeAlerts.clear();
    this.alertQueue = [];
    console.log('🔕 Cleared all alerts');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Alert config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Check if notifications are supported and permitted
   */
  canShowNotifications(): boolean {
    return 'Notification' in window && this.notificationPermission === 'granted';
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission;
    }
    return 'denied';
  }
}

/**
 * Singleton instance for global alert management
 */
export const alertManager = new AlertManager({
  enableNotifications: true,
  enableVibration: true,
  enableSound: true,
  enableVoice: false, // Can be enabled by user in settings
});
