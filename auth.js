// =====================================================
// LÓGICA DE AUTENTICAÇÃO (VERSÃO MELHORADA)
// =====================================================

// Verificar se usuário está logado com retry
async function checkAuth() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log("checkAuth - Usuário:", user?.email || "não autenticado");
    return user;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error.message);
    return null;
  }
}

// Fazer login
async function login(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("Erro ao fazer login:", error.message);
      return { success: false, error: error.message };
    }

    // Salvar que fez login
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    console.log("Login bem-sucedido para:", email);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Erro durante login:", error.message);
    return { success: false, error: error.message };
  }
}

// Fazer registro/signup
async function signup(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.error("Erro ao fazer registro:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Signup bem-sucedido para:", email);
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Erro durante signup:", error.message);
    return { success: false, error: error.message };
  }
}

// Fazer logout
async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Erro ao fazer logout:", error.message);
      return { success: false, error: error.message };
    }

    // Limpar dados locais
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("lastArea");
    localStorage.removeItem("lastTab");

    console.log("Logout bem-sucedido");
    return { success: true };
  } catch (error) {
    console.error("Erro durante logout:", error.message);
    return { success: false, error: error.message };
  }
}

// Redirecionar se não está logado - COM RETRY
async function requireAuth() {
  console.log("requireAuth iniciado...");
  
  // Tentar verificar autenticação múltiplas vezes
  for (let i = 0; i < 5; i++) {
    const user = await checkAuth();

    if (user) {
      console.log("✓ Autenticação confirmada para:", user.email);
      return user;
    }

    console.log(`Tentativa ${i + 1}/5 - Usuário não encontrado, aguardando...`);
    
    if (i < 4) {
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Se chegou aqui, não está autenticado
  console.error("✗ Usuário não autenticado após 5 tentativas, redirecionando para login");
  window.location.href = "index.html";
  return false;
}
