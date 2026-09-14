// =====================================================
// CONFIGURAÇÃO DO SUPABASE (VERSÃO MELHORADA)
// =====================================================

const SUPABASE_URL = "https://yjldccipruugghifgvws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jYKpCaLeJuiKoXBdKVcmBQ_e4xr9m9w";

// Inicializar cliente Supabase
let supabaseClient = null;
let supabaseReady = false;
let sessionLoaded = false;
const supabaseReadyCallbacks = [];

// Notificar callbacks quando Supabase estiver pronto
function onSupabaseReady(callback) {
  if (supabaseReady) {
    callback();
  } else {
    supabaseReadyCallbacks.push(callback);
  }
}

// Função para inicializar Supabase quando a biblioteca estiver pronta
function initializeSupabase() {
  if (supabaseReady) {
    return; // Já foi inicializado
  }

  if (!window.supabase) {
    console.error("Biblioteca Supabase não foi carregada ainda");
    setTimeout(initializeSupabase, 100); // Tenta novamente
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.supabaseClient = supabaseClient;
    supabaseReady = true;
    console.log("Supabase inicializado com sucesso");

    // Aguardar que a sessão seja carregada do localStorage
    loadSessionAndRunCallbacks();
  } catch (error) {
    console.error("Erro ao inicializar Supabase:", error);
    setTimeout(initializeSupabase, 500); // Tenta novamente em mais tempo
  }
}

// Aguardar carregamento da sessão
async function loadSessionAndRunCallbacks() {
  try {
    // Dar tempo para Supabase carregar a sessão
    console.log("Aguardando carregamento de sessão do Supabase...");
    
    for (let i = 0; i < 10; i++) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        console.log("Sessão carregada! Usuário:", user.email);
        sessionLoaded = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    sessionLoaded = true;
    console.log("Pronto para executar callbacks de Supabase");

    // Executar todos os callbacks pendentes
    supabaseReadyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.error("Erro ao executar callback de Supabase:", e);
      }
    });
  } catch (error) {
    console.error("Erro ao carregar sessão:", error);
    // Mesmo com erro, executar callbacks para não travar
    sessionLoaded = true;
    supabaseReadyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.error("Erro ao executar callback de Supabase:", e);
      }
    });
  }
}

// Tentar inicializar imediatamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}

// Tentar inicializar também após um pequeno delay
setTimeout(initializeSupabase, 100);
setTimeout(initializeSupabase, 500);
