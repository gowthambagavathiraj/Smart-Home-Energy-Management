import apiConfig from '../config/apiConfig';

const { API_BASE_URL, OAUTH2_BASE_URL } = apiConfig;

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

export const authService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  verifyResetCode: async (email, code) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return handleResponse(response);
  },

  resetPassword: async (email, code, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return handleResponse(response);
  },

  verifyEmail: async (email, code) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return handleResponse(response);
  },

  resendVerification: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // ✅ FIXED: correct Spring Boot OAuth2 endpoint
  googleLogin: () => {
    window.location.href = `${OAUTH2_BASE_URL}/oauth2/authorization/google`;
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  selectRole: async (role) => {
    const response = await fetch(`${API_BASE_URL}/auth/select-role`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  },
};
