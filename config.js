// Public browser configuration. The Supabase anon/publishable key is safe to expose
// only when the Row Level Security policies in supabase_setup.sql are enabled.
window.PORTFOLIO_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
