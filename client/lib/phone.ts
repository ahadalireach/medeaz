/**
 * Pakistani phone number validation and normalization.
 * Accepts:  +923001234567  (international, 13 chars)
 *           03001234567    (local, 11 chars — auto-normalized)
 */

const PK_REGEX = /^(\+92|0)[0-9]{10}$/;

export const PK_PHONE_PLACEHOLDER = "+923001234567";
export const PK_PHONE_ERROR = "Enter a valid Pakistani number, e.g. +923001234567";

/** Returns true if the value is a valid PK phone number. */
export function validatePkPhone(value: string): boolean {
  return PK_REGEX.test(value.replace(/\s+/g, ""));
}

/** Converts 03001234567 → +923001234567. Returns the value unchanged if already international. */
export function normalizePkPhone(value: string): string {
  const clean = value.replace(/\s+/g, "");
  if (clean.startsWith("0") && clean.length === 11) {
    return "+92" + clean.slice(1);
  }
  return clean;
}
