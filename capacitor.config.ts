import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ecoverify.app',
  appName: 'EcoVerify',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    // Configure your production URL here when deploying
    url: 'https://your-production-url.com',
    cleartext: false
  }
};

export default config;
