import { Observable } from 'rxjs';
import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-messaging';
import { LocalNotifications } from '@nativescript/local-notifications';
import { Notification } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  private db: firebase.firestore.Firestore;
  private messaging: firebase.messaging.Messaging;

  private constructor() {
    this.db = firebase.firestore();
    this.messaging = firebase.messaging();
    this.initializeNotifications();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeNotifications() {
    try {
      const hasPermission = await this.messaging.hasPermission();
      if (!hasPermission) {
        await this.messaging.requestPermission();
      }

      // Initialize local notifications
      await LocalNotifications.requestPermission();

      // Handle FCM token refresh
      this.messaging.onTokenRefresh((token) => {
        this.updateUserFCMToken(token);
      });

      // Handle incoming messages when app is in foreground
      this.messaging.onMessage((message) => {
        this.showLocalNotification({
          title: message.notification?.title || 'New Notification',
          body: message.notification?.body || '',
          data: message.data
        });
      });
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  private async updateUserFCMToken(token: string) {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      await this.db.collection('users')
        .doc(currentUser.uid)
        .update({ fcmToken: token });
    }
  }

  async showLocalNotification({
    title,
    body,
    data = {}
  }: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    try {
      await LocalNotifications.schedule([{
        id: Date.now(),
        title,
        body,
        forceShowWhenInForeground: true,
        channel: 'default',
        userInfo: data
      }]);
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  async sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<void> {
    try {
      // Store notification in Firestore
      await this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .add({
          ...notification,
          read: false,
          createdAt: new Date()
        });

      // Get user's FCM token
      const userDoc = await this.db.collection('users')
        .doc(userId)
        .get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (fcmToken) {
        // Send FCM notification
        await firebase.functions()
          .httpsCallable('sendPushNotification')({
            token: fcmToken,
            title: notification.title,
            body: notification.message,
            data: {
              type: notification.type,
              userId: notification.userId
            }
          });
      }
    } catch (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  getUserNotifications(userId: string): Observable<Notification[]> {
    return new Observable(subscriber => {
      const unsubscribe = this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Notification[];
          subscriber.next(notifications);
        }, error => {
          subscriber.error(error);
        });

      return () => unsubscribe();
    });
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const batch = this.db.batch();
      const snapshot = await this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .where('read', '==', false)
        .get();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      await this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .delete();
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const batch = this.db.batch();
      const snapshot = await this.db.collection('users')
        .doc(userId)
        .collection('notifications')
        .get();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to clear notifications: ${error.message}`);
    }
  }
}