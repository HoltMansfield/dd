"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  
  // Clear the session cookie
  cookieStore.delete("session_user");
  
  // Redirect to login page
  redirect("/login");
}

export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_user");
  
  return sessionCookie?.value || null;
}
