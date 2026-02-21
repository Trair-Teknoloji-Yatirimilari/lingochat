import * as Sentry from "@sentry/react-native";
import PostHog from "posthog-react-native";
import Constants from "expo-constants";

// Sentry Configuration
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.log("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeSend(event) {
      // Don't send events in development
      if (__DEV__) {
        console.log("[Sentry] Event captured (dev mode, not sent):", event);
        return null;
      }
      return event;
    },
  });

  console.log("[Sentry] Initialized successfully");
}

// PostHog Configuration
let posthogClient: PostHog | null = null;

export async function initPostHog() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    console.log("[PostHog] API key not configured, skipping initialization");
    return;
  }

  try {
    posthogClient = await PostHog.initAsync(apiKey, {
      host,
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
    });

    console.log("[PostHog] Initialized successfully");
  } catch (error) {
    console.error("[PostHog] Initialization failed:", error);
  }
}

// Analytics Helper Functions
export const analytics = {
  // Track events
  track: (eventName: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    posthogClient.capture(eventName, properties);
  },

  // Identify user
  identify: (userId: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    posthogClient.identify(userId, properties);
  },

  // Screen tracking
  screen: (screenName: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    posthogClient.screen(screenName, properties);
  },

  // User properties
  setUserProperties: (properties: Record<string, any>) => {
    if (!posthogClient) return;
    posthogClient.identify(undefined, properties);
  },

  // Reset on logout
  reset: () => {
    if (!posthogClient) return;
    posthogClient.reset();
  },
};

// Error tracking helper
export function captureError(error: Error, context?: Record<string, any>) {
  console.error("[Error]", error, context);
  
  if (__DEV__) {
    console.log("[Sentry] Error captured (dev mode, not sent)");
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  if (__DEV__) return null;
  return Sentry.startTransaction({ name, op });
}
