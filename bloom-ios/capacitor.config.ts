import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.opticald.bloom",
  appName: "Bloom",
  // The built Bloom web app is copied here by `npm run build:web`.
  webDir: "www",
  // Matches the app's dark background so there's no white flash on launch.
  backgroundColor: "#0a0a12",
  ios: {
    // Let the WebView background match the app instead of flashing white.
    backgroundColor: "#0a0a12",
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#0a0a12",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK", // dark UI → light status-bar text
      backgroundColor: "#0a0a12",
    },
  },
};

export default config;
