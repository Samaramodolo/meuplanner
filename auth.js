// Authentication functions for Meu Planner
// PROXY VERSION: Uses backend relay instead of direct Supabase calls
// This solves network blocking issues

// Ensure Supabase client is loaded
async function ensureSupabaseLoaded() {
    const maxAttempts = 30;
    let attempts = 0;

    while (!window.supabaseClient && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.supabaseClient) {
        throw new Error('Supabase client não foi inicializado');
    }

    return window.supabaseClient;
}

// Check if user is already logged in
async function checkAuth() {
    try {
        const supabase = await ensureSupabaseLoaded();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return null;
    }
}

// Login using backend proxy
async function login(email, password) {
    try {
        const supabase = await ensureSupabaseLoaded();

        // Use backend proxy instead of direct Supabase call
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro de login:', data);
            return { success: false, error: data.error || 'Erro ao fazer login' };
        }

        // Now set the session in Supabase client
        if (data.access_token) {
            const { data: sessionData, error: setError } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });

            if (setError) {
                console.error('Erro ao definir sessão:', setError);
                return { success: false, error: 'Erro ao estabelecer sessão' };
            }

            return { success: true, user: sessionData.user };
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erro de login:', error);
        return { success: false, error: 'Erro de conexão. Verifique sua internet' };
    }
}

// Signup using backend proxy
async function signup(email, password) {
    try {
        const supabase = await ensureSupabaseLoaded();

        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro de registro:', data);

            // Provide user-friendly error messages
            if (data.error && data.error.includes('already registered')) {
                return { success: false, error: 'Este email já está cadastrado' };
            } else if (data.error && data.error.includes('password')) {
                return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
            }

            return { success: false, error: data.error || 'Erro ao criar conta' };
        }

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Erro ao fazer registro:', error);
        return { success: false, error: 'Erro de conexão. Verifique sua internet' };
    }
}

// Logout
async function logout() {
    try {
        const supabase = await ensureSupabaseLoaded();
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Erro ao fazer logout:', error);
            return { success: false, error: 'Erro ao fazer logout' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return { success: false, error: 'Erro ao fazer logout' };
    }
}

// Get current user
async function getCurrentUser() {
    try {
        const supabase = await ensureSupabaseLoaded();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
    }
}
