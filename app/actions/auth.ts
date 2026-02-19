"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "habits-pwa-auth";
const APP_PASSWORD = process.env.APP_PASSWORD;

export async function checkPasswordGate(): Promise<boolean> {
  if (!APP_PASSWORD) return true;
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value === "1";
}

export async function verifyPassword(formData: FormData) {
  const password = formData.get("password") as string | null;
  if (!APP_PASSWORD) return { success: true as const };
  if (password !== APP_PASSWORD) return { success: false as const, error: "Wrong password" };
  const c = await cookies();
  c.set(COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return { success: true as const };
}
