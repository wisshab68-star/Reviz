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

export function trackPaywallDisplayed(userId: string) {
  gtag("event", "paywall_displayed", {
    userId,
    timestamp: new Date().toISOString(),
  });
}

export function trackSubscriptionCompleted(subscriptionId: string, price: number) {
  gtag("event", "subscription_completed", {
    subscriptionId,
    price,
    currency: "EUR",
    timestamp: new Date().toISOString(),
  });
}
