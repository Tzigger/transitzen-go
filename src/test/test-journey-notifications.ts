/**
 * Test Journey Notifications
 * Creates a fake journey with real-time notifications
 */

import { notificationService } from '../lib/notifications/notification-service';

/**
 * Schedule notifications for a test journey
 * Journey: Palatul Culturii -> Copou
 * Departure: Today at 11:00
 */
export async function scheduleTestJourneyNotifications() {
  console.log('🚀 Starting test journey notification setup...');

  // Get today's date at 11:00
  const today = new Date();
  const departureTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    11, // 11:00
    0,
    0
  );

  const currentTime = new Date();
  console.log('📅 Current time:', currentTime.toLocaleString('ro-RO'));
  console.log('🕐 Departure time:', departureTime.toLocaleString('ro-RO'));

  // Check if departure time is in the past
  if (departureTime < currentTime) {
    console.warn('⚠️ Departure time is in the past. Adjusting to next occurrence...');
    // If it's past 11:00 today, schedule for 11:00 tomorrow
    departureTime.setDate(departureTime.getDate() + 1);
    console.log('🕐 New departure time:', departureTime.toLocaleString('ro-RO'));
  }

  // Request permission first
  const hasPermission = await notificationService.checkPermission();
  if (!hasPermission) {
    console.log('📱 Requesting notification permission...');
    const granted = await notificationService.requestPermission();
    if (!granted) {
      console.error('❌ Notification permission denied!');
      return;
    }
    console.log('✅ Notification permission granted!');
  } else {
    console.log('✅ Already have notification permission');
  }

  try {
    // 1. Departure notification (exactly at 11:00)
    console.log('⏰ Scheduling departure notification for:', departureTime.toLocaleString('ro-RO'));
    await notificationService.scheduleNotification({
      id: 'test-journey-departure',
      title: '🚀 Time to leave!',
      body: 'Your bus from Palatul Culturii to Copou is departing now',
      scheduledAt: departureTime,
      data: {
        type: 'departure',
        origin: 'Palatul Culturii',
        destination: 'Copou',
        route: 'Bus',
      },
    });
    console.log('✅ Departure notification scheduled');

    // 2. Delay alert notification (1 minute after departure)
    const delayTime = new Date(departureTime.getTime() + 60 * 1000); // +1 minute
    console.log('⏰ Scheduling delay notification for:', delayTime.toLocaleString('ro-RO'));
    await notificationService.scheduleNotification({
      id: 'test-journey-delay',
      title: '⚠️ Bus Delay Alert',
      body: 'Your bus is running 2 minutes late. New estimated departure: 11:02',
      scheduledAt: delayTime,
      data: {
        type: 'delay',
        delayMinutes: 2,
        route: 'Bus to Copou',
      },
    });
    console.log('✅ Delay notification scheduled');

    // Get pending notifications to verify
    const pending = await notificationService.getPendingNotifications();
    console.log('📋 Pending notifications:', pending.length);
    console.log('📋 Details:', pending);

    console.log('\n✅ Test journey notifications scheduled successfully!');
    console.log('📱 You will receive:');
    console.log(`   1. Departure notification at ${departureTime.toLocaleTimeString('ro-RO')}`);
    console.log(`   2. Delay notification at ${delayTime.toLocaleTimeString('ro-RO')}`);
    
    return {
      departureTime,
      delayTime,
      pendingCount: pending.length,
    };
  } catch (error) {
    console.error('❌ Error scheduling notifications:', error);
    throw error;
  }
}

/**
 * Schedule immediate test notifications (for quick testing)
 * Will send notifications in 10 seconds and 70 seconds
 */
export async function scheduleImmediateTestNotifications() {
  console.log('🚀 Starting immediate test notifications...');

  const hasPermission = await notificationService.checkPermission();
  if (!hasPermission) {
    const granted = await notificationService.requestPermission();
    if (!granted) {
      console.error('❌ Notification permission denied!');
      return;
    }
  }

  const now = new Date();
  
  // Notification 1: In 10 seconds
  const departureTime = new Date(now.getTime() + 10 * 1000);
  console.log('⏰ Scheduling departure notification for:', departureTime.toLocaleTimeString('ro-RO'));
  await notificationService.scheduleNotification({
    id: 'immediate-test-departure',
    title: '🚀 Time to leave!',
    body: 'Your bus from Palatul Culturii to Copou is departing now',
    scheduledAt: departureTime,
    data: {
      type: 'departure',
      origin: 'Palatul Culturii',
      destination: 'Copou',
    },
  });

  // Notification 2: In 70 seconds (10 + 60)
  const delayTime = new Date(now.getTime() + 70 * 1000);
  console.log('⏰ Scheduling delay notification for:', delayTime.toLocaleTimeString('ro-RO'));
  await notificationService.scheduleNotification({
    id: 'immediate-test-delay',
    title: '⚠️ Bus Delay Alert',
    body: 'Your bus is running 2 minutes late. New estimated departure: 11:02',
    scheduledAt: delayTime,
    data: {
      type: 'delay',
      delayMinutes: 2,
    },
  });

  console.log('✅ Immediate test notifications scheduled!');
  console.log('📱 You will receive:');
  console.log(`   1. Departure notification in 10 seconds`);
  console.log(`   2. Delay notification in 70 seconds (1 min 10 sec)`);

  return { departureTime, delayTime };
}

/**
 * Cancel all test notifications
 */
export async function cancelTestNotifications() {
  console.log('🗑️ Cancelling test notifications...');
  
  try {
    await notificationService.cancelNotification('test-journey-departure');
    await notificationService.cancelNotification('test-journey-delay');
    await notificationService.cancelNotification('immediate-test-departure');
    await notificationService.cancelNotification('immediate-test-delay');
    
    console.log('✅ Test notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
}

