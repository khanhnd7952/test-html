// Configuration constants for the dynamic web app
const CONFIG = {
    // API endpoints
    API_BASE: '/api',
    ENDPOINTS: {
        PROJECTS: '/api/projects',
        SCRIPT_IDS: '/api/projects/script-ids',
        PROJECT_BY_ID: (id) => `/api/projects/${id}`,
        PROJECT_BY_NAME: (name) => `/api/projects/by-name/${encodeURIComponent(name)}`
    },
    
    // Validation
    AD_ID_LENGTH: 16,
    AD_ID_PATTERN: /^[a-z0-9]{16}$/,
    
    // Default values
    DEFAULT_VALUES: {
        LOAD_COUNT: 3,
        AUTO_RELOAD_INTERVAL: 99999,
        AUTO_RETRY: false
    },
    
    // UI settings
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    TOAST_DURATION: 5000,
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
    
    // Local storage keys
    STORAGE_KEYS: {
        CURRENT_PROJECT: 'currentProject',
        FORM_DATA: 'formData',
        USER_PREFERENCES: 'userPreferences'
    },
    
    // Validation messages
    MESSAGES: {
        VALIDATION: {
            REQUIRED: 'Trường này là bắt buộc',
            AD_ID_FORMAT: 'Ad ID phải có đúng 16 ký tự (a-z, 0-9)',
            PROJECT_NAME_LENGTH: 'Tên project phải từ 1-100 ký tự',
            SCRIPT_ID_LENGTH: 'Script ID không được quá 50 ký tự',
            DESCRIPTION_LENGTH: 'Mô tả không được quá 500 ký tự'
        },
        SUCCESS: {
            PROJECT_SAVED: 'Project đã được lưu thành công',
            PROJECT_DELETED: 'Project đã được xóa thành công',
            PROJECT_DUPLICATED: 'Project đã được nhân bản thành công',
            DATA_IMPORTED: 'Dữ liệu đã được import thành công',
            JSON_COPIED: 'JSON đã được copy vào clipboard'
        },
        ERROR: {
            NETWORK: 'Lỗi kết nối mạng. Vui lòng thử lại.',
            PROJECT_NOT_FOUND: 'Không tìm thấy project',
            PROJECT_EXISTS: 'Tên project đã tồn tại',
            INVALID_JSON: 'Dữ liệu JSON không hợp lệ',
            SAVE_FAILED: 'Lưu project thất bại',
            DELETE_FAILED: 'Xóa project thất bại',
            LOAD_FAILED: 'Tải project thất bại'
        }
    }
};

// Global state management
const AppState = {
    currentProject: null,
    projects: [],
    isLoading: false
};

// Utility functions
const Utils = {
    /**
     * Debounce function to limit function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Validate Ad ID format
     */
    isValidAdId(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        const trimmedId = id.trim();
        if (trimmedId === '') {
            return false;
        }
        return CONFIG.AD_ID_PATTERN.test(trimmedId);
    },

    /**
     * Sanitize string input
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return !obj || Object.keys(obj).length === 0;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, AppState, Utils };
}
