export const guestReviewCookie = "STAYESCAPE_guest_review_id";
export const guestReviewHeader = "x-STAYESCAPE-guest";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGuestReviewId(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function getOrCreateGuestReviewId() {
  if (typeof window === "undefined") return "";

  const stored = window.localStorage.getItem(guestReviewCookie);
  if (isValidGuestReviewId(stored)) {
    document.cookie = `${guestReviewCookie}=${stored}; Path=/; Max-Age=31536000; SameSite=Lax`;
    return stored;
  }

  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
          const random = Math.floor(Math.random() * 16);
          const value = character === "x" ? random : (random & 0x3) | 0x8;
          return value.toString(16);
        });

  window.localStorage.setItem(guestReviewCookie, token);
  document.cookie = `${guestReviewCookie}=${token}; Path=/; Max-Age=31536000; SameSite=Lax`;
  return token;
}
