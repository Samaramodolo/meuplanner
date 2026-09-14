// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = "https://yjldccipruugghifgvws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jYKpCaLeJuiKoXBdKVcmBQ_e4xr9m9w";

// Importar Supabase SDK do CDN
const supabase = window.supabase;

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Exportar para uso em outros arquivos
window.supabaseClient = supabaseClient;
