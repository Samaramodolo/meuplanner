// Database functions for Meu Planner

// Ensure Supabase client is loaded
async function getSupabaseClient() {
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

// Get tasks for current user
async function getTasks() {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar tarefas:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro em getTasks:', error);
        return { success: false, error: error.message };
    }
}

// Create new task
async function createTask(taskData) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                user_id: user.id,
                title: taskData.title,
                description: taskData.description || '',
                due_date: taskData.due_date || null,
                priority: taskData.priority || 'normal',
                status: taskData.status || 'todo',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Erro ao criar tarefa:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] };
    } catch (error) {
        console.error('Erro em createTask:', error);
        return { success: false, error: error.message };
    }
}

// Update task
async function updateTask(taskId, updates) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .eq('user_id', user.id)
            .select();

        if (error) {
            console.error('Erro ao atualizar tarefa:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] };
    } catch (error) {
        console.error('Erro em updateTask:', error);
        return { success: false, error: error.message };
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Erro ao deletar tarefa:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro em deleteTask:', error);
        return { success: false, error: error.message };
    }
}

// Get user profile
async function getUserProfile() {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil:', error);
            return { success: false, error: error.message };
        }

        // If profile doesn't exist, return null (not an error)
        return { success: true, data: data || null };
    } catch (error) {
        console.error('Erro em getUserProfile:', error);
        return { success: false, error: error.message };
    }
}

// Update user profile
async function updateUserProfile(profileData) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] };
    } catch (error) {
        console.error('Erro em updateUserProfile:', error);
        return { success: false, error: error.message };
    }
}

// Get goals
async function getGoals() {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar objetivos:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro em getGoals:', error);
        return { success: false, error: error.message };
    }
}

// Create goal
async function createGoal(goalData) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('goals')
            .insert([{
                user_id: user.id,
                title: goalData.title,
                description: goalData.description || '',
                target_date: goalData.target_date || null,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Erro ao criar objetivo:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] };
    } catch (error) {
        console.error('Erro em createGoal:', error);
        return { success: false, error: error.message };
    }
}

// Get notes
async function getNotes() {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar notas:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro em getNotes:', error);
        return { success: false, error: error.message };
    }
}

// Create note
async function createNote(noteData) {
    try {
        const supabase = await getSupabaseClient();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('notes')
            .insert([{
                user_id: user.id,
                title: noteData.title,
                content: noteData.content || '',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Erro ao criar nota:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] };
    } catch (error) {
        console.error('Erro em createNote:', error);
        return { success: false, error: error.message };
    }
}
