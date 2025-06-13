import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Space, Button, message, Tabs, List, Badge, Modal, Row, Col, Divider, Select, Alert, Drawer, Collapse, notification, Spin, Avatar, Tag, Input } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, ReloadOutlined, LogoutOutlined } from '@ant-design/icons';
import { API } from '../api/client';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface Section {
    id: number;
    title: string;
    addedByPersonId: number;
    creationDate: string;
    deletionDate: string | null;
    isDeleted: boolean;
}

interface Person {
    id: number;
    name: string;
    surname: string;
    phoneNumber: string;
    email: string;
    sectionId: number;
    section: Section | null;
    role: number;
}

interface WorkAssignment {
    id: number;
    sectionId: number;
    section: Section;
    workOrderId: string;
    personId: number;
    person: Person;
    startDate: string;
    endDate: string | null;
    pauseDate: string | null;
    status: number;
    description: string | null;
    approvalStatus: number;
    approvalNotes: string | null;
}

interface WorkOrder {
    SIPARIS_TARIHI: string;
    TESLIM_TARIHI: string;
    PROJE_KODU: string;
    PROJE_ADI: string;
    MUSTERI: string;
    URUN_ADI: string;
    MIKTAR: string;
    URT_DURUM: string;
}

const QualityControl: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [employee, setEmployee] = useState<Person | null>(null);
    const [currentWorks, setCurrentWorks] = useState<WorkAssignment[]>([]);
    const [preparedWorks, setPreparedWorks] = useState<WorkAssignment[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [activeTab, setActiveTab] = useState<string>('1');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
    const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
    const [selectedWork, setSelectedWork] = useState<WorkAssignment | null>(null);
    const [approvalNote, setApprovalNote] = useState('');
    const [approvalType, setApprovalType] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        try {
            setLoading(true);
            await fetchSections();
            const userInfo = await API.persons.getUserInfo();
            setEmployee(userInfo);
            await fetchWorkAssignments(userInfo);
            await fetchWorkOrders();
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
            setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await API.sections.getAll();
            setSections(response);
        } catch (error) {
            console.error('Bölümler alınamadı:', error);
            setError('Bölümler alınamadı. Lütfen sayfayı yenileyin.');
        }
    };

    const fetchWorkAssignments = async (employeeData: Person) => {
        try {
            const response = await API.sectionWorkAssignment.getAll();
            const allWorks = response;

            // Tüm iş emirlerini al
            const workOrdersResponse = await API.excelUpload.getActiveData();
            const workOrders = workOrdersResponse.data;

            // Mevcut işler - personelin bölümüne eşit olanlar ve bitmemiş olanlar
            const current = allWorks.filter((work: WorkAssignment) =>
                work.sectionId === employeeData.sectionId &&
                work.status === 2 && // Sadece tamamlanmış işler
                work.approvalStatus === 0 // Onay bekleyen işler
            );

            // Hazırlanan işler - bir önceki bölümden gelenler
            let prepared = allWorks.filter((work: WorkAssignment) =>
                work.sectionId === employeeData.sectionId - 2 &&
                work.status === 1 && // Tamamlanmış işler
                work.approvalStatus === 0 // Onay bekleyen işler
            );

            setCurrentWorks(current);
            setPreparedWorks(prepared);
        } catch (error) {
            console.error('İş atamaları alınamadı:', error);
            setError('İş atamaları alınamadı. Lütfen sayfayı yenileyin.');
        }
    };

    const fetchWorkOrders = async () => {
        try {
            const response = await API.excelUpload.getActiveData();
            if (response && response.data) {
                setWorkOrders(response.data);
            } else {
                console.error('İş emirleri verisi boş veya hatalı format');
                setError('İş emirleri alınamadı. Lütfen sayfayı yenileyin.');
            }
        } catch (error) {
            console.error('İş emirleri alınamadı:', error);
            setError('İş emirleri alınamadı. Lütfen sayfayı yenileyin.');
        }
    };

    const handleApproval = async (work: WorkAssignment, type: 'approve' | 'reject') => {
        setSelectedWork(work);
        setApprovalType(type);
        setApprovalNote('');
        setIsApprovalModalVisible(true);
    };

    const submitApproval = async () => {
        if (!selectedWork || !approvalNote.trim()) {
            messageApi.error('Lütfen bir not giriniz');
            return;
        }

        try {
            const newStatus = approvalType === 'approve' ? 1 : 2; // 1: Onaylandı, 2: Reddedildi
            await API.sectionWorkAssignment.updateApprovalStatus(
                selectedWork.id,
                newStatus,
                approvalNote
            );

            messageApi.success(`İş emri başarıyla ${approvalType === 'approve' ? 'onaylandı' : 'reddedildi'}`);
            setIsApprovalModalVisible(false);
            if (employee) {
                await fetchWorkAssignments(employee);
            }
        } catch (error) {
            console.error('Onay durumu güncellenirken hata:', error);
            messageApi.error('Onay durumu güncellenirken bir hata oluştu');
        }
    };

    const getStatusTag = (status: number) => {
        switch (status) {
            case 0: return <Tag color="default">Bekliyor</Tag>;
            case 1: return <Tag color="success">Onaylandı</Tag>;
            case 2: return <Tag color="error">Reddedildi</Tag>;
            default: return <Tag>Bilinmiyor</Tag>;
        }
    };

    const getWorkOrderDetails = (workOrderId: string) => {
        return workOrders.find(order => order.PROJE_KODU === workOrderId);
    };

    const groupWorksByProjectCode = (works: WorkAssignment[]) => {
        if (!works || works.length === 0) return [];

        const groups = works.reduce((acc, work) => {
            if (!work.workOrderId) return acc;

            const key = work.workOrderId;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(work);
            return acc;
        }, {} as Record<string, WorkAssignment[]>);

        return Object.entries(groups).map(([projectCode, works]) => ({
            projectCode,
            works,
            workOrder: getWorkOrderDetails(projectCode)
        }));
    };

    const renderGroupedWorks = (works: WorkAssignment[]) => {
        if (!works || works.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">Gösterilecek iş emri bulunmamaktadır.</Text>
                </div>
            );
        }

        const groupedWorks = groupWorksByProjectCode(works);
        const isPreparedWorks = activeTab === '2'; // Hazırlanan işler sekmesi

        return (
            <List
                dataSource={groupedWorks}
                renderItem={group => {
                    const allStatuses = group.works.map(work => work.approvalStatus);
                    const hasApproved = allStatuses.includes(1);
                    const hasRejected = allStatuses.includes(2);

                    let displayStatus = 0;
                    if (hasApproved) displayStatus = 1;
                    else if (hasRejected) displayStatus = 2;

                    return (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                                        gap: '8px',
                                        width: '100%'
                                    }}>
                                        <Space wrap>
                                            <Text strong>İş Emri: {group.projectCode}</Text>
                                            {group.workOrder && (
                                                <Button
                                                    type="text"
                                                    icon={<InfoCircleOutlined />}
                                                    onClick={() => {
                                                        if (group.workOrder) {
                                                            setSelectedWorkOrder(group.workOrder);
                                                            setIsDetailVisible(true);
                                                        }
                                                    }}
                                                >
                                                    <span className="hide-on-mobile">Detay</span>
                                                </Button>
                                            )}
                                        </Space>
                                        <Space wrap>
                                            {isPreparedWorks ? (
                                                <Tag color="processing">Üretimde</Tag>
                                            ) : (
                                                displayStatus === 0 && (
                                                    <>
                                                        <Button
                                                            type="primary"
                                                            icon={<CheckCircleOutlined />}
                                                            onClick={() => handleApproval(group.works[0], 'approve')}
                                                        >
                                                            <span className="hide-on-mobile">Onayla</span>
                                                        </Button>
                                                        <Button
                                                            danger
                                                            icon={<CloseCircleOutlined />}
                                                            onClick={() => handleApproval(group.works[0], 'reject')}
                                                        >
                                                            <span className="hide-on-mobile">Reddet</span>
                                                        </Button>
                                                    </>
                                                )
                                            )}
                                        </Space>
                                    </div>

                                    {group.works.length > 1 && (
                                        <Collapse>
                                            <Collapse.Panel
                                                header={`${group.works.length} İş Emri`}
                                                key="1"
                                            >
                                                <List
                                                    dataSource={group.works}
                                                    renderItem={work => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                title={
                                                                    <Space wrap>
                                                                        <Text strong>İş Emri: {work.workOrderId}</Text>
                                                                        {getStatusTag(work.approvalStatus)}
                                                                    </Space>
                                                                }
                                                                description={
                                                                    <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                                                                        <Text type="secondary">
                                                                            Başlangıç: {new Date(work.startDate).toLocaleString()}
                                                                        </Text>
                                                                        {work.approvalNotes && (
                                                                            <Text type="secondary">
                                                                                Not: {work.approvalNotes}
                                                                            </Text>
                                                                        )}
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            </Collapse.Panel>
                                        </Collapse>
                                    )}
                                </Space>
                            </Card>
                        </List.Item>
                    );
                }}
            />
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

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
        <Layout style={{ minHeight: '100vh' }}>
            {contextHolder}
            <Header style={{
                background: '#fff',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                flexWrap: 'wrap',
                gap: '8px',
                height: 'auto',
                minHeight: '64px'
            }}>
                <Space>
                    <Title level={4} style={{ margin: 0 }}>Kalite Kontrol</Title>
                </Space>
                <Space>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined spin={isRefreshing} />}
                        onClick={() => {
                            setIsRefreshing(true);
                            if (employee) {
                                fetchWorkAssignments(employee).finally(() => setIsRefreshing(false));
                            }
                        }}
                    >
                        <span className="hide-on-mobile">Yenile</span>
                    </Button>
                </Space>
            </Header>

            <Content style={{ padding: '16px' }}>
                {error && (
                    <Alert
                        message="Hata"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Card
                    style={{
                        maxWidth: 1000,
                        margin: '0 auto',
                        width: '100%',
                        borderRadius: 8,
                    }}
                    bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '16px' }}
                >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {employee && (
                            <Card bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '16px' }}>
                                <Space
                                    align="start"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '16px'
                                    }}
                                >
                                    <Space align="start" style={{ flexWrap: 'wrap', gap: '16px' }}>
                                        <Avatar size={window.innerWidth < 768 ? 48 : 64} style={{ backgroundColor: '#1890ff' }}>
                                            {employee.name[0]}{employee.surname[0]}
                                        </Avatar>
                                        <Space direction="vertical" size={0}>
                                            <Title level={window.innerWidth < 768 ? 5 : 4} style={{ margin: 0 }}>
                                                {employee.name} {employee.surname}
                                            </Title>
                                            <Text type="secondary">
                                                {sections.find(s => s.id === employee.sectionId)?.title || 'Bölüm Tanımlanmamış'}
                                            </Text>
                                        </Space>
                                    </Space>
                                    <Button
                                        danger
                                        icon={<LogoutOutlined />}
                                        onClick={() => setIsLogoutModalVisible(true)}
                                    >
                                        <span className="hide-on-mobile">Çıkış Yap</span>
                                    </Button>
                                </Space>
                            </Card>
                        )}

                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            type="card"
                            items={[
                                {
                                    key: '1',
                                    label: 'Mevcut İşler',
                                    children: renderGroupedWorks(currentWorks)
                                },
                                {
                                    key: '2',
                                    label: 'Hazırlanan İşler',
                                    children: renderGroupedWorks(preparedWorks)
                                }
                            ]}
                        />
                    </Space>
                </Card>
            </Content>

            <Drawer
                title="İş Emri Detayı"
                placement="right"
                onClose={() => setIsDetailVisible(false)}
                open={isDetailVisible}
                width={window.innerWidth < 768 ? '100%' : 600}
                bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '24px' }}
            >
                {selectedWorkOrder && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '16px' }}>
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Space wrap>
                                    <Text strong>İş Emri: {selectedWorkOrder.PROJE_KODU}</Text>
                                </Space>
                                <Space wrap>
                                    <Text strong>Müşteri: {selectedWorkOrder.MUSTERI}</Text>
                                </Space>
                                <Space wrap>
                                    <Text strong>Ürün: {selectedWorkOrder.URUN_ADI}</Text>
                                </Space>
                                <Space wrap>
                                    <Text strong>Miktar: {selectedWorkOrder.MIKTAR}</Text>
                                </Space>
                                <Space wrap>
                                    <Text strong>Teslim Tarihi: {selectedWorkOrder.TESLIM_TARIHI}</Text>
                                </Space>
                                <Space wrap>
                                    <Text strong>Durum: {selectedWorkOrder.URT_DURUM}</Text>
                                </Space>
                            </Space>
                        </Card>
                    </Space>
                )}
            </Drawer>

            <Modal
                title={`İş Emri ${approvalType === 'approve' ? 'Onaylama' : 'Reddetme'}`}
                open={isApprovalModalVisible}
                onOk={submitApproval}
                onCancel={() => setIsApprovalModalVisible(false)}
                okText={approvalType === 'approve' ? 'Onayla' : 'Reddet'}
                cancelText="İptal"
                okButtonProps={{ 
                    type: approvalType === 'approve' ? 'primary' : 'primary',
                    danger: approvalType === 'reject'
                }}
                width={window.innerWidth < 768 ? '90%' : 420}
                centered
                bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '24px' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>Lütfen {approvalType === 'approve' ? 'onaylama' : 'reddetme'} için bir not giriniz:</Text>
                    <TextArea
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        placeholder="Notunuzu buraya giriniz..."
                        rows={4}
                    />
                </Space>
            </Modal>

            <Modal
                title="Çıkış Yap"
                open={isLogoutModalVisible}
                onOk={handleLogout}
                onCancel={() => setIsLogoutModalVisible(false)}
                okText="Evet, Çıkış Yap"
                cancelText="İptal"
                okButtonProps={{ danger: true }}
                width={window.innerWidth < 768 ? '90%' : 420}
                centered
                bodyStyle={{ padding: window.innerWidth < 768 ? '12px' : '24px' }}
            >
                <p>Çıkış yapmak istediğinizden emin misiniz?</p>
            </Modal>

            <style>{`
                @media (max-width: 768px) {
                    .hide-on-mobile {
                        display: none;
                    }
                    
                    .ant-card {
                        margin: 0 !important;
                    }
                    
                    .ant-list-item {
                        padding: 8px !important;
                    }
                    
                    .ant-space {
                        gap: 4px !important;
                    }
                    
                    .ant-btn {
                        padding: 4px 8px !important;
                        height: auto !important;
                    }
                    
                    .ant-tabs-nav {
                        margin-bottom: 8px !important;
                    }
                    
                    .ant-drawer-content-wrapper {
                        width: 100% !important;
                    }

                    .ant-card-body {
                        padding: 12px !important;
                    }

                    .ant-collapse-content-box {
                        padding: 8px !important;
                    }

                    .ant-list-item-meta-title {
                        margin-bottom: 4px !important;
                    }

                    .ant-space-item {
                        margin-right: 4px !important;
                    }

                    .ant-btn-icon-only {
                        padding: 4px !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default QualityControl;