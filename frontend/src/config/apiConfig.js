/**
 * Configuration file for API endpoints and environment variables
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
const OAUTH2_BASE_URL = process.env.REACT_APP_OAUTH2_URL || 'http://localhost:8081';
const ENV = process.env.REACT_APP_ENV || 'development';

export default {
  API_BASE_URL,
  OAUTH2_BASE_URL,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
};
