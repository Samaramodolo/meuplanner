// Main application logic for Meu Planner

let currentArea = 'hoje';
let currentUser = null;

// Initialize app
async function initApp() {
    console.log('Inicializando app...');

    try {
        // Check if user is authenticated
        const user = await getCurrentUser();

        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
            return;
        }

        currentUser = user;
        console.log('Usuário autenticado:', user.email);

        // Update header with user info
        updateHeader();

        // Load initial data
        await loadArea('hoje');

        // Setup event listeners
        setupEventListeners();

        // Setup auth state listener
        setupAuthListener();

        console.log('App inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar app:', error);
        // Redirect to login on error
        window.location.href = 'index.html';
    }
}

// Update header with user information
function updateHeader() {
    const headerBar = document.getElementById('headerBar');
    if (headerBar) {
        const userEmail = currentUser?.email || 'Meu Planner';
        headerBar.innerHTML = `
            <h1>Meu Planner</h1>
            <button id="logoutBtn" onclick="handleLogout()" title="Sair">
                👤 ${userEmail.split('@')[0]}
            </button>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const area = btn.getAttribute('data-area');
            if (area) {
                switchArea(area);
            }
        });
    });
}

// Switch to different area
async function switchArea(area) {
    console.log('Alternando para área:', area);

    currentArea = area;

    // Update active nav button
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-area') === area) {
            btn.classList.add('active');
        }
    });

    // Load area content
    await loadArea(area);
}

// Load content for specific area
async function loadArea(area) {
    const appContent = document.getElementById('appContent');

    if (!appContent) return;

    try {
        switch(area) {
            case 'hoje':
                await loadTodayArea(appContent);
                break;
            case 'semana':
                await loadWeekArea(appContent);
                break;
            case 'mes':
                await loadMonthArea(appContent);
                break;
            case 'gestao':
                await loadManagementArea(appContent);
                break;
            case 'masya':
                await loadMasyaArea(appContent);
                break;
            default:
                appContent.innerHTML = '<p>Área não encontrada</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar área:', error);
        appContent.innerHTML = `<p style="color: red;">Erro ao carregar: ${error.message}</p>`;
    }
}

// Load today's view
async function loadTodayArea(container) {
    const todayDate = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const result = await getTasks();
    const tasks = result.success ? result.data : [];

    // Filter tasks for today
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => {
        const taskDate = task.due_date ? task.due_date.split('T')[0] : null;
        return taskDate === today;
    });

    let html = `
        <div style="padding: 16px;">
            <h2 style="margin-bottom: 16px;">Hoje - ${todayDate}</h2>
    `;

    if (todayTasks.length === 0) {
        html += '<p style="color: #8A8A88; text-align: center; padding: 40px 0;">Sem tarefas para hoje 🎉</p>';
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
        todayTasks.forEach(task => {
            const priorityColor = getPriorityColor(task.priority);
            html += `
                <div style="
                    background: white;
                    padding: 12px;
                    border-radius: 8px;
                    border-left: 4px solid ${priorityColor};
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <input type="checkbox"
                        ${task.status === 'done' ? 'checked' : ''}
                        onchange="updateTaskStatus('${task.id}', this.checked)"
                        style="cursor: pointer;">
                    <div style="flex: 1;">
                        <p style="font-weight: 600; ${task.status === 'done' ? 'text-decoration: line-through; color: #8A8A88;' : ''}">${task.title}</p>
                        ${task.description ? `<p style="font-size: 12px; color: #8A8A88; margin-top: 4px;">${task.description}</p>` : ''}
                    </div>
                    <button onclick="deleteTask('${task.id}')" style="
                        background: none;
                        border: none;
                        color: #E8A8A8;
                        cursor: pointer;
                        font-size: 16px;
                    ">🗑️</button>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `
        <button onclick="showAddTaskModal()" style="
            width: 100%;
            margin-top: 20px;
            padding: 12px;
            background: #4A4A48;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">+ Nova Tarefa</button>
        </div>
    `;

    container.innerHTML = html;
}

// Load week view
async function loadWeekArea(container) {
    container.innerHTML = `
        <div style="padding: 16px;">
            <h2>Esta Semana</h2>
            <p style="color: #8A8A88; margin-top: 16px;">Visualização da semana em desenvolvimento...</p>
            <button onclick="showAddTaskModal()" style="
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                background: #4A4A48;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">+ Nova Tarefa</button>
        </div>
    `;
}

// Load month view
async function loadMonthArea(container) {
    container.innerHTML = `
        <div style="padding: 16px;">
            <h2>Este Mês</h2>
            <p style="color: #8A8A88; margin-top: 16px;">Visualização do mês em desenvolvimento...</p>
            <button onclick="showAddTaskModal()" style="
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                background: #4A4A48;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">+ Nova Tarefa</button>
        </div>
    `;
}

// Load management area
async function loadManagementArea(container) {
    const result = await getGoals();
    const goals = result.success ? result.data : [];

    let html = `
        <div style="padding: 16px;">
            <h2 style="margin-bottom: 16px;">Gestão de Objetivos</h2>
    `;

    if (goals.length === 0) {
        html += '<p style="color: #8A8A88; text-align: center; padding: 40px 0;">Sem objetivos definidos</p>';
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
        goals.forEach(goal => {
            html += `
                <div style="
                    background: white;
                    padding: 12px;
                    border-radius: 8px;
                    border-left: 4px solid #D4A5A5;
                ">
                    <p style="font-weight: 600;">${goal.title}</p>
                    ${goal.description ? `<p style="font-size: 12px; color: #8A8A88; margin-top: 4px;">${goal.description}</p>` : ''}
                    ${goal.target_date ? `<p style="font-size: 12px; color: #8A8A88; margin-top: 4px;">📅 ${new Date(goal.target_date).toLocaleDateString('pt-BR')}</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }

    html += `
        <button onclick="showAddGoalModal()" style="
            width: 100%;
            margin-top: 20px;
            padding: 12px;
            background: #4A4A48;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">+ Novo Objetivo</button>
        </div>
    `;

    container.innerHTML = html;
}

// Load MASYA area
async function loadMasyaArea(container) {
    const result = await getNotes();
    const notes = result.success ? result.data : [];

    let html = `
        <div style="padding: 16px;">
            <h2 style="margin-bottom: 16px;">✨ MASYA - Notas</h2>
    `;

    if (notes.length === 0) {
        html += '<p style="color: #8A8A88; text-align: center; padding: 40px 0;">Nenhuma nota criada</p>';
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
        notes.forEach(note => {
            html += `
                <div style="
                    background: white;
                    padding: 12px;
                    border-radius: 8px;
                    border-left: 4px solid #90C695;
                ">
                    <p style="font-weight: 600;">${note.title}</p>
                    <p style="font-size: 12px; color: #8A8A88; margin-top: 4px; white-space: pre-wrap;">${note.content}</p>
                </div>
            `;
        });
        html += '</div>';
    }

    html += `
        <button onclick="showAddNoteModal()" style="
            width: 100%;
            margin-top: 20px;
            padding: 12px;
            background: #4A4A48;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">+ Nova Nota</button>
        </div>
    `;

    container.innerHTML = html;
}

// Get priority color
function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return '#E8A8A8';
        case 'medium': return '#D4A5A5';
        case 'low': return '#A8D8A8';
        default: return '#D4A5A5';
    }
}

// Update task status
async function updateTaskStatus(taskId, isDone) {
    const result = await updateTask(taskId, {
        status: isDone ? 'done' : 'todo'
    });

    if (!result.success) {
        alert('Erro ao atualizar tarefa: ' + result.error);
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) {
        return;
    }

    const result = await deleteTask(taskId);

    if (result.success) {
        await loadArea(currentArea);
    } else {
        alert('Erro ao deletar tarefa: ' + result.error);
    }
}

// Show add task modal
function showAddTaskModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 20px;
            border-radius: 12px;
            max-width: 400px;
            width: 100%;
        ">
            <h2 style="margin-bottom: 16px;">Nova Tarefa</h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="taskTitle" placeholder="Título" style="
                    padding: 10px;
                    border: 1px solid #E5E5E3;
                    border-radius: 6px;
                    font-family: inherit;
                ">
                <textarea id="taskDesc" placeholder="Descrição" style="
                    padding: 10px;
                    border: 1px solid #E5E5E3;
                    border-radius: 6px;
                    font-family: inherit;
                    resize: vertical;
                    min-height: 80px;
                "></textarea>
                <input type="date" id="taskDate" style="
                    padding: 10px;
                    border: 1px solid #E5E5E3;
                    border-radius: 6px;
                    font-family: inherit;
                ">
                <select id="taskPriority" style="
                    padding: 10px;
                    border: 1px solid #E5E5E3;
                    border-radius: 6px;
                    font-family: inherit;
                ">
                    <option value="low">Baixa Prioridade</option>
                    <option value="medium" selected>Média Prioridade</option>
                    <option value="high">Alta Prioridade</option>
                </select>
                <div style="display: flex; gap: 10px;">
                    <button onclick="createNewTask()" style="
                        flex: 1;
                        padding: 10px;
                        background: #4A4A48;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Criar</button>
                    <button onclick="closeModal()" style="
                        flex: 1;
                        padding: 10px;
                        background: #F8E8E8;
                        color: #4A4A48;
                        border: 1px solid #E5E5E3;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancelar</button>
                </div>
            </div>
        </div>
    `;

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    document.body.appendChild(modal);
}

// Create new task
async function createNewTask() {
    const title = document.getElementById('taskTitle')?.value;
    const desc = document.getElementById('taskDesc')?.value;
    const date = document.getElementById('taskDate')?.value;
    const priority = document.getElementById('taskPriority')?.value;

    if (!title || title.trim() === '') {
        alert('Título é obrigatório');
        return;
    }

    const result = await createTask({
        title: title.trim(),
        description: desc,
        due_date: date ? new Date(date).toISOString() : null,
        priority: priority || 'normal'
    });

    if (result.success) {
        closeModal();
        await loadArea(currentArea);
    } else {
        alert('Erro ao criar tarefa: ' + result.error);
    }
}

// Show add goal modal
function showAddGoalModal() {
    // Similar to task modal but for goals
    console.log('Modal de objetivo não implementado ainda');
}

// Show add note modal
function showAddNoteModal() {
    // Similar to task modal but for notes
    console.log('Modal de nota não implementado ainda');
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Handle logout
async function handleLogout() {
    if (!confirm('Tem certeza que deseja sair?')) {
        return;
    }

    const result = await logout();

    if (result.success) {
        window.location.href = 'index.html';
    } else {
        alert('Erro ao fazer logout: ' + result.error);
    }
}
