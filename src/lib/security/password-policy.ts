import { z } from "zod";

/** Minimum length for user-chosen passwords. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

/**
 * Requires at least one letter and one digit.
 * Demo-friendly (not overly strict) but stronger than length-only checks.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`)
  .max(PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`)
  .regex(/[A-Za-zÀ-ỹ]/, "Mật khẩu phải chứa ít nhất một chữ cái")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số");

export function isPasswordStrong(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function passwordPolicyMessage(language: "vi" | "en" = "vi") {
  return language === "vi"
    ? `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự, gồm chữ và số`
    : `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include letters and numbers`;
}
