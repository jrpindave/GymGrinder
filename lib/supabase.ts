import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPA_URL!;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPA_KEY!;

export const supabase = createClient(SUPA_URL, SUPA_KEY);

export async function rpc<T = unknown>(fn: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

const PHOTO_BUCKET = 'gym-photos';

export function photoPublicUrl(storagePath: string): string {
  return `${SUPA_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}
