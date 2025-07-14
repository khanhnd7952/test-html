// UI management functions

/**
 * Show/hide loading overlay
 */
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
    AppState.isLoading = show;
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    const toast = document.getElementById('notificationToast');
    const content = toast.querySelector('.toast-content');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    icon.textContent = icons[type] || icons.info;
    messageEl.textContent = message;
    
    // Set style based on type
    content.className = `toast-content ${type}`;
    
    // Show toast
    toast.style.display = 'block';
    
    // Auto hide after duration
    setTimeout(() => {
        hideNotification();
    }, duration);
}

/**
 * Hide notification toast
 */
function hideNotification() {
    const toast = document.getElementById('notificationToast');
    if (toast) {
        toast.style.display = 'none';
    }
}

/**
 * Show confirmation modal
 */
function showConfirmation(title, message, onConfirm, onCancel = null) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Remove existing event listeners
    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    
    // Add new event listeners
    newYesBtn.addEventListener('click', () => {
        closeModal('confirmModal');
        if (onConfirm) onConfirm();
    });
    
    newNoBtn.addEventListener('click', () => {
        closeModal('confirmModal');
        if (onCancel) onCancel();
    });
    
    modal.style.display = 'block';
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Update project status display
 */
function updateProjectStatus() {
    const statusDiv = document.getElementById('projectStatus');
    const projectIdSpan = document.getElementById('projectId');
    const lastSavedSpan = document.getElementById('lastSaved');
    const deleteBtn = document.getElementById('deleteProjectBtn');

    if (AppState.currentProject) {
        statusDiv.style.display = 'block';

        // Update project ID and last saved time
        if (projectIdSpan) {
            projectIdSpan.textContent = `ID: ${AppState.currentProject.id}`;
        }
        if (lastSavedSpan) {
            lastSavedSpan.textContent = `Cập nhật: ${Utils.formatDate(AppState.currentProject.updatedAt)}`;
        }

        // Update script count and current script info
        const scriptCount = AppState.currentProject.data && AppState.currentProject.data.scripts
            ? AppState.currentProject.data.scripts.length
            : 0;

        const currentScriptInfo = AppState.currentScript
            ? `${AppState.currentScript.name} (${AppState.currentScript.scriptId})`
            : 'Chưa chọn script';

        // Update project name display
        const projectNameElement = document.querySelector('.project-name-display');
        if (projectNameElement) {
            projectNameElement.textContent = AppState.currentProject.name;
        }

        // Update script info display
        const scriptInfoElement = document.querySelector('.script-info-display');
        if (scriptInfoElement) {
            scriptInfoElement.innerHTML = `📜 ${scriptCount} script(s) | 🎯 ${currentScriptInfo}`;
        }

        // Show delete and rename buttons when there's a current project
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }

        const renameBtn = document.getElementById('renameProjectBtn');
        if (renameBtn) {
            renameBtn.style.display = 'inline-block';
            // Add animation class after a short delay
            setTimeout(() => {
                renameBtn.classList.add('show');
            }, 100);
        }
    } else {
        statusDiv.style.display = 'none';

        // Hide delete and rename buttons when no current project
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }

        const renameBtn = document.getElementById('renameProjectBtn');
        if (renameBtn) {
            renameBtn.classList.remove('show');
            setTimeout(() => {
                renameBtn.style.display = 'none';
            }, 200);
        }
    }
}

/**
 * Render project list (simplified)
 */
function renderProjectList(projects) {
    const container = document.getElementById('projectList');

    if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="loading-projects">Không có project nào.</div>';
        return;
    }

    const projectsHTML = projects.map(project => {
        const scriptCount = project.data && project.data.scripts ? project.data.scripts.length : 0;
        const hasData = project.data && project.data.scripts && project.data.scripts.length > 0;

        return `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-name">${Utils.sanitizeString(project.name)}</h3>
                    <span class="project-script-count">📜 ${scriptCount} script(s)</span>
                </div>
                <div class="project-meta">
                    <div class="project-dates">
                        <span>Tạo: ${Utils.formatDate(project.createdAt)}</span>
                        <span>Cập nhật: ${Utils.formatDate(project.updatedAt)}</span>
                        <span class="project-status">${hasData ? '✅ Có dữ liệu' : '⚠️ Trống'}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn-load" onclick="loadProjectFromList('${project.id}')">📂 Load</button>
                        <button class="btn-delete" onclick="deleteProjectFromList('${project.id}', '${Utils.sanitizeString(project.name)}')">🗑️ Xóa</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = projectsHTML;
}



/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        }
    });
}

/**
 * Initialize UI components
 */
function initializeUI() {
    setupModalEventListeners();
    setupRealTimeValidation();
    updateProjectStatus();
}
