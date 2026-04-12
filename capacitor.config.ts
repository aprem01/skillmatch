import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.skillmatch.app",
  appName: "Skillmatch",
  webDir: "out",
  server: {
    url: "https://skillmatch-red.vercel.app",
    cleartext: false,
    errorPath: "/offline.html",
  },
  ios: {
    scheme: "Skillmatch",
    contentInset: "automatic",
    allowsLinkPreview: false,
    backgroundColor: "#F5F5F5",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#00BFA5",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFFFFF",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
