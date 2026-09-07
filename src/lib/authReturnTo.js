// Guards the post-login redirect target so we only ever send the browser to
// a same-origin path (never an absolute/external URL) after sign-in.
export function safeReturnTo() {
  try {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (!returnTo) return null;
    if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return null;
    return returnTo;
  } catch {
    return null;
  }
}
