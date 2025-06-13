import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api/client';

const { Title } = Typography;

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        form.setFieldValue('phoneNumber', formatted);
    };

    const handleSubmit = async (values: { phoneNumber: string; password: string }) => {
        setLoading(true);
        try {
            const response = await API.auth.login(values);

            if (response && response.accessToken) {
                localStorage.setItem('token', response.accessToken);

                // Kullanıcı bilgilerini al
                const userResponse = await API.persons.getUserInfo();

                message.success('Giriş başarılı!');

                // Role göre yönlendir (2 = işçi)
                if (userResponse.role === 2) {
                    if (userResponse.sectionId === 6) {
                        navigate(`/quality-control`);
                    } else {
                        navigate(`/employee/${userResponse.id}`);
                    }
                } else {
                    navigate('/');
                }
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Giriş başarısız!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
                    Giriş Yap
                </Title>
                <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        name="phoneNumber"
                        rules={[
                            { required: true, message: 'Lütfen telefon numaranızı girin!' },
                            {
                                pattern: /^0 \(\d{3}\) \d{3} \d{4}$/,
                                message: 'Geçerli bir telefon numarası girin! (0 (xxx) xxx xxxx)'
                            }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="0 (xxx) xxx xxxx"
                            size="large"
                            onChange={handlePhoneChange}
                            maxLength={17}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Şifre"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                        >
                            Giriş Yap
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginScreen;