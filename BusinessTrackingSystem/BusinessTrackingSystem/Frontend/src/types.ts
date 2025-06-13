// src/types.ts
export interface Notification {
    id: number;
    title: string;
    icon: string;
    description: string;
    color: 'success' | 'error' | 'warning' | 'info' | 'default';
    read: boolean;
    date: string;
}

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: number) => void;
}