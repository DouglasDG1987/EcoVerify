import type { CapacitorConfig } from '@capacitor/cli';

const capacitorServerUrl = process.env.CAPACITOR_SERVER_URL;

if (!capacitorServerUrl) {
  throw new Error('CAPACITOR_SERVER_URL must be set when syncing the Android project');
}

const parsedServerUrl = new URL(capacitorServerUrl);

if (parsedServerUrl.protocol !== 'https:') {
  throw new Error('CAPACITOR_SERVER_URL must use HTTPS');
}

const config: CapacitorConfig = {
  appId: 'com.ecoverify.app',
  appName: 'EcoVerify',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: capacitorServerUrl,
    cleartext: false
  }
};

export default config;
