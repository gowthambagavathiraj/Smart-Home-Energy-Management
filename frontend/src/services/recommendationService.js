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

export const recommendationService = {
  getRecommendations: async () => {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
