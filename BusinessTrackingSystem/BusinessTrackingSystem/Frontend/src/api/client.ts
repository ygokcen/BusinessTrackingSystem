import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 saniye timeout
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        console.error('Response error:', error);

        // 401 Unauthorized hatası
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Network hatası
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error:', error);
            return Promise.reject(error);
        }

        // Timeout hatası
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout error:', error);
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// API endpoint'leri
export const API = {
    // Auth
    auth: {
        login: async (data: { phoneNumber: string; password: string }) => {
            const response = await apiClient.post('/Auth/login', data);
            return response.data;
        },
        refreshToken: async (refreshToken: string) => {
            const response = await apiClient.post('/Auth/refresh', { refreshToken });
            return response.data;
        }
    },

    // Excel Upload
    excelUpload: {
        getAll: async () => {
            const response = await apiClient.get('/ExcelUpload');
            return response.data;
        },
        upload: async (data: FormData) => {
            const response = await apiClient.post('/ExcelUpload', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        download: async (fileName: string) => {
            const response = await apiClient.get(`/ExcelUpload/download/${fileName}`, {
                responseType: 'blob'
            });
            return response.data;
        },
        getFiles: async () => {
            const response = await apiClient.get('/ExcelUpload/files');
            return response.data;
        },
        getActiveData: async () => {
            const response = await apiClient.get('/ExcelUpload/active-data');
            return response.data;
        }
    },

    // Notification
    notification: {
        send: async (data: any) => {
            const response = await apiClient.post('/Notification/send', data);
            return response.data;
        }
    },

    // Persons
    persons: {
        getAll: async () => {
            const response = await apiClient.get('/Persons');
            return response.data;
        },
        create: async (data: any) => {
            const response = await apiClient.post('/Persons', data);
            return response.data;
        },
        getUserInfo: async () => {
            const response = await apiClient.get('/Persons/user-info');
            return response.data;
        },
        getById: async (id: string) => {
            const response = await apiClient.get(`/Persons/${id}`);
            return response.data;
        },
        update: async (id: string, data: any) => {
            const response = await apiClient.put(`/Persons/${id}`, data);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await apiClient.delete(`/Persons/${id}`);
            return response.data;
        }
    },

    // Sections
    sections: {
        getAll: async () => {
            const response = await apiClient.get('/Sections');
            return response.data;
        },
        create: async (data: any) => {
            const response = await apiClient.post('/Sections', data);
            return response.data;
        },
        getById: async (id: number) => {
            const response = await apiClient.get(`/Sections/${id}`);
            return response.data;
        },
        update: async (id: number, data: any) => {
            const response = await apiClient.put(`/Sections/${id}`, data);
            return response.data;
        },
        delete: async (id: number) => {
            const response = await apiClient.delete(`/Sections/${id}`);
            return response.data;
        }
    },

    // Section Work Assignment
    sectionWorkAssignment: {
        getAll: async () => {
            const response = await apiClient.get('/SectionWorkAssignment');
            return response.data;
        },
        create: async (data: any) => {
            const response = await apiClient.post('/SectionWorkAssignment', data);
            return response.data;
        },
        getById: async (id: string) => {
            const response = await apiClient.get(`/SectionWorkAssignment/${id}`);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await apiClient.delete(`/SectionWorkAssignment/${id}`);
            return response.data;
        },
        updateStatus: async (workOrderId: string, sectionId: number, status: number) => {
            const response = await apiClient.put(`/SectionWorkAssignment/${workOrderId}/sections/${sectionId}/status/${status}`);
            return response.data;
        },
        updateApprovalStatus: async (id: number, status: number, notes: string) => {
            const response = await apiClient.put(`/SectionWorkAssignment/approval/${id}/${status}/${notes}`);
            return response.data;
        },
        pauseAll: async () => {
            const response = await apiClient.post('/SectionWorkAssignment/pause-all');
            return response.data;
        },
        resumeAll: async () => {
            const response = await apiClient.post('/SectionWorkAssignment/resume-all');
            return response.data;
        }
    },

    // Session Logs
    sessionLogs: {
        getAll: async () => {
            const response = await apiClient.get('/SessionLogs');
            return response.data;
        },
        getByWorkOrder: async (workOrderId: string) => {
            const response = await apiClient.get(`/SessionLogs/byWorkOrder/${workOrderId}`);
            return response.data;
        },
        getByPerson: async (personId: string) => {
            const response = await apiClient.get(`/SessionLogs/byPerson/${personId}`);
            return response.data;
        },
        getBySection: async (sectionId: number) => {
            const response = await apiClient.get(`/SessionLogs/bySection/${sectionId}`);
            return response.data;
        }
    }
};

export default apiClient; 