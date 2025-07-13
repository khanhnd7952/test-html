// API service for communicating with the backend
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE;
    }

    /**
     * Make HTTP request with error handling
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            showLoading(true);
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.statusText = response.statusText;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        } finally {
            showLoading(false);
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.toString());
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // Project-specific API methods

    /**
     * Get all projects (simplified)
     */
    async getProjects() {
        return this.get(CONFIG.ENDPOINTS.PROJECTS);
    }

    /**
     * Get project by ID
     */
    async getProjectById(id) {
        return this.get(CONFIG.ENDPOINTS.PROJECT_BY_ID(id));
    }

    /**
     * Get project by name
     */
    async getProjectByName(name) {
        return this.get(CONFIG.ENDPOINTS.PROJECT_BY_NAME(name));
    }

    /**
     * Get all unique script IDs
     */
    async getScriptIds() {
        return this.get(CONFIG.ENDPOINTS.SCRIPT_IDS);
    }

    /**
     * Get all scripts from a project
     */
    async getProjectScripts(projectId) {
        return this.get(`${CONFIG.ENDPOINTS.PROJECTS}/${projectId}/scripts`);
    }

    /**
     * Get specific script from project
     */
    async getProjectScript(projectId, scriptId) {
        return this.get(`${CONFIG.ENDPOINTS.PROJECTS}/${projectId}/scripts/${scriptId}`);
    }

    /**
     * Add script to project
     */
    async addProjectScript(projectId, scriptData) {
        return this.post(`${CONFIG.ENDPOINTS.PROJECTS}/${projectId}/scripts`, scriptData);
    }

    /**
     * Update script in project
     */
    async updateProjectScript(projectId, scriptId, scriptData) {
        return this.put(`${CONFIG.ENDPOINTS.PROJECTS}/${projectId}/scripts/${scriptId}`, scriptData);
    }

    /**
     * Delete script from project
     */
    async deleteProjectScript(projectId, scriptId) {
        return this.delete(`${CONFIG.ENDPOINTS.PROJECTS}/${projectId}/scripts/${scriptId}`);
    }

    /**
     * Create new project
     */
    async createProject(projectData) {
        return this.post(CONFIG.ENDPOINTS.PROJECTS, projectData);
    }

    /**
     * Update existing project
     */
    async updateProject(id, projectData) {
        return this.put(CONFIG.ENDPOINTS.PROJECT_BY_ID(id), projectData);
    }

    /**
     * Delete project
     */
    async deleteProject(id) {
        return this.delete(CONFIG.ENDPOINTS.PROJECT_BY_ID(id));
    }
}

// Create global API instance
const api = new ApiService();

// Project management functions

/**
 * Load all projects for the project list (simplified)
 */
async function loadProjects() {
    try {
        const response = await api.get(CONFIG.ENDPOINTS.PROJECTS);

        if (response.success) {
            AppState.projects = response.data;
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to load projects');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification(CONFIG.MESSAGES.ERROR.LOAD_FAILED, 'error');
        throw error;
    }
}

/**
 * Load project by name
 */
async function loadProjectByName(name) {
    try {
        const response = await api.getProjectByName(name);

        if (response.success) {
            AppState.currentProject = response.data;
            return response.data;
        } else {
            throw new Error(response.message || 'Project not found');
        }
    } catch (error) {
        // Check if it's a 404 error (project not found)
        if (error.status === 404 || error.message.includes('404') || error.message.includes('not found')) {
            return null; // Project doesn't exist yet
        }

        console.error('Error loading project by name:', error);
        showNotification(CONFIG.MESSAGES.ERROR.LOAD_FAILED, 'error');
        throw error;
    }
}

/**
 * Save current project
 */
async function saveProject(projectData) {
    try {
        let response;
        
        if (AppState.currentProject && AppState.currentProject.id) {
            // Update existing project
            response = await api.updateProject(AppState.currentProject.id, projectData);
        } else {
            // Create new project
            response = await api.createProject(projectData);
        }
        
        if (response.success) {
            AppState.currentProject = response.data;
            showNotification(CONFIG.MESSAGES.SUCCESS.PROJECT_SAVED, 'success');
            updateProjectStatus();
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        
        if (error.message.includes('already exists') || error.message.includes('409')) {
            showNotification(CONFIG.MESSAGES.ERROR.PROJECT_EXISTS, 'error');
        } else {
            showNotification(CONFIG.MESSAGES.ERROR.SAVE_FAILED, 'error');
        }
        throw error;
    }
}

/**
 * Delete project
 */
async function deleteProject(id) {
    try {
        const response = await api.deleteProject(id);
        
        if (response.success) {
            if (AppState.currentProject && AppState.currentProject.id === id) {
                AppState.currentProject = null;
                clearForm();
                updateProjectStatus();
            }
            showNotification(CONFIG.MESSAGES.SUCCESS.PROJECT_DELETED, 'success');
            return true;
        } else {
            throw new Error(response.message || 'Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification(CONFIG.MESSAGES.ERROR.DELETE_FAILED, 'error');
        throw error;
    }
}


