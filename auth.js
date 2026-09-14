// =====================================================
// LÓGICA DE AUTENTICAÇÃO
// =====================================================

// Verificar se usuário está logado
async function checkAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// Fazer login
async function login(email, password) {
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
  return { success: true, user: data.user };
}

// Fazer registro/signup
async function signup(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    console.error("Erro ao fazer registro:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user };
}

// Fazer logout
async function logout() {
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

  return { success: true };
}

// Redirecionar se não está logado
async function requireAuth() {
  const user = await checkAuth();

  if (!user) {
    window.location.href = "index.html";
    return false;
  }

  return user;
}
