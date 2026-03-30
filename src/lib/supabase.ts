import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase 클라이언트
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 환경변수가 없으면 null 반환 → mock 데이터 사용
 */
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
