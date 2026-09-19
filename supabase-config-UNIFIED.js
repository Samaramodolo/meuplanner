// Consolidated Supabase Configuration File
// This file consolidates all Supabase configuration in one place to prevent SyntaxError from duplicate SUPABASE_URL declarations

// Guard clause to prevent multiple loads
if (typeof window.SUPABASE_CONFIG_LOADED === 'undefined') {
    
    // Supabase Configuration
    const SUPABASE_URL = 'https://bkprdbxtysvfshrjnfyk.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcHJkYnh0eXN2ZnNocmpuZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzNDU2MzAsImV4cCI6MjA0MTkyMTYzMH0.6Xs28nFzT2aTpx0Y-nz6ZjAVnH4W5YxAl5qXz0pYgZ0';
    
    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Export to window object for global access
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_KEY = SUPABASE_KEY;
    window.supabaseClient = supabase;
    
    // Mark as loaded to prevent re-initialization
    window.SUPABASE_CONFIG_LOADED = true;
    
    console.log('Supabase configuration loaded successfully');
}
