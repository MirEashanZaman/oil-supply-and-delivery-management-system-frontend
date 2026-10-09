import type { CapacitorConfig } from '@capacitor/cli';

const liveUrl = process.env.CAPACITOR_SERVER_URL || 'https://oil-supply-and-delivery-management.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.Eshan.oilsupply',
  appName: 'OSDMS',
  webDir: 'public',
  server: {
    url: liveUrl,
    cleartext: liveUrl.startsWith('http://'),
  },
};

export default config;
