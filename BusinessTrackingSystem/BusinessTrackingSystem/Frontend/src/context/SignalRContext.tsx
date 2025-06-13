import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import apiClient from '../api/client';
import { message } from 'antd';

interface Notification {
    id: number;
    title: string;
    description: string;
    color: 'success' | 'error' | 'warning' | 'info';
    read: boolean;
    date: string;
    icon?: React.ReactNode;
}

interface SignalRContextType {
    isConnected: boolean;
    notifications: Notification[];
    markAsRead: (id: number) => void;
    clearNotifications: () => void;
    markAllAsRead: () => void;
    deleteNotification: (id: number) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

const STORAGE_KEY = 'notifications';

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    // LocalStorage'a kaydetme fonksiyonu
    const saveToLocalStorage = (newNotifications: Notification[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5158/notification-hub", {
                accessTokenFactory: () => token,
                transport: signalR.HttpTransportType.LongPolling,
                skipNegotiation: false,
                withCredentials: true
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        setConnection(newConnection);

        newConnection.start()
            .then(() => {
                console.log('SignalR Connected!');
                setIsConnected(true);
            })
            .catch(err => {
                console.error('SignalR Connection Error:', err);
                setIsConnected(false);
            });

        newConnection.on('ReceiveNotification', (notification: Notification) => {
            const newNotification = {
                ...notification,
                date: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => {
                const updated = [newNotification, ...prev];
                saveToLocalStorage(updated);
                return updated;
            });
        });

        newConnection.onreconnecting(error => {
            console.log('SignalR Reconnecting:', error);
            setIsConnected(false);
        });

        newConnection.onreconnected(connectionId => {
            console.log('SignalR Reconnected:', connectionId);
            setIsConnected(true);
        });

        newConnection.onclose(error => {
            console.log('SignalR Connection Closed:', error);
            setIsConnected(false);
        });

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    const markAsRead = (id: number) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const clearNotifications = () => {
        setNotifications([]);
        saveToLocalStorage([]);
    };

    return (
        <SignalRContext.Provider value={{
            isConnected,
            notifications,
            markAsRead,
            clearNotifications,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (context === undefined) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
}; 