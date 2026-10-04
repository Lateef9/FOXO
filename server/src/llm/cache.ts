import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LlmCacheStore = {
  get(hash: string): Promise<unknown | null>;
  set(hash: string, response: unknown): Promise<void>;
};

export function memoryCache(): LlmCacheStore {
  const map = new Map<string, unknown>();
  return {
    async get(hash) {
      return map.has(hash) ? map.get(hash)! : null;
    },
    async set(hash, response) {
      map.set(hash, response);
    },
  };
}

function supabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseLlmCache(): LlmCacheStore {
  const client = supabaseClient();
  if (!client) return memoryCache();

  return {
    async get(hash) {
      const { data, error } = await client
        .from("llm_cache")
        .select("response")
        .eq("hash", hash)
        .maybeSingle();
      if (error || !data) return null;
      return data.response as unknown;
    },
    async set(hash, response) {
      await client.from("llm_cache").upsert({ hash, response });
    },
  };
}
