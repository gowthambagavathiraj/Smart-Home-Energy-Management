import apiConfig from '../config/apiConfig';

const { API_BASE_URL } = apiConfig;

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const technicianService = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserDevices: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/devices`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserEnergyLogs: async (userId, deviceId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/devices/${deviceId}/energy-logs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserRealtimeUsage: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/energy/realtime`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserConsumption: async (userId, period = 'hourly', points = 12) => {
    const params = new URLSearchParams({ period, points: String(points) });
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/energy/consumption?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserAnalytics: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/energy/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserNotifications: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserRecommendations: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/technician/users/${userId}/recommendations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getDevicesHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/devices/health`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getMaintenanceRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/maintenance-requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getOfflineDevices: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/devices/offline`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getInstallationRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/technician/installation-requests`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
