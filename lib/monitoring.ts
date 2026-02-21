import * as Sentry from "sentry-expo";
import PostHog from "posthog-react-native";

// Sentry Configuration
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.log("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  try {
    Sentry.init({
      dsn,
      debug: __DEV__,
      environment: __DEV__ ? "development" : "production",
      enableInExpoDevelopment: false,
      tracesSampleRate: 1.0,
    });

    console.log("[Sentry] Initialized successfully");
  } catch (error) {
    console.error("[Sentry] Initialization failed:", error);
  }
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
    // PostHog initialization for React Native
    posthogClient = new PostHog(apiKey, {
      host,
    });

    console.log("[PostHog] Initialized successfully");
  } catch (error) {
    console.error("[PostHog] Initialization failed:", error);
  }
}

// Analytics Helper Functions
export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    try {
      posthogClient.capture(eventName, properties);
    } catch (error) {
      console.error("[PostHog] Track error:", error);
    }
  },

  identify: (userId: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    try {
      posthogClient.identify(userId, properties);
    } catch (error) {
      console.error("[PostHog] Identify error:", error);
    }
  },

  screen: (screenName: string, properties?: Record<string, any>) => {
    if (!posthogClient) return;
    try {
      posthogClient.screen(screenName, properties);
    } catch (error) {
      console.error("[PostHog] Screen error:", error);
    }
  },

  setUserProperties: (properties: Record<string, any>) => {
    if (!posthogClient) return;
    try {
      posthogClient.identify(undefined, properties);
    } catch (error) {
      console.error("[PostHog] Set properties error:", error);
    }
  },

  reset: () => {
    if (!posthogClient) return;
    try {
      posthogClient.reset();
    } catch (error) {
      console.error("[PostHog] Reset error:", error);
    }
  },
};

// Error tracking helper
export function captureError(error: Error, context?: Record<string, any>) {
  console.error("[Error]", error, context);
  
  if (__DEV__) {
    console.log("[Sentry] Error captured (dev mode, not sent)");
    return;
  }

  try {
    Sentry.Native.captureException(error, {
      extra: context,
    });
  } catch (e) {
    console.error("[Sentry] Failed to capture error:", e);
  }
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  if (__DEV__) return null;
  try {
    return Sentry.Native.startTransaction({ name, op });
  } catch (error) {
    console.error("[Sentry] Failed to start transaction:", error);
    return null;
  }
}

