import React, { createContext, useContext, useState, useEffect } from 'react';

interface Activity {
    id: number;
    type: 'view' | 'create' | 'update' | 'delete';
    entity: 'order' | 'person' | 'section' | 'log';
    details: string;
    timestamp: string;
}

interface ActivityContextType {
    activities: Activity[];
    addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
    clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = 'user_activities';
const MAX_ACTIVITIES = 5;

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activities, setActivities] = useState<Activity[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    const saveToLocalStorage = (newActivities: Activity[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));
    };

    const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };

        setActivities(prev => {
            const updated = [newActivity, ...prev].slice(0, MAX_ACTIVITIES);
            saveToLocalStorage(updated);
            return updated;
        });
    };

    const clearActivities = () => {
        setActivities([]);
        saveToLocalStorage([]);
    };

    return (
        <ActivityContext.Provider value={{
            activities,
            addActivity,
            clearActivities
        }}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
}; 