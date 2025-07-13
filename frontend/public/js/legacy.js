// AdData JSON Serializer Tool - Production Version

/**
 * Configuration constants
 */
const CONFIG = {
    STORAGE_KEY: 'adDataProjects',
    AD_ID_LENGTH: 16,
    AD_ID_PATTERN: /^[a-z0-9]{16}$/,
    DEFAULT_VALUES: {
        LOAD_COUNT: 3,
        AUTO_RELOAD_INTERVAL: 99999,
        AUTO_RETRY: false
    },
    ANIMATION_DURATION: 300
};

/**
 * Utility functions
 */
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
     * Validate Ad ID format
     */
    isValidAdId(id) {
        // Kiểm tra null, undefined, hoặc chuỗi rỗng
        if (!id || typeof id !== 'string') {
            return false;
        }

        // Trim và kiểm tra lại
        const trimmedId = id.trim();
        if (trimmedId === '') {
            return false;
        }

        // Kiểm tra pattern
        return CONFIG.AD_ID_PATTERN.test(trimmedId);
    },

    /**
     * Validate Ad ID with detailed error information
     */
    validateAdIdDetailed(id) {
        const result = {
            isValid: false,
            error: null,
            value: id
        };

        // Kiểm tra null, undefined
        if (id === null || id === undefined) {
            result.error = 'ID không được để trống';
            return result;
        }

        // Kiểm tra kiểu dữ liệu
        if (typeof id !== 'string') {
            result.error = 'ID phải là chuỗi ký tự';
            return result;
        }

        // Trim và kiểm tra chuỗi rỗng
        const trimmedId = id.trim();
        if (trimmedId === '') {
            result.error = 'ID không được để trống';
            return result;
        }

        // Kiểm tra độ dài
        if (trimmedId.length !== CONFIG.AD_ID_LENGTH) {
            result.error = `ID phải có đúng ${CONFIG.AD_ID_LENGTH} ký tự (hiện tại: ${trimmedId.length})`;
            return result;
        }

        // Kiểm tra pattern
        if (!CONFIG.AD_ID_PATTERN.test(trimmedId)) {
            result.error = 'ID chỉ được chứa chữ thường (a-z) và số (0-9)';
            return result;
        }

        result.isValid = true;
        result.value = trimmedId;
        return result;
    },

    /**
     * Show notification message with improved UX
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; margin-left: auto;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * Handle errors with user-friendly messages
     */
    handleError(error, context = '') {
        let userMessage = 'Đã xảy ra lỗi không mong muốn.';

        if (error.name === 'QuotaExceededError') {
            userMessage = 'Bộ nhớ trình duyệt đã đầy. Vui lòng xóa một số projects cũ.';
        } else if (error.name === 'SyntaxError') {
            userMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (error.message) {
            userMessage = error.message;
        }

        this.showNotification(`${context ? context + ': ' : ''}${userMessage}`, 'error', 5000);
    },

    /**
     * Validate form data before processing
     */
    validateFormData(data) {
        const errors = [];

        // Validate required fields
        if (!data.projectName?.trim()) {
            errors.push('Tên project không được để trống');
        }

        // Validate Ad IDs
        const adIdFields = ['interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId',
                           'interstitialDefaultId', 'rewardedDefaultId', 'bidfloorBanner'];

        adIdFields.forEach(field => {
            if (data[field] && !this.isValidAdId(data[field])) {
                errors.push(`${field} không hợp lệ`);
            }
        });

        // Validate bidfloor arrays
        ['interstitialBidfloorIds', 'rewardedBidfloorIds'].forEach(field => {
            if (data[field] && Array.isArray(data[field])) {
                data[field].forEach((id, index) => {
                    if (id && !this.isValidAdId(id)) {
                        errors.push(`${field}[${index}] không hợp lệ`);
                    }
                });
            }
        });

        return errors;
    }
};

// Database Management using localStorage
class ProjectDatabase {
    constructor() {
        this.storageKey = CONFIG.STORAGE_KEY;
        this.currentProject = '';
    }

    /**
     * Get all projects from localStorage
     */
    getAllProjects() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            Utils.showNotification('Lỗi khi tải danh sách projects', 'error');
            return {};
        }
    }

    /**
     * Save project data to localStorage with validation
     */
    saveProject(projectName, data) {
        if (!projectName?.trim()) {
            Utils.showNotification('Tên project không được để trống', 'warning');
            return false;
        }

        const validationErrors = Utils.validateFormData(data);
        if (validationErrors.length > 0) {
            Utils.showNotification(`Dữ liệu không hợp lệ: ${validationErrors.join(', ')}`, 'error', 7000);
            return false;
        }

        try {
            const projects = this.getAllProjects();
            const isNewProject = !projects[projectName];

            projects[projectName] = {
                data: data,
                lastModified: new Date().toISOString(),
                created: projects[projectName]?.created || new Date().toISOString(),
                version: '1.0'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(projects));

            const message = isNewProject
                ? `Project "${projectName}" đã được tạo thành công`
                : `Project "${projectName}" đã được cập nhật thành công`;
            Utils.showNotification(message, 'success');
            return true;
        } catch (error) {
            Utils.handleError(error, 'Lưu project');
            return false;
        }
    }

    /**
     * Load project data from localStorage
     */
    loadProject(projectName) {
        try {
            const projects = this.getAllProjects();
            return projects[projectName]?.data || null;
        } catch (error) {
            Utils.showNotification('Lỗi khi tải project', 'error');
            return null;
        }
    }

    /**
     * Delete project from localStorage
     */
    deleteProject(projectName) {
        try {
            const projects = this.getAllProjects();
            delete projects[projectName];
            localStorage.setItem(this.storageKey, JSON.stringify(projects));
            Utils.showNotification(`Project "${projectName}" đã được xóa`, 'success');
            return true;
        } catch (error) {
            Utils.showNotification('Lỗi khi xóa project', 'error');
            return false;
        }
    }

    /**
     * Get project list with metadata, sorted by last modified
     */
    getProjectList() {
        try {
            const projects = this.getAllProjects();
            return Object.keys(projects).map(name => ({
                name: name,
                lastModified: projects[name].lastModified,
                created: projects[name].created
            })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        } catch (error) {
            return [];
        }
    }

    /**
     * Export project to JSON format
     */
    exportProject(projectName) {
        try {
            const projects = this.getAllProjects();
            const project = projects[projectName];
            if (!project) {
                Utils.showNotification('Project không tồn tại', 'error');
                return null;
            }

            return {
                projectName: projectName,
                exportDate: new Date().toISOString(),
                version: "1.0",
                ...project
            };
        } catch (error) {
            Utils.showNotification('Lỗi khi export project', 'error');
            return null;
        }
    }

    /**
     * Import project from JSON data
     */
    importProject(projectData) {
        try {
            if (!projectData?.projectName || !projectData?.data) {
                Utils.showNotification('Dữ liệu project không hợp lệ', 'error');
                return false;
            }

            const projects = this.getAllProjects();
            projects[projectData.projectName] = {
                data: projectData.data,
                lastModified: new Date().toISOString(),
                created: projectData.created || new Date().toISOString()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(projects));
            Utils.showNotification(`Project "${projectData.projectName}" đã được import thành công`, 'success');
            return true;
        } catch (error) {
            Utils.showNotification('Lỗi khi import project', 'error');
            return false;
        }
    }
}

// Global database instance
const projectDB = new ProjectDatabase();

/**
 * Validation Manager Class
 */
class ValidationManager {
    constructor() {
        this.validators = new Map();
        this.debouncedValidate = Utils.debounce(this.validateField.bind(this), 300);
    }

    /**
     * Validate a specific field
     */
    validateField(input) {
        const value = input.value;
        // Tìm validation message element trong cấu trúc mới
        let messageElement = input.nextElementSibling;

        // Nếu input nằm trong array-input-field, tìm small element
        if (!messageElement || !messageElement.classList.contains('validation-message')) {
            const fieldContainer = input.closest('.array-input-field');
            if (fieldContainer) {
                messageElement = fieldContainer.querySelector('.validation-message');
            } else {
                messageElement = input.nextElementSibling;
            }
        }

        input.classList.remove('input-valid', 'input-invalid');

        // Kiểm tra xem có phải là field bắt buộc không
        const isRequired = this.isRequiredField(input);

        // Nếu field trống
        if (!value || value.trim() === '') {
            if (isRequired) {
                input.classList.add('input-invalid');
                this.showValidationMessage(messageElement, '❌ Trường này không được để trống', 'error');
                return false;
            } else {
                this.showValidationMessage(messageElement, 'Format: 16 ký tự (chữ thường a-z và số 0-9)', 'info');
                return true;
            }
        }

        // Sử dụng validation chi tiết
        const validationResult = Utils.validateAdIdDetailed(value);

        if (validationResult.isValid) {
            input.classList.add('input-valid');
            this.showValidationMessage(messageElement, '✅ ID hợp lệ', 'success');
            return true;
        } else {
            input.classList.add('input-invalid');
            this.showValidationMessage(messageElement, `❌ ${validationResult.error}`, 'error');
            return false;
        }
    }

    /**
     * Check if a field is required
     */
    isRequiredField(input) {
        // Kiểm tra các field bắt buộc dựa trên ID hoặc context
        const fieldId = input.id;
        const requiredFields = [
            'interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId',
            'interstitialDefaultId', 'rewardedDefaultId', 'bidfloorBanner'
        ];

        // Nếu là field chính thì bắt buộc
        if (requiredFields.includes(fieldId)) {
            return true;
        }

        // Nếu là bidfloor ID và có giá trị thì bắt buộc phải hợp lệ
        const isBidfloorField = input.closest('#interstitialBidfloorIds') || input.closest('#rewardedBidfloorIds');
        if (isBidfloorField && input.value.trim() !== '') {
            return true;
        }

        return false;
    }

    /**
     * Show validation message
     */
    showValidationMessage(messageElement, text, type) {
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `validation-message validation-${type}`;
        }
    }

    /**
     * Validate all Ad ID inputs
     */
    validateAllAdIds() {
        const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
        let allValid = true;

        adIdInputs.forEach(input => {
            const value = input.value;
            const isRequired = this.isRequiredField(input);

            // Nếu field bắt buộc và trống
            if (isRequired && (!value || value.trim() === '')) {
                allValid = false;
                return;
            }

            // Nếu có giá trị thì phải hợp lệ
            if (value && value.trim() !== '') {
                const validationResult = Utils.validateAdIdDetailed(value);
                if (!validationResult.isValid) {
                    allValid = false;
                }
            }
        });

        return allValid;
    }

    /**
     * Get invalid Ad IDs with details
     */
    getInvalidAdIds() {
        const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
        const invalidIds = [];

        adIdInputs.forEach(input => {
            const value = input.value;
            const isRequired = this.isRequiredField(input);

            // Lấy tên field
            const label = input.closest('.form-group')?.querySelector('label') ||
                         input.closest('.array-input')?.parentElement?.previousElementSibling?.querySelector('label');
            const fieldName = label ? label.textContent.replace(':', '') : 'Unknown field';

            // Kiểm tra field bắt buộc và trống
            if (isRequired && (!value || value.trim() === '')) {
                invalidIds.push({
                    field: fieldName,
                    value: value || '',
                    error: 'Trường này không được để trống',
                    element: input
                });
                return;
            }

            // Kiểm tra field có giá trị nhưng không hợp lệ
            if (value && value.trim() !== '') {
                const validationResult = Utils.validateAdIdDetailed(value);
                if (!validationResult.isValid) {
                    invalidIds.push({
                        field: fieldName,
                        value: value,
                        error: validationResult.error,
                        element: input
                    });
                }
            }
        });

        return invalidIds;
    }
}

/**
 * Form Manager Class for handling form operations
 */
class FormManager {
    constructor() {
        this.form = null;
        this.isDirty = false;
        this.autoSaveTimeout = null;
        this.init();
    }

    /**
     * Initialize form manager
     */
    init() {
        this.form = document.getElementById('adDataForm');
        if (this.form) {
            this.setupEventListeners();
        }
    }

    /**
     * Setup event listeners for form
     */
    setupEventListeners() {
        this.form.addEventListener('input', () => {
            this.markDirty();
            this.scheduleAutoSave();
        });

        this.form.addEventListener('change', () => {
            this.markDirty();
            this.scheduleAutoSave();
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                return 'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn rời khỏi trang?';
            }
        });
    }

    /**
     * Mark form as dirty (has unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
        this.updateSaveButtonState();
    }

    /**
     * Mark form as clean (saved)
     */
    markClean() {
        this.isDirty = false;
        this.updateSaveButtonState();
    }

    /**
     * Update save button state based on dirty status
     */
    updateSaveButtonState() {
        const saveButtons = document.querySelectorAll('[onclick*="saveCurrentProject"]');
        saveButtons.forEach(button => {
            if (this.isDirty) {
                button.style.background = 'linear-gradient(45deg, #007acc, #0056b3)';
                button.style.animation = 'pulse 2s infinite';
            } else {
                button.style.background = '';
                button.style.animation = '';
            }
        });
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            const projectName = document.getElementById('projectName')?.value?.trim();
            if (projectName) {
                this.autoSave();
            }
        }, 5000); // Auto-save after 5 seconds of inactivity
    }

    /**
     * Auto-save current form data
     */
    autoSave() {
        try {
            const projectName = document.getElementById('projectName')?.value?.trim();
            if (!projectName) return;

            const formData = this.collectFormData();
            if (projectDB.saveProject(projectName, formData)) {
                this.markClean();
                Utils.showNotification('Đã tự động lưu', 'info', 2000);
            }
        } catch (error) {
            Utils.handleError(error, 'Tự động lưu');
        }
    }

    /**
     * Collect all form data
     */
    collectFormData() {
        const data = {};

        // Collect all input values
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.type === 'number') {
                data[input.id] = parseInt(input.value) || 0;
            } else {
                data[input.id] = input.value.trim();
            }
        });

        // Collect bidfloor arrays
        data.interstitialBidfloorIds = this.getBidfloorIds('interstitialBidfloorIds');
        data.rewardedBidfloorIds = this.getBidfloorIds('rewardedBidfloorIds');

        return data;
    }

    /**
     * Get bidfloor IDs from container
     */
    getBidfloorIds(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];

        const inputs = container.querySelectorAll('input[type="text"]');
        return Array.from(inputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');
    }

    /**
     * Reset form to initial state
     */
    reset() {
        if (this.form) {
            this.form.reset();
            this.markClean();

            // Reset bidfloor containers
            this.resetBidfloorContainer('interstitialBidfloorIds', 'interstitial');
            this.resetBidfloorContainer('rewardedBidfloorIds', 'rewarded');
        }
    }

    /**
     * Reset bidfloor container
     */
    resetBidfloorContainer(containerId, type) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="array-input">
                    <div class="array-input-row">
                        <div class="array-input-field">
                            <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
                            <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
                        </div>
                        <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
                    </div>
                </div>
            `;
        }
    }
}

// Global instances
const validationManager = new ValidationManager();
const formManager = new FormManager();

// Ad ID Validation Functions
function isValidAdId(id) {
    return Utils.isValidAdId(id);
}

function validateAdId(input) {
    return validationManager.validateField(input);
}

function validateAllAdIds() {
    return validationManager.validateAllAdIds();
}

function getInvalidAdIds() {
    return validationManager.getInvalidAdIds();
}

/**
 * Validate entire form and show summary
 */
function validateEntireForm() {
    const invalidIds = getInvalidAdIds();

    if (invalidIds.length === 0) {
        Utils.showNotification('✅ Tất cả dữ liệu đều hợp lệ!', 'success');
        return true;
    }

    // Hiển thị tóm tắt lỗi
    let errorSummary = `❌ Tìm thấy ${invalidIds.length} lỗi:\n\n`;
    invalidIds.forEach((invalid, index) => {
        errorSummary += `${index + 1}. ${invalid.field}: ${invalid.error}\n`;
    });

    console.error('Form validation errors:', invalidIds);
    Utils.showNotification('❌ Form có lỗi, vui lòng kiểm tra console để xem chi tiết', 'error', 5000);

    // Focus vào field đầu tiên có lỗi
    if (invalidIds[0].element) {
        invalidIds[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => invalidIds[0].element.focus(), 500);
    }

    return false;
}

/**
 * Check if all required fields are filled
 */
function checkRequiredFields() {
    const requiredFieldIds = [
        'interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId',
        'interstitialDefaultId', 'rewardedDefaultId', 'bidfloorBanner'
    ];

    const emptyFields = [];

    requiredFieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && (!field.value || field.value.trim() === '')) {
            const label = field.closest('.form-group')?.querySelector('label');
            const fieldName = label ? label.textContent.replace(':', '') : fieldId;
            emptyFields.push(fieldName);
        }
    });

    if (emptyFields.length > 0) {
        Utils.showNotification('❌ Vui lòng điền đầy đủ các trường bắt buộc', 'error', 5000);
        console.warn('Empty required fields:', emptyFields);
        return false;
    }

    return true;
}

// Utility functions for managing bidfloor ID arrays
function addBidfloorId(type, button) {
    const container = document.getElementById(`${type}BidfloorIds`);

    // Tìm input hiện tại (input cùng hàng với button được click)
    const currentInputDiv = button ? button.closest('.array-input') : container.lastElementChild;
    const currentInput = currentInputDiv.querySelector('input[type="text"]');
    const currentValue = currentInput ? currentInput.value.trim() : '';

    // Validate input hiện tại trước khi thêm
    if (currentValue && button) {
        const validationResult = Utils.validateAdIdDetailed(currentValue);
        if (!validationResult.isValid) {
            // Hiển thị lỗi và không cho phép thêm
            Utils.showNotification(`❌ Vui lòng nhập ID hợp lệ trước khi thêm: ${validationResult.error}`, 'error');
            currentInput.focus();
            return;
        }

        // Nếu hợp lệ, chuyển button "Thêm" thành "Xóa"
        button.textContent = 'Xóa';
        button.className = 'btn btn-remove';
        button.setAttribute('onclick', 'removeBidfloorId(this)');
        currentInput.readOnly = true; // Làm cho input không thể chỉnh sửa
    } else if (button && !currentValue) {
        // Nếu input trống, yêu cầu nhập
        Utils.showNotification('❌ Vui lòng nhập ID trước khi thêm', 'error');
        currentInput.focus();
        return;
    }

    // Tạo input mới với cấu trúc layout mới
    const newInput = document.createElement('div');
    newInput.className = 'array-input';
    newInput.innerHTML = `
        <div class="array-input-row">
            <div class="array-input-field">
                <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
                <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
            </div>
            <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
        </div>
    `;
    container.appendChild(newInput);

    // Focus vào input mới
    const newInputField = newInput.querySelector('input[type="text"]');
    newInputField.focus();
}

function removeBidfloorId(button) {
    const container = button.closest('.array-input').parentElement;
    const inputDiv = button.closest('.array-input');

    // Xóa input div
    inputDiv.remove();

    // Đảm bảo luôn có ít nhất một input với button "Thêm"
    const remainingInputs = container.querySelectorAll('.array-input');
    if (remainingInputs.length === 0) {
        // Nếu không còn input nào, tạo input mới
        const type = container.id.includes('interstitial') ? 'interstitial' : 'rewarded';
        container.innerHTML = `
            <div class="array-input">
                <div class="array-input-row">
                    <div class="array-input-field">
                        <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
                        <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
                    </div>
                    <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
                </div>
            </div>
        `;
    } else {
        // Đảm bảo input cuối cùng có button "Thêm"
        const lastInput = remainingInputs[remainingInputs.length - 1];
        const lastButton = lastInput.querySelector('button');
        const lastInputField = lastInput.querySelector('input[type="text"]');

        if (lastButton && lastInputField.value.trim() === '') {
            lastButton.textContent = 'Thêm';
            lastButton.className = 'btn btn-add';
            const type = container.id.includes('interstitial') ? 'interstitial' : 'rewarded';
            lastButton.setAttribute('onclick', `addBidfloorId('${type}', this)`);
            lastInputField.readOnly = false;
        }
    }
}

// Get bidfloor IDs from a container
function getBidfloorIds(containerId) {
    const container = document.getElementById(containerId);
    const inputs = container.querySelectorAll('input[type="text"]');
    const ids = [];
    
    inputs.forEach(input => {
        if (input.value.trim()) {
            ids.push(input.value.trim());
        }
    });
    
    return ids;
}

// Create BFSuperAdUnitConfig object
function createBFSuperAdUnitConfig(defaultId, bidfloorIds, loadCount, autoRetry, autoReloadInterval) {
    return {
        DefaultId: defaultId || "",
        BidfloorIds: bidfloorIds || [],
        BidFloorLoadCount: parseInt(loadCount) || 3,
        BidFloorAutoRetry: autoRetry || false,
        AutoReloadInterval: parseInt(autoReloadInterval) || 99999
    };
}

// Create AdUnitData object
function createAdUnitData(interstitialId, rewardedVideoId, bannerId, aoaId) {
    return {
        interstitialId: interstitialId || "",
        rewardedVideoId: rewardedVideoId || "",
        bannerId: bannerId || "",
        aoaId: aoaId || ""
    };
}

/**
 * Main function to generate JSON with improved error handling
 */
function generateJSON() {
    try {
        const generateBtn = document.querySelector('[onclick="generateJSON()"]');
        if (generateBtn) {
            generateBtn.innerHTML = '<span class="loading-spinner"></span> Đang tạo JSON...';
            generateBtn.disabled = true;
        }

        const invalidIds = getInvalidAdIds();
        if (invalidIds.length > 0) {
            let errorMessage = '❌ Có lỗi trong dữ liệu:\n\n';
            invalidIds.forEach(invalid => {
                errorMessage += `• ${invalid.field}: ${invalid.error}\n`;
                if (invalid.value) {
                    errorMessage += `  Giá trị hiện tại: "${invalid.value}"\n`;
                }
            });
            errorMessage += '\nVui lòng sửa các lỗi trước khi tạo JSON.';

            Utils.showNotification('❌ Không thể tạo JSON do có lỗi trong dữ liệu!', 'error', 5000);

            // Hiển thị chi tiết lỗi
            console.error('Validation errors:', invalidIds);

            if (invalidIds[0].element) {
                invalidIds[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => invalidIds[0].element.focus(), 500);
            }
            return;
        }

        // Get DefaultAdUnitData values
        const interstitialId = document.getElementById('interstitialId').value;
        const rewardedVideoId = document.getElementById('rewardedVideoId').value;
        const bannerId = document.getElementById('bannerId').value;
        const aoaId = document.getElementById('aoaId').value;

        // Get BidfloorInterstitial values
        const interstitialDefaultId = document.getElementById('interstitialDefaultId').value;
        const interstitialBidfloorIds = getBidfloorIds('interstitialBidfloorIds');
        const interstitialLoadCount = document.getElementById('interstitialLoadCount').value;
        const interstitialAutoRetry = document.getElementById('interstitialAutoRetry').checked;
        const interstitialAutoReloadInterval = document.getElementById('interstitialAutoReloadInterval').value;

        // Get BidfloorRewarded values
        const rewardedDefaultId = document.getElementById('rewardedDefaultId').value;
        const rewardedBidfloorIds = getBidfloorIds('rewardedBidfloorIds');
        const rewardedLoadCount = document.getElementById('rewardedLoadCount').value;
        const rewardedAutoRetry = document.getElementById('rewardedAutoRetry').checked;
        const rewardedAutoReloadInterval = document.getElementById('rewardedAutoReloadInterval').value;

        // Get BidfloorBanner value
        const bidfloorBanner = document.getElementById('bidfloorBanner').value;

        // Create the complete AdData object with new structure
        const adData = {
            DefaultAdUnitData: createAdUnitData(interstitialId, rewardedVideoId, bannerId, aoaId),
            BidfloorConfig: {
                Interstitial: createBFSuperAdUnitConfig(
                    interstitialDefaultId,
                    interstitialBidfloorIds,
                    interstitialLoadCount,
                    interstitialAutoRetry,
                    interstitialAutoReloadInterval
                ),
                Rewarded: createBFSuperAdUnitConfig(
                    rewardedDefaultId,
                    rewardedBidfloorIds,
                    rewardedLoadCount,
                    rewardedAutoRetry,
                    rewardedAutoReloadInterval
                ),
                Banner: bidfloorBanner || ""
            }
        };

        const jsonString = JSON.stringify(adData, null, 2);

        const jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.value = jsonString;

        jsonOutput.style.height = 'auto';
        jsonOutput.style.height = Math.min(jsonOutput.scrollHeight, 500) + 'px';

        Utils.showNotification('✅ JSON đã được tạo thành công!', 'success');
        formManager.markClean();
        jsonOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        Utils.handleError(error, 'Tạo JSON');
    } finally {
        const generateBtn = document.querySelector('[onclick="generateJSON()"]');
        if (generateBtn) {
            generateBtn.innerHTML = '🔄 Tạo JSON';
            generateBtn.disabled = false;
        }
    }
}

/**
 * Copy JSON to clipboard with improved UX
 */
function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        Utils.showNotification('⚠️ Vui lòng tạo JSON trước khi copy!', 'warning');
        return;
    }

    // Show loading state
    const copyBtn = document.querySelector('[onclick="copyToClipboard()"]');
    const originalText = copyBtn?.textContent;
    if (copyBtn) {
        copyBtn.innerHTML = '<span class="loading-spinner"></span> Đang copy...';
        copyBtn.disabled = true;
    }

    // Use modern Clipboard API if available, fallback to execCommand
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(jsonOutput.value).then(() => {
            Utils.showNotification('📋 JSON đã được copy vào clipboard!', 'success');

            // Visual feedback - briefly highlight the textarea
            jsonOutput.style.background = '#e8f5e8';
            setTimeout(() => {
                jsonOutput.style.background = '';
            }, 1000);
        }).catch(() => {
            fallbackCopyToClipboard(jsonOutput);
        }).finally(() => {
            // Restore button state
            if (copyBtn) {
                copyBtn.innerHTML = originalText || '📋 Copy JSON';
                copyBtn.disabled = false;
            }
        });
    } else {
        fallbackCopyToClipboard(jsonOutput);
        // Restore button state for fallback
        if (copyBtn) {
            copyBtn.innerHTML = originalText || '📋 Copy JSON';
            copyBtn.disabled = false;
        }
    }
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopyToClipboard(textElement) {
    textElement.select();
    textElement.setSelectionRange(0, 99999); // For mobile devices

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            Utils.showNotification('📋 JSON đã được copy vào clipboard!', 'success');

            // Visual feedback
            textElement.style.background = '#e8f5e8';
            setTimeout(() => {
                textElement.style.background = '';
            }, 1000);
        } else {
            throw new Error('Copy command failed');
        }
    } catch (err) {
        Utils.showNotification('❌ Không thể copy. Vui lòng copy thủ công!', 'error');

        // Select all text for manual copy
        textElement.focus();
        textElement.select();
    }
}

/**
 * Download JSON as file with improved naming and error handling
 */
function downloadJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        Utils.showNotification('⚠️ Vui lòng tạo JSON trước khi tải xuống!', 'warning');
        return;
    }

    try {
        // Generate filename with project name and timestamp
        const projectName = document.getElementById('projectName')?.value?.trim() || 'AdData';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${projectName}_${timestamp}.json`;

        // Show loading state
        const downloadBtn = document.querySelector('[onclick="downloadJSON()"]');
        const originalText = downloadBtn?.textContent;
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span class="loading-spinner"></span> Đang tải xuống...';
            downloadBtn.disabled = true;
        }

        // Create and trigger download
        const blob = new Blob([jsonOutput.value], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);

        Utils.showNotification(`💾 File "${filename}" đã được tải xuống!`, 'success');

        // Restore button state
        setTimeout(() => {
            if (downloadBtn) {
                downloadBtn.innerHTML = originalText || '💾 Tải xuống JSON';
                downloadBtn.disabled = false;
            }
        }, 1000);

    } catch (error) {
        Utils.handleError(error, 'Tải xuống JSON');

        // Restore button state on error
        const downloadBtn = document.querySelector('[onclick="downloadJSON()"]');
        if (downloadBtn) {
            downloadBtn.innerHTML = '💾 Tải xuống JSON';
            downloadBtn.disabled = false;
        }
    }
}



// Helper functions for form data management
function collectFormData() {
    return {
        // DefaultAdUnitData
        interstitialId: document.getElementById('interstitialId').value,
        rewardedVideoId: document.getElementById('rewardedVideoId').value,
        bannerId: document.getElementById('bannerId').value,
        aoaId: document.getElementById('aoaId').value,

        // BidfloorInterstitial
        interstitialDefaultId: document.getElementById('interstitialDefaultId').value,
        interstitialBidfloorIds: getBidfloorIds('interstitialBidfloorIds'),
        interstitialLoadCount: document.getElementById('interstitialLoadCount').value,
        interstitialAutoRetry: document.getElementById('interstitialAutoRetry').checked,
        interstitialAutoReloadInterval: document.getElementById('interstitialAutoReloadInterval').value,

        // BidfloorRewarded
        rewardedDefaultId: document.getElementById('rewardedDefaultId').value,
        rewardedBidfloorIds: getBidfloorIds('rewardedBidfloorIds'),
        rewardedLoadCount: document.getElementById('rewardedLoadCount').value,
        rewardedAutoRetry: document.getElementById('rewardedAutoRetry').checked,
        rewardedAutoReloadInterval: document.getElementById('rewardedAutoReloadInterval').value,

        // BidfloorBanner
        bidfloorBanner: document.getElementById('bidfloorBanner').value
    };
}

function populateFormWithData(data) {
    // Handle both old and new data structures for backward compatibility
    let formData = data;

    // If data has the new BidfloorConfig structure, extract it
    if (data.BidfloorConfig) {
        formData = {
            // DefaultAdUnitData
            interstitialId: data.DefaultAdUnitData?.interstitialId || '',
            rewardedVideoId: data.DefaultAdUnitData?.rewardedVideoId || '',
            bannerId: data.DefaultAdUnitData?.bannerId || '',
            aoaId: data.DefaultAdUnitData?.aoaId || '',

            // BidfloorConfig.Interstitial
            interstitialDefaultId: data.BidfloorConfig.Interstitial?.DefaultId || '',
            interstitialBidfloorIds: data.BidfloorConfig.Interstitial?.BidfloorIds || [],
            interstitialLoadCount: data.BidfloorConfig.Interstitial?.BidFloorLoadCount || '3',
            interstitialAutoRetry: data.BidfloorConfig.Interstitial?.BidFloorAutoRetry || false,
            interstitialAutoReloadInterval: data.BidfloorConfig.Interstitial?.AutoReloadInterval || '99999',

            // BidfloorConfig.Rewarded
            rewardedDefaultId: data.BidfloorConfig.Rewarded?.DefaultId || '',
            rewardedBidfloorIds: data.BidfloorConfig.Rewarded?.BidfloorIds || [],
            rewardedLoadCount: data.BidfloorConfig.Rewarded?.BidFloorLoadCount || '3',
            rewardedAutoRetry: data.BidfloorConfig.Rewarded?.BidFloorAutoRetry || false,
            rewardedAutoReloadInterval: data.BidfloorConfig.Rewarded?.AutoReloadInterval || '99999',

            // BidfloorConfig.Banner
            bidfloorBanner: data.BidfloorConfig.Banner || ''
        };
    } else if (data.BidfloorInterstitial || data.BidfloorRewarded) {
        formData = {
            // DefaultAdUnitData
            interstitialId: data.DefaultAdUnitData?.interstitialId || '',
            rewardedVideoId: data.DefaultAdUnitData?.rewardedVideoId || '',
            bannerId: data.DefaultAdUnitData?.bannerId || '',
            aoaId: data.DefaultAdUnitData?.aoaId || '',

            // BidfloorInterstitial
            interstitialDefaultId: data.BidfloorInterstitial?.DefaultId || '',
            interstitialBidfloorIds: data.BidfloorInterstitial?.BidfloorIds || [],
            interstitialLoadCount: data.BidfloorInterstitial?.BidFloorLoadCount || '3',
            interstitialAutoRetry: data.BidfloorInterstitial?.BidFloorAutoRetry || false,
            interstitialAutoReloadInterval: data.BidfloorInterstitial?.AutoReloadInterval || '99999',

            // BidfloorRewarded
            rewardedDefaultId: data.BidfloorRewarded?.DefaultId || '',
            rewardedBidfloorIds: data.BidfloorRewarded?.BidfloorIds || [],
            rewardedLoadCount: data.BidfloorRewarded?.BidFloorLoadCount || '3',
            rewardedAutoRetry: data.BidfloorRewarded?.BidFloorAutoRetry || false,
            rewardedAutoReloadInterval: data.BidfloorRewarded?.AutoReloadInterval || '99999',

            // BidfloorBanner
            bidfloorBanner: data.BidfloorBanner || ''
        };
    }

    // DefaultAdUnitData
    const interstitialIdEl = document.getElementById('interstitialId');
    const rewardedVideoIdEl = document.getElementById('rewardedVideoId');
    const bannerIdEl = document.getElementById('bannerId');
    const aoaIdEl = document.getElementById('aoaId');

    if (interstitialIdEl) interstitialIdEl.value = formData.interstitialId || '';
    if (rewardedVideoIdEl) rewardedVideoIdEl.value = formData.rewardedVideoId || '';
    if (bannerIdEl) bannerIdEl.value = formData.bannerId || '';
    if (aoaIdEl) aoaIdEl.value = formData.aoaId || '';

    // BidfloorInterstitial
    const interstitialDefaultIdEl = document.getElementById('interstitialDefaultId');
    const interstitialLoadCountEl = document.getElementById('interstitialLoadCount');
    const interstitialAutoRetryEl = document.getElementById('interstitialAutoRetry');
    const interstitialAutoReloadIntervalEl = document.getElementById('interstitialAutoReloadInterval');

    if (interstitialDefaultIdEl) interstitialDefaultIdEl.value = formData.interstitialDefaultId || '';
    if (interstitialLoadCountEl) interstitialLoadCountEl.value = formData.interstitialLoadCount || '3';
    if (interstitialAutoRetryEl) interstitialAutoRetryEl.checked = formData.interstitialAutoRetry || false;
    if (interstitialAutoReloadIntervalEl) interstitialAutoReloadIntervalEl.value = formData.interstitialAutoReloadInterval || '99999';

    // BidfloorRewarded
    const rewardedDefaultIdEl = document.getElementById('rewardedDefaultId');
    const rewardedLoadCountEl = document.getElementById('rewardedLoadCount');
    const rewardedAutoRetryEl = document.getElementById('rewardedAutoRetry');
    const rewardedAutoReloadIntervalEl = document.getElementById('rewardedAutoReloadInterval');

    if (rewardedDefaultIdEl) rewardedDefaultIdEl.value = formData.rewardedDefaultId || '';
    if (rewardedLoadCountEl) rewardedLoadCountEl.value = formData.rewardedLoadCount || '3';
    if (rewardedAutoRetryEl) rewardedAutoRetryEl.checked = formData.rewardedAutoRetry || false;
    if (rewardedAutoReloadIntervalEl) rewardedAutoReloadIntervalEl.value = formData.rewardedAutoReloadInterval || '99999';

    // BidfloorBanner
    const bidfloorBannerEl = document.getElementById('bidfloorBanner');
    if (bidfloorBannerEl) bidfloorBannerEl.value = formData.bidfloorBanner || '';

    // Populate bidfloor IDs
    populateBidfloorIds('interstitialBidfloorIds', formData.interstitialBidfloorIds || [], 'interstitial');
    populateBidfloorIds('rewardedBidfloorIds', formData.rewardedBidfloorIds || [], 'rewarded');
}

function populateBidfloorIds(containerId, ids, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Add existing IDs
    ids.forEach(id => {
        const div = document.createElement('div');
        div.className = 'array-input';
        div.innerHTML = `
            <div class="array-input-row">
                <div class="array-input-field">
                    <input type="text" value="${id}" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" readonly>
                    <small class="validation-message validation-success">✅ ID hợp lệ</small>
                </div>
                <button type="button" class="btn btn-remove" onclick="removeBidfloorId(this)">Xóa</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Add empty input for new entries
    const div = document.createElement('div');
    div.className = 'array-input';
    div.innerHTML = `
        <div class="array-input-row">
            <div class="array-input-field">
                <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
                <small class="validation-message validation-info">Format: 16 ký tự (chữ thường a-z và số 0-9)</small>
            </div>
            <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
        </div>
    `;
    container.appendChild(div);
}

function clearForm() {
    // Clear all inputs
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        if (input.id !== 'projectName') {
            input.value = '';
        }
    });

    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset default values
    document.getElementById('interstitialLoadCount').value = '3';
    document.getElementById('interstitialAutoReloadInterval').value = '99999';
    document.getElementById('rewardedLoadCount').value = '3';
    document.getElementById('rewardedAutoReloadInterval').value = '99999';

    // Reset bidfloor containers
    populateBidfloorIds('interstitialBidfloorIds', [], 'interstitial');
    populateBidfloorIds('rewardedBidfloorIds', [], 'rewarded');

    // Clear JSON output
    document.getElementById('jsonOutput').value = '';
}

// Show message to user
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        ${type === 'success' ? 'background-color: #28a745;' : ''}
        ${type === 'error' ? 'background-color: #dc3545;' : ''}
        ${type === 'warning' ? 'background-color: #ffc107; color: #212529;' : ''}
    `;

    document.body.appendChild(messageDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// Project Management Functions
function handleProjectNameInput() {
    const projectName = document.getElementById('projectName').value.trim();
    if (projectName) {
        // Auto-save current data when typing (debounced)
        clearTimeout(window.projectInputTimeout);
        window.projectInputTimeout = setTimeout(() => {
            saveCurrentProject(false); // Save silently
        }, 2000);
    }
}

function loadProjectData() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) return;

    const projectData = projectDB.loadProject(projectName);
    if (projectData) {
        populateFormWithData(projectData);
        showMessage(`📂 Đã tải project "${projectName}"`, 'success');
        projectDB.currentProject = projectName;
    } else {
        // New project - clear form
        clearForm();
        showMessage(`🆕 Project mới "${projectName}"`, 'success');
        projectDB.currentProject = projectName;
    }
}

function saveCurrentProject(showNotification = true) {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showMessage('⚠️ Vui lòng nhập tên project!', 'warning');
        return;
    }

    const formData = collectFormData();
    const success = projectDB.saveProject(projectName, formData);

    if (success && showNotification) {
        showMessage(`💾 Đã lưu project "${projectName}"`, 'success');
    }

    projectDB.currentProject = projectName;
    return success;
}

function clearCurrentData() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showMessage('⚠️ Vui lòng nhập tên project!', 'warning');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa tất cả dữ liệu của project "${projectName}"?\n\nProject sẽ được giữ lại nhưng tất cả dữ liệu sẽ bị xóa sạch.`)) {
        clearForm();
        // Save empty data to project
        const emptyData = {
            interstitialId: '',
            rewardedVideoId: '',
            bannerId: '',
            aoaId: '',
            interstitialDefaultId: '',
            interstitialBidfloorIds: [],
            interstitialLoadCount: '3',
            interstitialAutoRetry: false,
            interstitialAutoReloadInterval: '99999',
            rewardedDefaultId: '',
            rewardedBidfloorIds: [],
            rewardedLoadCount: '3',
            rewardedAutoRetry: false,
            rewardedAutoReloadInterval: '99999',
            bidfloorBanner: ''
        };

        projectDB.saveProject(projectName, emptyData);
        showMessage(`🧹 Đã xóa sạch dữ liệu của project "${projectName}"`, 'success');
    }
}

function deleteCurrentProject() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showMessage('⚠️ Vui lòng nhập tên project!', 'warning');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa hoàn toàn project "${projectName}"?\n\nProject và tất cả dữ liệu sẽ bị xóa vĩnh viễn.`)) {
        projectDB.deleteProject(projectName);
        clearForm();
        document.getElementById('projectName').value = '';
        showMessage(`🗑️ Đã xóa project "${projectName}"`, 'success');
    }
}

function showProjectList() {
    const projects = projectDB.getProjectList();
    const projectListDiv = document.getElementById('projectList');

    if (projects.length === 0) {
        projectListDiv.innerHTML = '<p style="text-align: center; color: #6c757d;">Chưa có project nào được lưu.</p>';
    } else {
        projectListDiv.innerHTML = projects.map(project => `
            <div class="project-item">
                <div>
                    <div class="project-name">${project.name}</div>
                    <div class="project-date">Cập nhật: ${new Date(project.lastModified).toLocaleString('vi-VN')}</div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="loadProjectFromList('${project.name}')">📂 Tải</button>
                    <button class="btn btn-remove" onclick="deleteProjectFromList('${project.name}')">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    }

    const modal = document.getElementById('projectListModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    } else {
        alert('❌ Project List modal not found!');
    }
}

function loadProjectFromList(projectName) {
    document.getElementById('projectName').value = projectName;
    loadProjectData();
    closeModal('projectListModal');
}

function deleteProjectFromList(projectName) {
    if (confirm(`Bạn có chắc muốn xóa project "${projectName}"?`)) {
        projectDB.deleteProject(projectName);
        showProjectList(); // Refresh list
        showMessage(`🗑️ Đã xóa project "${projectName}"`, 'success');
    }
}

function exportProject() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showMessage('⚠️ Vui lòng nhập tên project!', 'warning');
        return;
    }

    const formData = collectFormData();
    const exportData = {
        projectName: projectName,
        data: formData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage(`📤 Đã export project "${projectName}"`, 'success');
}

function importProject() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    } else {
        alert('❌ Import Project modal not found! Please check if the page loaded correctly.');
    }
}

function handleFileImport(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('importText').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

function processImport() {
    const importText = document.getElementById('importText').value.trim();
    if (!importText) {
        showMessage('⚠️ Vui lòng chọn file hoặc paste JSON data!', 'warning');
        return;
    }

    try {
        const importData = JSON.parse(importText);

        if (importData.projectName && importData.data) {
            // Import project format
            document.getElementById('projectName').value = importData.projectName;
            populateFormWithData(importData.data);
            saveCurrentProject();
            showMessage(`📥 Đã import project "${importData.projectName}"`, 'success');
        } else {
            // Import raw AdData format
            populateFormWithData(importData);
            showMessage('📥 Đã import dữ liệu AdData', 'success');
        }

        closeModal('importModal');
        document.getElementById('importText').value = '';
        document.getElementById('importFile').value = '';

    } catch (error) {
        showMessage('❌ Lỗi: File JSON không hợp lệ!', 'error');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// JSON Data Import Functions
function showImportDataModal() {
    const modal = document.getElementById('importDataModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    } else {
        alert('❌ Modal element not found! Please check if the page loaded correctly.');
    }
}

function handleDataFileImport(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('importDataText').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

function clearImportData() {
    document.getElementById('importDataText').value = '';
    document.getElementById('importDataFile').value = '';
}



function processDataImport() {
    const importText = document.getElementById('importDataText').value.trim();
    if (!importText) {
        showMessage('⚠️ Vui lòng chọn file hoặc paste JSON data!', 'warning');
        return;
    }

    try {
        const jsonData = JSON.parse(importText);

        const validateOnImport = document.getElementById('validateOnImport').checked;

        // Convert JSON to form data format
        const formData = convertJsonToFormData(jsonData);

        if (validateOnImport) {
            // Validate all Ad IDs in the imported data
            const invalidIds = validateImportedAdIds(formData);
            if (invalidIds.length > 0) {
                let errorMessage = '❌ JSON chứa Ad IDs không hợp lệ:\n\n';
                invalidIds.forEach(invalid => {
                    errorMessage += `• ${invalid.field}: "${invalid.value}"\n`;
                });
                errorMessage += '\nBạn có muốn:\n';
                errorMessage += '1. Bỏ tick "Validate Ad IDs" và import anyway\n';
                errorMessage += '2. Sửa JSON và thử lại\n';
                errorMessage += '3. Hủy import';

                alert(errorMessage);
                return;
            }
        }

        // Populate form with imported data
        populateFormWithData(formData);

        // Trigger validation for all inputs after population
        setTimeout(() => {
            const allInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
            allInputs.forEach(input => {
                if (input.value.trim() !== '') {
                    validateAdId(input);
                }
            });
        }, 100);

        // Auto-save if project name exists
        const projectName = document.getElementById('projectName').value.trim();
        if (projectName) {
            saveCurrentProject(false); // Save silently
        }

        closeModal('importDataModal');
        clearImportData();

        showMessage('📥 Đã import JSON data thành công!', 'success');

    } catch (error) {
        showMessage('❌ Lỗi: JSON không hợp lệ! Vui lòng kiểm tra format.', 'error');
    }
}

function convertJsonToFormData(jsonData) {
    // Handle both old and new JSON structures
    let formData = {};

    if (jsonData.DefaultAdUnitData && jsonData.BidfloorConfig) {
        // New structure: {DefaultAdUnitData: {...}, BidfloorConfig: {...}}
        formData = {
            // DefaultAdUnitData
            interstitialId: jsonData.DefaultAdUnitData.interstitialId || '',
            rewardedVideoId: jsonData.DefaultAdUnitData.rewardedVideoId || '',
            bannerId: jsonData.DefaultAdUnitData.bannerId || '',
            aoaId: jsonData.DefaultAdUnitData.aoaId || '',

            // BidfloorConfig.Interstitial
            interstitialDefaultId: jsonData.BidfloorConfig.Interstitial?.DefaultId || '',
            interstitialBidfloorIds: jsonData.BidfloorConfig.Interstitial?.BidfloorIds || [],
            interstitialLoadCount: jsonData.BidfloorConfig.Interstitial?.BidFloorLoadCount || 3,
            interstitialAutoRetry: jsonData.BidfloorConfig.Interstitial?.BidFloorAutoRetry || false,
            interstitialAutoReloadInterval: jsonData.BidfloorConfig.Interstitial?.AutoReloadInterval || 99999,

            // BidfloorConfig.Rewarded
            rewardedDefaultId: jsonData.BidfloorConfig.Rewarded?.DefaultId || '',
            rewardedBidfloorIds: jsonData.BidfloorConfig.Rewarded?.BidfloorIds || [],
            rewardedLoadCount: jsonData.BidfloorConfig.Rewarded?.BidFloorLoadCount || 3,
            rewardedAutoRetry: jsonData.BidfloorConfig.Rewarded?.BidFloorAutoRetry || false,
            rewardedAutoReloadInterval: jsonData.BidfloorConfig.Rewarded?.AutoReloadInterval || 99999,

            // BidfloorConfig.Banner
            bidfloorBanner: jsonData.BidfloorConfig.Banner || ''
        };
    } else if (jsonData.DefaultAdUnitData && (jsonData.BidfloorInterstitial || jsonData.BidfloorRewarded)) {
        // Old structure: {DefaultAdUnitData: {...}, BidfloorInterstitial: {...}, BidfloorRewarded: {...}, BidfloorBanner: "..."}
        formData = {
            // DefaultAdUnitData
            interstitialId: jsonData.DefaultAdUnitData.interstitialId || '',
            rewardedVideoId: jsonData.DefaultAdUnitData.rewardedVideoId || '',
            bannerId: jsonData.DefaultAdUnitData.bannerId || '',
            aoaId: jsonData.DefaultAdUnitData.aoaId || '',

            // BidfloorInterstitial
            interstitialDefaultId: jsonData.BidfloorInterstitial?.DefaultId || '',
            interstitialBidfloorIds: jsonData.BidfloorInterstitial?.BidfloorIds || [],
            interstitialLoadCount: jsonData.BidfloorInterstitial?.BidFloorLoadCount || 3,
            interstitialAutoRetry: jsonData.BidfloorInterstitial?.BidFloorAutoRetry || false,
            interstitialAutoReloadInterval: jsonData.BidfloorInterstitial?.AutoReloadInterval || 99999,

            // BidfloorRewarded
            rewardedDefaultId: jsonData.BidfloorRewarded?.DefaultId || '',
            rewardedBidfloorIds: jsonData.BidfloorRewarded?.BidfloorIds || [],
            rewardedLoadCount: jsonData.BidfloorRewarded?.BidFloorLoadCount || 3,
            rewardedAutoRetry: jsonData.BidfloorRewarded?.BidFloorAutoRetry || false,
            rewardedAutoReloadInterval: jsonData.BidfloorRewarded?.AutoReloadInterval || 99999,

            // BidfloorBanner
            bidfloorBanner: jsonData.BidfloorBanner || ''
        };
    } else {
        // Direct form data format
        formData = jsonData;
    }

    return formData;
}

function validateImportedAdIds(formData) {
    const invalidIds = [];

    // Check all Ad ID fields
    const adIdFields = [
        { field: 'Interstitial ID', value: formData.interstitialId },
        { field: 'Rewarded Video ID', value: formData.rewardedVideoId },
        { field: 'Banner ID', value: formData.bannerId },
        { field: 'AOA ID', value: formData.aoaId },
        { field: 'Interstitial Default ID', value: formData.interstitialDefaultId },
        { field: 'Rewarded Default ID', value: formData.rewardedDefaultId },
        { field: 'Bidfloor Banner ID', value: formData.bidfloorBanner }
    ];

    adIdFields.forEach(item => {
        if (item.value && item.value.trim() !== '' && !isValidAdId(item.value.trim())) {
            invalidIds.push({
                field: item.field,
                value: item.value
            });
        }
    });

    // Check bidfloor IDs arrays
    if (formData.interstitialBidfloorIds && Array.isArray(formData.interstitialBidfloorIds)) {
        formData.interstitialBidfloorIds.forEach((id, index) => {
            if (id && id.trim() !== '' && !isValidAdId(id.trim())) {
                invalidIds.push({
                    field: `Interstitial Bidfloor ID #${index + 1}`,
                    value: id
                });
            }
        });
    }

    if (formData.rewardedBidfloorIds && Array.isArray(formData.rewardedBidfloorIds)) {
        formData.rewardedBidfloorIds.forEach((id, index) => {
            if (id && id.trim() !== '' && !isValidAdId(id.trim())) {
                invalidIds.push({
                    field: `Rewarded Bidfloor ID #${index + 1}`,
                    value: id
                });
            }
        });
    }

    return invalidIds;
}

// Initialize the form when page loads
document.addEventListener('DOMContentLoaded', function() {


    // Add event listeners for real-time validation
    const form = document.getElementById('adDataForm');
    form.addEventListener('input', function() {
        // You can add real-time validation here if needed
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    showMessage('🎯 Tool đã sẵn sàng sử dụng!', 'success');
});
