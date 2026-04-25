export function getGa4ClientId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return undefined;
  const parts = match[1].split(".");
  if (parts.length < 4) return undefined;
  return `${parts[2]}.${parts[3]}`;
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

export function trackClickCtaLanding() {
  gtag("event", "click_cta_landing", {
    page: "home",
    timestamp: new Date().toISOString(),
  });
}

export function trackSignupCompleted(userId: string) {
  gtag("event", "signup_completed", {
    userId,
    authMethod: "google",
    timestamp: new Date().toISOString(),
  });
}

export function trackUploadPdfInitiated() {
  gtag("event", "upload_pdf_initiated", {
    timestamp: new Date().toISOString(),
  });
}

export function trackUploadPdfCompleted(fileSize: number, subject: string) {
  gtag("event", "upload_pdf_completed", {
    fileSize,
    subject,
    timestamp: new Date().toISOString(),
  });
}

export function trackTestSheetViewed(sheetId: string) {
  gtag("event", "test_sheet_viewed", {
    sheetId,
    timestamp: new Date().toISOString(),
  });
}

export function trackCreateOwnClicked(sheetId: string) {
  gtag("event", "create_own_clicked", {
    sheetId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaywallDisplayed(userId?: string) {
  gtag("event", "paywall_displayed", {
    ...(userId ? { userId } : {}),
    timestamp: new Date().toISOString(),
  });
}

export function trackPricingPageViewed() {
  gtag("event", "pricing_page_viewed", {
    timestamp: new Date().toISOString(),
  });
}

export function trackGoogleSigninClicked(source: string) {
  gtag("event", "google_signin_clicked", {
    source, // "blurred_sheet" | "try_paywall" | "sheet_preview"
    timestamp: new Date().toISOString(),
  });
}

export function trackSheetUnlocked(sheetId: string) {
  gtag("event", "sheet_unlocked", {
    sheetId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaywallShown(trigger: string) {
  gtag("event", "paywall_shown", {
    trigger, // "quota_reached" | "second_sheet"
    timestamp: new Date().toISOString(),
  });
}

export function trackStripeRedirectClicked() {
  gtag("event", "stripe_redirect_clicked", {
    timestamp: new Date().toISOString(),
  });
}

export function trackLandingPageViewed() {
  gtag("event", "landing_page_viewed", {
    timestamp: new Date().toISOString(),
  });
}

// inputType: "pdf" | "photo" | "text"
export function trackInputTypeSelected(inputType: "pdf" | "photo" | "text") {
  gtag("event", "input_type_selected", {
    inputType,
    timestamp: new Date().toISOString(),
  });
}

export function trackCreateAnotherSheetClicked() {
  gtag("event", "create_another_sheet_clicked", {
    timestamp: new Date().toISOString(),
  });
}

