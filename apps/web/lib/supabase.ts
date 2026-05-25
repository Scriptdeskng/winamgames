import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createFallbackClient() {
  const fail = () => {
    throw new Error("Supabase client is disabled. Use the FastAPI-backed helpers instead.");
  };
  return new Proxy(
    {},
    {
      get: () => fail,
    },
  ) as ReturnType<typeof createClient>;
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })
    : createFallbackClient();
