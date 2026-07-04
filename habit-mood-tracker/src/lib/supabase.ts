import { createClient } from "@supabase/supabase-js";

// The publishable key is designed to be exposed in client apps (RLS protects data),
// so a hard-coded fallback is safe and keeps the production build self-contained.
const url = import.meta.env.VITE_SUPABASE_URL ?? "https://etjajqcdjpysiskqepda.supabase.co";
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_MfEMfSLs1atU-OPLjG5XfQ_ii0xVW9P";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
