// Main application logic for AdData JSON Serializer Tool v2.0

/**
 * Extend AppState with additional properties for the dynamic app
 * (AppState is already defined in config.js)
 */
Object.assign(AppState, {
    currentScript: null,
    currentScriptId: null,
    lastSaved: null
});

// Global variables
let currentProjectId = null;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
    setupEventListeners();

    // Load script IDs for dropdown
    loadScriptIds();

    // Load project if name is provided in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('project');
    if (projectName) {
        loadProjectData(projectName);
    }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Project name input handler
    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
        projectNameInput.addEventListener('change', handleProjectNameChange);
        projectNameInput.addEventListener('input', handleProjectNameInput);
    }
}

/**
 * Handle project name input
 */
function handleProjectNameInput() {
    const projectName = document.getElementById('projectName').value.trim();
    
    // Update URL without reloading
    if (projectName) {
        const url = new URL(window.location);
        url.searchParams.set('project', projectName);
        window.history.replaceState({}, '', url);
    } else {
        const url = new URL(window.location);
        url.searchParams.delete('project');
        window.history.replaceState({}, '', url);
    }
}

/**
 * Handle project name change
 */
async function handleProjectNameChange() {
    const projectName = document.getElementById('projectName').value.trim();
    if (projectName) {
        await loadProjectData(projectName);
    }
}

/**
 * Load project data by name
 */
async function loadProjectData(projectName = null) {
    if (!projectName) {
        projectName = document.getElementById('projectName').value.trim();
    }
    
    if (!projectName) {
        return;
    }
    
    try {
        const project = await loadProjectByName(projectName);
        
        if (project) {
            // Project exists, load its data
            AppState.currentProject = project;
            populateFormWithProjectData(project);
            updateProjectStatus();
            showNotification(`Đã tải project: ${project.name}`, 'success');
        } else {
            // Project doesn't exist, clear current project
            AppState.currentProject = null;
            updateProjectStatus();
        }
    } catch (error) {
        console.error('Error loading project:', error);
        // Don't show error notification for non-existent projects
    }
}

/**
 * Populate form with project data (new scripts structure)
 */
function populateFormWithProjectData(project) {
    // Set basic project info
    document.getElementById('projectName').value = project.name || '';

    if (!project.data || !project.data.scripts) {
        clearFormData();
        return;
    }

    // Load scripts for this project
    loadProjectScripts();
    
    const data = project.data;
    
    // Populate DefaultAdUnitData
    if (data.defaultAdUnitData) {
        const defaultData = data.defaultAdUnitData;
        document.getElementById('interstitialId').value = defaultData.interstitialId || '';
        document.getElementById('rewardedVideoId').value = defaultData.rewardedVideoId || '';
        document.getElementById('bannerId').value = defaultData.bannerId || '';
        document.getElementById('aoaId').value = defaultData.aoaId || '';
    }
    
    // Populate BidfloorConfig
    if (data.bidfloorConfig) {
        const bidfloorConfig = data.bidfloorConfig;
        
        // Interstitial
        if (bidfloorConfig.interstitial) {
            const interstitial = bidfloorConfig.interstitial;
            document.getElementById('interstitialDefaultId').value = interstitial.defaultId || '';
            document.getElementById('interstitialLoadCount').value = interstitial.loadCount || 3;
            document.getElementById('interstitialAutoReloadInterval').value = interstitial.autoReloadInterval || 99999;
            document.getElementById('interstitialAutoRetry').checked = interstitial.autoRetry || false;
            
            // Populate bidfloor IDs
            populateBidfloorIds('interstitial', interstitial.bidfloorIds || []);
        }
        
        // Rewarded
        if (bidfloorConfig.rewarded) {
            const rewarded = bidfloorConfig.rewarded;
            document.getElementById('rewardedDefaultId').value = rewarded.defaultId || '';
            document.getElementById('rewardedLoadCount').value = rewarded.loadCount || 3;
            document.getElementById('rewardedAutoReloadInterval').value = rewarded.autoReloadInterval || 99999;
            document.getElementById('rewardedAutoRetry').checked = rewarded.autoRetry || false;
            
            // Populate bidfloor IDs
            populateBidfloorIds('rewarded', rewarded.bidfloorIds || []);
        }
        
        // Banner
        if (bidfloorConfig.banner) {
            document.getElementById('bidfloorBanner').value = bidfloorConfig.banner.bidfloorBanner || '';
        }
    }
    
    // Trigger validation for all inputs
    setTimeout(() => {
        const allInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
        allInputs.forEach(input => {
            if (input.maxLength === 16) {
                validateAdId(input);
            }
        });
    }, 100);
}

/**
 * Populate bidfloor IDs for a specific type
 */
function populateBidfloorIds(type, ids) {
    const container = document.getElementById(`${type}BidfloorIds`);
    const arrayInput = container.querySelector('.array-input');
    
    // Clear existing inputs except the first one
    const existingRows = arrayInput.querySelectorAll('.array-input-row');
    existingRows.forEach((row, index) => {
        if (index > 0) {
            row.remove();
        }
    });
    
    // Set the first input
    const firstInput = arrayInput.querySelector('input[type="text"]');
    if (ids.length > 0) {
        firstInput.value = ids[0];
        validateAdId(firstInput);
    }
    
    // Add additional inputs for remaining IDs
    for (let i = 1; i < ids.length; i++) {
        addBidfloorId(type, arrayInput.querySelector('.btn-add'), ids[i]);
    }
}

/**
 * Collect form data (new scripts structure)
 */
function collectFormData() {
    const projectName = document.getElementById('projectName').value.trim();

    if (!AppState.currentProject) {
        // Creating new project
        return {
            name: projectName,
            data: {
                scripts: []
            }
        };
    }

    // Updating existing project - collect current script data
    if (!AppState.currentScript) {
        return {
            id: AppState.currentProject.id,
            name: projectName,
            data: AppState.currentProject.data
        };
    }

    // Collect current script data from form
    const scriptData = collectCurrentScriptData();

    // Update current script in project data
    const updatedProject = JSON.parse(JSON.stringify(AppState.currentProject));
    const scriptIndex = updatedProject.data.scripts.findIndex(s => s.scriptId === AppState.currentScript.scriptId);

    if (scriptIndex !== -1) {
        updatedProject.data.scripts[scriptIndex].data = scriptData;
    }

    return {
        id: updatedProject.id,
        name: projectName,
        data: updatedProject.data
    };
}

/**
 * Collect current script data from form
 */
function collectCurrentScriptData() {
    // Collect DefaultAdUnitData
    const defaultAdUnitData = {
        interstitialId: document.getElementById('interstitialId').value.trim(),
        rewardedVideoId: document.getElementById('rewardedVideoId').value.trim(),
        bannerId: document.getElementById('bannerId').value.trim(),
        aoaId: document.getElementById('aoaId').value.trim()
    };

    // Collect BidfloorConfig
    const bidfloorConfig = {
        interstitial: {
            defaultId: document.getElementById('interstitialDefaultId').value.trim(),
            bidfloorIds: collectBidfloorIds('interstitial'),
            loadCount: parseInt(document.getElementById('interstitialLoadCount').value) || 3,
            autoReloadInterval: parseInt(document.getElementById('interstitialAutoReloadInterval').value) || 99999,
            autoRetry: document.getElementById('interstitialAutoRetry').checked
        },
        rewarded: {
            defaultId: document.getElementById('rewardedDefaultId').value.trim(),
            bidfloorIds: collectBidfloorIds('rewarded'),
            loadCount: parseInt(document.getElementById('rewardedLoadCount').value) || 3,
            autoReloadInterval: parseInt(document.getElementById('rewardedAutoReloadInterval').value) || 99999,
            autoRetry: document.getElementById('rewardedAutoRetry').checked
        },
        banner: {
            bidfloorBanner: document.getElementById('bidfloorBanner').value.trim()
        }
    };

    return {
        defaultAdUnitData,
        bidfloorConfig
    };
}

/**
 * Collect bidfloor IDs for a specific type
 */
function collectBidfloorIds(type) {
    const container = document.getElementById(`${type}BidfloorIds`);
    const inputs = container.querySelectorAll('input[type="text"]');
    const ids = [];
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value && Utils.isValidAdId(value)) {
            ids.push(value);
        }
    });
    
    return ids;
}

/**
 * Save current project (new scripts structure)
 */
async function saveCurrentProject() {
    try {
        if (!AppState.currentProject) {
            showNotification('Vui lòng tạo project trước', 'warning');
            return;
        }

        if (!AppState.currentScript) {
            showNotification('Vui lòng chọn script để lưu', 'warning');
            return;
        }

        // Validate form data
        const isValid = validateEntireForm();
        if (!isValid) {
            showNotification('Vui lòng sửa các lỗi validation trước khi lưu', 'error');
            return;
        }

        // Collect current script data and update project
        const scriptData = collectCurrentScriptData();

        // Update script data via API
        const response = await api.updateProjectScript(
            AppState.currentProject.id,
            AppState.currentScript.scriptId,
            {
                name: AppState.currentScript.name,
                data: scriptData
            }
        );

        if (response.success) {
            // Update local state
            AppState.currentScript.data = scriptData;
            updateCurrentScriptInfo();

            showNotification('Đã lưu script thành công', 'success');
        }

    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Lỗi khi lưu project', 'error');
    }
}

/**
 * Create new project
 */
function createNewProject() {
    openModal('createProjectModal');

    // Clear the form inputs
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectScriptId').value = '';
    document.getElementById('clearFormData').checked = true;

    // Focus on project name input
    setTimeout(() => {
        document.getElementById('newProjectName').focus();
    }, 100);
}

/**
 * Delete current project
 */
function deleteCurrentProject() {
    if (!AppState.currentProject || !AppState.currentProject.id) {
        showNotification('Không có project nào để xóa', 'warning');
        return;
    }

    const projectName = AppState.currentProject.name;

    // Show confirmation modal
    showConfirmation(
        '🗑️ Xóa Project',
        `Bạn có chắc chắn muốn xóa project "${projectName}"?\n\nHành động này không thể hoàn tác!`,
        async () => {
            try {
                await deleteProject(AppState.currentProject.id);

                // Clear current project state
                AppState.currentProject = null;
                clearFormData();
                updateProjectStatus();

                showNotification(`Đã xóa project "${projectName}" thành công`, 'success');
            } catch (error) {
                console.error('Error deleting project:', error);
                showNotification('Lỗi khi xóa project', 'error');
            }
        }
    );
}

/**
 * Process create new project
 */
async function processCreateProject() {
    const projectName = document.getElementById('newProjectName').value.trim();
    const scriptId = document.getElementById('newProjectScriptId').value.trim() || 'DEFAULT';
    const clearForm = document.getElementById('clearFormData').checked;

    if (!projectName) {
        showNotification('Vui lòng nhập tên project', 'error');
        return;
    }

    try {
        // Check if project name already exists
        const existingProject = await loadProjectByName(projectName);
        if (existingProject) {
            showNotification('Tên project đã tồn tại. Vui lòng chọn tên khác.', 'error');
            return;
        }

        // Create project with initial script
        const projectData = {
            name: projectName,
            data: {
                scripts: [
                    {
                        scriptId: scriptId,
                        name: `Script ${scriptId}`,
                        data: clearForm ? getDefaultScriptData() : collectCurrentScriptData()
                    }
                ]
            }
        };

        const savedProject = await saveProject(projectData);

        // Update state
        AppState.currentProject = savedProject;
        AppState.currentScriptId = scriptId;
        AppState.currentScript = savedProject.data.scripts[0];

        // Update UI
        document.getElementById('projectName').value = projectName;
        updateProjectStatus();
        await loadProjectScripts();

        // Clear form if requested
        if (clearForm) {
            clearFormData();
            populateFormWithScriptData(getDefaultScriptData());
        }

        // Close modal
        closeModal('createProjectModal');

        showNotification(`Đã tạo project: ${projectName}`, 'success');

    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Lỗi khi tạo project', 'error');
    }
}

/**
 * Get default script data structure
 */
function getDefaultScriptData() {
    return {
        defaultAdUnitData: {
            interstitialId: '',
            rewardedVideoId: '',
            bannerId: '',
            aoaId: ''
        },
        bidfloorConfig: {
            interstitial: {
                defaultId: '',
                bidfloorIds: [],
                loadCount: 3,
                autoReloadInterval: 99999,
                autoRetry: false
            },
            rewarded: {
                defaultId: '',
                bidfloorIds: [],
                loadCount: 3,
                autoReloadInterval: 99999,
                autoRetry: false
            },
            banner: {
                bidfloorBanner: ''
            }
        }
    };
}

/**
 * Check if AdData has any meaningful data
 */
function hasAdData(data) {
    if (!data) return false;

    const { defaultAdUnitData, bidfloorConfig } = data;

    // Check if any Ad ID is filled
    if (defaultAdUnitData) {
        if (defaultAdUnitData.interstitialId || defaultAdUnitData.rewardedVideoId ||
            defaultAdUnitData.bannerId || defaultAdUnitData.aoaId) {
            return true;
        }
    }

    // Check if any bidfloor config is filled
    if (bidfloorConfig) {
        if (bidfloorConfig.interstitial?.defaultId ||
            (bidfloorConfig.interstitial?.bidfloorIds && bidfloorConfig.interstitial.bidfloorIds.length > 0) ||
            bidfloorConfig.rewarded?.defaultId ||
            (bidfloorConfig.rewarded?.bidfloorIds && bidfloorConfig.rewarded.bidfloorIds.length > 0) ||
            bidfloorConfig.banner?.bidfloorBanner) {
            return true;
        }
    }

    return false;
}

/**
 * Clear current data
 */
function clearCurrentData() {
    clearFormData();
    AppState.currentProject = null;
    updateProjectStatus();
    showNotification('Đã xóa dữ liệu', 'success');
}

/**
 * Clear form data (renamed from clearForm for clarity)
 */
function clearFormData() {
    // Clear all text inputs except project name and script ID
    const adDataInputs = document.querySelectorAll('#adDataForm input[type="text"]:not(#projectName):not(#scriptId), #adDataForm textarea');
    adDataInputs.forEach(input => {
        input.value = '';
        input.classList.remove('validation-success', 'validation-error');
    });

    // Reset numeric inputs to default values
    document.getElementById('interstitialLoadCount').value = 3;
    document.getElementById('interstitialAutoReloadInterval').value = 99999;
    document.getElementById('rewardedLoadCount').value = 3;
    document.getElementById('rewardedAutoReloadInterval').value = 99999;

    // Reset checkboxes
    document.getElementById('interstitialAutoRetry').checked = false;
    document.getElementById('rewardedAutoRetry').checked = false;

    // Clear bidfloor ID arrays
    clearBidfloorIds('interstitial');
    clearBidfloorIds('rewarded');

    // Clear JSON output
    document.getElementById('jsonOutput').value = '';
}

/**
 * Show project list modal
 */
async function showProjectList() {
    openModal('projectListModal');

    try {
        const projects = await loadProjects();
        renderProjectList(projects);
    } catch (error) {
        console.error('Error loading project list:', error);
        document.getElementById('projectList').innerHTML =
            '<div class="loading-projects">Lỗi khi tải danh sách projects</div>';
    }
}

/**
 * Load project from list
 */
async function loadProjectFromList(projectId) {
    try {
        const response = await api.getProjectById(projectId);

        if (response.success) {
            AppState.currentProject = response.data;
            populateFormWithProjectData(response.data);
            updateProjectStatus();
            closeModal('projectListModal');
            showNotification(`Đã tải project: ${response.data.name}`, 'success');
        }
    } catch (error) {
        console.error('Error loading project from list:', error);
        showNotification('Lỗi khi tải project', 'error');
    }
}

/**
 * Delete project from list
 */
async function deleteProjectFromList(projectId, projectName) {
    // Show confirmation modal
    showConfirmation(
        '🗑️ Xóa Project',
        `Bạn có chắc chắn muốn xóa project "${projectName}"?\n\nHành động này không thể hoàn tác!`,
        async () => {
            try {
                await deleteProject(projectId);

                // If deleted project is currently loaded, clear it
                if (AppState.currentProject && AppState.currentProject.id === projectId) {
                    AppState.currentProject = null;
                    clearFormData();
                    updateProjectStatus();
                }

                // Refresh project list
                const projects = await loadProjects();
                renderProjectList(projects);

                showNotification(`Đã xóa project "${projectName}" thành công`, 'success');
            } catch (error) {
                console.error('Error deleting project from list:', error);
                showNotification('Lỗi khi xóa project', 'error');
            }
        }
    );
}

// ===== SCRIPT ID MANAGEMENT =====

/**
 * Load script IDs for dropdown
 */
async function loadScriptIds() {
    try {
        const response = await api.getScriptIds();

        if (response.success) {
            const datalist = document.getElementById('scriptIdDatalist');
            if (datalist) {
                datalist.innerHTML = '';

                response.data.forEach(scriptId => {
                    const option = document.createElement('option');
                    option.value = scriptId;
                    datalist.appendChild(option);
                });

                console.log(`Loaded ${response.data.length} script IDs`);
            } else {
                console.warn('scriptIdDatalist element not found');
            }
        }
    } catch (error) {
        console.error('Error loading script IDs:', error);
    }
}

/**
 * Show Script ID Manager modal
 */
async function showScriptIdManager() {
    openModal('scriptIdManagerModal');
    await refreshScriptIdManager();
}

/**
 * Refresh Script ID Manager content
 */
async function refreshScriptIdManager() {
    try {
        const response = await api.getScriptIds();

        if (response.success) {
            const scriptIds = response.data;

            // Update count
            document.getElementById('scriptIdCount').textContent = scriptIds.length;

            // Render list
            renderScriptIdList(scriptIds);
        }
    } catch (error) {
        console.error('Error refreshing script ID manager:', error);
        document.getElementById('scriptIdList').innerHTML =
            '<div class="loading-scripts">Lỗi khi tải danh sách Script IDs</div>';
    }
}

/**
 * Render script ID list in manager
 */
function renderScriptIdList(scriptIds) {
    const container = document.getElementById('scriptIdList');

    if (!scriptIds || scriptIds.length === 0) {
        container.innerHTML = '<div class="loading-scripts">Chưa có Script ID nào.</div>';
        return;
    }

    const scriptIdsHTML = scriptIds.map(scriptId => `
        <div class="script-id-item">
            <span class="script-id-name">${Utils.sanitizeString(scriptId)}</span>
            <div class="script-id-item-actions">
                <button class="btn-use-script" onclick="useScriptId('${Utils.sanitizeString(scriptId)}')" title="Sử dụng Script ID này">📋 Sử dụng</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = scriptIdsHTML;
}

/**
 * Use a script ID (set it to the input field)
 */
function useScriptId(scriptId) {
    document.getElementById('scriptId').value = scriptId;
    closeModal('scriptIdManagerModal');
    showNotification(`Đã chọn Script ID: ${scriptId}`, 'success');
}

/**
 * Add new script ID (by creating a project with it)
 */
async function addNewScriptId() {
    const newScriptIdInput = document.getElementById('newScriptId');
    const newScriptId = newScriptIdInput.value.trim();

    if (!newScriptId) {
        showNotification('Vui lòng nhập Script ID', 'warning');
        return;
    }

    if (newScriptId.length > 50) {
        showNotification('Script ID không được quá 50 ký tự', 'error');
        return;
    }

    try {
        // Check if script ID already exists
        const response = await api.getScriptIds();
        if (response.success && response.data.includes(newScriptId)) {
            showNotification('Script ID này đã tồn tại', 'warning');
            return;
        }

        // Set the new script ID to current input
        document.getElementById('scriptId').value = newScriptId;
        newScriptIdInput.value = '';

        // Refresh the manager and main dropdown
        await loadScriptIds();
        await refreshScriptIdManager();

        showNotification(`Đã thêm Script ID: ${newScriptId}`, 'success');

    } catch (error) {
        console.error('Error adding new script ID:', error);
        showNotification('Lỗi khi thêm Script ID', 'error');
    }
}

// ===== SCRIPT MANAGEMENT (NEW STRUCTURE) =====

/**
 * Load scripts for current project
 */
async function loadProjectScripts() {
    if (!AppState.currentProject || !AppState.currentProject.id) {
        return;
    }

    try {
        const response = await api.getProjectScripts(AppState.currentProject.id);

        if (response.success) {
            const scripts = response.data.scripts || [];
            updateScriptSelector(scripts);

            // Auto-select first script if available
            if (scripts.length > 0 && !AppState.currentScriptId) {
                AppState.currentScriptId = scripts[0].scriptId;
                AppState.currentScript = scripts[0];
                updateCurrentScriptInfo();
                populateFormWithScriptData(scripts[0].data);
            }
        }
    } catch (error) {
        console.error('Error loading project scripts:', error);
    }
}

/**
 * Update script selector dropdown
 */
function updateScriptSelector(scripts) {
    const selector = document.getElementById('currentScriptSelector');
    selector.innerHTML = '<option value="">Chọn script...</option>';

    scripts.forEach(script => {
        const option = document.createElement('option');
        option.value = script.scriptId;
        option.textContent = `${script.name} (${script.scriptId})`;
        selector.appendChild(option);
    });

    // Set current selection
    if (AppState.currentScriptId) {
        selector.value = AppState.currentScriptId;
    }

    // Update button states
    updateScriptButtonStates();
}

/**
 * Switch to different script
 */
async function switchScript() {
    const selector = document.getElementById('currentScriptSelector');
    const selectedScriptId = selector.value;

    if (!selectedScriptId) {
        AppState.currentScriptId = null;
        AppState.currentScript = null;
        clearFormData();
        updateCurrentScriptInfo();
        updateScriptButtonStates();
        return;
    }

    try {
        const response = await api.getProjectScript(AppState.currentProject.id, selectedScriptId);

        if (response.success) {
            AppState.currentScriptId = selectedScriptId;
            AppState.currentScript = response.data;
            updateCurrentScriptInfo();
            populateFormWithScriptData(response.data.data);
            updateScriptButtonStates();
        }
    } catch (error) {
        console.error('Error switching script:', error);
        showNotification('Lỗi khi chuyển script', 'error');
    }
}

/**
 * Update current script info display
 */
function updateCurrentScriptInfo() {
    const infoDiv = document.getElementById('currentScriptInfo');
    const nameSpan = document.getElementById('currentScriptName');
    const idSpan = document.getElementById('currentScriptId');
    const statusSpan = document.getElementById('currentScriptStatus');

    if (AppState.currentScript) {
        infoDiv.style.display = 'block';
        nameSpan.textContent = AppState.currentScript.name;
        idSpan.textContent = AppState.currentScript.scriptId;

        // Check if script has data
        const hasData = AppState.currentScript.data &&
                       (AppState.currentScript.data.defaultAdUnitData || AppState.currentScript.data.bidfloorConfig);
        statusSpan.textContent = hasData ? 'Có dữ liệu' : 'Chưa có dữ liệu';
        statusSpan.className = hasData ? 'status-success' : 'status-warning';
    } else {
        infoDiv.style.display = 'none';
    }
}

/**
 * Update script management button states
 */
function updateScriptButtonStates() {
    const editBtn = document.getElementById('editScriptBtn');
    const deleteBtn = document.getElementById('deleteScriptBtn');

    const hasCurrentScript = AppState.currentScript !== null;

    editBtn.disabled = !hasCurrentScript;
    deleteBtn.disabled = !hasCurrentScript;
}

/**
 * Show add script modal
 */
function showAddScriptModal() {
    if (!AppState.currentProject) {
        showNotification('Vui lòng tạo hoặc load project trước', 'warning');
        return;
    }

    // Reset form
    document.getElementById('addScriptForm').reset();
    document.getElementById('copyCurrentData').checked = AppState.currentScript !== null;

    openModal('addScriptModal');
}

/**
 * Show edit script modal
 */
function showEditScriptModal() {
    if (!AppState.currentScript) {
        showNotification('Vui lòng chọn script để sửa', 'warning');
        return;
    }

    // Populate form
    document.getElementById('editScriptId').value = AppState.currentScript.scriptId;
    document.getElementById('editScriptName').value = AppState.currentScript.name;

    openModal('editScriptModal');
}

/**
 * Delete current script
 */
async function deleteCurrentScript() {
    if (!AppState.currentScript) {
        showNotification('Vui lòng chọn script để xóa', 'warning');
        return;
    }

    // Check if this is the only script
    const selector = document.getElementById('currentScriptSelector');
    if (selector.options.length <= 2) { // 1 for "Chọn script..." + 1 for current script
        showNotification('Không thể xóa script cuối cùng trong project', 'error');
        return;
    }

    const scriptName = AppState.currentScript.name;

    showConfirmation(
        '🗑️ Xóa Script',
        `Bạn có chắc chắn muốn xóa script "${scriptName}"?\n\nHành động này không thể hoàn tác!`,
        async () => {
            try {
                await api.deleteProjectScript(AppState.currentProject.id, AppState.currentScript.scriptId);

                // Clear current script
                AppState.currentScript = null;
                AppState.currentScriptId = null;

                // Reload scripts
                await loadProjectScripts();

                showNotification(`Đã xóa script "${scriptName}" thành công`, 'success');
            } catch (error) {
                console.error('Error deleting script:', error);
                showNotification('Lỗi khi xóa script', 'error');
            }
        }
    );
}

/**
 * Handle add script form submission
 */
document.addEventListener('DOMContentLoaded', function() {
    const addScriptForm = document.getElementById('addScriptForm');
    if (addScriptForm) {
        addScriptForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const scriptId = formData.get('scriptId').trim();
            const name = formData.get('name').trim();
            const copyCurrentData = document.getElementById('copyCurrentData').checked;

            if (!scriptId || !name) {
                showNotification('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            try {
                let scriptData = null;

                if (copyCurrentData && AppState.currentScript) {
                    scriptData = JSON.parse(JSON.stringify(AppState.currentScript.data));
                }

                const response = await api.addProjectScript(AppState.currentProject.id, {
                    scriptId,
                    name,
                    data: scriptData
                });

                if (response.success) {
                    closeModal('addScriptModal');
                    await loadProjectScripts();

                    // Switch to new script
                    AppState.currentScriptId = scriptId;
                    document.getElementById('currentScriptSelector').value = scriptId;
                    await switchScript();

                    showNotification(`Đã thêm script "${name}" thành công`, 'success');
                }
            } catch (error) {
                console.error('Error adding script:', error);
                if (error.message && error.message.includes('already exists')) {
                    showNotification('Script ID đã tồn tại', 'error');
                } else {
                    showNotification('Lỗi khi thêm script', 'error');
                }
            }
        });
    }

    const editScriptForm = document.getElementById('editScriptForm');
    if (editScriptForm) {
        editScriptForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const name = formData.get('name').trim();

            if (!name) {
                showNotification('Vui lòng nhập tên script', 'error');
                return;
            }

            try {
                const response = await api.updateProjectScript(
                    AppState.currentProject.id,
                    AppState.currentScript.scriptId,
                    { name }
                );

                if (response.success) {
                    closeModal('editScriptModal');

                    // Update current script
                    AppState.currentScript.name = name;
                    updateCurrentScriptInfo();
                    await loadProjectScripts();

                    showNotification(`Đã cập nhật script thành công`, 'success');
                }
            } catch (error) {
                console.error('Error updating script:', error);
                showNotification('Lỗi khi cập nhật script', 'error');
            }
        });
    }
});

/**
 * Populate form with script data
 */
function populateFormWithScriptData(scriptData) {
    if (!scriptData) return;

    // Populate DefaultAdUnitData
    const defaultData = scriptData.defaultAdUnitData || {};
    document.getElementById('interstitialId').value = defaultData.interstitialId || '';
    document.getElementById('rewardedVideoId').value = defaultData.rewardedVideoId || '';
    document.getElementById('bannerId').value = defaultData.bannerId || '';
    document.getElementById('aoaId').value = defaultData.aoaId || '';

    // Populate BidfloorConfig
    const bidfloorConfig = scriptData.bidfloorConfig || {};

    // Interstitial
    const interstitial = bidfloorConfig.interstitial || {};
    document.getElementById('interstitialDefaultId').value = interstitial.defaultId || '';
    document.getElementById('interstitialLoadCount').value = interstitial.loadCount || 3;
    document.getElementById('interstitialAutoReloadInterval').value = interstitial.autoReloadInterval || 99999;
    document.getElementById('interstitialAutoRetry').checked = interstitial.autoRetry || false;

    // Populate bidfloor IDs
    const bidfloorIds = interstitial.bidfloorIds || [];
    bidfloorIds.forEach((id, index) => {
        const input = document.getElementById(`interstitialBidfloorId${index + 1}`);
        if (input) input.value = id;
    });

    // Rewarded
    const rewarded = bidfloorConfig.rewarded || {};
    document.getElementById('rewardedDefaultId').value = rewarded.defaultId || '';
    document.getElementById('rewardedLoadCount').value = rewarded.loadCount || 3;
    document.getElementById('rewardedAutoReloadInterval').value = rewarded.autoReloadInterval || 99999;
    document.getElementById('rewardedAutoRetry').checked = rewarded.autoRetry || false;

    // Populate rewarded bidfloor IDs
    const rewardedBidfloorIds = rewarded.bidfloorIds || [];
    rewardedBidfloorIds.forEach((id, index) => {
        const input = document.getElementById(`rewardedBidfloorId${index + 1}`);
        if (input) input.value = id;
    });

    // Banner
    const banner = bidfloorConfig.banner || {};
    document.getElementById('bidfloorBanner').value = banner.bidfloorBanner || '';
}



/**
 * Import project
 */
function importProject() {
    openModal('importModal');
}

/**
 * Handle file import
 */
function handleFileImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('importText').value = e.target.result;
    };
    reader.readAsText(file);
}

/**
 * Process import
 */
async function processImport() {
    const jsonText = document.getElementById('importText').value.trim();

    if (!jsonText) {
        showNotification('Vui lòng nhập hoặc chọn file JSON', 'error');
        return;
    }

    try {
        const projectData = JSON.parse(jsonText);

        // Validate project structure
        if (!projectData.name || !projectData.data) {
            showNotification('File JSON không đúng định dạng project', 'error');
            return;
        }

        // Create new project with imported data
        const newProjectData = {
            name: `${projectData.name}_imported`,
            scriptId: projectData.scriptId || '',
            data: projectData.data
        };

        const savedProject = await saveProject(newProjectData);
        AppState.currentProject = savedProject;
        populateFormWithProjectData(savedProject);
        updateProjectStatus();

        closeModal('importModal');
        showNotification(`Đã import project: ${savedProject.name}`, 'success');

    } catch (error) {
        console.error('Error importing project:', error);
        showNotification('Lỗi khi import project', 'error');
    }
}

/**
 * Generate JSON output
 */
function generateJSON() {
    try {
        const formData = collectFormData();
        const jsonOutput = JSON.stringify(formData.data, null, 2);

        document.getElementById('jsonOutput').value = jsonOutput;
        showNotification('JSON đã được tạo thành công', 'success');
    } catch (error) {
        console.error('Error generating JSON:', error);
        showNotification('Lỗi khi tạo JSON', 'error');
    }
}

/**
 * Copy JSON to clipboard
 */
async function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');

    if (!jsonOutput.value) {
        generateJSON();
    }

    try {
        await navigator.clipboard.writeText(jsonOutput.value);
        showNotification('JSON đã được copy vào clipboard', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showNotification('Lỗi khi copy vào clipboard', 'error');
    }
}

/**
 * Download JSON file
 */
function downloadJSON() {
    const jsonOutput = document.getElementById('jsonOutput');

    if (!jsonOutput.value) {
        generateJSON();
    }

    const projectName = document.getElementById('projectName').value.trim() || 'addata';
    const filename = `${projectName}_addata.json`;

    const blob = new Blob([jsonOutput.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(`Đã tải xuống: ${filename}`, 'success');
}

/**
 * Add bidfloor ID input
 */
function addBidfloorId(type, button, value = '') {
    const container = button.closest('.array-input');
    const newRow = document.createElement('div');
    newRow.className = 'array-input-row';

    newRow.innerHTML = `
        <div class="array-input-field">
            <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16"
                   value="${value}" oninput="validateAdId(this)" onblur="validateAdId(this)">
            <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
        </div>
        <button type="button" class="btn btn-remove" onclick="removeBidfloorId(this)">Xóa</button>
    `;

    container.appendChild(newRow);

    // Validate the input if value is provided
    if (value) {
        const input = newRow.querySelector('input');
        validateAdId(input);
    }
}

/**
 * Remove bidfloor ID input
 */
function removeBidfloorId(button) {
    const row = button.closest('.array-input-row');
    row.remove();
}

/**
 * Show import data modal
 */
function showImportDataModal() {
    openModal('importDataModal');
}

/**
 * Handle data file import
 */
function handleDataFileImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('importDataText').value = e.target.result;
    };
    reader.readAsText(file);
}

/**
 * Process data import
 */
function processDataImport() {
    const jsonText = document.getElementById('importDataText').value.trim();
    const validateOnImport = document.getElementById('validateOnImport').checked;

    if (!jsonText) {
        showNotification('Vui lòng nhập hoặc chọn file JSON', 'error');
        return;
    }

    try {
        const data = JSON.parse(jsonText);

        // Validate structure if validation is enabled
        if (validateOnImport) {
            const validation = validateAdDataStructure(data);
            if (!validation.isValid) {
                showNotification(`Dữ liệu không hợp lệ:\n${validation.errors.join('\n')}`, 'error');
                return;
            }
        }

        // Import the data
        importAdDataToForm(data);
        closeModal('importDataModal');
        showNotification('Dữ liệu đã được import thành công', 'success');

    } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Dữ liệu JSON không hợp lệ', 'error');
    }
}

/**
 * Import AdData to form
 */
function importAdDataToForm(data) {
    // Import DefaultAdUnitData
    if (data.defaultAdUnitData) {
        const defaultData = data.defaultAdUnitData;
        document.getElementById('interstitialId').value = defaultData.interstitialId || '';
        document.getElementById('rewardedVideoId').value = defaultData.rewardedVideoId || '';
        document.getElementById('bannerId').value = defaultData.bannerId || '';
        document.getElementById('aoaId').value = defaultData.aoaId || '';
    }

    // Import BidfloorConfig
    if (data.bidfloorConfig) {
        const bidfloorConfig = data.bidfloorConfig;

        // Interstitial
        if (bidfloorConfig.interstitial) {
            const interstitial = bidfloorConfig.interstitial;
            document.getElementById('interstitialDefaultId').value = interstitial.defaultId || '';
            document.getElementById('interstitialLoadCount').value = interstitial.loadCount || 3;
            document.getElementById('interstitialAutoReloadInterval').value = interstitial.autoReloadInterval || 99999;
            document.getElementById('interstitialAutoRetry').checked = interstitial.autoRetry || false;

            populateBidfloorIds('interstitial', interstitial.bidfloorIds || []);
        }

        // Rewarded
        if (bidfloorConfig.rewarded) {
            const rewarded = bidfloorConfig.rewarded;
            document.getElementById('rewardedDefaultId').value = rewarded.defaultId || '';
            document.getElementById('rewardedLoadCount').value = rewarded.loadCount || 3;
            document.getElementById('rewardedAutoReloadInterval').value = rewarded.autoReloadInterval || 99999;
            document.getElementById('rewardedAutoRetry').checked = rewarded.autoRetry || false;

            populateBidfloorIds('rewarded', rewarded.bidfloorIds || []);
        }

        // Banner
        if (bidfloorConfig.banner) {
            document.getElementById('bidfloorBanner').value = bidfloorConfig.banner.bidfloorBanner || '';
        }
    }

    // Trigger validation for all inputs
    setTimeout(() => {
        const allInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
        allInputs.forEach(input => {
            if (input.maxLength === 16) {
                validateAdId(input);
            }
        });
    }, 100);
}

/**
 * Clear import data
 */
function clearImportData() {
    document.getElementById('importDataText').value = '';
    document.getElementById('importDataFile').value = '';
}



/**
 * Clear bidfloor IDs for a specific type
 */
function clearBidfloorIds(type) {
    const container = document.getElementById(`${type}BidfloorIds`);
    const arrayInput = container.querySelector('.array-input');

    // Remove all rows except the first one
    const rows = arrayInput.querySelectorAll('.array-input-row');
    rows.forEach((row, index) => {
        if (index > 0) {
            row.remove();
        }
    });

    // Clear the first input
    const firstInput = arrayInput.querySelector('input[type="text"]');
    if (firstInput) {
        firstInput.value = '';
        firstInput.classList.remove('validation-success', 'validation-error');
    }
}



/**
 * Show project list modal
 */
async function showProjectList() {
    openModal('projectListModal');

    try {
        const projects = await loadProjects();
        renderProjectList(projects);
    } catch (error) {
        console.error('Error loading project list:', error);
        document.getElementById('projectList').innerHTML =
            '<div class="loading-projects">Lỗi khi tải danh sách projects</div>';
    }
}

/**
 * Load project from list
 */
async function loadProjectFromList(projectId) {
    try {
        const response = await api.getProjectById(projectId);

        if (response.success) {
            AppState.currentProject = response.data;
            populateFormWithProjectData(response.data);
            updateProjectStatus();
            closeModal('projectListModal');
            showNotification(`Đã tải project: ${response.data.name}`, 'success');
        }
    } catch (error) {
        console.error('Error loading project from list:', error);
        showNotification('Lỗi khi tải project', 'error');
    }
}



/**
 * Generate JSON output
 */
function generateJSON() {
    try {
        const formData = collectFormData();
        const jsonOutput = JSON.stringify(formData.data, null, 2);

        document.getElementById('jsonOutput').value = jsonOutput;
        showNotification('JSON đã được tạo thành công', 'success');
    } catch (error) {
        console.error('Error generating JSON:', error);
        showNotification('Lỗi khi tạo JSON', 'error');
    }
}

/**
 * Copy JSON to clipboard
 */
async function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');

    if (!jsonOutput.value) {
        generateJSON();
    }

    try {
        await navigator.clipboard.writeText(jsonOutput.value);
        showNotification(CONFIG.MESSAGES.SUCCESS.JSON_COPIED, 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showNotification('Lỗi khi copy vào clipboard', 'error');
    }
}

/**
 * Download JSON file
 */
function downloadJSON() {
    const jsonOutput = document.getElementById('jsonOutput');

    if (!jsonOutput.value) {
        generateJSON();
    }

    const projectName = document.getElementById('projectName').value.trim() || 'addata';
    const filename = `${projectName}_addata.json`;

    const blob = new Blob([jsonOutput.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(`Đã tải xuống: ${filename}`, 'success');
}

/**
 * Add bidfloor ID input
 */
function addBidfloorId(type, button, value = '') {
    const container = button.closest('.array-input');
    const newRow = document.createElement('div');
    newRow.className = 'array-input-row';

    newRow.innerHTML = `
        <div class="array-input-field">
            <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16"
                   value="${value}" oninput="validateAdId(this)" onblur="validateAdId(this)">
            <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
        </div>
        <button type="button" class="btn btn-remove" onclick="removeBidfloorId(this)">Xóa</button>
    `;

    container.appendChild(newRow);

    // Validate the input if value is provided
    if (value) {
        const input = newRow.querySelector('input');
        validateAdId(input);
    }
}

/**
 * Remove bidfloor ID input
 */
function removeBidfloorId(button) {
    const row = button.closest('.array-input-row');
    row.remove();
}

/**
 * Show import data modal
 */
function showImportDataModal() {
    openModal('importDataModal');
}

/**
 * Handle data file import
 */
function handleDataFileImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('importDataText').value = e.target.result;
    };
    reader.readAsText(file);
}

/**
 * Process data import
 */
function processDataImport() {
    const jsonText = document.getElementById('importDataText').value.trim();
    const validateOnImport = document.getElementById('validateOnImport').checked;

    if (!jsonText) {
        showNotification('Vui lòng nhập hoặc chọn file JSON', 'error');
        return;
    }

    try {
        const data = JSON.parse(jsonText);

        // Validate structure if validation is enabled
        if (validateOnImport) {
            const validation = validateAdDataStructure(data);
            if (!validation.isValid) {
                showNotification(`Dữ liệu không hợp lệ:\n${validation.errors.join('\n')}`, 'error');
                return;
            }
        }

        // Import the data
        importAdDataToForm(data);
        closeModal('importDataModal');
        showNotification(CONFIG.MESSAGES.SUCCESS.DATA_IMPORTED, 'success');

    } catch (error) {
        console.error('Error importing data:', error);
        showNotification(CONFIG.MESSAGES.ERROR.INVALID_JSON, 'error');
    }
}

/**
 * Import AdData to form
 */
function importAdDataToForm(data) {
    // Import DefaultAdUnitData
    if (data.defaultAdUnitData) {
        const defaultData = data.defaultAdUnitData;
        document.getElementById('interstitialId').value = defaultData.interstitialId || '';
        document.getElementById('rewardedVideoId').value = defaultData.rewardedVideoId || '';
        document.getElementById('bannerId').value = defaultData.bannerId || '';
        document.getElementById('aoaId').value = defaultData.aoaId || '';
    }

    // Import BidfloorConfig
    if (data.bidfloorConfig) {
        const bidfloorConfig = data.bidfloorConfig;

        // Interstitial
        if (bidfloorConfig.interstitial) {
            const interstitial = bidfloorConfig.interstitial;
            document.getElementById('interstitialDefaultId').value = interstitial.defaultId || '';
            document.getElementById('interstitialLoadCount').value = interstitial.loadCount || 3;
            document.getElementById('interstitialAutoReloadInterval').value = interstitial.autoReloadInterval || 99999;
            document.getElementById('interstitialAutoRetry').checked = interstitial.autoRetry || false;

            populateBidfloorIds('interstitial', interstitial.bidfloorIds || []);
        }

        // Rewarded
        if (bidfloorConfig.rewarded) {
            const rewarded = bidfloorConfig.rewarded;
            document.getElementById('rewardedDefaultId').value = rewarded.defaultId || '';
            document.getElementById('rewardedLoadCount').value = rewarded.loadCount || 3;
            document.getElementById('rewardedAutoReloadInterval').value = rewarded.autoReloadInterval || 99999;
            document.getElementById('rewardedAutoRetry').checked = rewarded.autoRetry || false;

            populateBidfloorIds('rewarded', rewarded.bidfloorIds || []);
        }

        // Banner
        if (bidfloorConfig.banner) {
            document.getElementById('bidfloorBanner').value = bidfloorConfig.banner.bidfloorBanner || '';
        }
    }

    // Trigger validation for all inputs
    setTimeout(() => {
        const allInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
        allInputs.forEach(input => {
            if (input.maxLength === 16) {
                validateAdId(input);
            }
        });
    }, 100);
}

/**
 * Clear import data
 */
function clearImportData() {
    document.getElementById('importDataText').value = '';
    document.getElementById('importDataFile').value = '';
}

/**
 * Export project (new scripts structure)
 */
function exportProject() {
    if (!AppState.currentProject) {
        showNotification('Không có project nào để export', 'warning');
        return;
    }

    const exportData = {
        ...AppState.currentProject,
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        structure: 'scripts' // Indicate new structure
    };

    const filename = `${AppState.currentProject.name}_project_v2.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(`Đã export project: ${filename}`, 'success');
}

/**
 * Import project
 */
function importProject() {
    openModal('importModal');
}

/**
 * Handle file import
 */
function handleFileImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('importText').value = e.target.result;
    };
    reader.readAsText(file);
}

/**
 * Process import (supports both old and new structure)
 */
async function processImport() {
    const jsonText = document.getElementById('importText').value.trim();

    if (!jsonText) {
        showNotification('Vui lòng nhập hoặc chọn file JSON', 'error');
        return;
    }

    try {
        const projectData = JSON.parse(jsonText);

        // Validate project structure
        if (!projectData.name || !projectData.data) {
            showNotification('File JSON không đúng định dạng project', 'error');
            return;
        }

        let newProjectData;

        // Check if it's new scripts structure
        if (projectData.data.scripts && Array.isArray(projectData.data.scripts)) {
            // New structure - use as is
            newProjectData = {
                name: `${projectData.name}_imported`,
                description: projectData.description || '',
                data: projectData.data
            };
        } else {
            // Old structure - convert to new structure
            newProjectData = {
                name: `${projectData.name}_imported`,
                description: projectData.description || '',
                data: {
                    scripts: [
                        {
                            scriptId: projectData.scriptId || 'IMPORTED',
                            name: 'Imported Script',
                            data: projectData.data
                        }
                    ]
                }
            };
        }

        const savedProject = await saveProject(newProjectData);
        AppState.currentProject = savedProject;
        populateFormWithProjectData(savedProject);
        updateProjectStatus();

        closeModal('importModal');
        showNotification(`Đã import project: ${savedProject.name}`, 'success');

    } catch (error) {
        console.error('Error importing project:', error);
        showNotification('Lỗi khi import project', 'error');
    }
}
