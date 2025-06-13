import { createContext } from 'react';

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
    addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
    markAsRead: (id: number) => void;
    deleteNotification: (id: number) => void;
    clearAll: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    addNotification: () => {},
    markAsRead: () => {},
    deleteNotification: () => {},
    clearAll: () => {},
});