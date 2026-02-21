// Sentry and PostHog temporarily disabled for build
// Will be re-enabled after successful build

// Sentry Configuration
export function initSentry() {
  console.log("[Sentry] Temporarily disabled for build");
}

// PostHog Configuration
let posthogClient: any = null;

export async function initPostHog() {
  console.log("[PostHog] Temporarily disabled for build");
}

// Analytics Helper Functions
export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    // Temporarily disabled
  },
  identify: (userId: string, properties?: Record<string, any>) => {
    // Temporarily disabled
  },
  screen: (screenName: string, properties?: Record<string, any>) => {
    // Temporarily disabled
  },
  setUserProperties: (properties: Record<string, any>) => {
    // Temporarily disabled
  },
  reset: () => {
    // Temporarily disabled
  },
};

// Error tracking helper
export function captureError(error: Error, context?: Record<string, any>) {
  console.error("[Error]", error, context);
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return null;
}


