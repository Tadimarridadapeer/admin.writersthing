import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "[SUPABASE] Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Using a mock client."
      );
      
      const mock: any = new Proxy({} as any, {
        get(target, prop) {
          if (prop === "then") return undefined;
          return () => mock;
        }
      });
      return mock;
    }

    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

export const supabase = new Proxy({} as any, {
  get(target, prop, receiver) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

// Helper for Signed URLs (Private Storage)
export const getSignedUrl = async (path: string, bucket: string = "pdfs") => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error("Error creating signed URL:", error.message);
    return null;
  }
  return data.signedUrl;
};
