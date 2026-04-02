// PFRS Expert System - Main Application

// Application State
const AppState = {
  entity: {
    name: '',
    secRegNo: '',
    tin: '',
    totalAssets: 0,
    totalLiabilities: 0,
    publiclyListed: false,
    fiscalYearEnd: '',
    industrySector: 'general'
  },
  framework: null,
  complianceScore: 0,
  checklistItems: [],
  uploadedFiles: [],
  settings: {
    darkMode: false,
    offlineSupport: true,
    autoSave: true
  }
};

// DOM Elements
let deferredPrompt;
let currentPage = 'dashboard';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadEntityData();
  setupEventListeners();
  setupServiceWorker();
  setupInstallPrompt();
  updateFrameworkAnalysis();
  updateDeadlines();
  renderChecklist();
  updateComplianceScore();
});

// Load saved settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('pfrs_settings');
  if (saved) {
    const settings = JSON.parse(saved);
    AppState.settings = { ...AppState.settings, ...settings };
    if (AppState.settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('darkModeToggle').checked = true;
    }
  }
}

// Load entity data from localStorage
function loadEntityData() {
  const saved = localStorage.getItem('pfrs_entity');
  if (saved) {
    AppState.entity = JSON.parse(saved);
    updateEntityDisplay();
  }
}

// Save entity data
function saveEntityData() {
  localStorage.setItem('pfrs_entity', JSON.stringify(AppState.entity));
  updateEntityDisplay();
  updateFrameworkAnalysis();
  updateDeadlines();
  updateComplianceScore();
}

// Update entity display in header
function updateEntityDisplay() {
  const entityInfo = document.getElementById('entityInfo');
  const frameworkBadge = document.getElementById('frameworkBadge');
  
  if (AppState.entity.name) {
    entityInfo.innerHTML = `<i class="fas fa-building"></i><span>${AppState.entity.name}</span>`;
  } else {
    entityInfo.innerHTML = `<i class="fas fa-building"></i><span>No Entity Selected</span>`;
  }
  
  if (AppState.framework) {
    frameworkBadge.innerHTML = `<i class="fas fa-chart-line"></i><span>Framework: ${AppState.framework}</span>`;
  } else {
    frameworkBadge.innerHTML = `<i class="fas fa-building"></i><span>Framework: Not Set</span>`;
  }
}

// Determine PFRS framework based on entity data
function determineFramework() {
  const assets = AppState.entity.totalAssets;
  const liabilities = AppState.entity.totalLiabilities;
  const publiclyListed = AppState.entity.publiclyListed;
  
  if (publiclyListed) return 'Full PFRS';
  if (assets > 350000000) return 'Full PFRS';
  if (assets >= 100000000 && assets <= 350000000) return 'PFRS for SMEs';
  if (assets >= 3000000 && assets < 100000000) return 'PFRS for SEs';
  if (assets < 3000000) return 'PFRS for Micro';
  return 'Full PFRS';
}

// Update framework analysis display
function updateFrameworkAnalysis() {
  const container = document.getElementById('frameworkAnalysis');
  const framework = determineFramework();
  AppState.framework = framework;
  
  const analysis = getFrameworkAnalysis(framework);
  container.innerHTML = `
    <div class="framework-details">
      <p><strong>Detected Framework:</strong> ${framework}</p>
      <p><strong>Basis:</strong> ${analysis.basis}</p>
      <p><strong>Required Disclosures:</strong> ${analysis.disclosures}</p>
      <p><strong>Audit Required:</strong> ${analysis.audit}</p>
      <p><strong>SEC Filing Type:</strong> ${analysis.filing}</p>
    </div>
  `;
  updateEntityDisplay();
}

// Get framework analysis details
function getFrameworkAnalysis(framework) {
  const analyses = {
    'Full PFRS': {
      basis: 'Publicly listed or assets > P350M',
      disclosures: '40+ required notes',
      audit: 'Yes, by independent CPA',
      filing: 'Full AFS with all schedules'
    },
    'PFRS for SMEs': {
      basis: 'Assets P100M - P350M, no public accountability',
      disclosures: '20-25 required notes',
      audit: 'Yes, by independent CPA',
      filing: 'Full AFS with simplified notes'
    },
    'PFRS for SEs': {
      basis: 'Assets P3M - P100M',
      disclosures: '8-12 required notes',
      audit: 'Required if assets > P50M',
      filing: 'Full AFS with simplified notes'
    },
    'PFRS for Micro': {
      basis: 'Assets < P3M',
      disclosures: '3-5 required notes',
      audit: 'Not required',
      filing: 'Simplified AFS per SEC MC 3-2018'
    }
  };
  return analyses[framework] || analyses['Full PFRS'];
}

// Update filing deadlines
function updateDeadlines() {
  const container = document.getElementById('deadlineList');
  const fiscalYearEnd = AppState.entity.fiscalYearEnd;
  
  if (!fiscalYearEnd) {
    container.innerHTML = '<p class="text-muted">Set fiscal year end to see deadlines.</p>';
    return;
  }
  
  const deadlines = calculateDeadlines(fiscalYearEnd);
  container.innerHTML = deadlines.map(d => `
    <div class="deadline-item">
      <span class="deadline-date">${d.date}</span>
      <span class="deadline-title">${d.title}</span>
      <span class="deadline-days ${d.days <= 30 ? 'urgent' : ''}">${d.days} days left</span>
    </div>
  `).join('');
  
  // Update days to filing stat
  const daysToFiling = deadlines[0]?.days || 0;
  document.getElementById('statDays').textContent = daysToFiling;
}

// Calculate SEC filing deadlines
function calculateDeadlines(fiscalYearEnd) {
  const yearEnd = new Date(fiscalYearEnd);
  const year = yearEnd.getFullYear();
  
  // AFS filing deadline: 120 days after year end for stock corporations
  const afsDeadline = new Date(yearEnd);
  afsDeadline.setDate(afsDeadline.getDate() + 120);
  
  const today = new Date();
  const daysToAfs = Math.ceil((afsDeadline - today) / (1000 * 60 * 60 * 24));
  
  // GIS deadline: 30 days after annual meeting (assume May 15)
  const gisDeadline = new Date(year, 4, 15);
  const daysToGis = Math.ceil((gisDeadline - today) / (1000 * 60 * 60 * 24));
  
  return [
    { title: 'Annual Financial Statements (AFS)', date: afsDeadline.toLocaleDateString(), days: daysToAfs },
    { title: 'General Information Sheet (GIS)', date: gisDeadline.toLocaleDateString(), days: daysToGis }
  ];
}

// Render SEC Checklist
function renderChecklist() {
  const container = document.getElementById('secChecklist');
  const checklist = getSECChecklist();
  AppState.checklistItems = checklist;
  
  let completed = 0;
  container.innerHTML = checklist.map((item, index) => {
    const checked = localStorage.getItem(`checklist_${item.id}`) === 'true';
    if (checked) completed++;
    return `
      <div class="checklist-item ${checked ? 'completed' : ''}" data-id="${item.id}">
        <input type="checkbox" id="check_${item.id}" ${checked ? 'checked' : ''}>
        <label for="check_${item.id}">
          <strong>${item.category}</strong><br>
          ${item.description}
        </label>
      </div>
    `;
  }).join('');
  
  const progress = (completed / checklist.length) * 100;
  document.getElementById('checklistProgress').textContent = `${Math.round(progress)}% Complete`;
  document.getElementById('checklistProgressBar').style.width = `${progress}%`;
  
  // Add checkbox listeners
  document.querySelectorAll('.checklist-item input').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const itemId = e.target.closest('.checklist-item').dataset.id;
      localStorage.setItem(`checklist_${itemId}`, e.target.checked);
      renderChecklist();
      updateComplianceScore();
    });
  });
}

// Get SEC Checklist items
function getSECChecklist() {
  return [
    { id: 'sec_reg', category: 'Entity Information', description: 'SEC Registration Number disclosed' },
    { id: 'tin', category: 'Entity Information', description: 'TIN disclosed' },
    { id: 'address', category: 'Entity Information', description: 'Principal office address complete' },
    { id: 'board', category: 'Entity Information', description: 'Board of Directors listed with appointment dates' },
    { id: 'officers', category: 'Entity Information', description: 'Officers listed with positions' },
    { id: 'compliance', category: 'Financial Statements', description: 'Statement of Compliance with PFRS' },
    { id: 'basis', category: 'Financial Statements', description: 'Basis of Preparation disclosed' },
    { id: 'going_concern', category: 'Financial Statements', description: 'Going Concern Assessment' },
    { id: 'policies', category: 'Notes', description: 'Summary of Significant Accounting Policies' },
    { id: 'judgments', category: 'Notes', description: 'Judgments and Estimates section' },
    { id: 'ppe', category: 'Notes', description: 'Property and Equipment movement schedule' },
    { id: 'receivables', category: 'Notes', description: 'Receivables aging and impairment' },
    { id: 'related_party', category: 'Notes', description: 'Related Party Disclosures (MC 15-2024)' },
    { id: 'income_tax', category: 'Notes', description: 'Income Tax reconciliation' },
    { id: 'audit', category: 'Audit', description: 'Independent Auditor\'s Report included' },
    { id: 'auditor_accred', category: 'Audit', description: 'Auditor accredited by SEC' },
    { id: 'president_sign', category: 'Certification', description: 'President signature' },
    { id: 'treasurer_sign', category: 'Certification', description: 'Treasurer signature' },
    { id: 'secretary_sign', category: 'Certification', description: 'Corporate Secretary signature' },
    { id: 'sched_a', category: 'Schedules', description: 'Schedule A - Financial Assets' },
    { id: 'sched_b', category: 'Schedules', description: 'Schedule B - Receivables' },
    { id: 'sched_d', category: 'Schedules', description: 'Schedule D - Property and Equipment' },
    { id: 'sched_f', category: 'Schedules', description: 'Schedule F - Long Term Debt' },
    { id: 'sched_l', category: 'Schedules', description: 'Schedule L - Related Party Transactions' }
  ];
}

// Update compliance score
function updateComplianceScore() {
  const checklist = AppState.checklistItems;
  let completed = 0;
  checklist.forEach(item => {
    if (localStorage.getItem(`checklist_${item.id}`) === 'true') completed++;
  });
  
  const score = (completed / checklist.length) * 100;
  AppState.complianceScore = score;
  document.getElementById('statCompliance').textContent = `${Math.round(score)}%`;
  document.getElementById('overallScoreValue').textContent = `${Math.round(score)}%`;
  
  renderScoreBreakdown();
  renderRecommendations();
}

// Render score breakdown
function renderScoreBreakdown() {
  const container = document.getElementById('scoreBreakdown');
  const categories = getCategoryScores();
  
  container.innerHTML = categories.map(cat => `
    <div class="score-item">
      <span>${cat.name}</span>
      <div class="score-bar">
        <div class="score-fill" style="width: ${cat.score}%"></div>
      </div>
      <span>${Math.round(cat.score)}%</span>
    </div>
  `).join('');
}

// Get scores by category
function getCategoryScores() {
  const checklist = AppState.checklistItems;
  const categories = {};
  
  checklist.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = { total: 0, completed: 0 };
    }
    categories[item.category].total++;
    if (localStorage.getItem(`checklist_${item.id}`) === 'true') {
      categories[item.category].completed++;
    }
  });
  
  return Object.entries(categories).map(([name, data]) => ({
    name,
    score: (data.completed / data.total) * 100
  }));
}

// Render recommendations
function renderRecommendations() {
  const container = document.getElementById('recommendationsList');
  const checklist = AppState.checklistItems;
  const incomplete = checklist.filter(item => 
    localStorage.getItem(`checklist_${item.id}`) !== 'true'
  );
  
  if (incomplete.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>All requirements satisfied! Ready for SEC filing.</p></div>';
    return;
  }
  
  container.innerHTML = `
    <div class="recommendations-header">
      <p>${incomplete.length} items require attention before filing:</p>
    </div>
    <ul class="recommendations-list">
      ${incomplete.slice(0, 5).map(item => `
        <li><i class="fas fa-exclamation-circle"></i> ${item.category}: ${item.description}</li>
      `).join('')}
      ${incomplete.length > 5 ? `<li><em>and ${incomplete.length - 5} more items...</em></li>` : ''}
    </ul>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
  
  // Menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  
  document.getElementById('closeSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      AppState.settings.darkMode = true;
    } else {
      document.documentElement.removeAttribute('data-theme');
      AppState.settings.darkMode = false;
    }
    saveSettings();
  });
  
  // Settings save
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveEntitySettings);
  
  // Edit entity modal
  document.getElementById('editEntityBtn')?.addEventListener('click', openEntityModal);
  document.getElementById('saveModalBtn')?.addEventListener('click', saveEntityFromModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeEntityModal);
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeEntityModal);
  });
  
  // File upload
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  
  uploadArea?.addEventListener('click', () => fileInput?.click());
  uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea?.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea?.addEventListener('drop', handleFileDrop);
  fileInput?.addEventListener('change', handleFileSelect);
  
  // Disclosure generator
  document.getElementById('generateDisclosureBtn')?.addEventListener('click', generateDisclosure);
  document.getElementById('copyDisclosureBtn')?.addEventListener('click', copyDisclosure);
  
  // Set fiscal year button
  document.getElementById('setFiscalYearBtn')?.addEventListener('click', openEntityModal);
  
  // Export data
  document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
  document.getElementById('clearDataBtn')?.addEventListener('click', clearData);
  
  // Start review button
  document.getElementById('startReviewBtn')?.addEventListener('click', startReview);
}

// Navigate to page
function navigateTo(page) {
  currentPage = page;
  
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Update page visibility
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  document.getElementById(`${page}-page`).classList.add('active');
  
  // Update header title
  const titles = {
    dashboard: 'Dashboard',
    review: 'FS Review',
    disclosure: 'Disclosure Generator',
    checklist: 'SEC Checklist',
    compliance: 'Compliance Score',
    deadlines: 'Filing Deadlines',
    templates: 'Templates',
    settings: 'Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'PFRS Expert';
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// Toggle theme
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    AppState.settings.darkMode = false;
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    AppState.settings.darkMode = true;
  }
  document.getElementById('darkModeToggle').checked = !isDark;
  saveSettings();
}

// Save settings
function saveSettings() {
  localStorage.setItem('pfrs_settings', JSON.stringify(AppState.settings));
}

// Save entity settings
function saveEntitySettings() {
  AppState.entity.name = document.getElementById('entityName').value;
  AppState.entity.secRegNo = document.getElementById('secRegNo').value;
  AppState.entity.tin = document.getElementById('tin').value;
  AppState.entity.totalAssets = parseFloat(document.getElementById('totalAssets').value) || 0;
  AppState.entity.totalLiabilities = parseFloat(document.getElementById('totalLiabilities').value) || 0;
  AppState.entity.publiclyListed = document.getElementById('publiclyListed').value === 'true';
  AppState.entity.fiscalYearEnd = document.getElementById('fiscalYearEnd').value;
  AppState.entity.industrySector = document.getElementById('industrySector').value;
  
  saveEntityData();
  showToast('Settings saved successfully');
}

// Open entity modal
function openEntityModal() {
  document.getElementById('modalEntityName').value = AppState.entity.name;
  document.getElementById('modalTotalAssets').value = AppState.entity.totalAssets;
  document.getElementById('modalTotalLiabilities').value = AppState.entity.totalLiabilities;
  document.getElementById('modalPubliclyListed').value = AppState.entity.publiclyListed ? 'true' : 'false';
  document.getElementById('modalFiscalYearEnd').value = AppState.entity.fiscalYearEnd;
  document.getElementById('entityModal').classList.add('active');
}

// Save entity from modal
function saveEntityFromModal() {
  AppState.entity.name = document.getElementById('modalEntityName').value;
  AppState.entity.totalAssets = parseFloat(document.getElementById('modalTotalAssets').value) || 0;
  AppState.entity.totalLiabilities = parseFloat(document.getElementById('modalTotalLiabilities').value) || 0;
  AppState.entity.publiclyListed = document.getElementById('modalPubliclyListed').value === 'true';
  AppState.entity.fiscalYearEnd = document.getElementById('modalFiscalYearEnd').value;
  
  saveEntityData();
  closeEntityModal();
  showToast('Entity configuration saved');
}

// Close entity modal
function closeEntityModal() {
  document.getElementById('entityModal').classList.remove('active');
}

// Handle file drop
function handleFileDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  handleFiles(files);
}

// Handle file select
function handleFileSelect(e) {
  const files = e.target.files;
  handleFiles(files);
}

// Handle uploaded files
function handleFiles(files) {
  const container = document.getElementById('uploadedFiles');
  
  for (const file of files) {
    AppState.uploadedFiles.push(file);
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <i class="fas fa-file-${getFileIcon(file.type)}"></i>
      <span>${file.name}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
      <button class="remove-file" data-name="${file.name}"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(fileItem);
  }
  
  document.getElementById('startReviewBtn').disabled = AppState.uploadedFiles.length === 0;
  
  // Add remove handlers
  document.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fileName = btn.dataset.name;
      AppState.uploadedFiles = AppState.uploadedFiles.filter(f => f.name !== fileName);
      btn.closest('.file-item').remove();
      document.getElementById('startReviewBtn').disabled = AppState.uploadedFiles.length === 0;
    });
  });
}

// Get file icon
function getFileIcon(type) {
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('word')) return 'word';
  if (type.includes('excel')) return 'excel';
  return 'alt';
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Start review (simulated AI review)
function startReview() {
  const resultsContainer = document.getElementById('reviewResults');
  resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Analyzing financial statements...</div>';
  
  setTimeout(() => {
    const reviewResults = generateReviewResults();
    resultsContainer.innerHTML = reviewResults;
  }, 2000);
}

// Generate review results
function generateReviewResults() {
  const framework = determineFramework();
  const missingDisclosures = getMissingDisclosures(framework);
  
  return `
    <div class="review-summary">
      <div class="review-header">
        <h4>AI Review Summary</h4>
        <span class="review-badge ${missingDisclosures.length === 0 ? 'success' : 'warning'}">
          ${missingDisclosures.length === 0 ? 'Compliant' : `${missingDisclosures.length} Issues Found`}
        </span>
      </div>
      <div class="review-details">
        <p><strong>Framework Detected:</strong> ${framework}</p>
        <p><strong>Compliance Level:</strong> ${Math.max(0, 100 - missingDisclosures.length * 5)}%</p>
      </div>
      ${missingDisclosures.length > 0 ? `
        <div class="missing-disclosures">
          <h5>Missing or Incomplete Disclosures:</h5>
          <ul>
            ${missingDisclosures.map(d => `<li><i class="fas fa-exclamation-circle"></i> ${d}</li>`).join('')}
          </ul>
        </div>
      ` : `
        <div class="success-message">
          <i class="fas fa-check-circle"></i>
          <p>All required disclosures appear to be present based on the uploaded documents.</p>
        </div>
      `}
    </div>
  `;
}

// Get missing disclosures for framework
function getMissingDisclosures(framework) {
  const allDisclosures = {
    'Full PFRS': [
      'Statement of Compliance',
      'Basis of Preparation',
      'Going Concern Assessment',
      'Judgments and Estimates',
      'Property and Equipment Movement',
      'Financial Instruments',
      'Revenue Recognition',
      'Related Party Disclosures',
      'Income Tax Reconciliation',
      'Contingent Liabilities'
    ],
    'PFRS for SMEs': [
      'Statement of Compliance',
      'Basis of Preparation',
      'Judgments and Estimates',
      'Property and Equipment',
      'Related Party Disclosures',
      'Income Tax'
    ],
    'PFRS for SEs': [
      'Statement of Compliance',
      'Basis of Preparation',
      'Property and Equipment',
      'Income Tax'
    ],
    'PFRS for Micro': [
      'Corporate Information',
      'Basis of Preparation',
      'Property and Equipment'
    ]
  };
  
  const required = allDisclosures[framework] || allDisclosures['Full PFRS'];
  // Simulate random missing items
  return required.filter(() => Math.random() < 0.3);
}

// Generate disclosure (to be implemented in disclosure-generator.js)
function generateDisclosure() {
  const type = document.getElementById('disclosureType').value;
  const context = document.getElementById('disclosureContext').value;
  const entityName = AppState.entity.name || '[Entity Name]';
  
  const disclosure = generateDisclosureText(type, entityName, context);
  const output = document.getElementById('generatedDisclosure');
  output.innerHTML = `<pre>${escapeHtml(disclosure)}</pre>`;
  document.getElementById('copyDisclosureBtn').style.display = 'block';
}

// Copy disclosure to clipboard
function copyDisclosure() {
  const text = document.getElementById('generatedDisclosure').innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard');
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Export data
function exportData() {
  const data = {
    entity: AppState.entity,
    settings: AppState.settings,
    checklist: AppState.checklistItems.map(item => ({
      id: item.id,
      completed: localStorage.getItem(`checklist_${item.id}`) === 'true'
    })),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pfrs_export_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully');
}

// Clear all data
function clearData() {
  if (confirm('Are you sure? This will delete all saved data including entity configuration and checklist progress.')) {
    localStorage.clear();
    AppState.entity = { name: '', secRegNo: '', tin: '', totalAssets: 0, totalLiabilities: 0, publiclyListed: false, fiscalYearEnd: '', industrySector: 'general' };
    AppState.settings = { darkMode: false, offlineSupport: true, autoSave: true };
    AppState.checklistItems = [];
    AppState.uploadedFiles = [];
    location.reload();
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Setup Service Worker
function setupServiceWorker() {
  if ('serviceWorker' in navigator && AppState.settings.offlineSupport) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
}

// Setup install prompt
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', () => {
      installBtn.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted install');
        }
        deferredPrompt = null;
      });
    });
  });
}

// Online/offline handling
window.addEventListener('online', () => {
  document.getElementById('offline-indicator').classList.add('hidden');
  showToast('Back online');
});

window.addEventListener('offline', () => {
  document.getElementById('offline-indicator').classList.remove('hidden');
  showToast('You are offline. Some features may be limited.');
});