// =====================================================
// LÓGICA PRINCIPAL DO APP
// =====================================================

// Obter data local no formato YYYY-MM-DD
function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

let currentArea = "minha-agenda";
let currentTab = "hoje";
let allTasks = [];
let allContent = [];
let currentUser = null;
let editingTaskId = null;
let editingContentId = null;

// Inicializar app
async function initApp() {
    currentUser = await requireAuth();

    // Restaurar última área acessada
    const lastArea = localStorage.getItem("lastArea") || "minha-agenda";
    const lastTab = localStorage.getItem("lastTab") || "hoje";

    currentArea = lastArea;
    currentTab = lastTab;

    // Carregar dados
    await loadAllData();

    // Renderizar interface
    renderApp();

    // Event listeners
    setupEventListeners();
}

// Carregar todos os dados
async function loadAllData() {
    allTasks = await getTasks();
    allContent = await getContent();
}

// Renderizar app
function renderApp() {
    const content = document.getElementById("appContent");

    if (currentArea === "minha-agenda") {
        content.innerHTML = renderMinhaAgenda();
    } else if (currentArea === "gestao") {
        content.innerHTML = renderGestao();
    } else if (currentArea === "masya") {
        content.innerHTML = renderMASYA();
    }

    // Update navigation
    updateNavigation();

    // Setup content listeners
    setupContentListeners();
}

// ============ MINHA AGENDA ============

function renderMinhaAgenda() {
    const tabs = `
        <div class="tabs">
            <button class="tab ${currentTab === 'hoje' ? 'active' : ''}" onclick="switchTab('hoje')">Hoje</button>
            <button class="tab ${currentTab === 'semana' ? 'active' : ''}" onclick="switchTab('semana')">Semana</button>
            <button class="tab ${currentTab === 'mes' ? 'active' : ''}" onclick="switchTab('mes')">Mês</button>
        </div>
    `;

    let content = tabs;

    if (currentTab === "hoje") {
        content += renderHoje();
    } else if (currentTab === "semana") {
        content += renderSemana();
    } else if (currentTab === "mes") {
        content += renderMes();
    }

    return content;
}

function renderHoje() {
    const today = getLocalDateString();
    const todayTasks = allTasks.filter(t => t.date === today && t.area === "minha-agenda");

    let html = '<div class="task-list">';

    if (todayTasks.length === 0) {
        html += '<div class="empty-state">Nenhuma tarefa para hoje</div>';
    } else {
        todayTasks.forEach(task => {
            html += renderTaskItem(task);
        });
    }

    html += '</div>';
    return html;
}

function renderSemana() {
    const today = new Date();
    let html = '<div class="week-view">';

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][date.getDay()];
        const dayNum = date.getDate();

        const dayTasks = allTasks.filter(t => t.date === dateStr && t.area === "minha-agenda");

        html += `
            <div class="week-day">
                <div class="day-header">${dayName} ${dayNum}</div>
                <div class="day-tasks">
        `;

        if (dayTasks.length === 0) {
            html += '<div class="empty-small">-</div>';
        } else {
            dayTasks.forEach(task => {
                html += renderTaskItemCompact(task);
            });
        }

        html += '</div></div>';
    }

    html += '</div>';
    return html;
}

function renderMes() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const monthName = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][month];

    let html = `
        <div class="month-view">
            <div class="month-header">${monthName} ${year}</div>
            <div class="calendar-grid">
    `;

    const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    dayLabels.forEach(day => {
        html += `<div class="calendar-day-label">${day}</div>`;
    });

    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = allTasks.filter(t => t.date === dateStr && t.area === "minha-agenda");
        const isToday = dateStr === getLocalDateString();

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="viewDayTasks('${dateStr}')">
                <div class="day-num">${day}</div>
                <div class="day-count">${dayTasks.length > 0 ? dayTasks.length : ''}</div>
            </div>
        `;
    }

    html += '</div></div>';
    return html;
}

// ============ GESTÃO ============

function renderGestao() {
    const categories = ["todos", "gf-maquinas", "prime-car", "outros"];
    const categoryLabels = ["Todos", "GF Máquinas", "Prime Car", "Outros"];
    const currentCategory = localStorage.getItem("gestaoCategory") || "todos";

    let html = '<div class="filter-tabs">';

    categories.forEach((cat, i) => {
        html += `
            <button class="filter-btn ${currentCategory === cat ? 'active' : ''}"
                    onclick="filterGestao('${cat}')">
                ${categoryLabels[i]}
            </button>
        `;
    });

    html += '</div><div class="task-list">';

    let gestaoTasks = allTasks.filter(t => t.area === "gestao");

    if (currentCategory !== "todos") {
        gestaoTasks = gestaoTasks.filter(t => t.category === currentCategory);
    }

    if (gestaoTasks.length === 0) {
        html += '<div class="empty-state">Nenhuma tarefa nesta categoria</div>';
    } else {
        gestaoTasks.forEach(task => {
            html += renderTaskItem(task);
        });
    }

    html += '</div>';
    return html;
}

// ============ MASYA ============

function renderMASYA() {
    const tabs = `
        <div class="tabs">
            <button class="tab ${currentTab === 'masya-afazeres' ? 'active' : ''}" onclick="switchTab('masya-afazeres')">Afazeres</button>
            <button class="tab ${currentTab === 'masya-conteudo' ? 'active' : ''}" onclick="switchTab('masya-conteudo')">Conteúdo</button>
        </div>
    `;

    let content = tabs;

    if (currentTab === "masya-afazeres") {
        content += renderMASYAAfazeres();
    } else if (currentTab === "masya-conteudo") {
        content += renderMASYAConteudo();
    }

    return content;
}

function renderMASYAAfazeres() {
    const masyaTasks = allTasks.filter(t => t.area === "masya");

    let html = '<div class="task-list">';

    if (masyaTasks.length === 0) {
        html += '<div class="empty-state">Nenhum afazer cadastrado</div>';
    } else {
        masyaTasks.forEach(task => {
            html += renderTaskItem(task);
        });
    }

    html += '</div>';
    return html;
}

function renderMASYAConteudo() {
    let html = '<div class="content-list">';

    if (allContent.length === 0) {
        html += '<div class="empty-state">Nenhum conteúdo cadastrado</div>';
    } else {
        allContent.forEach(content => {
            html += renderContentItem(content);
        });
    }

    html += '</div>';
    return html;
}

// ============ COMPONENTES ============

function renderTaskItem(task) {
    const timeStr = task.time ? task.time.slice(0, 5) : "";
    const categoryBadge = task.category ? `<span class="badge">${task.category}</span>` : "";

    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" onclick="editTask(${task.id})">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}
                   onclick="event.stopPropagation(); toggleTask(${task.id})">
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    ${task.date} ${timeStr ? `• ${timeStr}` : ""} ${categoryBadge}
                </div>
            </div>
        </div>
    `;
}

function renderTaskItemCompact(task) {
    return `
        <div class="task-item-compact ${task.completed ? 'completed' : ''}" onclick="editTask(${task.id})">
            <input type="checkbox" ${task.completed ? 'checked' : ''}
                   onclick="event.stopPropagation(); toggleTask(${task.id})">
            <span>${task.title}</span>
        </div>
    `;
}

function renderContentItem(content) {
    const statusColor = {
        "Ideia": "#E5E5E3",
        "Produzir": "#F8E8E8",
        "Pronto": "#F0D89C",
        "Publicado": "#90C695"
    };

    return `
        <div class="content-item" onclick="editContent(${content.id})">
            <div class="content-header">
                <strong>${content.title}</strong>
                <span class="status" style="background-color: ${statusColor[content.status]}">${content.status}</span>
            </div>
            <div class="content-meta">
                ${content.publish_date} • ${content.content_type}
                ${content.has_paid_traffic ? '• 💰 Pago' : ''}
            </div>
        </div>
    `;
}

// ============ AÇÕES ============

function switchTab(tab) {
    currentTab = tab;
    localStorage.setItem("lastTab", tab);
    renderApp();
}

function filterGestao(category) {
    localStorage.setItem("gestaoCategory", category);
    renderApp();
}

async function toggleTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (task) {
        await updateTask(id, { completed: !task.completed });
        await loadAllData();
        renderApp();
    }
}

async function editTask(id) {
    editingTaskId = id;
    const task = allTasks.find(t => t.id === id);
    if (task) {
        showTaskModal(task);
    }
}

async function editContent(id) {
    editingContentId = id;
    const content = allContent.find(c => c.id === id);
    if (content) {
        showContentModal(content);
    }
}

async function handleDeleteTask(id) {
    if (confirm("Deletar esta tarefa?")) {
        await dbDeleteTask(id);
        await loadAllData();
        closeModals();
        renderApp();
    }
}

async function handleDeleteContent(id) {
    if (confirm("Deletar este conteúdo?")) {
        await dbDeleteContent(id);
        await loadAllData();
        closeModals();
        renderApp();
    }
}

function viewDayTasks(dateStr) {
    const dayTasks = allTasks.filter(t => t.date === dateStr && t.area === "minha-agenda");

    let html = `
        <div class="modal-overlay" onclick="closeModals()">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>Tarefas - ${dateStr}</h2>
                <div class="task-list">
    `;

    if (dayTasks.length === 0) {
        html += '<div class="empty-state">Nenhuma tarefa neste dia</div>';
    } else {
        dayTasks.forEach(task => {
            html += renderTaskItem(task);
        });
    }

    html += `
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" onclick="closeModals()">Fechar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
}

// ============ MODAL DE TAREFA ============

function showTaskModal(task = null) {
    const isEditing = task !== null;
    const title = isEditing ? "Editar Tarefa" : "Nova Tarefa";

    let html = `
        <div class="modal-overlay" onclick="closeModals()">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>${title}</h2>
                <div class="form-group">
                    <label>Título *</label>
                    <input type="text" id="taskTitle" placeholder="Título da tarefa" value="${task?.title || ''}">
                </div>
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="taskDate" value="${task?.date || getLocalDateString()}">
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" id="taskTime" value="${task?.time || ''}">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="taskCategory">
                        <option value="">Selecione...</option>
    `;

    let categories = [];
    if (currentArea === "minha-agenda") {
        categories = ["Pessoal", "Casa", "Família"];
    } else if (currentArea === "gestao") {
        categories = ["gf-maquinas", "prime-car", "outros"];
    } else if (currentArea === "masya") {
        categories = ["Estoque", "Catálogo", "Fotos", "Entregas", "Outros"];
    }

    categories.forEach(cat => {
        const selected = task?.category === cat ? "selected" : "";
        html += `<option value="${cat}" ${selected}>${cat}</option>`;
    });

    html += `
                    </select>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="taskCompleted" ${task?.completed ? 'checked' : ''}> Concluído</label>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" onclick="closeModals()">Cancelar</button>
    `;

    if (isEditing) {
        html += `
                    <button class="btn btn-danger" onclick="handleDeleteTask(${task.id})">Deletar</button>
                    <button class="btn btn-primary" onclick="saveTask(${task.id})">Salvar</button>
        `;
    } else {
        html += `
                    <button class="btn btn-primary" onclick="saveNewTask()">Criar</button>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
}

async function saveTask(id) {
    const title = document.getElementById("taskTitle").value.trim();
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const category = document.getElementById("taskCategory").value;
    const completed = document.getElementById("taskCompleted").checked;

    if (!title) {
        alert("Preencha o título");
        return;
    }

    await updateTask(id, { title, date, time, category, completed });
    await loadAllData();
    closeModals();
    renderApp();
}

async function saveNewTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const category = document.getElementById("taskCategory").value;

    if (!title) {
        alert("Preencha o título");
        return;
    }

    await createTask({
        title,
        date,
        time,
        category,
        area: currentArea
    });

    await loadAllData();
    closeModals();
    renderApp();
}

// ============ MODAL DE CONTEÚDO ============

function showContentModal(content = null) {
    const isEditing = content !== null;
    const title = isEditing ? "Editar Conteúdo" : "Novo Conteúdo";

    let html = `
        <div class="modal-overlay" onclick="closeModals()">
            <div class="modal" onclick="event.stopPropagation()">
                <h2>${title}</h2>
                <div class="form-group">
                    <label>Título/Ideia *</label>
                    <input type="text" id="contentTitle" placeholder="Título do conteúdo" value="${content?.title || ''}">
                </div>
                <div class="form-group">
                    <label>Data de Publicação *</label>
                    <input type="date" id="contentDate" value="${content?.publish_date || getLocalDateString()}">
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select id="contentType">
                        <option value="Feed" ${content?.content_type === 'Feed' ? 'selected' : ''}>Feed</option>
                        <option value="Reels" ${content?.content_type === 'Reels' ? 'selected' : ''}>Reels</option>
                        <option value="Stories" ${content?.content_type === 'Stories' ? 'selected' : ''}>Stories</option>
                        <option value="Campanha" ${content?.content_type === 'Campanha' ? 'selected' : ''}>Campanha</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status *</label>
                    <select id="contentStatus">
                        <option value="Ideia" ${content?.status === 'Ideia' ? 'selected' : ''}>Ideia</option>
                        <option value="Produzir" ${content?.status === 'Produzir' ? 'selected' : ''}>Produzir</option>
                        <option value="Pronto" ${content?.status === 'Pronto' ? 'selected' : ''}>Pronto</option>
                        <option value="Publicado" ${content?.status === 'Publicado' ? 'selected' : ''}>Publicado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="contentPaid" ${content?.has_paid_traffic ? 'checked' : ''}> Tráfego Pago</label>
                </div>
                <div class="form-group" id="budgetGroup" style="display: ${content?.has_paid_traffic ? 'block' : 'none'}">
                    <label>Orçamento</label>
                    <input type="number" id="contentBudget" placeholder="0.00" value="${content?.budget ?? ''}">
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" onclick="closeModals()">Cancelar</button>
    `;

    if (isEditing) {
        html += `
                    <button class="btn btn-danger" onclick="handleDeleteContent(${content.id})">Deletar</button>
                    <button class="btn btn-primary" onclick="saveContent(${content.id})">Salvar</button>
        `;
    } else {
        html += `
                    <button class="btn btn-primary" onclick="saveNewContent()">Criar</button>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Toggle budget field
    document.getElementById("contentPaid").addEventListener("change", (e) => {
        document.getElementById("budgetGroup").style.display = e.target.checked ? "block" : "none";
    });
}

async function saveContent(id) {
    const title = document.getElementById("contentTitle").value.trim();
    const publish_date = document.getElementById("contentDate").value;
    const content_type = document.getElementById("contentType").value;
    const status = document.getElementById("contentStatus").value;
    const has_paid_traffic = document.getElementById("contentPaid").checked;

    let budget = null;
    if (has_paid_traffic) {
        const budgetValue = document.getElementById("contentBudget").value.trim();
        budget = budgetValue === '' ? null : parseFloat(budgetValue);
    }

    if (!title) {
        alert("Preencha o título");
        return;
    }

    await updateContent(id, {
        title,
        publish_date,
        content_type,
        status,
        has_paid_traffic,
        budget
    });

    await loadAllData();
    closeModals();
    renderApp();
}

async function saveNewContent() {
    const title = document.getElementById("contentTitle").value.trim();
    const publish_date = document.getElementById("contentDate").value;
    const content_type = document.getElementById("contentType").value;
    const status = document.getElementById("contentStatus").value;
    const has_paid_traffic = document.getElementById("contentPaid").checked;

    let budget = null;
    if (has_paid_traffic) {
        const budgetValue = document.getElementById("contentBudget").value.trim();
        budget = budgetValue === '' ? null : parseFloat(budgetValue);
    }

    if (!title) {
        alert("Preencha o título");
        return;
    }

    await createContent({
        title,
        publish_date,
        content_type,
        status,
        has_paid_traffic,
        budget
    });

    await loadAllData();
    closeModals();
    renderApp();
}

// ============ BOTÃO FLUTUANTE ============

function openNewTaskFromMenu() {
    closeModals();
    setTimeout(() => showTaskModal(), 100);
}

function openNewContentFromMenu() {
    closeModals();
    setTimeout(() => showContentModal(), 100);
}

function showFloatingMenu() {
    let html = `
        <div class="modal-overlay" onclick="closeModals()">
            <div class="floating-menu" onclick="event.stopPropagation()">
    `;

    if (currentArea === "minha-agenda") {
        html += '<button onclick="openNewTaskFromMenu()">+ Nova Tarefa</button>';
    } else if (currentArea === "gestao") {
        html += '<button onclick="openNewTaskFromMenu()">+ Nova Tarefa</button>';
    } else if (currentArea === "masya") {
        if (currentTab === "masya-afazeres") {
            html += '<button onclick="openNewTaskFromMenu()">+ Novo Afazer</button>';
        } else {
            html += '<button onclick="openNewContentFromMenu()">+ Novo Conteúdo</button>';
        }
    }

    html += '</div></div>';

    document.body.insertAdjacentHTML("beforeend", html);
}

// ============ HELPERS ============

function closeModals() {
    document.querySelectorAll(".modal-overlay").forEach(el => el.remove());
}

function updateNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeBtn = document.querySelector(`.nav-btn[data-area="${currentArea}"]`);
    if (activeBtn) activeBtn.classList.add("active");
}

function switchArea(area) {
    currentArea = area;
    currentTab = area === "minha-agenda" ? "hoje" : "masya-afazeres";
    localStorage.setItem("lastArea", area);
    localStorage.setItem("lastTab", currentTab);
    renderApp();
}

async function handleLogout() {
    if (confirm("Tem certeza que deseja sair?")) {
        await logout();
        window.location.href = "index.html";
    }
}

function setupEventListeners() {
    document.getElementById("floatingBtn").addEventListener("click", showFloatingMenu);
}

function setupContentListeners() {
    // Listeners já estão nos elementos
}
