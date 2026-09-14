// =====================================================
// OPERAÇÕES DO BANCO DE DADOS
// =====================================================

// ============ TASKS ============

// Obter todas as tarefas do usuário
async function getTasks() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) console.error("Erro ao buscar tarefas:", error);
  return data || [];
}

// Obter tarefas de uma área específica
async function getTasksByArea(area) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("area", area)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) console.error("Erro ao buscar tarefas:", error);
  return data || [];
}

// Obter tarefas de uma data específica
async function getTasksByDate(date) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) console.error("Erro ao buscar tarefas:", error);
  return data || [];
}

// Criar nova tarefa
async function createTask(task) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("tasks")
    .insert([{
      user_id: user.id,
      title: task.title,
      date: task.date,
      time: task.time || null,
      category: task.category || null,
      area: task.area,
      priority: task.priority || null,
      description: task.description || null,
      completed: false
    }])
    .select();

  if (error) console.error("Erro ao criar tarefa:", error);
  return data ? data[0] : null;
}

// Atualizar tarefa
async function updateTask(id, updates) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) console.error("Erro ao atualizar tarefa:", error);
  return data ? data[0] : null;
}

// Deletar tarefa
async function dbDeleteTask(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return false;

  const { error } = await supabaseClient
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) console.error("Erro ao deletar tarefa:", error);
  return !error;
}

// ============ CONTENT ============

// Obter todo conteúdo MASYA
async function getContent() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("content")
    .select("*")
    .eq("user_id", user.id)
    .order("publish_date", { ascending: true });

  if (error) console.error("Erro ao buscar conteúdo:", error);
  return data || [];
}

// Criar novo conteúdo
async function createContent(content) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("content")
    .insert([{
      user_id: user.id,
      title: content.title,
      content_type: content.content_type,
      publish_date: content.publish_date,
      status: content.status || "Ideia",
      has_paid_traffic: content.has_paid_traffic || false,
      budget: content.budget || null,
      product_collection: content.product_collection || null,
      notes: content.notes || null
    }])
    .select();

  if (error) console.error("Erro ao criar conteúdo:", error);
  return data ? data[0] : null;
}

// Atualizar conteúdo
async function updateContent(id, updates) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("content")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) console.error("Erro ao atualizar conteúdo:", error);
  return data ? data[0] : null;
}

// Deletar conteúdo
async function dbDeleteContent(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return false;

  const { error } = await supabaseClient
    .from("content")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) console.error("Erro ao deletar conteúdo:", error);
  return !error;
}
