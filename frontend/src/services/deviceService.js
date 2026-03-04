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
  // Check content type
  const contentType = response.headers.get('content-type');
  const hasJsonContent = contentType && contentType.includes('application/json');
  
  // Handle empty responses (like 204 No Content)
  if (!hasJsonContent || response.status === 204) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return { success: true };
  }
  
  // Parse JSON response
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error.message.includes('JSON')) {
      // JSON parsing failed
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return { success: true };
    }
    throw error;
  }
};

export const deviceService = {
  // Get all user's devices
  getAllDevices: async () => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get single device
  getDevice: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create new device
  createDevice: async (deviceData) => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Update device
  updateDevice: async (deviceId, deviceData) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Delete device - FIXED VERSION
  deleteDevice: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Toggle device ON/OFF
  toggleDevice: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get device energy logs
  getEnergyLogs: async (deviceId, start = null, end = null) => {
    let url = `${API_BASE_URL}/devices/${deviceId}/energy-logs`;
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create energy usage log for a device
  addEnergyLog: async (deviceId, logData) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/energy-logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(logData),
    });
    return handleResponse(response);
  },
};
