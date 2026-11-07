import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
// No request is made with placeholder settings: the provider blocks unconfigured routes.
export const supabase = createClient(
  url || "https://unconfigured.invalid",
  key || "unconfigured",
);
