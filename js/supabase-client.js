// Shared Supabase client (anon key)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://rrokmjzrnbapyjziqpbp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyb2ttanpybmJhcHlqemlxcGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTE4NzAsImV4cCI6MjA5NDk2Nzg3MH0.eR53yyeUuyTYp5XtxTugJplTxIPgjxusdiDrIDQ_DSo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)