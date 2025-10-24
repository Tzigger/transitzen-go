import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.georgecatanescu.transitzen.app",
  appName: "ZeroWait",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "http",
    iosScheme: "http",
    hostname: "100.114.211.3",
    cleartext: true,
    allowNavigation: ["*"],
  },
};

export default config;
