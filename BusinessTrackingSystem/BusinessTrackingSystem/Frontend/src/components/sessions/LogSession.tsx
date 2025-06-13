import React, { useEffect, useState, useRef } from 'react';
import {
    Timeline,
    Tag,
    Typography,
    Card,
    Divider,
    Space,
    Avatar,
    Badge,
    Button,
    List,
    Dropdown,
    Menu,
    Empty,
    theme,
    Table,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    message
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    BellOutlined,
    SyncOutlined,
    FilterOutlined,
    DeleteOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    MoreOutlined,
    PlusOutlined,
    EditOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import relativeTime from 'dayjs/plugin/relativeTime';
import apiClient from '../../api/client';
import { useSignalR } from '../../context/SignalRContext';
import * as XLSX from 'xlsx';

const { Text, Title } = Typography;
const { useToken } = theme;

dayjs.locale('tr');
dayjs.extend(relativeTime);

const LogSession: React.FC = () => {
    const { token } = useToken();
    const { notifications, markAsRead, clearNotifications, markAllAsRead, deleteNotification } = useSignalR();
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [logs, setLogs] = useState<any[]>([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [form] = Form.useForm();

    const getNotificationIcon = (color: string) => {
        const style = { fontSize: '16px' };
        switch (color) {
            case 'success':
                return <CheckCircleOutlined style={{ ...style, color: token.colorSuccess }} />;
            case 'error':
                return <CloseCircleOutlined style={{ ...style, color: token.colorError }} />;
            case 'warning':
                return <ExclamationCircleOutlined style={{ ...style, color: token.colorWarning }} />;
            default:
                return <InfoCircleOutlined style={{ ...style, color: token.colorInfo }} />;
        }
    };

    const getNotificationColor = (color: string) => {
        switch (color) {
            case 'success':
                return token.colorSuccess;
            case 'error':
                return token.colorError;
            case 'warning':
                return token.colorWarning;
            default:
                return token.colorInfo;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const refreshNotifications = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : !n.read
    );

    const notificationMenu = (id: number) => (
        <Menu>
            <Menu.Item
                icon={<EyeOutlined />}
                onClick={() => markAsRead(id)}
            >
                Okundu olarak işaretle
            </Menu.Item>
            <Menu.Item
                icon={<DeleteOutlined />}
                danger
                onClick={() => deleteNotification(id)}
            >
                Bildirimi sil
            </Menu.Item>
        </Menu>
    );

    const filterMenu = (
        <Menu selectedKeys={[filter]}>
            <Menu.Item key="all" onClick={() => setFilter('all')}>
                Tüm Bildirimler
            </Menu.Item>
            <Menu.Item key="unread" onClick={() => setFilter('unread')}>
                Okunmamışlar
            </Menu.Item>
        </Menu>
    );

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/SessionLogs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            message.error('Loglar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        try {
            setLoading(true);
            message.loading('Excel dosyası oluşturuluyor...', 0);

            const data = filteredNotifications.map(notification => ({
                'Başlık': notification.title,
                'Açıklama': notification.description,
                'Tarih': formatDate(notification.date),
                'Durum': notification.read ? 'Okundu' : 'Okunmadı',
                'Tür': notification.color === 'success' ? 'Başarılı' :
                      notification.color === 'error' ? 'Hata' :
                      notification.color === 'warning' ? 'Uyarı' : 'Bilgi'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            
            // Sütun genişliklerini ayarla
            const wscols = [
                { wch: 30 }, // Başlık
                { wch: 50 }, // Açıklama
                { wch: 20 }, // Tarih
                { wch: 15 }, // Durum
                { wch: 15 }  // Tür
            ];
            ws['!cols'] = wscols;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Bildirimler');

            const fileName = `bildirimler_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            message.destroy();
            message.success('Excel dosyası başarıyla indirildi');
        } catch (error) {
            console.error('Excel oluşturma hatası:', error);
            message.destroy();
            message.error('Excel dosyası oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div style={{
            maxWidth: '100%',
            padding: '24px',
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadow
        }}>
            <Card
                title={
                    <Space>
                        <BellOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
                        <Title level={4} style={{ margin: 0 }}>Bildirim Geçmişi</Title>
                        <Badge
                            count={notifications.filter(n => !n.read).length}
                            style={{
                                backgroundColor: token.colorPrimary,
                                boxShadow: `0 0 0 2px ${token.colorBgContainer}`
                            }}
                        />
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={exportToExcel}
                            loading={loading}
                        >
                            Excel İndir
                        </Button>
                        <Dropdown overlay={filterMenu} trigger={['click']}>
                            <Button icon={<FilterOutlined />}>
                                {filter === 'all' ? 'Tümü' : 'Okunmamışlar'}
                            </Button>
                        </Dropdown>
                        <Button
                            icon={<SyncOutlined />}
                            loading={loading}
                            onClick={refreshNotifications}
                        />
                        <Button
                            icon={<EyeInvisibleOutlined />}
                            onClick={markAllAsRead}
                            disabled={notifications.every(n => n.read)}
                        >
                            Tümünü Okundu Yap
                        </Button>
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={clearNotifications}
                            disabled={notifications.length === 0}
                        >
                            Tümünü Temizle
                        </Button>
                    </Space>
                }
                bordered={false}
                headStyle={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
                bodyStyle={{ padding: '24px' }}
            >
                {filteredNotifications.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Text type="secondary">
                                {filter === 'all'
                                    ? 'Henüz bildirim bulunmamaktadır'
                                    : 'Okunmamış bildirim bulunmamaktadır'}
                            </Text>
                        }
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <Timeline
                        mode="left"
                        items={filteredNotifications.map((notification) => ({
                            color: notification.color,
                            dot: (
                                <Avatar
                                    size="small"
                                    icon={getNotificationIcon(notification.color)}
                                    style={{
                                        backgroundColor: `${getNotificationColor(notification.color)}10`,
                                        color: getNotificationColor(notification.color)
                                    }}
                                />
                            ),
                            children: (
                                <div
                                    style={{
                                        padding: '16px',
                                        backgroundColor: notification.read
                                            ? token.colorBgContainer
                                            : token.colorPrimaryBg,
                                        borderRadius: token.borderRadius,
                                        marginBottom: '16px',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                        boxShadow: 'none',
                                        border: `1px solid ${token.colorBorderSecondary}`
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = token.boxShadowSecondary;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Space>
                                                <Text strong style={{ fontSize: '16px' }}>{notification.title}</Text>
                                                {!notification.read && (
                                                    <Tag color="blue">Yeni</Tag>
                                                )}
                                            </Space>
                                            <Dropdown
                                                overlay={notificationMenu(notification.id)}
                                                trigger={['click']}
                                            >
                                                <Button
                                                    type="text"
                                                    icon={<MoreOutlined />}
                                                    size="small"
                                                />
                                            </Dropdown>
                                        </div>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '1.5'
                                            }}
                                        >
                                            {notification.description}
                                        </Text>
                                        <Tag
                                            color={notification.color}
                                            icon={getNotificationIcon(notification.color)}
                                            style={{
                                                backgroundColor: `${getNotificationColor(notification.color)}10`,
                                                color: getNotificationColor(notification.color),
                                                border: 'none'
                                            }}
                                        >
                                            {formatDate(notification.date)}
                                        </Tag>
                                    </Space>
                                </div>
                            )
                        }))}
                    />
                )}
            </Card>

            <Card
                title={
                    <Space>
                        <InfoCircleOutlined style={{ fontSize: '20px', color: token.colorPrimary }} />
                        <Title level={4} style={{ margin: 0 }}>Bildirim Türleri</Title>
                    </Space>
                }
                bordered={false}
                style={{ marginTop: '24px' }}
            >
                <Space wrap>
                    <Tag
                        icon={<CheckCircleOutlined />}
                        color="success"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            margin: '4px',
                            fontSize: '14px'
                        }}
                    >
                        Başarılı İşlemler
                    </Tag>
                    <Tag
                        icon={<ExclamationCircleOutlined />}
                        color="warning"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            margin: '4px',
                            fontSize: '14px'
                        }}
                    >
                        Uyarılar
                    </Tag>
                    <Tag
                        icon={<CloseCircleOutlined />}
                        color="error"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            margin: '4px',
                            fontSize: '14px'
                        }}
                    >
                        Hatalar
                    </Tag>
                    <Tag
                        icon={<InfoCircleOutlined />}
                        color="processing"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            margin: '4px',
                            fontSize: '14px'
                        }}
                    >
                        Bilgilendirme
                    </Tag>
                </Space>
            </Card>
        </div>
    );
};

export default LogSession;