import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vbowemldnswvwcschrdw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_T7TTxtCie7oWNbDE0aBYPg_PDhjPVtU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
