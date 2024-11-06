import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet } from "react-nativescript";
import { NotificationService } from "../services/NotificationService";
import { AuthService } from "../services/AuthService";
import { Notification } from "../types";

export function NotificationBell({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationService = NotificationService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const subscription = authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          subscribeToNotifications(user.id);
        }
      },
      error: console.error
    });

    return () => subscription.unsubscribe();
  }, []);

  const subscribeToNotifications = (userId: string) => {
    return notificationService.getUserNotifications(userId).subscribe({
      next: (notifications) => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      },
      error: console.error
    });
  };

  return (
    <gridLayout columns="auto, auto" onTap={() => navigation.navigate('Notifications')}>
      <label col={0} className="fas" text="&#xf0f3;" style={styles.bellIcon} />
      {unreadCount > 0 && (
        <label col={1} text={unreadCount.toString()} style={styles.badge} />
      )}
    </gridLayout>
  );
}

const styles = StyleSheet.create({
  bellIcon: {
    fontSize: 24,
    color: "white",
    padding: 8,
  },
  badge: {
    backgroundColor: "#FF3B30",
    color: "white",
    fontSize: 12,
    padding: 4,
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    textAlignment: "center",
    marginLeft: -10,
    marginTop: -5,
  },
});