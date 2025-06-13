import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Space, Button, message, Tabs, List, Badge, Modal, Row, Col, Divider, Select, Alert, Drawer, Collapse, notification, Spin, Avatar, Tag } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, PauseCircleOutlined, PlayCircleOutlined, InfoCircleOutlined, ReloadOutlined, LogoutOutlined } from '@ant-design/icons';
import { API } from '../api/client';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

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

const EmployeeTracking: React.FC = () => {
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
                work.status !== 2 // Tamamlanmamış işler
            );

            // Hazırlanan işler - bir önceki bölümden gelenler
            let prepared = allWorks.filter((work: WorkAssignment) =>
                work.sectionId === employeeData.sectionId - 1 &&
                work.status !== 2 // Tamamlanmamış işler
            );

            // Bölüm 1 için özel filtreleme
            if (employeeData.sectionId === 1) {
                // Work assignment tablosundaki tüm iş emri ID'lerini al
                const existingWorkOrderIds = allWorks.map((work: WorkAssignment) => work.workOrderId);

                // Sadece "URETIM YAPILMADI" durumundaki ve work assignment'ı olmayan iş emirlerini filtrele
                const pendingWorkOrders = workOrders.filter((order: WorkOrder) =>
                    order.URT_DURUM === "URETIM YAPILMADI" &&
                    !existingWorkOrderIds.includes(order.PROJE_KODU)
                );

                // Bu iş emirleri için yeni work assignment'lar oluştur
                const newPreparedWorks = pendingWorkOrders.map((order: WorkOrder) => ({
                    id: 0,
                    sectionId: 1,
                    section: {
                        id: 1,
                        title: "Kesim Bölümü",
                        addedByPersonId: 0,
                        creationDate: new Date().toISOString(),
                        deletionDate: null,
                        isDeleted: false
                    },
                    workOrderId: order.PROJE_KODU,
                    personId: employeeData.id,
                    person: employeeData,
                    startDate: new Date().toISOString(),
                    endDate: null,
                    pauseDate: null,
                    status: 0,
                    description: null,
                    approvalStatus: 0,
                    approvalNotes: null
                }));

                prepared = newPreparedWorks;
            }

            // Önceki bölümde biten işleri bul
            const completedFromPrevious = allWorks.filter((work: WorkAssignment) =>
                work.sectionId === employeeData.sectionId - 1 &&
                work.status === 2 // Tamamlanmış işler
            );

            // Önceki bölümde biten işleri mevcut işlere ekle
            const newCurrentWorks = [
                ...current,
                ...completedFromPrevious.map((work: WorkAssignment) => ({
                    ...work,
                    id: 0, // Yeni ID
                    sectionId: employeeData.sectionId, // Mevcut bölüm ID'si
                    status: 0, // Beklemede durumu
                    startDate: new Date().toISOString(), // Yeni başlangıç tarihi
                    endDate: null,
                    pauseDate: null
                }))
            ];

            // Mevcut işlerdeki proje kodlarını bul
            const currentProjectCodes = newCurrentWorks.map(work => work.workOrderId);

            // Bu proje kodlarına sahip tüm iş emirlerini bul
            const relatedWorkOrders = workOrders.filter((order: WorkOrder) =>
                currentProjectCodes.includes(order.PROJE_KODU)
            );

            // Her proje kodu için yeni work assignment'lar oluştur
            const additionalWorks = relatedWorkOrders.flatMap((order: WorkOrder) => {
                // Bu proje koduna ait mevcut işleri bul
                const existingWorks = newCurrentWorks.filter(work =>
                    work.workOrderId === order.PROJE_KODU
                );

                // Eğer bu iş emri için zaten bir atama varsa, yeni atama oluşturma
                if (existingWorks.length > 0) {
                    return existingWorks;
                }

                // Yeni atama oluştur
                return [{
                    id: 0,
                    sectionId: employeeData.sectionId,
                    section: {
                        id: employeeData.sectionId,
                        title: employeeData.section?.title || "",
                        addedByPersonId: 0,
                        creationDate: new Date().toISOString(),
                        deletionDate: null,
                        isDeleted: false
                    },
                    workOrderId: order.PROJE_KODU,
                    personId: employeeData.id,
                    person: employeeData,
                    startDate: new Date().toISOString(),
                    endDate: null,
                    pauseDate: null,
                    status: 0,
                    description: null,
                    approvalStatus: 0,
                    approvalNotes: null
                }];
            });

            // Mevcut işleri proje koduna göre grupla
            const groupedCurrentWorks = additionalWorks.reduce((acc: Record<string, WorkAssignment[]>, work: WorkAssignment) => {
                if (!work.workOrderId) return acc;

                const key = work.workOrderId;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(work);
                return acc;
            }, {} as Record<string, WorkAssignment[]>);

            // Gruplanmış mevcut işleri düzleştir
            const flattenedCurrentWorks = Object.values(groupedCurrentWorks).flat() as WorkAssignment[];

            // Bölüm 1 dışındaki personeller için tamamlanan işleri filtrele
            const finalCurrentWorks = employeeData.sectionId === 1
                ? flattenedCurrentWorks
                : flattenedCurrentWorks.filter(work => work.status !== 2);

            setCurrentWorks(finalCurrentWorks);
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

    const handleStatusUpdate = async (workOrderId: string, sectionId: number, newStatus: number) => {
        try {
            // Önce mevcut iş emrinin durumunu güncelle
            await API.sectionWorkAssignment.updateStatus(workOrderId, sectionId, newStatus);

            // Aynı proje koduna sahip diğer iş emirlerini bul ve güncelle
            const sameProjectWorks = currentWorks.filter(work =>
                work.workOrderId === workOrderId
            );

            // Diğer iş emirlerinin durumlarını güncelle
            for (const work of sameProjectWorks) {
                if (work.workOrderId !== workOrderId || work.sectionId !== sectionId) {
                    await API.sectionWorkAssignment.updateStatus(work.workOrderId, work.sectionId, newStatus);
                }
            }

            messageApi.success('İş durumu başarıyla güncellendi');
            if (employee) {
                await fetchWorkAssignments(employee);
            }
        } catch (error) {
            console.error('Durum güncellenirken hata:', error);
            messageApi.error('Durum güncellenirken bir hata oluştu');
        }
    };

    const handleStartWork = async (workOrderId: string) => {
        try {
            if (!employee) return;

            // Önce mevcut iş emri için yeni atama oluştur
            const newWorkAssignment = {
                workOrderId: workOrderId,
                sectionId: employee.sectionId,
                personId: employee.id,
                status: 1,
                startDate: new Date().toISOString()
            };

            await API.sectionWorkAssignment.create(newWorkAssignment);

            // Aynı proje koduna sahip diğer iş emirleri için de atama oluştur
            const workOrder = getWorkOrderDetails(workOrderId);
            if (workOrder) {
                const sameProjectWorks = currentWorks.filter(work =>
                    work.workOrderId === workOrderId
                );

                for (const work of sameProjectWorks) {
                    if (work.workOrderId !== workOrderId) {
                        const newAssignment = {
                            ...newWorkAssignment,
                            workOrderId: work.workOrderId
                        };
                        await API.sectionWorkAssignment.create(newAssignment);
                    }
                }
            }

            messageApi.success('İş başarıyla başlatıldı');
            await fetchWorkAssignments(employee);
        } catch (error) {
            console.error('İş başlatılırken hata:', error);
            messageApi.error('İş başlatılırken bir hata oluştu');
        }
    };

    const getStatusTag = (status: number) => {
        switch (status) {
            case 0: return <Tag color="default">Bekliyor</Tag>;
            case 1: return <Tag color="processing">Başladı</Tag>;
            case 2: return <Tag color="success">Bitti</Tag>;
            case 3: return <Tag color="warning">Durduruldu</Tag>;
            default: return <Tag>Bilinmiyor</Tag>;
        }
    };

    const getWorkOrderDetails = (workOrderId: string) => {
        return workOrders.find(order => order.PROJE_KODU === workOrderId);
    };

    const groupWorksByProjectCode = (works: WorkAssignment[]) => {
        if (!works || works.length === 0) return [];

        console.log('Gelen iş emirleri:', works);

        // Önce tüm iş emirlerini proje koduna göre grupla
        const groups = works.reduce((acc, work) => {
            if (!work.workOrderId) return acc;

            const key = work.workOrderId;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(work);
            return acc;
        }, {} as Record<string, WorkAssignment[]>);

        console.log('Gruplanmış iş emirleri:', groups);

        // Her grup için detaylı bilgileri oluştur
        const result = Object.entries(groups).map(([projectCode, works]) => {
            console.log(`Proje kodu ${projectCode} için iş emirleri:`, works);
            return {
                projectCode,
                works: works, // Tüm iş emirlerini doğrudan kullan
                workOrder: getWorkOrderDetails(projectCode)
            };
        });

        console.log('Sonuç:', result);
        return result;
    };

    const renderGroupedWorks = (works: WorkAssignment[], isCurrentWorks: boolean = false) => {
        if (!works || works.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">Gösterilecek iş emri bulunmamaktadır.</Text>
                </div>
            );
        }

        const groupedWorks = groupWorksByProjectCode(works);

        return (
            <List
                dataSource={groupedWorks}
                renderItem={group => {
                    const allStatuses = group.works.map(work => work.status);
                    const hasStarted = allStatuses.includes(1);
                    const hasPaused = allStatuses.includes(3);
                    const hasCompleted = allStatuses.includes(2);

                    let displayStatus = 0;
                    if (hasCompleted) displayStatus = 2;
                    else if (hasPaused) displayStatus = 3;
                    else if (hasStarted) displayStatus = 1;

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
                                            {(isCurrentWorks || (employee?.sectionId === 1 && !isCurrentWorks)) && displayStatus !== 2 && (
                                                <>
                                                    {displayStatus === 0 && (
                                                        <Button
                                                            type="primary"
                                                            icon={<PlayCircleOutlined />}
                                                            onClick={() => handleStartWork(group.works[0].workOrderId)}
                                                        >
                                                            <span className="hide-on-mobile">Başlat</span>
                                                        </Button>
                                                    )}
                                                    {displayStatus === 1 && (
                                                        <>
                                                            <Button
                                                                danger
                                                                icon={<PauseCircleOutlined />}
                                                                onClick={() => handleStatusUpdate(group.works[0].workOrderId, group.works[0].sectionId, 3)}
                                                            >
                                                                <span className="hide-on-mobile">Durdur</span>
                                                            </Button>
                                                            <Button
                                                                type="primary"
                                                                icon={<CheckCircleOutlined />}
                                                                onClick={() => handleStatusUpdate(group.works[0].workOrderId, group.works[0].sectionId, 2)}
                                                            >
                                                                <span className="hide-on-mobile">Tamamla</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                    {displayStatus === 3 && (
                                                        <Button
                                                            type="primary"
                                                            icon={<PlayCircleOutlined />}
                                                            onClick={() => handleStatusUpdate(group.works[0].workOrderId, group.works[0].sectionId, 1)}
                                                        >
                                                            <span className="hide-on-mobile">Yeniden Başlat</span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </Space>
                                    </div>

                                    {(isCurrentWorks || group.works.length > 1) && (
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
                                                                        {getStatusTag(displayStatus)}
                                                                    </Space>
                                                                }
                                                                description={
                                                                    <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                                                                        <Text type="secondary">
                                                                            Başlangıç: {new Date(work.startDate).toLocaleString()}
                                                                        </Text>
                                                                        {work.description && (
                                                                            <Text type="secondary">
                                                                                Açıklama: {work.description}
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
                    <Title level={4} style={{ margin: 0 }}>İş Takibi</Title>
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
                                                {sections.find(s => s.id === employee.sectionId)?.title || 'Bilinmeyen Bölüm'}
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
                                    children: renderGroupedWorks(currentWorks, true)
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

export default EmployeeTracking;