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
        <input type="text" placeholder="Nhập Bidfloor ID">
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
                <input type="text" placeholder="Nhập Bidfloor ID">
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

        // Create the complete AdData object
        const adData = {
            DefaultAdUnitData: createAdUnitData(interstitialId, rewardedVideoId, bannerId, aoaId),
            BidfloorInterstitial: createBFSuperAdUnitConfig(
                interstitialDefaultId,
                interstitialBidfloorIds,
                interstitialLoadCount,
                interstitialAutoRetry,
                interstitialAutoReloadInterval
            ),
            BidfloorRewarded: createBFSuperAdUnitConfig(
                rewardedDefaultId,
                rewardedBidfloorIds,
                rewardedLoadCount,
                rewardedAutoRetry,
                rewardedAutoReloadInterval
            ),
            BidfloorBanner: bidfloorBanner || ""
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
    
    jsonOutput.select();
    document.execCommand('copy');
    showMessage('📋 JSON đã được copy vào clipboard!', 'success');
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
        // DefaultAdUnitData sample
        interstitialId: 'ca-app-pub-1234567890123456/1234567890',
        rewardedVideoId: 'ca-app-pub-1234567890123456/0987654321',
        bannerId: 'ca-app-pub-1234567890123456/1122334455',
        aoaId: 'ca-app-pub-1234567890123456/5544332211',

        // BidfloorInterstitial sample
        interstitialDefaultId: 'bf-interstitial-default-001',
        interstitialBidfloorIds: ['bf-interstitial-001', 'bf-interstitial-002'],
        interstitialLoadCount: '5',
        interstitialAutoRetry: true,
        interstitialAutoReloadInterval: '30000',

        // BidfloorRewarded sample
        rewardedDefaultId: 'bf-rewarded-default-001',
        rewardedBidfloorIds: ['bf-rewarded-001', 'bf-rewarded-002'],
        rewardedLoadCount: '3',
        rewardedAutoRetry: false,
        rewardedAutoReloadInterval: '60000',

        // BidfloorBanner sample
        bidfloorBanner: 'bf-banner-001'
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
    // DefaultAdUnitData
    document.getElementById('interstitialId').value = data.interstitialId || '';
    document.getElementById('rewardedVideoId').value = data.rewardedVideoId || '';
    document.getElementById('bannerId').value = data.bannerId || '';
    document.getElementById('aoaId').value = data.aoaId || '';

    // BidfloorInterstitial
    document.getElementById('interstitialDefaultId').value = data.interstitialDefaultId || '';
    document.getElementById('interstitialLoadCount').value = data.interstitialLoadCount || '3';
    document.getElementById('interstitialAutoRetry').checked = data.interstitialAutoRetry || false;
    document.getElementById('interstitialAutoReloadInterval').value = data.interstitialAutoReloadInterval || '99999';

    // BidfloorRewarded
    document.getElementById('rewardedDefaultId').value = data.rewardedDefaultId || '';
    document.getElementById('rewardedLoadCount').value = data.rewardedLoadCount || '3';
    document.getElementById('rewardedAutoRetry').checked = data.rewardedAutoRetry || false;
    document.getElementById('rewardedAutoReloadInterval').value = data.rewardedAutoReloadInterval || '99999';

    // BidfloorBanner
    document.getElementById('bidfloorBanner').value = data.bidfloorBanner || '';

    // Populate bidfloor IDs
    populateBidfloorIds('interstitialBidfloorIds', data.interstitialBidfloorIds || [], 'interstitial');
    populateBidfloorIds('rewardedBidfloorIds', data.rewardedBidfloorIds || [], 'rewarded');
}

function populateBidfloorIds(containerId, ids, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Add existing IDs
    ids.forEach(id => {
        const div = document.createElement('div');
        div.className = 'array-input';
        div.innerHTML = `
            <input type="text" value="${id}" placeholder="Nhập Bidfloor ID" readonly>
            <button type="button" class="btn btn-remove" onclick="removeBidfloorId(this)">Xóa</button>
        `;
        container.appendChild(div);
    });

    // Add empty input for new entries
    const div = document.createElement('div');
    div.className = 'array-input';
    div.innerHTML = `
        <input type="text" placeholder="Nhập Bidfloor ID">
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

function deleteCurrentProject() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        showMessage('⚠️ Vui lòng nhập tên project!', 'warning');
        return;
    }

    if (confirm(`Bạn có chắc muốn xóa project "${projectName}"?`)) {
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

    document.getElementById('projectListModal').style.display = 'block';
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
    document.getElementById('importModal').style.display = 'block';
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
    document.getElementById(modalId).style.display = 'none';
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
