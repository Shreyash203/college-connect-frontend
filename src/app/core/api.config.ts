import { Capacitor } from '@capacitor/core';

const LOCAL_API_BASE_URL = 'http://localhost:8000/api';
const DEPLOYED_API_BASE_URL =
  'https://ca-college-connect-api.ashygrass-6a4c76da.centralindia.azurecontainerapps.io/api';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE_URL = !Capacitor.isNativePlatform() && isLocalHost ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL;
