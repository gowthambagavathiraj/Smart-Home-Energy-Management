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

export const scheduleService = {
  getSchedules: async () => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getSchedulesByDevice: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/schedules/device/${deviceId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createSchedule: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  updateSchedule: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  deleteSchedule: async (id) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete schedule');
    }
    return true;
  },
};
