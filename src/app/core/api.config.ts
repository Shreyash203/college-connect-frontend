const LOCAL_API_BASE_URL = 'http://localhost:8000/api';
const DEPLOYED_API_BASE_URL =
  'https://ca-college-connect-api.agreeablepebble-a4512869.centralindia.azurecontainerapps.io/api';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL = isLocalHost ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL;
