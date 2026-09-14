// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = "https://yjldccipruugghifgvws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jYKpCaLeJuiKoXBdKVcmBQ_e4xr9m9w";

// Inicializar cliente Supabase
let supabaseClient = null;

// Função para inicializar Supabase quando a biblioteca estiver pronta
function initializeSupabase() {
  if (supabaseClient) {
    return; // Já foi inicializado
  }
  
  if (!window.supabase) {
    console.error("Biblioteca Supabase não foi carregada");
    setTimeout(initializeSupabase, 100); // Tenta novamente
    return;
  }
  
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.supabaseClient = supabaseClient;
    console.log("Supabase inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}

// Tentar inicializar também após um pequeno delay
setTimeout(initializeSupabase, 500);
