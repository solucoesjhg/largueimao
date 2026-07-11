import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solucoesjhg.largueimao',
  appName: 'Larguei Mão',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  plugins: {
    Keyboard: {
      resize: "none",
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#265939",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: false,
    },
    GoogleSignIn: {
      clientId: "1077803983918-9fn1clbcp1o2p6t6ibianvnamcou1sbh.apps.googleusercontent.com",
      iosClientId: "1077803983918-gug1tff01inupg36fdvi4kslinqjqrpd.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
