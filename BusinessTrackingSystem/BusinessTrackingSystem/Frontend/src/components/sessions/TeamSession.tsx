import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Typography,
    Card,
    Avatar,
    Tag,
    Divider,
    Popconfirm,
    message,
    Badge,
    Tooltip,
    notification as antNotification
} from 'antd';
import {
    UserAddOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    SyncOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    EyeOutlined
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { useTheme } from 'antd-style';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useActivity } from '../../context/ActivityContext';

const { Title, Text } = Typography;
const { Option } = Select;

dayjs.locale('tr');
dayjs.extend(relativeTime);

interface TeamMember {
    id: number;
    name: string;
    surname: string;
    phoneNumber: string;
    email: string;
    sectionId: number;
    role: number;
    status?: 'active' | 'inactive';
    password?: string;
    hashedPassword?: string;
    refreshToken?: string;
    refreshTokenExpiryTime?: string;
}

interface Section {
    id: number;
    title: string;
    addedByPersonId: number;
    creationDate: string;
    deletionDate: string | null;
    isDeleted: boolean;
}

interface UpdatePayload {
    id: number;
    name: string;
    surname: string;
    phoneNumber: string;
    email: string;
    sectionId: number;
    role: number;
    hashedPassword?: string;
}

const roleOptions = [
    { value: 1, label: 'Büro Personeli' },
    { value: 2, label: 'İmalat Personeli' }
];

const API_URL = '/Persons';
const SECTIONS_API_URL = '/Sections';

const TeamSession = () => {
    const token = useTheme();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const [teams, setTeams] = useState<any[]>([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [api, contextHolder] = antNotification.useNotification();
    const { addActivity } = useActivity();

    useEffect(() => {
        fetchMembers();
        fetchSections();
        fetchTeams();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(API_URL);
            setMembers(
                response.data.map((member: any) => ({
                    ...member,
                    status: member.status || 'active'
                }))
            );
        } catch (error) {
            console.error('Error fetching team members:', error);
            api.error({
                message: 'Hata',
                description: 'Takım üyeleri yüklenirken bir hata oluştu.'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await apiClient.get(SECTIONS_API_URL);
            setSections(response.data.filter((section: Section) => !section.isDeleted));
        } catch (error) {
            console.error('Error fetching sections:', error);
            api.error({
                message: 'Hata',
                description: 'Bölümler yüklenirken bir hata oluştu.'
            });
        }
    };

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/Persons');
            setTeams(response.data);
        } catch (error) {
            console.error('Takım verileri çekme hatası:', error);
            message.error('Takım verileri yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditMode(false);
        setCurrentMember(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record: TeamMember) => {
        setEditMode(true);
        setCurrentMember(record);
        const { password, ...rest } = record;
        form.setFieldsValue(rest);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            setLoading(true);
            const member = members.find(m => m.id === id);
            const response = await apiClient.delete(`${API_URL}/${id}`);
            console.log('Silme API Yanıtı:', response.data);
            if (member) {
                addActivity({
                    type: 'delete',
                    entity: 'person',
                    details: `${member.name} ${member.surname} personeli silindi`
                });
            }
            api.success({
                message: 'Başarılı!',
                description: 'Personel başarıyla silindi.',
                icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
                duration: 3
            });
            fetchMembers();
        } catch (error: any) {
            console.error('API Hata Detayları:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                request: {
                    url: error.config?.url,
                    method: error.config?.method
                }
            });
            api.error({
                message: 'Hata!',
                description: error.response?.data?.message || 'Silme işlemi sırasında bir hata oluştu.',
                icon: <CloseCircleOutlined style={{ color: token.colorError }} />,
                duration: 4
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: 'active' | 'inactive') => {
        try {
            setLoading(true);
            const member = members.find(m => m.id === id);
            await apiClient.patch(`${API_URL}/${id}/status`, { status });
            if (member) {
                addActivity({
                    type: 'update',
                    entity: 'person',
                    details: `${member.name} ${member.surname} personelinin durumu ${status === 'active' ? 'aktif' : 'pasif'} yapıldı`
                });
            }
            api.success({
                message: 'Başarılı!',
                description: `Personel durumu başarıyla ${status === 'active' ? 'aktif' : 'pasif'} yapıldı.`,
                icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
                duration: 3
            });
            fetchMembers();
        } catch (error) {
            console.error('Error changing status:', error);
            api.error({
                message: 'Hata!',
                description: 'Durum değiştirilirken bir hata oluştu.',
                icon: <CloseCircleOutlined style={{ color: token.colorError }} />,
                duration: 4
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true);
            const values = await form.validateFields();

            if (editMode && currentMember) {
                const updatePayload: any = {
                    id: currentMember.id,
                    name: values.name,
                    surname: values.surname,
                    phone_number: values.phoneNumber,
                    e_mail: values.email,
                    s_id: parseInt(values.sectionId) || 0
                };

                // Şifre sadece girilmişse ekle
                if (values.password && values.password.trim() !== '') {
                    updatePayload.hash_pass = values.password;
                }

                // Role sadece seçilmişse ekle
                if (values.role) {
                    updatePayload.role = parseInt(values.role);
                }

                console.log('Güncelleme İsteği:', {
                    url: `${API_URL}/${currentMember.id}`,
                    payload: updatePayload
                });

                const response = await apiClient.put(`${API_URL}/${currentMember.id}`, updatePayload);
                console.log('Güncelleme API Yanıtı:', response.data);
                addActivity({
                    type: 'update',
                    entity: 'person',
                    details: `${values.name} ${values.surname} personeli güncellendi`
                });
                api.success({
                    message: 'Başarılı!',
                    description: 'Personel başarıyla güncellendi.',
                    icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
                    duration: 3
                });
            } else {
                // Yeni üye için password zorunlu
                if (!values.password || values.password.trim() === '') {
                    api.error({
                        message: 'Hata!',
                        description: 'Lütfen bir şifre belirleyin.',
                        icon: <CloseCircleOutlined style={{ color: token.colorError }} />,
                        duration: 3
                    });
                    return;
                }

                const createPayload: any = {
                    name: values.name,
                    surname: values.surname,
                    phone_number: values.phoneNumber,
                    e_mail: values.email,
                    s_id: parseInt(values.sectionId) || 0,
                    hash_pass: values.password
                };

                // Role sadece seçilmişse ekle
                if (values.role) {
                    createPayload.role = parseInt(values.role);
                }

                console.log('Ekleme İsteği:', {
                    url: API_URL,
                    payload: createPayload
                });

                const response = await apiClient.post(API_URL, createPayload);
                console.log('Ekleme API Yanıtı:', response.data);
                addActivity({
                    type: 'create',
                    entity: 'person',
                    details: `${values.name} ${values.surname} personeli eklendi`
                });
                api.success({
                    message: 'Başarılı!',
                    description: 'Personel başarıyla eklendi.',
                    icon: <CheckCircleOutlined style={{ color: token.colorSuccess }} />,
                    duration: 3
                });
            }

            setModalVisible(false);
            fetchMembers();
        } catch (error: any) {
            console.error('API Hata Detayları:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                request: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: JSON.parse(error.config?.data || '{}')
                }
            });
            api.error({
                message: 'Hata!',
                description: error.response?.data?.message || 'İşlem sırasında bir hata oluştu. Lütfen bilgileri kontrol edin.',
                icon: <CloseCircleOutlined style={{ color: token.colorError }} />,
                duration: 4
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCreateTeam = async (values: any) => {
        try {
            setLoading(true);
            await apiClient.post('/Persons', values);
            message.success('Takım başarıyla oluşturuldu');
            fetchTeams();
        } catch (error) {
            console.error('Takım oluşturma hatası:', error);
            message.error('Takım oluşturulurken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTeam = async (values: any) => {
        try {
            setLoading(true);
            await apiClient.put(`/Persons/${values.id}`, values);
            message.success('Takım başarıyla güncellendi');
            fetchTeams();
        } catch (error) {
            console.error('Takım güncelleme hatası:', error);
            message.error('Takım güncellenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (id: number) => {
        try {
            setLoading(true);
            await apiClient.delete(`/Persons/${id}`);
            message.success('Takım başarıyla silindi');
            fetchTeams();
        } catch (error) {
            console.error('Takım silme hatası:', error);
            message.error('Takım silinirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(member =>
        `${member.name} ${member.surname} ${member.email} ${member.phoneNumber}`
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    // Telefon numarası formatlama fonksiyonu
    const formatPhoneNumber = (value: string) => {
        // Sadece rakamları al
        const numbers = value.replace(/\D/g, '');
        
        // Eğer numara yoksa boş string döndür
        if (!numbers) return '';
        
        // Numarayı parçalara ayır
        let formattedNumber = '';
        
        // İlk rakam 0 değilse ekle
        if (numbers.length > 0) {
            formattedNumber = '0';
        }
        
        // Alan kodu (3 rakam)
        if (numbers.length > 1) {
            formattedNumber += ` (${numbers.slice(1, 4)}`;
        }
        
        // Kapanış parantezi
        if (numbers.length > 4) {
            formattedNumber += ') ';
        }
        
        // İlk 3 rakam
        if (numbers.length > 4) {
            formattedNumber += numbers.slice(4, 7);
        }
        
        // Son 4 rakam
        if (numbers.length > 7) {
            formattedNumber += ` ${numbers.slice(7, 11)}`;
        }
        
        return formattedNumber;
    };

    // Telefon numarası değişiklik handler'ı
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        form.setFieldValue('phoneNumber', formattedValue);
    };

    const columns = [
        {
            title: 'Üye',
            dataIndex: 'name',
            key: 'name',
            render: (_: any, record: TeamMember) => (
                <Space>
                    <Avatar
                        style={{
                            backgroundColor: record.status === 'active'
                                ? token.colorPrimary
                                : token.colorError
                        }}
                    >
                        {record.name.charAt(0)}{record.surname.charAt(0)}
                    </Avatar>
                    <div>
                        <Text strong>{record.name} {record.surname}</Text>
                        <br />
                        <Text type="secondary">{record.email}</Text>
                    </div>
                </Space>
            ),
            sorter: (a: TeamMember, b: TeamMember) => a.name.localeCompare(b.name)
        },
        {
            title: 'Rol',
            dataIndex: 'role',
            key: 'role',
            render: (role: number) => {
                const roleInfo = roleOptions.find(r => r.value === role);
                return (
                    <Tag color={role === 1 ? 'red' : 'blue'}>
                        {roleInfo?.label || 'Rol Tanımlanmamış'}
                    </Tag>
                );
            },
            filters: roleOptions.map(r => ({ text: r.label, value: r.value })),
            onFilter: (value: any, record: TeamMember) => record.role === value
        },
        {
            title: 'Bölüm',
            dataIndex: 'sectionId',
            key: 'section',
            render: (sectionId: number) => {
                const section = sections.find(s => s.id === sectionId);
                return section?.title || 'Bölüm Tanımlanmamış';
            },
            filters: sections.map(s => ({ text: s.title, value: s.id })),
            onFilter: (value: any, record: TeamMember) => record.sectionId === value
        },
        {
            title: 'Telefon',
            dataIndex: 'phoneNumber',
            key: 'phone',
            render: (phone: string) => phone || '-'
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, record: TeamMember) => (
                <Space size="middle">
                    <Tooltip title="Düzenle">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Bu üyeyi silmek istediğinize emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Tooltip title="Sil">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {contextHolder}
            <Card
                title={
                    <Space>
                        <TeamOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
                        <Title level={4} style={{ margin: 0 }}>Takım Yönetimi</Title>
                    </Space>
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Arama yap..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Button
                            icon={<SyncOutlined spin={loading} />}
                            loading={loading}
                            onClick={fetchMembers}
                        />
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleAdd}
                        >
                            Yeni Üye Ekle
                        </Button>
                    </Space>
                }
                bordered={false}
                style={{ boxShadow: token.boxShadow }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredMembers}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} üye`
                    }}
                    scroll={{ x: true }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        {editMode ? (
                            <>
                                <EditOutlined />
                                <span>Üye Düzenle</span>
                            </>
                        ) : (
                            <>
                                <UserAddOutlined />
                                <span>Yeni Üye Ekle</span>
                            </>
                        )}
                    </Space>
                }
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                confirmLoading={submitLoading}
                width={600}
                okText={editMode ? 'Güncelle' : 'Ekle'}
                cancelText="İptal"
                destroyOnClose
            >
                <Divider />
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{}}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            label="Ad"
                            name="name"
                            rules={[{ required: true, message: 'Lütfen ad giriniz' }]}
                        >
                            <Input placeholder="Ad" />
                        </Form.Item>

                        <Form.Item
                            label="Soyad"
                            name="surname"
                            rules={[{ required: true, message: 'Lütfen soyad giriniz' }]}
                        >
                            <Input placeholder="Soyad" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="E-posta"
                        name="email"
                        rules={[
                            { required: true, message: 'Lütfen e-posta giriniz' },
                            { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
                        ]}
                    >
                        <Input placeholder="E-posta" />
                    </Form.Item>

                    <Form.Item
                        label="Telefon Numarası"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: 'Lütfen telefon numarası giriniz' },
                            { 
                                pattern: /^0 \(\d{3}\) \d{3} \d{4}$/,
                                message: 'Geçerli bir telefon numarası giriniz (0 (XXX) XXX XXXX)'
                            }
                        ]}
                    >
                        <Input 
                            placeholder="0 (XXX) XXX XXXX"
                            onChange={handlePhoneChange}
                            maxLength={16}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Şifre"
                        name="password"
                        rules={[
                            {
                                required: !editMode,
                                message: 'Lütfen şifre giriniz'
                            },
                            {
                                min: 6,
                                message: 'Şifre en az 6 karakter olmalıdır'
                            }
                        ]}
                        extra={editMode && "Şifreyi değiştirmek istemiyorsanız boş bırakın"}
                    >
                        <Input.Password placeholder="Şifre" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            label="Rol"
                            name="role"
                            rules={[{ required: true, message: 'Lütfen rol seçiniz' }]}
                        >
                            <Select 
                                placeholder="Rol seçiniz"
                                onChange={(value) => {
                                    if (value === 1) {
                                        form.setFieldValue('sectionId', undefined);
                                    }
                                }}
                            >
                                {roleOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                        >
                            {({ getFieldValue }) => {
                                const role = getFieldValue('role');
                                return role === 2 ? (
                                    <Form.Item
                                        label="Bölüm"
                                        name="sectionId"
                                        rules={[{ required: true, message: 'Lütfen bölüm seçiniz' }]}
                                    >
                                        <Select placeholder="Bölüm seçiniz">
                                            {sections.map(section => (
                                                <Option key={section.id} value={section.id}>
                                                    {section.title}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                ) : null;
                            }}
                        </Form.Item>
                    </div>

                    {editMode && (
                        <Form.Item
                            label="Durum"
                            name="status"
                        >
                            <Select>
                                <Option value="active">Aktif</Option>
                                <Option value="inactive">Pasif</Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default TeamSession;