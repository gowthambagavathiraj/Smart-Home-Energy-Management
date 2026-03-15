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
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : {};
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
};

export const adminService = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserDevices: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/devices`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserEnergyLogs: async (userId, deviceId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/devices/${deviceId}/energy-logs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserRealtimeUsage: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/energy/realtime`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserConsumption: async (userId, period = 'hourly', points = 12) => {
    const params = new URLSearchParams({ period, points: String(points) });
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/energy/consumption?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserAnalytics: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/energy/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserNotifications: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getUserRecommendations: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/recommendations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateUser: async (userId, payload) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
