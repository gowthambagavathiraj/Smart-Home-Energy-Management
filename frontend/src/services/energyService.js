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

export const energyService = {
  getRealtimeUsage: async () => {
    const response = await fetch(`${API_BASE_URL}/energy/realtime`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getConsumption: async (period = 'hourly', points = 12) => {
    const params = new URLSearchParams({ period, points: String(points) });
    const response = await fetch(`${API_BASE_URL}/energy/consumption?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/energy/analytics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
