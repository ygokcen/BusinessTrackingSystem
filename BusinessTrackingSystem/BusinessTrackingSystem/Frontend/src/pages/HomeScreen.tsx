import React, {useState, useEffect, useRef} from 'react';
import {
    Tabs,
    Typography,
    Space,
    Avatar,
    Badge,
    theme,
    Divider,
    FloatButton,
    Tooltip,
    Dropdown,
    Menu,
    notification,
    Tag,
    Upload,
    Button,
    message,
    Progress,
    Modal,
    Form,
    Input,
    Switch,
    Select,
    List,
    Card,
    Empty,
} from 'antd';
import {
    DashboardOutlined,
    OrderedListOutlined,
    TeamOutlined,
    HistoryOutlined,
    PlusOutlined,
    BellOutlined,
    BulbOutlined,
    FileExcelOutlined,
    LogoutOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import ProductionSession from "../components/sessions/ProductionSession";
import OrderSession from "../components/sessions/OrderSession";
import TeamSession from "../components/sessions/TeamSession";
import LogSession from "../components/sessions/LogSession";
import ExcelSession from "../components/sessions/ExcelSession";
import {RcFile} from 'antd/es/upload';
import * as signalR from '@microsoft/signalr';
import apiClient, {API} from '../api/client';
import {useSignalR} from '../context/SignalRContext';
import {useActivity} from '../context/ActivityContext';

const {Title, Text} = Typography;
const {Dragger} = Upload;
const {Option} = Select;

interface Notification {
    id: number;
    title: string;
    description: string;
    color: 'success' | 'error' | 'warning' | 'info' | string;
    read: boolean;
    date: string;
    icon: React.ReactNode;
}

const HomeScreen = () => {
    const {token} = theme.useToken();
    const [activeTab, setActiveTab] = useState('production');
    const {notifications, markAsRead, clearNotifications, isConnected} = useSignalR();
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<RcFile | null>(null);
    const [systemStatus, setSystemStatus] = useState('active');
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [recentModalVisible, setRecentModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [productionStatus, setProductionStatus] = useState<'running' | 'paused'>('running');
    const [loading, setLoading] = useState(false);

    const {activities} = useActivity();

    const [recentActions, setRecentActions] = useState<Array<{
        id: number;
        action: string;
        details: string;
        timestamp: string;
    }>>([
        {
            id: 1,
            action: 'İş Emri Güncellendi',
            details: '2024-1555 - Durum: AÇIK -> Bitti',
            timestamp: '2024-03-20T10:30:00'
        },
        {
            id: 2,
            action: 'Yeni İş Emri Oluşturuldu',
            details: '2024-1554 - HITACHI_TXpert_Hub_Kabinet_VIETNAM RAL7042',
            timestamp: '2024-03-20T09:15:00'
        }
    ]);

    // Klavye kısayolları
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInputFocused = document.activeElement?.tagName === 'INPUT';
            const isTextareaFocused = document.activeElement?.tagName === 'TEXTAREA';

            if (isInputFocused || isTextareaFocused) return;

            if (e.key === '1') setActiveTab('production');
            if (e.key === '2') setActiveTab('teams');
            if (e.key === '3') setActiveTab('logs');
            if (e.key === '4') setActiveTab('excel');
            if (e.ctrlKey && e.key === 'n') setUploadModalVisible(true);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const showToastNotification = (notification: Notification) => {
        api[notification.color === 'error' ? 'error' :
            notification.color === 'warning' ? 'warning' :
                notification.color === 'success' ? 'success' : 'info']({
            message: notification.title,
            description: notification.description,
            placement: 'bottomRight',
            duration: 5,
        });
    };

    // Excel yükleme işlemi
    const handleUpload = async (file: RcFile) => {
        setSelectedFile(file);
        setUploading(true);
        setUploadStatus('uploading');
        setUploadMessage('Dosya yükleniyor...');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/ExcelUpload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(percentCompleted);
                }
            });

            if (response.data) {
                setUploadStatus('success');
                setUploadProgress(100);
                setUploadMessage('Dosya başarıyla yüklendi!');
                message.success('Dosya başarıyla yüklendi!');
            }
        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            setUploadStatus('error');
            setUploadMessage('Dosya yüklenirken bir hata oluştu!');
            message.error('Dosya yüklenirken bir hata oluştu!');
        } finally {
            setUploading(false);
        }
    };

    const notificationMenu = (
        <Menu style={{minWidth: 300}}>
            {notifications.length === 0 ? (
                <Menu.Item disabled style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    color: token.colorTextSecondary
                }}>
                    <Space direction="vertical" size={8}>
                        <BellOutlined style={{fontSize: 24}}/>
                        <Text>Yeni bildirim yok</Text>
                    </Space>
                </Menu.Item>
            ) : (
                notifications.map(n => (
                    <Menu.Item
                        key={n.id}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: n.read ? 'transparent' : token.colorPrimaryBg,
                            borderLeft: n.read ? 'none' : `3px solid ${token.colorPrimary}`,
                            margin: '4px 0'
                        }}
                        onClick={() => markAsRead(n.id)}
                    >
                        <Space direction="vertical" size={4} style={{width: '100%'}}>
                            <Space style={{width: '100%', justifyContent: 'space-between'}}>
                                <Space>
                                    {!n.read && <Badge dot status="processing"/>}
                                    <Text strong>{n.title}</Text>
                                </Space>
                                <Text type="secondary" style={{fontSize: '12px'}}>
                                    {new Date(n.date).toLocaleTimeString()}
                                </Text>
                            </Space>
                            <Text type="secondary" style={{fontSize: '13px'}}>
                                {n.description}
                            </Text>
                        </Space>
                    </Menu.Item>
                ))
            )}
            {notifications.length > 0 && (
                <>
                    <Menu.Divider style={{margin: 0}}/>
                    <Menu.Item
                        key="clear"
                        onClick={clearNotifications}
                        style={{
                            textAlign: 'center',
                            color: token.colorError,
                            marginTop: 4
                        }}
                    >
                        Tümünü Temizle
                    </Menu.Item>
                </>
            )}
        </Menu>
    );

    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.length - unreadCount;

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = () => {
        try {
            // SignalR bağlantısını kapat
            if (connectionRef.current) {
                connectionRef.current.stop();
            }

            // Local storage'dan token'ı temizle
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Bildirimleri temizle
            clearNotifications();

            // Ana sayfaya yönlendir
            window.location.href = '/login';
        } catch (error) {
            console.error('Çıkış yapılırken hata oluştu:', error);
            message.error('Çıkış yapılırken bir hata oluştu');
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'view':
                return <EyeOutlined/>;
            case 'create':
                return <PlusOutlined/>;
            case 'update':
                return <EditOutlined/>;
            case 'delete':
                return <DeleteOutlined/>;
            default:
                return <InfoCircleOutlined/>;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'view':
                return '#1890ff';
            case 'create':
                return '#52c41a';
            case 'update':
                return '#faad14';
            case 'delete':
                return '#f5222d';
            default:
                return '#1890ff';
        }
    };

    const getActivityTitle = (activity: any) => {
        switch (activity.entity) {
            case 'order':
                return 'İş Emri';
            case 'person':
                return 'Personel';
            case 'section':
                return 'Bölüm';
            case 'log':
                return 'Log';
            default:
                return 'İşlem';
        }
    };

    // Üretim durumunu kontrol et
    const checkProductionStatus = async () => {
        try {
            const assignments = await API.sectionWorkAssignment.getAll();
            const hasRunningWork = assignments.some((a: any) =>
                a.status === 1 && a.approvalStatus !== 2 // Devam eden ve reddedilmemiş işler
            );
            setProductionStatus(hasRunningWork ? 'running' : 'paused');
        } catch (error) {
            console.error('Üretim durumu kontrol edilirken hata:', error);
        }
    };

    // Sayfa yüklendiğinde ve her 30 saniyede bir durumu kontrol et
    useEffect(() => {
        checkProductionStatus();
        const interval = setInterval(checkProductionStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Üretimi durdur
    const handlePauseProduction = async () => {
        try {
            setLoading(true);
            // Önce durumu değiştir
            setProductionStatus('paused');

            const response = await API.sectionWorkAssignment.pauseAll();
            // Başarılı bildirimi göster
            api.success({
                message: 'Üretim Durduruldu',
                description: response,
                placement: 'topRight',
                duration: 4.5,
            });

        } catch (error) {
            // Hata durumunda durumu geri al
            setProductionStatus('running');
            api.error({
                message: 'Hata',
                description: 'Üretim durdurulurken bir hata oluştu.',
                placement: 'topRight',
                duration: 4.5,
            });
        } finally {
            setLoading(false);
        }
    };

    // Üretime devam et
    const handleResumeProduction = async () => {
        try {
            setLoading(true);
            // Önce durumu değiştir
            setProductionStatus('running');

            const response = await API.sectionWorkAssignment.resumeAll();

            // Başarılı bildirimi göster
            api.success({
                message: 'Üretim Devam Ediyor',
                description: response,
                placement: 'topRight',
                duration: 4.5,
            });


        } catch (error) {
            // Hata durumunda durumu geri al
            setProductionStatus('paused');
            api.error({
                message: 'Hata',
                description: 'Üretim devam ettirilirken bir hata oluştu.',
                placement: 'topRight',
                duration: 4.5,
            });
        } finally {
            setLoading(false);
        }
    };

    // Buton stillerini belirle
    const getButtonStyle = () => {
        if (loading) {
            return {
                opacity: 0.7,
                transition: 'all 0.3s'
            };
        }
        return {
            transition: 'all 0.3s'
        };
    };

    return (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #f0f2f5 0%, #e6e9f0 100%)',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Arka plan desenleri */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                pointerEvents: 'none'
            }}/>

            {contextHolder}
            <Space direction="vertical" size="large" style={{width: '100%', position: 'relative'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <Title level={3} style={{margin: 0}}>
                        <DashboardOutlined/> Üretim Takip Sistemi
                    </Title>
                    <Space>
                        {productionStatus === 'running' ? (
                            <Button
                                type="primary"
                                danger
                                icon={<PauseCircleOutlined/>}
                                onClick={handlePauseProduction}
                                loading={loading}
                                style={{
                                    ...getButtonStyle(),
                                    background: 'rgba(255, 77, 79, 0.9)',
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 4px 15px rgba(255, 77, 79, 0.2)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Durduruluyor...' : 'Üretimi Durdur'}
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined/>}
                                onClick={handleResumeProduction}
                                loading={loading}
                                style={{
                                    ...getButtonStyle(),
                                    background: 'rgba(82, 196, 26, 0.9)',
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 4px 15px rgba(82, 196, 26, 0.2)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Devam Ettiriliyor...' : 'Üretime Devam Et'}
                            </Button>
                        )}
                        <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
                            <Badge count={unreadCount} offset={[-2, 2]}>
                                <Button
                                    type="text"
                                    icon={<BellOutlined/>}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.5)',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                />
                            </Badge>
                        </Dropdown>
                        <Button
                            type="text"
                            icon={<HistoryOutlined/>}
                            onClick={() => setRecentModalVisible(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        />
                        <Button
                            type="text"
                            icon={<LogoutOutlined/>}
                            onClick={handleLogout}
                            style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        />
                    </Space>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    items={[
                        {
                            key: 'production',
                            label: (
                                <span>
                                    <DashboardOutlined style={{marginRight: 8}}/>
                                    Üretim
                                </span>
                            ),
                            children: <ProductionSession/>
                        },
                        {
                            key: 'teams',
                            label: (
                                <span>
                                    <TeamOutlined style={{marginRight: 8}}/>
                                    Personel
                                </span>
                            ),
                            children: <TeamSession/>
                        },
                        {
                            key: 'logs',
                            label: (
                                <span>
                                    <HistoryOutlined style={{marginRight: 8}}/>
                                    Loglar
                                </span>
                            ),
                            children: <LogSession/>
                        },
                        {
                            key: 'excel',
                            label: (
                                <span>
                                    <FileExcelOutlined style={{marginRight: 8}}/>
                                    Excel
                                </span>
                            ),
                            children: <ExcelSession/>
                        }
                    ]}
                />
            </Space>

            {/* Upload Modal */}
            <Modal
                title="Excel Dosyası Yükle"
                open={uploadModalVisible}
                onCancel={() => setUploadModalVisible(false)}
                footer={null}
                style={{
                    backdropFilter: 'blur(10px)'
                }}
                bodyStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px'
                }}
            >
                <Dragger
                    name="file"
                    multiple={false}
                    accept=".xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleUpload(file);
                        return false;
                    }}
                    disabled={uploading}
                    style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px'
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <FileExcelOutlined/>
                    </p>
                    <p className="ant-upload-text">Excel dosyasını buraya sürükleyin veya seçin</p>
                    <p className="ant-upload-hint">
                        Sadece .xlsx ve .xls dosyaları desteklenmektedir
                    </p>
                </Dragger>
                {uploading && (
                    <div style={{marginTop: 16}}>
                        <Progress percent={uploadProgress} status={uploadStatus === 'error' ? 'exception' : 'active'}/>
                        <Text type="secondary">{uploadMessage}</Text>
                    </div>
                )}
            </Modal>

            {/* Recent Actions Modal */}
            <Modal
                title="Son İşlemler"
                open={recentModalVisible}
                onCancel={() => setRecentModalVisible(false)}
                footer={null}
                width={600}
                style={{
                    backdropFilter: 'blur(10px)'
                }}
                bodyStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px'
                }}
            >
                <List
                    dataSource={activities}
                    renderItem={(activity) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{
                                            backgroundColor: getActivityColor(activity.type),
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        {getActivityIcon(activity.type)}
                                    </Avatar>
                                }
                                title={getActivityTitle(activity)}
                                description={
                                    <Space direction="vertical" size={4}>
                                        <Text>{activity.details}</Text>
                                        <Text type="secondary" style={{fontSize: '12px'}}>
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </Text>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Modal>

            {/* Logout Modal */}
            <Modal
                title="Çıkış Yap"
                open={logoutModalVisible}
                onOk={confirmLogout}
                onCancel={() => setLogoutModalVisible(false)}
                okText="Evet"
                cancelText="Hayır"
                style={{
                    backdropFilter: 'blur(10px)'
                }}
                bodyStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px'
                }}
            >
                <p>Çıkış yapmak istediğinizden emin misiniz?</p>
            </Modal>

            <FloatButton
                icon={<PlusOutlined/>}
                tooltip="Excel Yükle"
                onClick={() => setUploadModalVisible(true)}
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
            />
        </div>
    );
};

export default HomeScreen;