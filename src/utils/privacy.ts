/**
 * Utility functions for privacy and data protection
 */

/**
 * Masks an email address to protect user privacy
 * Shows first 2 characters + *** + @ + domain
 *
 * @example
 * maskEmail('john.doe@example.com') // 'jo***@example.com'
 * maskEmail('a@b.com') // 'a***@b.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return email || "";
  }

  const [local, domain] = email.split("@");

  if (local.length <= 2) {
    return `${local}***@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Masks a phone number to protect privacy
 * Shows only last 2 digits
 *
 * @example
 * maskPhone('+2250707070707') // '*******707'
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return phone || "";
  }

  const visible = phone.slice(-3);
  const masked = "*".repeat(phone.length - 3);
  return `${masked}${visible}`;
}

/**
 * Formats a name for display (initials or abbreviated)
 *
 * @example
 * formatNameDisplay('Jean Kouassi') // 'J. Kouassi'
 * formatNameDisplay('Jean') // 'Jean'
 */
export function formatNameDisplay(name: string): string {
  if (!name) return "";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0];
  }

  // First initial + last name
  return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
}
