// ============= CONFIG =============
// IMPORTANTE: Substitua com sua URL real do Vercel
const VERCEL_API_URL = 'https://seu-projeto.vercel.app/api/google-calendar';

// Supabase config
const SUPABASE_URL = 'https://xabeqeaaxyxqmugxkdvz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhYmVxZWFheHl4cW11Z3hrZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIwMjI0NjcsImV4cCI6MTkyNzU5ODQ2N30.lbr1MdVaQ-cK7l3N-7HjnknEjZ8bG2v5V_jKMX5y2EA';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============= VARIABLES =============
let currentUser = null;
let tasks = [];
let users = [];
let currentView = 'minha-agenda';
let editingTaskId = null;
let selectedDate = new Date().toISOString().split('T')[0];

// ============= INITIALIZATION =============
async function initApp() {
  try {
    // Check user authentication
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;

    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }

    // Load initial data
    await loadUsers();
    await loadTasks();
    renderView('minha-agenda');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// ============= AUTH FUNCTIONS =============
async function handleLogout() {
  try {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// ============= USER FUNCTIONS =============
async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    users = data || [];
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function getUserName(userId) {
  const user = users.find(u => u.id === userId);
  return user?.name || 'Unknown User';
}

// ============= TASK FUNCTIONS =============
async function loadTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    tasks = data || [];
    renderView(currentView);
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
}

async function handleDeleteTask(id) {
  if (!confirm('Tem certeza que quer deletar esta tarefa?')) {
    return;
  }

  try {
    // Get task to retrieve Google Event ID before deletion
    const task = tasks.find(t => t.id === id);

    // Delete from Google Calendar if it exists
    if (task && task.googleEventId) {
      const syncSuccess = await deleteTaskWithSync(id);
      if (!syncSuccess) {
        throw new Error('Failed to sync deletion with Google Calendar');
      }
    } else {
      // No Google Event, just delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }

    // Reload and re-render
    await loadTasks();
    alert('Tarefa deletada com sucesso!');
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Erro ao deletar tarefa: ' + error.message);
  }
}

function showTaskModal(task = null) {
  editingTaskId = task?.id || null;

  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');

  // Reset form
  form.reset();

  if (task) {
    // Editing mode
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-time').value = task.time || '09:00';
    document.getElementById('task-assigned-to').value = task.assigned_to;
    document.getElementById('task-status').value = task.status;
    document.getElementById('modal-title').textContent = 'Editar Tarefa';
  } else {
    // Creating mode
    document.getElementById('task-date').value = selectedDate;
    document.getElementById('task-time').value = '09:00';
    document.getElementById('task-assigned-to').value = currentUser.id;
    document.getElementById('task-status').value = 'pendente';
    document.getElementById('modal-title').textContent = 'Nova Tarefa';
  }

  modal.style.display = 'block';
}

function closeTaskModal() {
  document.getElementById('task-modal').style.display = 'none';
  editingTaskId = null;
}

async function saveTask(id) {
  try {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const assignedTo = document.getElementById('task-assigned-to').value;
    const status = document.getElementById('task-status').value;

    if (!title.trim()) {
      alert('Por favor, preencha o título da tarefa');
      return;
    }

    const updates = {
      title,
      description,
      date,
      time,
      assigned_to: assignedTo,
      status,
      updated_at: new Date().toISOString()
    };

    // Update in database
    const { error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    // Get the updated task
    const { data: updatedTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Sync with Google Calendar if task has Google Event ID
    if (updatedTask.googleEventId) {
      const syncSuccess = await updateTaskWithSync(id, updates);
      if (!syncSuccess) {
        console.warn('Warning: Failed to sync update with Google Calendar, but task was updated locally');
      }
    }

    closeTaskModal();
    await loadTasks();
    alert('Tarefa atualizada com sucesso!');
  } catch (error) {
    console.error('Error updating task:', error);
    alert('Erro ao atualizar tarefa: ' + error.message);
  }
}

async function saveNewTask() {
  try {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const assignedTo = document.getElementById('task-assigned-to').value;
    const status = document.getElementById('task-status').value;

    if (!title.trim()) {
      alert('Por favor, preencha o título da tarefa');
      return;
    }

    // Create task in database
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        date,
        time,
        assigned_to: assignedTo,
        status,
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Sync new task to Google Calendar
    const syncSuccess = await syncTaskToGoogle(newTask);
    if (!syncSuccess) {
      console.warn('Warning: Failed to sync new task with Google Calendar, but task was created locally');
    }

    closeTaskModal();
    await loadTasks();
    alert('Tarefa criada com sucesso!');
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Erro ao criar tarefa: ' + error.message);
  }
}

// ============= GOOGLE CALENDAR SYNC FUNCTIONS =============

/**
 * Sincroniza uma nova tarefa com o Google Calendar
 * @param {Object} task - Objeto da tarefa com id, title, description, date, time, assigned_to
 * @returns {Promise<boolean>} - true se bem-sucedido, false caso contrário
 */
async function syncTaskToGoogle(task) {
  try {
    const eventData = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: `${task.date}T${task.time}:00`,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: `${task.date}T${task.time}:59:59`,
        timeZone: 'America/Sao_Paulo'
      },
      attendees: [
        {
          email: getUserEmail(task.assigned_to) || 'user@example.com'
        }
      ]
    };

    const response = await fetch(`${VERCEL_API_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Update task with Google Event ID
    if (result.eventId) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ googleEventId: result.eventId })
        .eq('id', task.id);

      if (updateError) throw updateError;

      console.log('Task synced to Google Calendar:', result.eventId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error syncing task to Google Calendar:', error);
    return false;
  }
}

/**
 * Atualiza uma tarefa no Google Calendar
 * @param {string} taskId - ID da tarefa
 * @param {Object} updates - Objeto com os campos atualizados
 * @returns {Promise<boolean>} - true se bem-sucedido, false caso contrário
 */
async function updateTaskWithSync(taskId, updates) {
  try {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('googleEventId')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    if (!task.googleEventId) {
      console.log('No Google Event ID found, skipping Google Calendar sync');
      return true; // Não é erro, apenas não há evento para sincronizar
    }

    const eventData = {
      summary: updates.title,
      description: updates.description || '',
      start: {
        dateTime: `${updates.date}T${updates.time}:00`,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: `${updates.date}T${updates.time}:59:59`,
        timeZone: 'America/Sao_Paulo'
      }
    };

    const response = await fetch(`${VERCEL_API_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: task.googleEventId,
        ...eventData
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Task updated in Google Calendar:', task.googleEventId);
    return true;
  } catch (error) {
    console.error('Error updating task in Google Calendar:', error);
    return false;
  }
}

/**
 * Deleta uma tarefa do Google Calendar
 * @param {string} googleEventId - ID do evento no Google Calendar
 * @returns {Promise<boolean>} - true se bem-sucedido, false caso contrário
 */
async function deleteTaskFromGoogle(googleEventId) {
  try {
    if (!googleEventId) {
      console.log('No Google Event ID provided, skipping deletion');
      return true;
    }

    const response = await fetch(`${VERCEL_API_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId: googleEventId })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    console.log('Task deleted from Google Calendar:', googleEventId);
    return true;
  } catch (error) {
    console.error('Error deleting task from Google Calendar:', error);
    return false;
  }
}

/**
 * Deleta uma tarefa e sincroniza com Google Calendar
 * @param {string} taskId - ID da tarefa no Supabase
 * @returns {Promise<boolean>} - true se bem-sucedido, false caso contrário
 */
async function deleteTaskWithSync(taskId) {
  try {
    // Get task to retrieve Google Event ID
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('googleEventId')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch task:', fetchError);
      return false;
    }

    // Delete from Google Calendar if event ID exists
    if (task.googleEventId) {
      const syncSuccess = await deleteTaskFromGoogle(task.googleEventId);
      if (!syncSuccess) {
        throw new Error('Failed to delete from Google Calendar');
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) throw deleteError;

    console.log('Task deleted successfully:', taskId);
    return true;
  } catch (error) {
    console.error('Error in deleteTaskWithSync:', error);
    return false;
  }
}

/**
 * Obtém o email do usuário (função auxiliar)
 * @param {string} userId - ID do usuário
 * @returns {string} - Email do usuário ou vazio
 */
function getUserEmail(userId) {
  const user = users.find(u => u.id === userId);
  return user?.email || '';
}

// ============= RENDER FUNCTIONS =============

function renderView(view) {
  currentView = view;
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (view === 'minha-agenda') {
    renderMinhaAgenda();
  } else if (view === 'gestao') {
    renderGestao();
  } else if (view === 'masya') {
    renderMasya();
  }

  // Update active nav
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
}

function renderMinhaAgenda() {
  const content = document.getElementById('content');
  const minhasTarefas = tasks.filter(t => t.assigned_to === currentUser.id);

  let html = `
    <div class="view-header">
      <h2>Minha Agenda</h2>
      <button class="btn-primary" onclick="showTaskModal()">+ Nova Tarefa</button>
    </div>
    <div class="task-list">
  `;

  if (minhasTarefas.length === 0) {
    html += '<p class="empty-state">Nenhuma tarefa atribuída a você</p>';
  } else {
    minhasTarefas.forEach(task => {
      html += `
        <div class="task-card">
          <div class="task-header">
            <h3>${escapeHtml(task.title)}</h3>
            <span class="status ${task.status}">${task.status}</span>
          </div>
          <p class="task-description">${escapeHtml(task.description || '')}</p>
          <div class="task-meta">
            <span class="date">${formatDate(task.date)}</span>
            <span class="time">${task.time}</span>
          </div>
          <div class="task-actions">
            <button class="btn-small" onclick="showTaskModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">Editar</button>
            <button class="btn-small btn-danger" onclick="handleDeleteTask('${task.id}')">Deletar</button>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  content.innerHTML = html;
}

function renderGestao() {
  const content = document.getElementById('content');

  let html = `
    <div class="view-header">
      <h2>Gestão de Tarefas</h2>
      <button class="btn-primary" onclick="showTaskModal()">+ Nova Tarefa</button>
    </div>
    <div class="task-list">
  `;

  if (tasks.length === 0) {
    html += '<p class="empty-state">Nenhuma tarefa criada</p>';
  } else {
    tasks.forEach(task => {
      const assignee = getUserName(task.assigned_to);
      html += `
        <div class="task-card">
          <div class="task-header">
            <h3>${escapeHtml(task.title)}</h3>
            <span class="status ${task.status}">${task.status}</span>
          </div>
          <p class="task-description">${escapeHtml(task.description || '')}</p>
          <div class="task-meta">
            <span class="assigned">Atribuído a: ${escapeHtml(assignee)}</span>
            <span class="date">${formatDate(task.date)}</span>
            <span class="time">${task.time}</span>
          </div>
          <div class="task-actions">
            <button class="btn-small" onclick="showTaskModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">Editar</button>
            <button class="btn-small btn-danger" onclick="handleDeleteTask('${task.id}')">Deletar</button>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  content.innerHTML = html;
}

function renderMasya() {
  const content = document.getElementById('content');
  const masyaTasks = tasks.filter(t => t.assigned_to === 'masya-id'); // Adjust as needed

  let html = `
    <div class="view-header">
      <h2>Masya Tasks</h2>
    </div>
    <div class="task-list">
  `;

  if (masyaTasks.length === 0) {
    html += '<p class="empty-state">No tasks assigned to Masya</p>';
  } else {
    masyaTasks.forEach(task => {
      html += `
        <div class="task-card">
          <div class="task-header">
            <h3>${escapeHtml(task.title)}</h3>
            <span class="status ${task.status}">${task.status}</span>
          </div>
          <p class="task-description">${escapeHtml(task.description || '')}</p>
          <div class="task-meta">
            <span class="date">${formatDate(task.date)}</span>
            <span class="time">${task.time}</span>
          </div>
        </div>
      `;
    });
  }

  html += '</div>';
  content.innerHTML = html;
}

// ============= UTILITY FUNCTIONS =============

function formatDate(dateString) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', options);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============= MODAL FUNCTIONS =============

window.onclick = function(event) {
  const modal = document.getElementById('task-modal');
  if (event.target == modal) {
    closeTaskModal();
  }
}

// ============= EVENT LISTENERS =============

document.addEventListener('DOMContentLoaded', function() {
  initApp();

  // Navigation
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', function() {
      renderView(this.getAttribute('data-view'));
    });
  });

  // Form submission
  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (editingTaskId) {
        saveTask(editingTaskId);
      } else {
        saveNewTask();
      }
    });
  }

  // Close modal button
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTaskModal);
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// ============= END GOOGLE CALENDAR SYNC FUNCTIONS =============

// Initialize planner
initApp();
