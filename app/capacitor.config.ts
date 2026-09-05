import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.auroraproject.app",
  appName: "AURORA",
  webDir: "dist",
  server: { androidScheme: "https" },
};

export default config;
