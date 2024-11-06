import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-nativescript";
import { NotificationService } from "../services/NotificationService";
import { AuthService } from "../services/AuthService";
import { Notification } from "../types";

export function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const subscription = authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          setCurrentUserId(user.id);
          subscribeToNotifications(user.id);
        }
      },
      error: console.error
    });

    return () => subscription.unsubscribe();
  }, []);

  const subscribeToNotifications = (userId: string) => {
    const subscription = notificationService
      .getUserNotifications(userId)
      .subscribe({
        next: (newNotifications) => {
          setNotifications(newNotifications);
          setLoading(false);
        },
        error: (error) => {
          console.error(error);
          setLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!currentUserId) return;

    try {
      if (!notification.read) {
        await notificationService.markNotificationAsRead(currentUserId, notification.id);
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'chat':
          navigation.navigate('Chat', {
            productId: notification.data?.productId,
            sellerId: notification.data?.sellerId
          });
          break;
        case 'offer':
          navigation.navigate('ProductDetail', {
            productId: notification.data?.productId
          });
          break;
        case 'review':
          navigation.navigate('ProductDetail', {
            productId: notification.data?.productId,
            scrollToReviews: true
          });
          break;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    try {
      await notificationService.markAllNotificationsAsRead(currentUserId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    if (!currentUserId) return;
    try {
      await notificationService.clearAllNotifications(currentUserId);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <activityIndicator busy={true} />;
  }

  return (
    <gridLayout rows="auto, *" style={styles.container}>
      {/* Actions Bar */}
      <gridLayout columns="*, *" row={0} style={styles.actionsBar}>
        <button
          col={0}
          className="primary-button"
          onTap={handleMarkAllAsRead}
          style={styles.actionButton}
        >
          Mark All as Read
        </button>
        <button
          col={1}
          className="secondary-button"
          onTap={handleClearAll}
          style={styles.actionButton}
        >
          Clear All
        </button>
      </gridLayout>

      {/* Notifications List */}
      <scrollView row={1}>
        <stackLayout>
          {notifications.length === 0 ? (
            <stackLayout style={styles.emptyState}>
              <label className="fas" text="&#xf0f3;" style={styles.emptyIcon} />
              <label style={styles.emptyText}>No notifications yet</label>
            </stackLayout>
          ) : (
            notifications.map((notification) => (
              <gridLayout
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.unreadNotification
                ]}
                onTap={() => handleNotificationPress(notification)}
              >
                <stackLayout>
                  <label style={styles.notificationTitle}>
                    {notification.title}
                  </label>
                  <label style={styles.notificationMessage}>
                    {notification.message}
                  </label>
                  <label style={styles.notificationTime}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </label>
                </stackLayout>
              </gridLayout>
            ))
          )}
        </stackLayout>
      </scrollView>
    </gridLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECE5DD",
  },
  actionsBar: {
    padding: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#128C7E",
  },
  actionButton: {
    margin: 4,
  },
  notificationItem: {
    backgroundColor: "white",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 4,
    borderLeftColor: "#128C7E",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#075E54",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4A4A4A",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 4,
  },
  emptyState: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    color: "#128C7E",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#4A4A4A",
  },
});