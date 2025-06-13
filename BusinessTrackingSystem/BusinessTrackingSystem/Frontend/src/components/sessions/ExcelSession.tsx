import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Typography,
    Card,
    Tag,
    message,
    Tooltip,
    Popconfirm,
    notification,
    Switch
} from 'antd';
import {
    FileExcelOutlined,
    DownloadOutlined,
    SyncOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import apiClient from '../../api/client';
import { useTheme } from 'antd-style';

const { Title, Text } = Typography;

interface ExcelFile {
    id: number;
    originalFileName: string;
    savedFileName: string;
    uploadedAt: string;
    isDeleted: boolean;
    isActive: boolean;
}

const API_URL = '/ExcelUpload';

const ExcelSession = () => {
    const token = useTheme();
    const [files, setFiles] = useState<ExcelFile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(API_URL);
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching Excel files:', error);
            notification.error({
                message: 'Hata',
                description: 'Excel dosyaları yüklenirken bir hata oluştu.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, isActive: boolean) => {
        try {
            await apiClient.patch(`${API_URL}/${id}/status`, { isActive });
            message.success(`Dosya durumu başarıyla ${isActive ? 'aktif' : 'pasif'} yapıldı`);
            fetchFiles();
        } catch (error) {
            console.error('Error changing status:', error);
            message.error('Durum değiştirilirken bir hata oluştu');
        }
    };

    const handleDownload = async (file: ExcelFile) => {
        try {
            const response = await apiClient.get(`${API_URL}/download/${file.savedFileName}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            message.error('Dosya indirilirken bir hata oluştu');
        }
    };

    const columns = [
        {
            title: 'Dosya Adı',
            dataIndex: 'originalFileName',
            key: 'originalFileName',
            render: (text: string) => (
                <Space>
                    <FileExcelOutlined style={{ color: '#1d6f42' }} />
                    <Text>{text}</Text>
                </Space>
            ),
            sorter: (a: ExcelFile, b: ExcelFile) => a.originalFileName.localeCompare(b.originalFileName)
        },
        {
            title: 'Yüklenme Tarihi',
            dataIndex: 'uploadedAt',
            key: 'uploadedAt',
            render: (date: string) => new Date(date).toLocaleString('tr-TR'),
            sorter: (a: ExcelFile, b: ExcelFile) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive: boolean, record: ExcelFile) => (
                <Space>
                    <Switch
                        checked={isActive}
                        onChange={(checked) => handleStatusChange(record.id, checked)}
                        checkedChildren="Aktif"
                        unCheckedChildren="Pasif"
                    />
                </Space>
            ),
            filters: [
                { text: 'Aktif', value: true },
                { text: 'Pasif', value: false }
            ],
            onFilter: (value: any, record: ExcelFile) => record.isActive === value
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, record: ExcelFile) => (
                <Space size="middle">
                    <Tooltip title="İndir">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card
                title={
                    <Space>
                        <FileExcelOutlined style={{ fontSize: '24px', color: '#1d6f42' }} />
                        <Title level={4} style={{ margin: 0 }}>Excel Dosyaları</Title>
                    </Space>
                }
                extra={
                    <Button
                        icon={<SyncOutlined />}
                        loading={loading}
                        onClick={fetchFiles}
                    >
                        Yenile
                    </Button>
                }
                bordered={false}
                style={{ boxShadow: token.boxShadow }}
            >
                <Table
                    columns={columns}
                    dataSource={files}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} dosya`
                    }}
                />
            </Card>
        </div>
    );
};

export default ExcelSession; 