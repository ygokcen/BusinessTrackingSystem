import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import trTR from 'antd/locale/tr_TR';
import HomeScreen from './pages/HomeScreen';
import { ActivityProvider } from './context/ActivityContext';
import { SignalRProvider } from './context/SignalRContext';
import LoginScreen from './pages/auth/LoginScreen';
import EmployeeTracking from './pages/EmployeeTracking';
import QualityControl from './pages/QualityControl';
import { API } from './api/client';

interface User {
    id: string;
    role: number;
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await API.persons.getUserInfo();
                setUser(response);
            } catch (error) {
                console.error('Kullanıcı bilgileri alınamadı:', error);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    console.log(user?.role);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <ConfigProvider
            locale={trTR}
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                },
            }}
        >
            <SignalRProvider>
                <ActivityProvider>
                    <Router>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                        <HomeScreen />
                                }
                            />
                            <Route
                                path="/employee/:id"
                                element={
                                        <EmployeeTracking />
                                }
                            />
                            <Route
                                path="/login"
                                element={
                                        <LoginScreen />
                                }
                            />
                            <Route
                                path="/quality-control"
                                element={
                                        <QualityControl />
                                }
                            />
                        </Routes>
                    </Router>
                </ActivityProvider>
            </SignalRProvider>
        </ConfigProvider>
    );
};

export default App;