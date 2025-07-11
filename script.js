// AdData JSON Serializer Tool - JavaScript Logic

// Database Management using localStorage
class ProjectDatabase {
    constructor() {
        this.storageKey = 'adDataProjects';
        this.currentProject = '';
    }

    // Get all projects
    getAllProjects() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    // Save project data
    saveProject(projectName, data) {
        if (!projectName.trim()) return false;

        const projects = this.getAllProjects();
        projects[projectName] = {
            data: data,
            lastModified: new Date().toISOString(),
            created: projects[projectName]?.created || new Date().toISOString()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(projects));
        return true;
    }

    // Load project data
    loadProject(projectName) {
        const projects = this.getAllProjects();
        return projects[projectName]?.data || null;
    }

    // Delete project
    deleteProject(projectName) {
        const projects = this.getAllProjects();
        delete projects[projectName];
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    // Get project list with metadata
    getProjectList() {
        const projects = this.getAllProjects();
        return Object.keys(projects).map(name => ({
            name: name,
            lastModified: projects[name].lastModified,
            created: projects[name].created
        })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }
}

// Global database instance
const projectDB = new ProjectDatabase();

// Ad ID Validation Functions
function isValidAdId(id) {
    // MAX Ad ID format: exactly 16 characters, lowercase letters and numbers only
    const adIdRegex = /^[a-z0-9]{16}$/;
    return adIdRegex.test(id);
}

function validateAdId(input) {
    const value = input.value.trim();
    const messageElement = input.nextElementSibling;

    // Remove existing validation classes
    input.classList.remove('input-valid', 'input-invalid');

    if (value === '') {
        // Empty is allowed, show info message
        messageElement.textContent = 'Format: 16 ký tự (chữ thường a-z và số 0-9)';
        messageElement.className = 'validation-message validation-info';
        return true;
    }

    if (isValidAdId(value)) {
        // Valid ID
        input.classList.add('input-valid');
        messageElement.textContent = '✅ ID hợp lệ';
        messageElement.className = 'validation-message validation-success';
        return true;
    } else {
        // Invalid ID
        input.classList.add('input-invalid');
        if (value.length !== 16) {
            messageElement.textContent = `❌ Phải có đúng 16 ký tự (hiện tại: ${value.length})`;
        } else {
            messageElement.textContent = '❌ Chỉ được chứa chữ thường (a-z) và số (0-9)';
        }
        messageElement.className = 'validation-message validation-error';
        return false;
    }
}

function validateAllAdIds() {
    const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
    let allValid = true;

    adIdInputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '' && !isValidAdId(value)) {
            allValid = false;
        }
    });

    return allValid;
}

function getInvalidAdIds() {
    const adIdInputs = document.querySelectorAll('input[type="text"][maxlength="16"]');
    const invalidIds = [];

    adIdInputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '' && !isValidAdId(value)) {
            const label = input.parentElement.querySelector('label');
            const fieldName = label ? label.textContent.replace(':', '') : 'Unknown field';
            invalidIds.push({
                field: fieldName,
                value: value,
                element: input
            });
        }
    });

    return invalidIds;
}

// Utility functions for managing bidfloor ID arrays
function addBidfloorId(type, button) {
    const container = document.getElementById(`${type}BidfloorIds`);

    // Tìm input hiện tại (input cùng hàng với button được click)
    const currentInputDiv = button ? button.parentElement : container.lastElementChild;
    const currentInput = currentInputDiv.querySelector('input[type="text"]');
    const currentValue = currentInput ? currentInput.value.trim() : '';

    // Nếu input hiện tại có giá trị, chuyển button "Thêm" thành "Xóa"
    if (currentValue && button) {
        button.textContent = 'Xóa';
        button.className = 'btn btn-remove';
        button.setAttribute('onclick', 'removeBidfloorId(this)');
        currentInput.readOnly = true; // Làm cho input không thể chỉnh sửa
    }

    // Tạo input mới
    const newInput = document.createElement('div');
    newInput.className = 'array-input';
    newInput.innerHTML = `
        <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
        <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
    `;
    container.appendChild(newInput);

    // Focus vào input mới
    const newInputField = newInput.querySelector('input[type="text"]');
    newInputField.focus();
}

function removeBidfloorId(button) {
    const container = button.parentElement.parentElement;
    const inputDiv = button.parentElement;

    // Xóa input div
    inputDiv.remove();

    // Đảm bảo luôn có ít nhất một input với button "Thêm"
    const remainingInputs = container.querySelectorAll('.array-input');
    if (remainingInputs.length === 0) {
        // Nếu không còn input nào, tạo input mới
        const type = container.id.includes('interstitial') ? 'interstitial' : 'rewarded';
        container.innerHTML = `
            <div class="array-input">
                <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
                <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
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

// Main function to generate JSON
function generateJSON() {
    try {
        // Validate all Ad IDs first
        const invalidIds = getInvalidAdIds();
        if (invalidIds.length > 0) {
            let errorMessage = '❌ Có ID không hợp lệ:\n\n';
            invalidIds.forEach(invalid => {
                errorMessage += `• ${invalid.field}: "${invalid.value}"\n`;
            });
            errorMessage += '\nVui lòng sửa các ID không hợp lệ trước khi tạo JSON.';

            showMessage('❌ Không thể tạo JSON do có ID không hợp lệ!', 'error');
            alert(errorMessage);

            // Focus on first invalid input
            if (invalidIds[0].element) {
                invalidIds[0].element.focus();
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

        // Convert to JSON with proper formatting
        const jsonString = JSON.stringify(adData, null, 2);
        
        // Display in output textarea
        document.getElementById('jsonOutput').value = jsonString;
        
        // Show success message
        showMessage('✅ JSON đã được tạo thành công!', 'success');
        
    } catch (error) {
        console.error('Error generating JSON:', error);
        showMessage('❌ Lỗi khi tạo JSON: ' + error.message, 'error');
    }
}

// Copy JSON to clipboard
function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        showMessage('⚠️ Vui lòng tạo JSON trước khi copy!', 'warning');
        return;
    }

    // Use modern Clipboard API if available, fallback to execCommand
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(jsonOutput.value).then(() => {
            showMessage('📋 JSON đã được copy vào clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(jsonOutput);
        });
    } else {
        fallbackCopyToClipboard(jsonOutput);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(textElement) {
    textElement.select();
    try {
        document.execCommand('copy');
        showMessage('📋 JSON đã được copy vào clipboard!', 'success');
    } catch (err) {
        showMessage('❌ Không thể copy. Vui lòng copy thủ công!', 'error');
    }
}

// Download JSON as file
function downloadJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput.value) {
        showMessage('⚠️ Vui lòng tạo JSON trước khi tải xuống!', 'warning');
        return;
    }
    
    const blob = new Blob([jsonOutput.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AdData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('💾 JSON đã được tải xuống!', 'success');
}

// Load sample data for testing
function loadSampleData() {
    // Set sample project name if empty
    if (!document.getElementById('projectName').value.trim()) {
        document.getElementById('projectName').value = 'SampleProject_Demo';
    }

    const sampleData = {
        // DefaultAdUnitData sample - Valid MAX Ad IDs (16 chars, lowercase + numbers)
        interstitialId: 'a1b2c3d4e5f6g7h8',
        rewardedVideoId: 'b2c3d4e5f6g7h8i9',
        bannerId: 'c3d4e5f6g7h8i9j0',
        aoaId: 'd4e5f6g7h8i9j0k1',

        // BidfloorInterstitial sample
        interstitialDefaultId: 'e5f6g7h8i9j0k1l2',
        interstitialBidfloorIds: ['f6g7h8i9j0k1l2m3', 'g7h8i9j0k1l2m3n4'],
        interstitialLoadCount: '5',
        interstitialAutoRetry: true,
        interstitialAutoReloadInterval: '30000',

        // BidfloorRewarded sample
        rewardedDefaultId: 'h8i9j0k1l2m3n4o5',
        rewardedBidfloorIds: ['i9j0k1l2m3n4o5p6', 'j0k1l2m3n4o5p6q7'],
        rewardedLoadCount: '3',
        rewardedAutoRetry: false,
        rewardedAutoReloadInterval: '60000',

        // BidfloorBanner sample
        bidfloorBanner: 'k1l2m3n4o5p6q7r8'
    };

    populateFormWithData(sampleData);
    showMessage('📝 Dữ liệu mẫu đã được tải!', 'success');
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
    console.log('populateFormWithData called with:', data);

    // Handle both old and new data structures for backward compatibility
    let formData = data;

    // If data has the new BidfloorConfig structure, extract it
    if (data.BidfloorConfig) {
        console.log('Detected new BidfloorConfig structure');
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
        console.log('Detected old structure with separate Bidfloor objects');
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

    console.log('Final formData to populate:', formData);

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
    console.log('Populating bidfloor IDs...');
    populateBidfloorIds('interstitialBidfloorIds', formData.interstitialBidfloorIds || [], 'interstitial');
    populateBidfloorIds('rewardedBidfloorIds', formData.rewardedBidfloorIds || [], 'rewarded');

    console.log('Form population completed');
}

function populateBidfloorIds(containerId, ids, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Add existing IDs
    ids.forEach(id => {
        const div = document.createElement('div');
        div.className = 'array-input';
        div.innerHTML = `
            <input type="text" value="${id}" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" readonly>
            <button type="button" class="btn btn-remove" onclick="removeBidfloorId(this)">Xóa</button>
        `;
        container.appendChild(div);
    });

    // Add empty input for new entries
    const div = document.createElement('div');
    div.className = 'array-input';
    div.innerHTML = `
        <input type="text" placeholder="Ví dụ: a1b2c3d4e5f6g7h8" maxlength="16" oninput="validateAdId(this)" onblur="validateAdId(this)">
        <button type="button" class="btn btn-add" onclick="addBidfloorId('${type}', this)">Thêm</button>
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
        console.log('Project List modal should be visible now');
    } else {
        console.error('projectListModal element not found!');
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
    console.log('importProject called');
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        console.log('Import Project modal should be visible now');
    } else {
        console.error('importModal element not found!');
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
    console.log('closeModal called for:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        console.log('Modal closed:', modalId);
    } else {
        console.error('Modal not found:', modalId);
    }
}

// JSON Data Import Functions
function showImportDataModal() {
    console.log('showImportDataModal called');
    const modal = document.getElementById('importDataModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        console.log('Modal should be visible now');
    } else {
        console.error('importDataModal element not found!');
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

function loadSampleJsonForImport() {
    const sampleJson = {
        "DefaultAdUnitData": {
            "interstitialId": "a1b2c3d4e5f6g7h8",
            "rewardedVideoId": "b2c3d4e5f6g7h8i9",
            "bannerId": "c3d4e5f6g7h8i9j0",
            "aoaId": "d4e5f6g7h8i9j0k1"
        },
        "BidfloorConfig": {
            "Interstitial": {
                "DefaultId": "e5f6g7h8i9j0k1l2",
                "BidfloorIds": [
                    "f6g7h8i9j0k1l2m3",
                    "g7h8i9j0k1l2m3n4"
                ],
                "BidFloorLoadCount": 5,
                "BidFloorAutoRetry": true,
                "AutoReloadInterval": 30000
            },
            "Rewarded": {
                "DefaultId": "h8i9j0k1l2m3n4o5",
                "BidfloorIds": [
                    "i9j0k1l2m3n4o5p6",
                    "j0k1l2m3n4o5p6q7"
                ],
                "BidFloorLoadCount": 3,
                "BidFloorAutoRetry": false,
                "AutoReloadInterval": 60000
            },
            "Banner": "k1l2m3n4o5p6q7r8"
        }
    };

    document.getElementById('importDataText').value = JSON.stringify(sampleJson, null, 2);
    showMessage('📝 Sample JSON đã được tải vào import area!', 'success');
}

function processDataImport() {
    const importText = document.getElementById('importDataText').value.trim();
    if (!importText) {
        showMessage('⚠️ Vui lòng chọn file hoặc paste JSON data!', 'warning');
        return;
    }

    try {
        const jsonData = JSON.parse(importText);
        console.log('Parsed JSON data:', jsonData);

        const validateOnImport = document.getElementById('validateOnImport').checked;

        // Convert JSON to form data format
        const formData = convertJsonToFormData(jsonData);
        console.log('Converted form data:', formData);

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
        console.log('Populating form with data...');
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
        console.error('Import error:', error);
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
    console.log('AdData JSON Serializer Tool loaded successfully!');

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
