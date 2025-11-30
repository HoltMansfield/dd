import { createClient } from "@supabase/supabase-js";

console.log("[Supabase Config] Initializing Supabase clients");
console.log("[Supabase Config] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "[Supabase Config] Has Service Role Key:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log(
  "[Supabase Config] Has Anon Key:",
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("[Supabase Config] ERROR: Missing NEXT_PUBLIC_SUPABASE_URL");
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Supabase Config] ERROR: Missing SUPABASE_SERVICE_ROLE_KEY");
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// Server-side client with service role key (full access)
// ONLY use this in server actions/API routes, NEVER expose to client
console.log("[Supabase Config] Creating admin client");
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
console.log("[Supabase Config] Admin client created successfully");

// Client-side client with anon key (limited access via RLS policies)
// Safe to use in client components
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);
