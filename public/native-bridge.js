/**
 * Skillmatch Native Bridge
 * Activates native iOS features when running inside Capacitor
 */

(function () {
  if (!window.Capacitor) return;

  const { Capacitor, Plugins } = window;
  if (!Capacitor.isNativePlatform()) return;

  console.log("[Skillmatch Native] Initializing native features...");

  // ─── 1. PUSH NOTIFICATIONS (candidate alerts) ───────────────
  async function setupPushNotifications() {
    try {
      const { PushNotifications } = Plugins;
      if (!PushNotifications) return;

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === "granted") {
        await PushNotifications.register();
      }

      PushNotifications.addListener("registration", (token) => {
        localStorage.setItem("skillmatch_push_token", token.value);
      });

      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          if (notification.body) {
            const banner = document.createElement("div");
            banner.style.cssText =
              "position:fixed;top:0;left:0;right:0;padding:60px 16px 16px;background:#00BFA5;color:white;font-weight:bold;z-index:99999;text-align:center;font-size:14px;";
            banner.textContent = notification.body;
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 4000);
          }
        }
      );

      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        () => {
          // Navigate to candidates when notification tapped
          window.location.href = "/candidates";
        }
      );

      console.log("[Skillmatch Native] Push notifications registered");
    } catch (e) {
      console.log("[Skillmatch Native] Push setup skipped:", e);
    }
  }

  // ─── 2. HAPTIC FEEDBACK ─────────────────────────────────────
  async function addHapticFeedback() {
    try {
      const { Haptics } = Plugins;
      if (!Haptics) return;

      document.addEventListener("click", (e) => {
        const target = e.target;

        // Pill chip interactions
        if (target.closest("[class*='rounded-full']")) {
          Haptics.impact({ style: "light" });
        }

        // Main CTAs (teal buttons)
        if (target.closest("[class*='bg-teal']")) {
          Haptics.impact({ style: "medium" });
        }
      });

      console.log("[Skillmatch Native] Haptic feedback enabled");
    } catch (e) {
      console.log("[Skillmatch Native] Haptics skipped:", e);
    }
  }

  // ─── 3. NETWORK STATUS ──────────────────────────────────────
  async function setupNetworkHandling() {
    try {
      const { Network } = Plugins;
      if (!Network) return;

      Network.addListener("networkStatusChange", (status) => {
        if (!status.connected) {
          let banner = document.getElementById("skillmatch-offline-banner");
          if (!banner) {
            banner = document.createElement("div");
            banner.id = "skillmatch-offline-banner";
            banner.style.cssText =
              "position:fixed;bottom:0;left:0;right:0;padding:12px;background:#F7A31C;color:white;font-weight:bold;z-index:99999;text-align:center;font-size:14px;";
            banner.textContent =
              "You're offline. Some features may not work.";
            document.body.appendChild(banner);
          }
        } else {
          const banner = document.getElementById("skillmatch-offline-banner");
          if (banner) banner.remove();
        }
      });

      console.log("[Skillmatch Native] Network monitoring enabled");
    } catch (e) {
      console.log("[Skillmatch Native] Network skipped:", e);
    }
  }

  // ─── 4. KEYBOARD HANDLING ───────────────────────────────────
  async function setupKeyboard() {
    try {
      const { Keyboard } = Plugins;
      if (!Keyboard) return;

      Keyboard.addListener("keyboardWillShow", (info) => {
        document.body.style.paddingBottom = info.keyboardHeight + "px";
        const active = document.activeElement;
        if (active && active.tagName === "INPUT") {
          setTimeout(() => {
            active.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      });

      Keyboard.addListener("keyboardWillHide", () => {
        document.body.style.paddingBottom = "0px";
      });

      console.log("[Skillmatch Native] Keyboard handling enabled");
    } catch (e) {
      console.log("[Skillmatch Native] Keyboard skipped:", e);
    }
  }

  // ─── 5. APP LIFECYCLE ───────────────────────────────────────
  async function setupAppLifecycle() {
    try {
      const { App } = Plugins;
      if (!App) return;

      App.addListener("backButton", () => {
        if (window.history.length > 1) window.history.back();
        else App.exitApp();
      });

      App.addListener("appStateChange", (state) => {
        if (state.isActive) {
          window.dispatchEvent(new Event("skillmatch-app-resume"));
        }
      });

      console.log("[Skillmatch Native] App lifecycle handlers enabled");
    } catch (e) {
      console.log("[Skillmatch Native] Lifecycle skipped:", e);
    }
  }

  // ─── 6. STATUS BAR ──────────────────────────────────────────
  async function setupStatusBar() {
    try {
      const { StatusBar } = Plugins;
      if (!StatusBar) return;

      StatusBar.setStyle({ style: "DARK" });
      StatusBar.setBackgroundColor({ color: "#FFFFFF" });
    } catch (e) {
      console.log("[Skillmatch Native] StatusBar skipped:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupPushNotifications();
    addHapticFeedback();
    setupNetworkHandling();
    setupKeyboard();
    setupAppLifecycle();
    setupStatusBar();
    console.log("[Skillmatch Native] All native features initialized");
  });
})();
