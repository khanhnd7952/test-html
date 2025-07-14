// Validation functions for the AdData tool

/**
 * Simple string sanitization function
 */
function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Validate Ad ID format
 */
function validateAdId(input) {
    const value = input.value.trim();
    const isValid = Utils.isValidAdId(value);
    const messageElement = input.parentElement.querySelector('.validation-message');

    // Remove existing validation classes
    input.classList.remove('validation-success', 'validation-error', 'valid', 'invalid');

    if (value === '') {
        // Empty is allowed
        if (messageElement) {
            messageElement.textContent = '16 ký tự: a-z, 0-9';
            messageElement.className = 'validation-message validation-info';
        }
        return true;
    }

    if (isValid) {
        input.classList.add('validation-success', 'valid');
        if (messageElement) {
            messageElement.textContent = '✅ Hợp lệ';
            messageElement.className = 'validation-message validation-success';
        }
        return true;
    } else {
        input.classList.add('validation-error', 'invalid');
        if (messageElement) {
            const length = value.length;
            if (length !== 16) {
                messageElement.textContent = `❌ Cần ${16 - length} ký tự nữa`;
            } else {
                messageElement.textContent = '❌ Chỉ được dùng a-z, 0-9';
            }
            messageElement.className = 'validation-message validation-error';
        }
        return false;
    }
}

/**
 * Validate project name
 */
function validateProjectName(input) {
    if (!input) return false;
    const value = sanitizeString(input.value);
    const isValid = value.length >= 1 && value.length <= 100;
    
    input.classList.remove('validation-success', 'validation-error');
    
    if (isValid) {
        input.classList.add('validation-success');
        return true;
    } else {
        input.classList.add('validation-error');
        return false;
    }
}

/**
 * Validate script ID
 */
function validateScriptId(input) {
    if (!input) return false;
    const value = sanitizeString(input.value);
    const isValid = value.length <= 50;
    
    input.classList.remove('validation-success', 'validation-error');
    
    if (isValid) {
        input.classList.add('validation-success');
        return true;
    } else {
        input.classList.add('validation-error');
        return false;
    }
}

/**
 * Validate description
 */
function validateDescription(input) {
    if (!input) return true; // If input doesn't exist, consider it valid

    const value = sanitizeString(input.value);
    const isValid = value.length <= 500;

    input.classList.remove('validation-success', 'validation-error');

    if (isValid) {
        input.classList.add('validation-success');
        return true;
    } else {
        input.classList.add('validation-error');
        return false;
    }
}

/**
 * Validate entire form
 */
function validateEntireForm() {
    let isValid = true;
    const errors = [];
    
    // Project name validation removed - now handled by dedicated rename functionality
    
    // Validate script ID (only if element exists - for backward compatibility)
    const scriptIdInput = document.getElementById('scriptId');
    if (scriptIdInput && !validateScriptId(scriptIdInput)) {
        isValid = false;
        errors.push('Script ID không hợp lệ');
    }
    
    // Validate description (only if element exists)
    const descriptionInput = document.getElementById('projectDescription');
    if (descriptionInput && !validateDescription(descriptionInput)) {
        isValid = false;
        errors.push('Mô tả quá dài');
    }
    
    // Validate all Ad IDs
    const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
    adIdInputs.forEach(input => {
        const value = input.value.trim();
        // Only validate if not empty (empty is allowed)
        if (value !== '' && !Utils.isValidAdId(value)) {
            isValid = false;
            errors.push(`Ad ID không hợp lệ: ${input.name || input.id}`);
        }
    });
    
    // Validate numeric inputs
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        const value = parseInt(input.value);
        if (isNaN(value) || value < 1) {
            isValid = false;
            errors.push(`Giá trị số không hợp lệ: ${input.name || input.id}`);
        }
    });
    
    if (isValid) {
        showNotification('✅ Tất cả dữ liệu đều hợp lệ!', 'success');
    } else {
        showNotification(`❌ Có ${errors.length} lỗi validation:\n${errors.join('\n')}`, 'error');
    }
    
    return isValid;
}

/**
 * Validate AdData structure
 */
function validateAdDataStructure(data) {
    const errors = [];
    
    // Check required structure
    if (!data.defaultAdUnitData) {
        errors.push('Thiếu defaultAdUnitData');
    }
    
    if (!data.bidfloorConfig) {
        errors.push('Thiếu bidfloorConfig');
    }
    
    // Validate Ad IDs in defaultAdUnitData
    if (data.defaultAdUnitData) {
        const defaultData = data.defaultAdUnitData;
        ['interstitialId', 'rewardedVideoId', 'bannerId', 'aoaId'].forEach(field => {
            if (defaultData[field] && !Utils.isValidAdId(defaultData[field])) {
                errors.push(`Invalid ${field}: ${defaultData[field]}`);
            }
        });
    }
    
    // Validate bidfloorConfig
    if (data.bidfloorConfig) {
        const bidfloorConfig = data.bidfloorConfig;
        
        // Validate interstitial
        if (bidfloorConfig.interstitial) {
            const interstitial = bidfloorConfig.interstitial;
            if (interstitial.defaultId && !Utils.isValidAdId(interstitial.defaultId)) {
                errors.push(`Invalid interstitial defaultId: ${interstitial.defaultId}`);
            }
            if (interstitial.bidfloorIds && Array.isArray(interstitial.bidfloorIds)) {
                interstitial.bidfloorIds.forEach((id, index) => {
                    if (!Utils.isValidAdId(id)) {
                        errors.push(`Invalid interstitial bidfloorIds[${index}]: ${id}`);
                    }
                });
            }
        }
        
        // Validate rewarded
        if (bidfloorConfig.rewarded) {
            const rewarded = bidfloorConfig.rewarded;
            if (rewarded.defaultId && !Utils.isValidAdId(rewarded.defaultId)) {
                errors.push(`Invalid rewarded defaultId: ${rewarded.defaultId}`);
            }
            if (rewarded.bidfloorIds && Array.isArray(rewarded.bidfloorIds)) {
                rewarded.bidfloorIds.forEach((id, index) => {
                    if (!Utils.isValidAdId(id)) {
                        errors.push(`Invalid rewarded bidfloorIds[${index}]: ${id}`);
                    }
                });
            }
        }
        
        // Validate banner
        if (bidfloorConfig.banner && bidfloorConfig.banner.bidfloorBanner) {
            if (!Utils.isValidAdId(bidfloorConfig.banner.bidfloorBanner)) {
                errors.push(`Invalid banner bidfloorBanner: ${bidfloorConfig.banner.bidfloorBanner}`);
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Real-time validation setup
 */
function setupRealTimeValidation() {
    // Project name validation
    const projectNameInput = document.getElementById('projectName');
    if (projectNameInput) {
        projectNameInput.addEventListener('input', Utils.debounce(() => {
            validateProjectName(projectNameInput);
        }, CONFIG.DEBOUNCE_DELAY));
    }
    
    // Script ID validation
    const scriptIdInput = document.getElementById('scriptId');
    if (scriptIdInput) {
        scriptIdInput.addEventListener('input', Utils.debounce(() => {
            validateScriptId(scriptIdInput);
        }, CONFIG.DEBOUNCE_DELAY));
    }
    
    // Description validation
    const descriptionInput = document.getElementById('projectDescription');
    if (descriptionInput) {
        descriptionInput.addEventListener('input', Utils.debounce(() => {
            validateDescription(descriptionInput);
        }, CONFIG.DEBOUNCE_DELAY));
    }
    
    // Ad ID validation for all relevant inputs
    const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
    adIdInputs.forEach(input => {
        input.addEventListener('input', Utils.debounce(() => {
            validateAdId(input);
        }, CONFIG.DEBOUNCE_DELAY));
        
        input.addEventListener('blur', () => {
            validateAdId(input);
        });
    });
    
    // Numeric input validation
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', () => {
            const value = parseInt(input.value);
            input.classList.remove('validation-success', 'validation-error');
            
            if (isNaN(value) || value < 1) {
                input.classList.add('validation-error');
            } else {
                input.classList.add('validation-success');
            }
        });
    });
}
