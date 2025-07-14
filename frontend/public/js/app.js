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
let autoSaveTimeout = null;
let isDirty = false;

// Auto-save settings
let autoSaveEnabled = true;
let autoSaveDelay = 30000; // 30 seconds - less intrusive
let lastAutoSaveTime = null;

// Project list state
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
let pageSize = 20;
let sortBy = 'updatedAt';
let searchQuery = '';

/**
 * Auto-save functionality
 */
function markDirty() {
    isDirty = true;
    updateSaveButtonState();

    if (autoSaveEnabled) {
        scheduleAutoSave();
    }
}

function markClean() {
    isDirty = false;
    updateSaveButtonState();

    // Clear any pending auto-save
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }

    // No visual indicators for silent auto-save
}

function updateSaveButtonState() {
    const saveButtons = document.querySelectorAll('[onclick*="saveCurrentProject"]');
    saveButtons.forEach(button => {
        if (isDirty) {
            // Subtle indication of unsaved changes - no animation to avoid flashing
            button.style.background = 'linear-gradient(45deg, #007acc, #0056b3)';
            button.title = autoSaveEnabled
                ? `Có thay đổi chưa lưu - Sẽ tự động lưu sau ${autoSaveDelay/1000}s`
                : 'Có thay đổi chưa lưu - Click để lưu';
        } else {
            button.style.background = '';
            button.title = 'Lưu project hiện tại';
        }
    });
}

function scheduleAutoSave() {
    if (!autoSaveEnabled || !AppState.currentProject || !AppState.currentScript) {
        return; // Auto-save disabled or no project/script to save
    }

    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    // Silent auto-save - no visual indicators to avoid flashing
    autoSaveTimeout = setTimeout(() => {
        performAutoSave();
    }, autoSaveDelay);
}

async function performAutoSave() {
    if (!isDirty || !AppState.currentProject || !AppState.currentScript) {
        return;
    }

    try {
        // Silent auto-save - no visual indicators
        console.log('🔄 Auto-saving silently...');

        // Collect current script data
        const scriptData = collectCurrentScriptData();

        // Update script data via API (without validation blocking)
        const response = await api.updateProjectScript(
            AppState.currentProject.id,
            AppState.currentScript.scriptId,
            {
                name: AppState.currentScript.name,
                data: scriptData
            }
        );

        if (response.success) {
            markClean();
            lastAutoSaveTime = new Date();
            AppState.lastSaved = lastAutoSaveTime;
            updateProjectStatus();

            // Silent success - only log to console
            console.log(`✅ Auto-saved successfully at ${lastAutoSaveTime.toLocaleTimeString()}`);
        } else {
            // Silent error - only log to console, don't disturb user
            console.warn('⚠️ Auto-save failed:', response.message);
        }
    } catch (error) {
        // Silent error - only log to console
        console.error('❌ Auto-save error:', error);
    }
}

/**
 * Clear all project and script state
 */
function clearProjectState() {
    AppState.currentProject = null;
    AppState.currentScriptId = null;
    AppState.currentScript = null;
    AppState.lastSaved = null;

    clearFormData();
    hideDataConfiguration();
    markClean();

    // Clear project name display
    updateProjectNameDisplay(null);

    // Clear script selector
    const selector = document.getElementById('currentScriptSelector');
    if (selector) {
        selector.innerHTML = '<option value="">Chọn script...</option>';
        selector.value = '';
    }

    // Update UI states
    updateCurrentScriptInfo();
    updateScriptButtonStates();

    console.log('🧹 Cleared all project state');
}

/**
 * Auto-save visual indicators - Removed for silent auto-save
 * All auto-save operations are now silent to avoid UI flashing
 */

/**
 * Toggle auto-save feature
 */
function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;

    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }

    if (!autoSaveEnabled) {
        showNotification(
            '🔕 Đã tắt tự động lưu. Nhớ lưu thủ công!',
            'warning',
            4000
        );
    } else {
        showNotification(
            `🔔 Đã bật tự động lưu (${autoSaveDelay/1000}s, chế độ ngầm)`,
            'success',
            3000
        );
        if (isDirty) {
            scheduleAutoSave();
        }
    }

    updateAutoSaveToggleButton();
}

/**
 * Update auto-save toggle button
 */
function updateAutoSaveToggleButton() {
    const toggleBtn = document.getElementById('autoSaveToggle');
    if (toggleBtn) {
        toggleBtn.textContent = autoSaveEnabled ? '🔔 Auto-Save: ON' : '🔕 Auto-Save: OFF';
        toggleBtn.className = autoSaveEnabled ? 'btn btn-success btn-sm' : 'btn btn-secondary btn-sm';
        toggleBtn.title = autoSaveEnabled
            ? `Tự động lưu sau ${autoSaveDelay/1000}s không hoạt động`
            : 'Click để bật tự động lưu';
    }
}

/**
 * Change auto-save delay
 */
function changeAutoSaveDelay() {
    const delaySelect = document.getElementById('autoSaveDelaySelect');
    if (delaySelect) {
        autoSaveDelay = parseInt(delaySelect.value);

        // Clear current timeout and reschedule if needed
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = null;
        }

        if (autoSaveEnabled && isDirty) {
            scheduleAutoSave();
        }

        updateAutoSaveToggleButton();

        showNotification(
            `⏱️ Đã đổi thời gian auto-save thành ${autoSaveDelay/1000} giây (chế độ ngầm)`,
            'info',
            3000
        );
    }
}

/**
 * Show/Hide data configuration based on script selection
 */
function showDataConfiguration() {
    const container = document.getElementById('dataConfigurationContainer');
    if (container) {
        container.style.display = 'block';
        console.log('✅ Data configuration shown');
    }
}

function hideDataConfiguration() {
    const container = document.getElementById('dataConfigurationContainer');
    if (container) {
        container.style.display = 'none';
        console.log('🔒 Data configuration hidden');
    }
}

/**
 * Update project name display
 */
function updateProjectNameDisplay(projectName = null) {
    // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateProjectNameDisplay(projectName));
        return;
    }

    const displayElement = document.getElementById('projectNameDisplay');
    const textElement = document.getElementById('projectNameText');

    if (!displayElement || !textElement) {
        console.error('Project name display elements not found:', {
            displayElement: !!displayElement,
            textElement: !!textElement,
            readyState: document.readyState
        });
        return;
    }

    if (projectName) {
        textElement.textContent = projectName;
        displayElement.className = 'project-name-display has-project';
        displayElement.title = `Project hiện tại: ${projectName}`;

        // Show rename button
        const renameBtn = document.getElementById('renameProjectBtn');
        if (renameBtn) renameBtn.style.display = 'inline-block';

        // Show delete button
        const deleteBtn = document.getElementById('deleteProjectBtn');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
        textElement.textContent = 'Chưa có project nào được chọn';
        displayElement.className = 'project-name-display no-project';
        displayElement.title = 'Chưa có project nào được chọn';

        // Hide rename button
        const renameBtn = document.getElementById('renameProjectBtn');
        if (renameBtn) renameBtn.style.display = 'none';

        // Hide delete button
        const deleteBtn = document.getElementById('deleteProjectBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
    setupEventListeners();

    // Load script IDs for dropdown
    loadScriptIds();

    // Initialize project name display
    updateProjectNameDisplay();

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
    // No longer need project name input handlers since it's now a display-only element
}

// Removed handleProjectNameInput and handleProjectNameChange functions
// since project name is now display-only

/**
 * Load project data by name
 */
async function loadProjectData(projectName) {
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
    // Set basic project info (don't clear state here as it's already cleared in loadProjectFromList)
    updateProjectNameDisplay(project.name || '');

    if (!project.data || !project.data.scripts) {
        console.log('❌ Project has no scripts data');
        return;
    }

    // Load scripts for this project
    loadProjectScripts();

    // Don't populate form data from project level - wait for user to select a script
    // Form data should only come from selected script
    console.log(`✅ Switched to project: ${project.name}`);
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
    if (!AppState.currentProject) {
        // Creating new project - should not happen in new UI flow
        return {
            name: 'New Project',
            data: {
                scripts: []
            }
        };
    }

    // Updating existing project - collect current script data
    if (!AppState.currentScript) {
        return {
            id: AppState.currentProject.id,
            name: AppState.currentProject.name,
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

        // Note: We allow saving even with validation errors
        // Validation only blocks JSON export, not project saving
        const isValid = validateEntireForm();
        if (!isValid) {
            showNotification('⚠️ Có lỗi validation nhưng vẫn lưu project (không thể export JSON)', 'warning');
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

            // Mark as clean (no unsaved changes)
            markClean();

            showNotification('Đã lưu script thành công', 'success');
        }

    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Lỗi khi lưu project', 'error');
    }
}

/**
 * Create quick project with auto-generated name and default script
 */
async function createQuickProject() {
    try {
        // Generate unique project name
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        const projectName = `Project_${timestamp}`;

        // Create project with default script
        const completeScriptData = {
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

        const projectData = {
            name: projectName,
            data: {
                scripts: [
                    {
                        scriptId: 'default_script',
                        name: 'Default',
                        data: completeScriptData
                    }
                ]
            }
        };

        // Force create new project
        const response = await api.createProject(projectData);

        if (!response.success) {
            throw new Error(response.message || 'Failed to create project');
        }

        const savedProject = response.data;

        // Update state
        AppState.currentProject = savedProject;
        AppState.currentScriptId = 'default_script';
        AppState.currentScript = savedProject.data.scripts[0];

        // Update UI
        updateProjectNameDisplay(projectName);
        updateProjectStatus();

        try {
            await loadProjectScripts();

            // After loading scripts, ensure we're on the created script
            if (AppState.currentScriptId === 'default_script') {
                const selector = document.getElementById('currentScriptSelector');
                if (selector) {
                    selector.value = 'default_script';
                }
                showDataConfiguration();
                console.log(`✅ Auto-selected created script: default_script`);
            }
        } catch (scriptsError) {
            console.error('Error loading project scripts:', scriptsError);
        }

        // Populate form with default data
        try {
            clearFormData();
            populateFormWithScriptData(completeScriptData);
            console.log('✅ Form populated with default data');
        } catch (formError) {
            console.error('Error populating form:', formError);
        }

        showNotification(`⚡ Đã tạo project nhanh: ${projectName}`, 'success');
        console.log(`🎉 Created quick project: ${projectName} (ID: ${savedProject.id})`);

    } catch (error) {
        console.error('Error creating quick project:', error);
        showNotification(`Lỗi khi tạo project nhanh: ${error.message}`, 'error');
    }
}

/**
 * Create new project
 */
function createNewProject() {
    // Show confirmation if there's a current project
    if (AppState.currentProject) {
        const confirmed = confirm(
            `Bạn đang có project "${AppState.currentProject.name}" đang mở.\n\n` +
            `Tạo project mới sẽ chuyển sang project mới (project cũ vẫn được lưu).\n\n` +
            `Bạn có muốn tiếp tục?`
        );

        if (!confirmed) {
            return;
        }
    }

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
    const scriptId = document.getElementById('newProjectScriptId').value.trim() || 'default_script';
    const clearForm = document.getElementById('clearFormData').checked;

    if (!projectName) {
        showNotification('Vui lòng nhập tên project', 'error');
        return;
    }

    try {
        // Check if project name already exists
        try {
            const existingProject = await loadProjectByName(projectName);
            if (existingProject) {
                showNotification('Tên project đã tồn tại. Vui lòng chọn tên khác.', 'error');
                return;
            }
        } catch (checkError) {
            // If error checking project name, assume it doesn't exist and continue
            console.log('Project name check completed (project does not exist)');
        }

        // Create project with initial script
        const scriptData = clearForm ? getDefaultScriptData() : collectCurrentScriptData();

        // Ensure script data has required fields
        const completeScriptData = {
            defaultAdUnitData: scriptData.defaultAdUnitData || {
                interstitialId: '',
                rewardedVideoId: '',
                bannerId: '',
                aoaId: ''
            },
            bidfloorConfig: scriptData.bidfloorConfig || {
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

        const projectData = {
            name: projectName,
            data: {
                scripts: [
                    {
                        scriptId: scriptId,
                        name: scriptId === 'default_script' ? 'Default' : `Script ${scriptId}`,
                        data: completeScriptData
                    }
                ]
            }
        };

        // Force create new project (not update existing)
        const response = await api.createProject(projectData);

        if (!response.success) {
            throw new Error(response.message || 'Failed to create project');
        }

        const savedProject = response.data;

        // Update state
        AppState.currentProject = savedProject;
        AppState.currentScriptId = scriptId;
        AppState.currentScript = savedProject.data.scripts[0];

        // Update UI
        updateProjectNameDisplay(projectName);
        updateProjectStatus();

        try {
            await loadProjectScripts();

            // After loading scripts, ensure we're on the created script
            if (AppState.currentScriptId === scriptId) {
                const selector = document.getElementById('currentScriptSelector');
                if (selector) {
                    selector.value = scriptId;
                }
                showDataConfiguration();
                console.log(`✅ Auto-selected created script: ${scriptId}`);
            }
        } catch (scriptsError) {
            console.error('Error loading project scripts:', scriptsError);
            // Don't throw error, just log it
        }

        // Clear form if requested
        if (clearForm) {
            try {
                clearFormData();
                populateFormWithScriptData(getDefaultScriptData());
                console.log('✅ Form cleared and populated with default data');
            } catch (formError) {
                console.error('Error populating form:', formError);
                // Don't throw error, just log it
            }
        } else {
            // If not clearing form, still populate with current script data
            try {
                populateFormWithScriptData(savedProject.data.scripts[0].data);
                console.log('✅ Form populated with current script data');
            } catch (formError) {
                console.error('Error populating form with current data:', formError);
            }
        }

        // Close modal
        closeModal('createProjectModal');

        showNotification(`✅ Đã tạo project mới: ${projectName}`, 'success');
        console.log(`🎉 Created new project: ${projectName} (ID: ${savedProject.id})`);

    } catch (error) {
        console.error('Error creating project:', error);
        console.error('Error details:', error.message, error.stack);
        showNotification(`Lỗi khi tạo project: ${error.message}`, 'error');
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
    AppState.currentScript = null;
    AppState.currentScriptId = null;
    updateProjectStatus();
    updateCurrentScriptInfo();
    updateProjectNameDisplay();
    showNotification('Đã xóa dữ liệu', 'success');
}

/**
 * Clear form data (renamed from clearForm for clarity)
 */
function clearFormData() {
    try {
        // Clear all text inputs except script ID
        const adDataInputs = document.querySelectorAll('#adDataForm input[type="text"]:not(#scriptId), #adDataForm textarea');
        adDataInputs.forEach(input => {
            input.value = '';
            input.classList.remove('validation-success', 'validation-error');
        });

        // Reset numeric inputs to default values
        const setElementValueSafe = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            } else {
                console.warn(`Element with id '${id}' not found in clearFormData`);
            }
        };

        setElementValueSafe('interstitialLoadCount', 3);
        setElementValueSafe('interstitialAutoReloadInterval', 99999);
        setElementValueSafe('rewardedLoadCount', 3);
        setElementValueSafe('rewardedAutoReloadInterval', 99999);

        // Reset checkboxes
        const setCheckboxSafe = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = value;
            } else {
                console.warn(`Checkbox with id '${id}' not found in clearFormData`);
            }
        };

        setCheckboxSafe('interstitialAutoRetry', false);
        setCheckboxSafe('rewardedAutoRetry', false);

        // Clear bidfloor ID arrays
        clearBidfloorIds('interstitial');
        clearBidfloorIds('rewarded');

        // Clear JSON output
        setElementValueSafe('jsonOutput', '');

    } catch (error) {
        console.error('Error clearing form data:', error);
        throw error; // Re-throw to be caught by caller
    }
}

/**
 * Show project list modal with search and pagination
 */
async function showProjectList() {
    openModal('projectListModal');

    // Reset state
    currentPage = 1;
    searchQuery = '';

    // Setup search listener
    setupProjectSearch();

    try {
        const projects = await loadProjects();
        allProjects = projects;
        filteredProjects = [...projects];
        renderProjectListWithPagination();
    } catch (error) {
        console.error('Error loading project list:', error);
        document.getElementById('projectList').innerHTML =
            '<div class="loading-projects">Lỗi khi tải danh sách projects</div>';
    }
}

/**
 * Show rename project modal
 */
function showRenameProjectModal() {
    if (!AppState.currentProject) {
        showNotification('Vui lòng chọn project để đổi tên', 'warning');
        return;
    }

    // Populate current project name
    document.getElementById('currentProjectNameDisplay').value = AppState.currentProject.name;
    document.getElementById('newProjectNameInput').value = '';

    openModal('renameProjectModal');

    // Focus on new name input and setup keyboard shortcuts
    setTimeout(() => {
        const input = document.getElementById('newProjectNameInput');
        input.focus();

        // Add Enter key handler
        input.onkeydown = function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                processRenameProject();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeModal('renameProjectModal');
            }
        };
    }, 100);
}

/**
 * Validate rename input
 */
function validateRenameInput() {
    const input = document.getElementById('newProjectNameInput');
    const message = document.getElementById('renameValidationMessage');
    const value = input.value.trim();

    if (!value) {
        message.style.display = 'none';
        return false;
    }

    if (value === AppState.currentProject.name) {
        message.textContent = 'Tên mới phải khác tên hiện tại';
        message.className = 'validation-message validation-error';
        message.style.display = 'block';
        return false;
    }

    if (value.length > 100) {
        message.textContent = 'Tên project không được quá 100 ký tự';
        message.className = 'validation-message validation-error';
        message.style.display = 'block';
        return false;
    }

    message.textContent = 'Tên project hợp lệ';
    message.className = 'validation-message validation-success';
    message.style.display = 'block';
    return true;
}

/**
 * Process rename project
 */
async function processRenameProject() {
    try {
        const newName = document.getElementById('newProjectNameInput').value.trim();

        // Validate input
        if (!validateRenameInput()) {
            showNotification('Vui lòng sửa lỗi validation trước khi đổi tên', 'warning');
            return;
        }

        // Show confirmation
        const confirmed = confirm(`Bạn có chắc chắn muốn đổi tên project từ "${AppState.currentProject.name}" thành "${newName}"?`);
        if (!confirmed) {
            return;
        }

        // Update project name via API
        const response = await api.updateProject(AppState.currentProject.id, {
            name: newName
        });

        if (response.success) {
            // Update local state
            const oldName = AppState.currentProject.name;
            AppState.currentProject.name = newName;

            // Update UI
            updateProjectNameDisplay(newName);
            updateProjectStatus();

            closeModal('renameProjectModal');
            showNotification(`Đã đổi tên project từ "${oldName}" thành "${newName}"`, 'success');
        }

    } catch (error) {
        console.error('Error renaming project:', error);
        if (error.message.includes('already exists')) {
            showNotification('Tên project đã tồn tại. Vui lòng chọn tên khác.', 'error');
        } else {
            showNotification('Lỗi khi đổi tên project', 'error');
        }
    }
}

/**
 * Load project from list
 */
async function loadProjectFromList(projectId) {
    try {
        console.log(`🔄 Loading project from list: ${projectId}`);

        const response = await api.getProjectById(projectId);

        if (response.success) {
            console.log(`📋 Loaded project: ${response.data.name}`);

            // Clear all current state before loading new project
            clearProjectState();

            // Set new project and populate
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
        console.log('❌ No current project to load scripts for');
        return;
    }

    try {
        console.log(`🔄 Loading scripts for project: ${AppState.currentProject.name} (${AppState.currentProject.id})`);
        const response = await api.getProjectScripts(AppState.currentProject.id);

        if (response.success) {
            const scripts = response.data.scripts || [];
            console.log(`📋 Found ${scripts.length} scripts:`, scripts.map(s => `${s.name} (${s.scriptId})`));

            updateScriptSelector(scripts);

            // Always clear form data when loading project scripts to avoid data from previous project
            clearFormData();

            // Check if we already have a current script (e.g., from creating new project)
            if (AppState.currentScriptId && AppState.currentScript) {
                // Keep the current script, just update UI and populate with correct data
                const selector = document.getElementById('currentScriptSelector');
                if (selector) {
                    selector.value = AppState.currentScriptId;
                }
                updateCurrentScriptInfo();
                populateFormWithScriptData(AppState.currentScript.data);
                updateScriptButtonStates();
                showDataConfiguration();
                markClean(); // Mark as clean since we just loaded fresh data
                console.log(`✅ Keeping current script: ${AppState.currentScript.name}`);
            } else {
                // Auto-select 'default_script' script if it exists
                const defaultScript = scripts.find(script => script.scriptId === 'default_script');
                if (defaultScript) {
                    console.log(`🎯 Auto-selecting default script: ${defaultScript.name}`);

                    // Set the selector value
                    const selector = document.getElementById('currentScriptSelector');
                    if (selector) {
                        selector.value = 'default_script';
                    }

                    // Load the default script
                    AppState.currentScriptId = 'default_script';
                    AppState.currentScript = defaultScript;
                    updateCurrentScriptInfo();
                    populateFormWithScriptData(defaultScript.data);
                    updateScriptButtonStates();
                    showDataConfiguration();
                    markClean(); // Mark as clean when auto-loading script

                    console.log(`✅ Auto-loaded default script successfully`);
                } else {
                    // No default script - let user choose
                    AppState.currentScriptId = null;
                    AppState.currentScript = null;
                    clearFormData();
                    updateCurrentScriptInfo();
                    hideDataConfiguration();

                    console.log(`✅ Loaded ${scripts.length} scripts. User needs to select a script.`);
                }
            }
        } else {
            console.error('❌ Failed to load project scripts:', response.message);
        }
    } catch (error) {
        console.error('❌ Error loading project scripts:', error);
    }
}

/**
 * Update script selector dropdown
 */
function updateScriptSelector(scripts) {
    const selector = document.getElementById('currentScriptSelector');
    if (!selector) {
        console.error('❌ Script selector element not found');
        return;
    }

    // Clear existing options
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
        console.log(`🎯 Set selector to current script: ${AppState.currentScriptId}`);
    }

    // Enable/disable script management buttons
    const editBtn = document.getElementById('editScriptBtn');
    const deleteBtn = document.getElementById('deleteScriptBtn');

    if (editBtn) editBtn.disabled = scripts.length === 0;
    if (deleteBtn) deleteBtn.disabled = scripts.length === 0;

    console.log(`📋 Updated script selector with ${scripts.length} scripts`);
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
        hideDataConfiguration();
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
            showDataConfiguration();

            // Mark as clean when switching to a script
            markClean();
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
    const noScriptDiv = document.getElementById('noScriptSelected');
    const nameSpan = document.getElementById('currentScriptName');
    const idSpan = document.getElementById('currentScriptId');
    const statusSpan = document.getElementById('currentScriptStatus');

    if (AppState.currentScript) {
        infoDiv.style.display = 'block';
        if (noScriptDiv) noScriptDiv.style.display = 'none';

        nameSpan.textContent = AppState.currentScript.name;
        idSpan.textContent = AppState.currentScript.scriptId;

        // Check if script has data
        const hasData = AppState.currentScript.data &&
                       (AppState.currentScript.data.defaultAdUnitData || AppState.currentScript.data.bidfloorConfig);
        statusSpan.textContent = hasData ? 'Có dữ liệu' : 'Chưa có dữ liệu';
        statusSpan.className = hasData ? 'status-success' : 'status-warning';
    } else {
        infoDiv.style.display = 'none';
        if (noScriptDiv) noScriptDiv.style.display = 'block';
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
            const scriptId = formData.get('scriptId').trim() || 'default_script';
            const name = formData.get('name').trim() || (scriptId === 'default_script' ? 'Default' : `Script ${scriptId}`);
            const copyCurrentData = document.getElementById('copyCurrentData').checked;

            if (!scriptId || !name) {
                showNotification('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            try {
                // Check if script ID already exists in current project
                const currentScripts = await api.getProjectScripts(AppState.currentProject.id);
                if (currentScripts.success) {
                    const existingScript = currentScripts.data.scripts.find(s => s.scriptId === scriptId);
                    if (existingScript) {
                        showNotification(`Script ID "${scriptId}" đã tồn tại trong project này`, 'error');
                        return;
                    }
                }

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

                    // Force reload project scripts with cache busting
                    console.log('🔄 Reloading project scripts after adding new script...');
                    await loadProjectScripts();

                    // Switch to new script
                    AppState.currentScriptId = scriptId;
                    const selector = document.getElementById('currentScriptSelector');
                    selector.value = scriptId;
                    await switchScript();

                    // Force update UI
                    updateCurrentScriptInfo();

                    showNotification(`Đã thêm script "${name}" thành công`, 'success');
                    console.log(`✅ Script "${name}" (${scriptId}) added successfully`);
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

    try {
        // Populate DefaultAdUnitData
        const defaultData = scriptData.defaultAdUnitData || {};

        const setElementValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        };

        setElementValue('interstitialId', defaultData.interstitialId);
        setElementValue('rewardedVideoId', defaultData.rewardedVideoId);
        setElementValue('bannerId', defaultData.bannerId);
        setElementValue('aoaId', defaultData.aoaId);

        // Populate BidfloorConfig
        const bidfloorConfig = scriptData.bidfloorConfig || {};

        // Interstitial
        const interstitial = bidfloorConfig.interstitial || {};
        setElementValue('interstitialDefaultId', interstitial.defaultId);
        setElementValue('interstitialLoadCount', interstitial.loadCount || 3);
        setElementValue('interstitialAutoReloadInterval', interstitial.autoReloadInterval || 99999);

        const autoRetryElement = document.getElementById('interstitialAutoRetry');
        if (autoRetryElement) {
            autoRetryElement.checked = interstitial.autoRetry || false;
        }

        // Populate bidfloor IDs
        const bidfloorIds = interstitial.bidfloorIds || [];
        bidfloorIds.forEach((id, index) => {
            setElementValue(`interstitialBidfloorId${index + 1}`, id);
        });

        // Rewarded
        const rewarded = bidfloorConfig.rewarded || {};
        setElementValue('rewardedDefaultId', rewarded.defaultId);
        setElementValue('rewardedLoadCount', rewarded.loadCount || 3);
        setElementValue('rewardedAutoReloadInterval', rewarded.autoReloadInterval || 99999);

        const rewardedAutoRetryElement = document.getElementById('rewardedAutoRetry');
        if (rewardedAutoRetryElement) {
            rewardedAutoRetryElement.checked = rewarded.autoRetry || false;
        }

        // Populate rewarded bidfloor IDs
        const rewardedBidfloorIds = rewarded.bidfloorIds || [];
        rewardedBidfloorIds.forEach((id, index) => {
            setElementValue(`rewardedBidfloorId${index + 1}`, id);
        });

        // Banner
        const banner = bidfloorConfig.banner || {};
        setElementValue('bidfloorBanner', banner.bidfloorBanner);

    } catch (error) {
        console.error('Error populating form with script data:', error);
        throw error; // Re-throw to be caught by caller
    }
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
        // Validate form before generating JSON
        const isValid = validateEntireForm();
        if (!isValid) {
            showNotification('❌ Không thể tạo JSON: Có lỗi validation. Vui lòng sửa các lỗi trước.', 'error');
            return;
        }

        const formData = collectFormData();
        const jsonOutput = JSON.stringify(formData.data, null, 2);

        document.getElementById('jsonOutput').value = jsonOutput;
        showNotification('✅ JSON đã được tạo thành công', 'success');
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
 * Download JSON file with project_name_script_name format
 */
function downloadJSON() {
    const jsonOutput = document.getElementById('jsonOutput');

    if (!jsonOutput.value) {
        generateJSON();
    }

    // Generate filename with project_name_script_name format
    const projectName = AppState.currentProject?.name || 'project';
    const scriptName = AppState.currentScript?.name || 'script';

    // Sanitize names for filename (remove special characters)
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedScriptName = scriptName.replace(/[^a-zA-Z0-9_-]/g, '_');

    const filename = `${sanitizedProjectName}_${sanitizedScriptName}.json`;

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
 * Setup project search functionality
 */
function setupProjectSearch() {
    const searchInput = document.getElementById('projectSearchInput');
    if (searchInput) {
        // Clear previous listeners
        searchInput.removeEventListener('input', handleProjectSearch);

        // Add new listener with debouncing
        searchInput.addEventListener('input', Utils.debounce(handleProjectSearch, 300));
        searchInput.value = searchQuery;
    }
}

/**
 * Handle project search
 */
function handleProjectSearch() {
    const searchInput = document.getElementById('projectSearchInput');
    searchQuery = searchInput.value.toLowerCase().trim();

    // Filter projects based on search query
    if (searchQuery === '') {
        filteredProjects = [...allProjects];
    } else {
        filteredProjects = allProjects.filter(project =>
            project.name.toLowerCase().includes(searchQuery) ||
            (project.description && project.description.toLowerCase().includes(searchQuery))
        );
    }

    // Reset to first page
    currentPage = 1;

    // Re-render with new filter
    renderProjectListWithPagination();
}

/**
 * Clear project search
 */
function clearProjectSearch() {
    const searchInput = document.getElementById('projectSearchInput');
    if (searchInput) {
        searchInput.value = '';
        searchQuery = '';
        filteredProjects = [...allProjects];
        currentPage = 1;
        renderProjectListWithPagination();
    }
}

/**
 * Sort projects
 */
function sortProjects() {
    const sortSelect = document.getElementById('projectSortBy');
    sortBy = sortSelect.value;

    filteredProjects.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'createdAt':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'updatedAt':
            default:
                return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
    });

    currentPage = 1;
    renderProjectListWithPagination();
}

/**
 * Change page size
 */
function changePageSize() {
    const pageSizeSelect = document.getElementById('projectPageSize');
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1;
    renderProjectListWithPagination();
}

/**
 * Navigate to previous page
 */
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderProjectListWithPagination();
    }
}

/**
 * Navigate to next page
 */
function nextPage() {
    const totalPages = Math.ceil(filteredProjects.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderProjectListWithPagination();
    }
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredProjects.length / pageSize);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderProjectListWithPagination();
    }
}

/**
 * Render project list with pagination
 */
function renderProjectListWithPagination() {
    const projectListDiv = document.getElementById('projectList');
    const paginationDiv = document.getElementById('projectPagination');

    if (!projectListDiv) return;

    // Calculate pagination
    const totalProjects = filteredProjects.length;
    const totalPages = Math.ceil(totalProjects / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalProjects);
    const currentPageProjects = filteredProjects.slice(startIndex, endIndex);

    // Render projects
    if (currentPageProjects.length === 0) {
        projectListDiv.innerHTML = searchQuery
            ? '<div class="no-projects">🔍 Không tìm thấy project nào phù hợp</div>'
            : '<div class="no-projects">📂 Chưa có project nào</div>';
    } else {
        projectListDiv.innerHTML = currentPageProjects.map(project => `
            <div class="project-item" onclick="loadProjectFromList('${project.id}')">
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-meta">
                        <span>📅 Cập nhật: ${Utils.formatDate(project.updatedAt)}</span>
                        <span>🆕 Tạo: ${Utils.formatDate(project.createdAt)}</span>
                        <span>🔧 ID: ${project.id.substring(0, 8)}...</span>
                    </div>
                </div>
                <div class="project-actions">
                    <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProjectFromList('${project.id}', '${project.name}')" title="Xóa project">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render pagination
    if (paginationDiv) {
        if (totalPages <= 1) {
            paginationDiv.style.display = 'none';
        } else {
            paginationDiv.style.display = 'flex';
            renderPagination(totalProjects, totalPages, startIndex, endIndex);
        }
    }
}

/**
 * Render pagination controls
 */
function renderPagination(totalProjects, totalPages, startIndex, endIndex) {
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    // Update info
    if (paginationInfo) {
        const searchText = searchQuery ? ` (tìm kiếm: "${searchQuery}")` : '';
        paginationInfo.textContent = `Hiển thị ${startIndex + 1}-${endIndex} của ${totalProjects} projects${searchText}`;
    }

    // Update buttons
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }

    // Render page numbers
    if (pageNumbers) {
        const pageNumbersHtml = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            pageNumbersHtml.push(`<span class="page-number" onclick="goToPage(1)">1</span>`);
            if (startPage > 2) {
                pageNumbersHtml.push(`<span class="page-number disabled">...</span>`);
            }
        }

        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            pageNumbersHtml.push(`<span class="page-number ${activeClass}" onclick="goToPage(${i})">${i}</span>`);
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbersHtml.push(`<span class="page-number disabled">...</span>`);
            }
            pageNumbersHtml.push(`<span class="page-number" onclick="goToPage(${totalPages})">${totalPages}</span>`);
        }

        pageNumbers.innerHTML = pageNumbersHtml.join('');
    }
}



// Duplicate function removed - using the one above with validation

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

// Duplicate function removed - using enhanced version above

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

/**
 * Setup auto-save event listeners
 */
function setupAutoSave() {
    const form = document.getElementById('adDataForm');
    if (!form) return;

    // Add event listeners for form changes
    form.addEventListener('input', (e) => {
        // Skip if it's the script selector or project name
        if (e.target.id === 'currentScriptSelector' || e.target.id === 'projectNameText') {
            return;
        }
        markDirty();
    });

    form.addEventListener('change', (e) => {
        // Skip if it's the script selector or project name
        if (e.target.id === 'currentScriptSelector' || e.target.id === 'projectNameText') {
            return;
        }
        markDirty();
    });

    // Add listeners for specific input types
    const textInputs = form.querySelectorAll('input[type="text"], input[type="number"], textarea');
    textInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.id !== 'currentScriptSelector' && input.id !== 'projectNameText') {
                markDirty();
            }
        });
    });

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            markDirty();
        });
    });

    // Prevent data loss on page unload
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            e.preventDefault();
            return 'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?';
        }
    });

    console.log('✅ Auto-save event listeners setup complete');
}

/**
 * Clear all Ad Unit IDs
 */
function clearAllAdIds() {
    const adIdInputs = ['interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId'];

    adIdInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = '';
            input.classList.remove('valid', 'invalid');
        }
    });

    markDirty();
    showNotification('🧹 Đã xóa tất cả Ad Unit IDs', 'info', 2000);
}

/**
 * Generate sample Ad Unit IDs
 */
function generateSampleAdIds() {
    const generateId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const adIdInputs = [
        { id: 'interstitialId', prefix: 'int' },
        { id: 'rewardedVideoId', prefix: 'rew' },
        { id: 'bannerId', prefix: 'ban' },
        { id: 'aoaId', prefix: 'aoa' }
    ];

    adIdInputs.forEach(({ id, prefix }) => {
        const input = document.getElementById(id);
        if (input) {
            // Generate ID with prefix for easier identification
            const randomPart = generateId().substring(3); // 13 chars
            const sampleId = prefix + randomPart; // 16 chars total
            input.value = sampleId;
            validateAdId(input);
        }
    });

    markDirty();
    showNotification('🎲 Đã tạo sample Ad Unit IDs', 'success', 2000);
}

/**
 * Validate all Ad Unit IDs
 */
function validateAllAdIds() {
    const adIdInputs = ['interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId'];
    let allValid = true;
    let validCount = 0;

    adIdInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value.trim()) {
            const isValid = validateAdId(input);
            if (isValid) {
                validCount++;
            } else {
                allValid = false;
            }
        }
    });

    if (allValid && validCount > 0) {
        showNotification(`✅ Tất cả ${validCount} Ad Unit IDs đều hợp lệ`, 'success', 3000);
    } else if (validCount === 0) {
        showNotification('ℹ️ Chưa có Ad Unit ID nào để validate', 'info', 2000);
    } else {
        showNotification(`⚠️ Có ${validCount} IDs hợp lệ, vui lòng kiểm tra lại các IDs khác`, 'warning', 4000);
    }
}

/**
 * Clear all Bidfloor IDs
 */
function clearAllBidfloorIds() {
    const bidfloorInputs = [
        'interstitialDefaultId',
        'rewardedDefaultId',
        'bidfloorBanner'
    ];

    // Clear default IDs
    bidfloorInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = '';
            input.classList.remove('valid', 'invalid');
        }
    });

    // Clear bidfloor ID arrays
    ['interstitial', 'rewarded'].forEach(type => {
        const container = document.getElementById(`${type}BidfloorIds`);
        if (container) {
            const arrayInput = container.querySelector('.array-input');
            if (arrayInput) {
                // Keep only the first row and clear its value
                const rows = arrayInput.querySelectorAll('.array-input-row');
                rows.forEach((row, index) => {
                    if (index === 0) {
                        const input = row.querySelector('input');
                        if (input) {
                            input.value = '';
                            input.classList.remove('valid', 'invalid');
                        }
                    } else {
                        row.remove();
                    }
                });
            }
        }
    });

    markDirty();
    showNotification('🧹 Đã xóa tất cả Bidfloor IDs', 'info', 2000);
}

/**
 * Generate sample Bidfloor IDs
 */
function generateSampleBidfloorIds() {
    const generateId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const bidfloorInputs = [
        { id: 'interstitialDefaultId', prefix: 'bid' },
        { id: 'rewardedDefaultId', prefix: 'rew' },
        { id: 'bidfloorBanner', prefix: 'ban' }
    ];

    // Generate default IDs
    bidfloorInputs.forEach(({ id, prefix }) => {
        const input = document.getElementById(id);
        if (input) {
            const randomPart = generateId().substring(3);
            const sampleId = prefix + randomPart;
            input.value = sampleId;
            validateAdId(input);
        }
    });

    // Generate sample bidfloor arrays
    ['interstitial', 'rewarded'].forEach(type => {
        const container = document.getElementById(`${type}BidfloorIds`);
        if (container) {
            const firstInput = container.querySelector('input');
            if (firstInput) {
                const randomPart = generateId().substring(3);
                const sampleId = type.substring(0, 3) + randomPart;
                firstInput.value = sampleId;
                validateAdId(firstInput);
            }
        }
    });

    markDirty();
    showNotification('🎲 Đã tạo sample Bidfloor IDs', 'success', 2000);
}

/**
 * Validate all Bidfloor IDs
 */
function validateAllBidfloorIds() {
    const bidfloorInputs = [
        'interstitialDefaultId',
        'rewardedDefaultId',
        'bidfloorBanner'
    ];

    let allValid = true;
    let validCount = 0;

    // Validate default IDs
    bidfloorInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value.trim()) {
            const isValid = validateAdId(input);
            if (isValid) {
                validCount++;
            } else {
                allValid = false;
            }
        }
    });

    // Validate bidfloor arrays
    ['interstitial', 'rewarded'].forEach(type => {
        const container = document.getElementById(`${type}BidfloorIds`);
        if (container) {
            const inputs = container.querySelectorAll('input[maxlength="16"]');
            inputs.forEach(input => {
                if (input.value.trim()) {
                    const isValid = validateAdId(input);
                    if (isValid) {
                        validCount++;
                    } else {
                        allValid = false;
                    }
                }
            });
        }
    });

    if (allValid && validCount > 0) {
        showNotification(`✅ Tất cả ${validCount} Bidfloor IDs đều hợp lệ`, 'success', 3000);
    } else if (validCount === 0) {
        showNotification('ℹ️ Chưa có Bidfloor ID nào để validate', 'info', 2000);
    } else {
        showNotification(`⚠️ Có ${validCount} IDs hợp lệ, vui lòng kiểm tra lại các IDs khác`, 'warning', 4000);
    }
}

// Initialize auto-save when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupAutoSave();
    hideDataConfiguration(); // Hide data configuration on page load
    updateAutoSaveToggleButton(); // Setup auto-save toggle button
});
