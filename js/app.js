document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'pfrsExpertState';
  const state = {
    entity: loadState(),
    uploads: [],
    reviewText: '',
    currentPage: 'dashboard'
  };

  const NOTE_TOPIC_KEYWORDS = {
    compliance: ['statement of compliance', 'compliance with philippine financial reporting standards', 'pfrs'],
    basis: ['basis of preparation', 'historical cost basis', 'functional currency'],
    judgments: ['judgment', 'estimate', 'estimation uncertainty', 'critical accounting estimates'],
    ppe: ['property and equipment', 'property, plant and equipment', 'ppe', 'depreciation'],
    revenue: ['revenue recognition', 'contracts with customers', 'performance obligations'],
    related_party: ['related party', 'related parties', 'key management personnel', 'rpt'],
    income_tax: ['income tax', 'deferred tax', 'current tax', 'temporary differences'],
    financial_risk: ['financial risk', 'credit risk', 'liquidity risk', 'market risk', 'capital management'],
    going_concern: ['going concern', 'material uncertainty'],
    leases: ['leases', 'lease liability', 'right-of-use asset', 'right of use asset', 'pfrs 16']
  };

  const TEMPLATE_LABELS = {
    compliance: 'Statement of Compliance',
    basis: 'Basis of Preparation',
    judgments: 'Judgments and Estimates',
    ppe: 'Property and Equipment',
    revenue: 'Revenue Recognition',
    related_party: 'Related Party Disclosures',
    income_tax: 'Income Taxes',
    financial_risk: 'Financial Risk Management',
    going_concern: 'Going Concern Assessment',
    leases: 'Leases (PFRS 16)'
  };

  init();

  function init() {
    initializeNavigation();
    initializeSettings();
    initializeEntityModal();
    initializeDisclosureGenerator();
    initializeUploadReview();
    initializeTheme();
    initializeInstallHelpers();
    initializeGlossary();
    initializeNews();
    renderTemplates();
    refreshAll();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultEntity();
    } catch (error) {
      console.error('Failed to load state:', error);
      return defaultEntity();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entity));
  }

  function defaultEntity() {
    return {
      entityName: '',
      secRegNo: '',
      tin: '',
      totalAssets: '',
      totalLiabilities: '',
      fiscalYearEnd: '',
      publiclyListed: 'false',
      industrySector: 'general',
      darkMode: false,
      offlineSupport: true,
      autoSave: true
    };
  }

  function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');

    const subtitles = {
      dashboard: 'PFRS Expert System with SEC Compliance',
      review: 'Upload and review draft Notes to Financial Statements',
      disclosure: 'Generate Notes to Financial Statements and disclosures',
      checklist: 'Track filing readiness and required note coverage',
      compliance: 'Measure disclosure and filing readiness',
      deadlines: 'Monitor SEC filing deadlines and penalties',
      templates: 'Reusable PFRS and SEC note templates',
      settings: 'Entity profile and app preferences'
    };

    navItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const page = item.dataset.page;
        state.currentPage = page;

        navItems.forEach(nav => nav.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) targetPage.classList.add('active');

        if (pageTitle) pageTitle.textContent = item.textContent.trim();
        if (pageSubtitle) pageSubtitle.textContent = subtitles[page] || 'PFRS Expert';
        if (sidebar) sidebar.classList.remove('open');
      });
    });

    menuToggle?.addEventListener('click', () => sidebar?.classList.add('open'));
    closeSidebar?.addEventListener('click', () => sidebar?.classList.remove('open'));
  }

  function initializeSettings() {
    bindField('entityName');
    bindField('secRegNo');
    bindField('tin');
    bindField('totalAssets');
    bindField('totalLiabilities');
    bindField('fiscalYearEnd');
    bindField('publiclyListed');
    bindField('industrySector');

    const darkModeToggle = document.getElementById('darkModeToggle');
    const offlineSupportToggle = document.getElementById('offlineSupportToggle');
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');

    if (darkModeToggle) {
      darkModeToggle.checked = !!state.entity.darkMode;
      darkModeToggle.addEventListener('change', () => {
        state.entity.darkMode = darkModeToggle.checked;
        saveState();
        applyTheme();
      });
    }

    if (offlineSupportToggle) {
      offlineSupportToggle.checked = state.entity.offlineSupport !== false;
      offlineSupportToggle.addEventListener('change', () => {
        state.entity.offlineSupport = offlineSupportToggle.checked;
        saveState();
      });
    }

    if (autoSaveToggle) {
      autoSaveToggle.checked = state.entity.autoSave !== false;
      autoSaveToggle.addEventListener('change', () => {
        state.entity.autoSave = autoSaveToggle.checked;
        saveState();
      });
    }

    saveSettingsBtn?.addEventListener('click', () => {
      syncEntityFromForm();
      saveState();
      refreshAll();
      showToast('Settings saved');
    });

    clearDataBtn?.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      state.entity = defaultEntity();
      state.uploads = [];
      state.reviewText = '';
      populateForm();
      refreshAll();
      clearUploadedFiles();
      showToast('All saved data cleared');
    });

    exportDataBtn?.addEventListener('click', exportData);

    populateForm();
  }

  function bindField(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.value = state.entity[id] ?? '';
    element.addEventListener('input', () => {
      state.entity[id] = element.type === 'checkbox' ? element.checked : element.value;
      if (state.entity.autoSave !== false) {
        saveState();
        refreshAll();
      }
    });
  }

  function populateForm() {
    Object.keys(defaultEntity()).forEach((key) => {
      const element = document.getElementById(key);
      if (!element) return;
      if (element.type === 'checkbox') {
        element.checked = !!state.entity[key];
      } else {
        element.value = state.entity[key] ?? '';
      }
    });
  }

  function syncEntityFromForm() {
    Object.keys(defaultEntity()).forEach((key) => {
      const element = document.getElementById(key);
      if (!element) return;
      state.entity[key] = element.type === 'checkbox' ? element.checked : element.value;
    });
  }

  function initializeEntityModal() {
    const modal = document.getElementById('entityModal');
    const editBtn = document.getElementById('editEntityBtn');
    const setFiscalYearBtn = document.getElementById('setFiscalYearBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const saveBtn = document.getElementById('saveModalBtn');

    function openModal() {
      if (!modal) return;
      setModalValues();
      modal.style.display = 'flex';
    }

    function closeModal() {
      if (modal) modal.style.display = 'none';
    }

    editBtn?.addEventListener('click', openModal);
    setFiscalYearBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    saveBtn?.addEventListener('click', () => {
      ['EntityName', 'TotalAssets', 'TotalLiabilities', 'PubliclyListed', 'FiscalYearEnd'].forEach((suffix) => {
        const modalField = document.getElementById(`modal${suffix}`);
        if (!modalField) return;
        const targetKey = suffix.charAt(0).toLowerCase() + suffix.slice(1);
        state.entity[targetKey] = modalField.value;
      });
      state.entity.entityName = document.getElementById('modalEntityName')?.value || state.entity.entityName;
      saveState();
      populateForm();
      refreshAll();
      closeModal();
      showToast('Entity updated');
    });

    window.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
  }

  function setModalValues() {
    const map = {
      modalEntityName: state.entity.entityName,
      modalTotalAssets: state.entity.totalAssets,
      modalTotalLiabilities: state.entity.totalLiabilities,
      modalPubliclyListed: state.entity.publiclyListed,
      modalFiscalYearEnd: state.entity.fiscalYearEnd
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? '';
    });
  }

  function initializeDisclosureGenerator() {
    const select = document.getElementById('disclosureType');
    const generateBtn = document.getElementById('generateDisclosureBtn');
    const copyBtn = document.getElementById('copyDisclosureBtn');
    const output = document.getElementById('generatedDisclosure');

    if (select && !select.querySelector('option[value="full_notes_pack"]')) {
      select.insertAdjacentHTML('beforeend', `
        <option value="full_notes_pack">Full Notes to FS Pack</option>
        <option value="review_uploaded_notes">Review Uploaded Notes Summary</option>
      `);
    }

    generateBtn?.addEventListener('click', () => {
      const type = select?.value || 'compliance';
      const context = document.getElementById('disclosureContext')?.value || '';
      const entityName = state.entity.entityName || '[Entity Name]';
      let text = '';

      if (type === 'full_notes_pack') {
        text = buildFullNotesPack(entityName, context);
      } else if (type === 'review_uploaded_notes') {
        const joined = getCombinedUploadedText();
        text = joined ? buildReviewText(joined) : 'No uploaded or pasted notes available to review yet.';
      } else {
        text = generateDisclosureText(type, entityName, context);
      }

      if (output) output.textContent = text;
      if (copyBtn) copyBtn.style.display = 'inline-flex';
    });

    copyBtn?.addEventListener('click', async () => {
      const text = output?.textContent || '';
      if (!text.trim()) return;
      await navigator.clipboard.writeText(text);
      showToast('Generated note copied');
    });
  }

  function buildFullNotesPack(entityName, context) {
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);
    const sections = [];
    let noteNo = 1;

    required.forEach((item) => {
      const type = mapDisclosureToType(item);
      if (!type) return;
      let section = generateDisclosureText(type, entityName, context);
      section = section.replace(/^NOTE\s+\w+\s*-\s*/i, `NOTE ${noteNo} - `);
      sections.push(section);
      noteNo += 1;
    });

    if (!sections.length) {
      sections.push(generateComplianceStatement(entityName, context));
      sections.push(generateBasisOfPreparation(entityName, context));
    }

    return [
      `${entityName}`,
      `NOTES TO FINANCIAL STATEMENTS`,
      `Framework Applied: ${framework.name}`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      context ? `Entity context: ${context}` : '',
      '',
      ...sections
    ].filter(Boolean).join('\n\n');
  }

  function mapDisclosureToType(label) {
    const normalized = String(label).toLowerCase();
    if (normalized.includes('compliance')) return 'compliance';
    if (normalized.includes('basis')) return 'basis';
    if (normalized.includes('judgment') || normalized.includes('estimate')) return 'judgments';
    if (normalized.includes('property')) return 'ppe';
    if (normalized.includes('revenue')) return 'revenue';
    if (normalized.includes('related')) return 'related_party';
    if (normalized.includes('income tax')) return 'income_tax';
    if (normalized.includes('financial risk') || normalized.includes('capital management')) return 'financial_risk';
    if (normalized.includes('going concern')) return 'going_concern';
    if (normalized.includes('lease')) return 'leases';
    return null;
  }

  function initializeUploadReview() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const startReviewBtn = document.getElementById('startReviewBtn');
    const reviewResults = document.getElementById('reviewResults');

    if (uploadedFiles && !document.getElementById('reviewTextInput')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-group';
      wrapper.innerHTML = `
        <label for="reviewTextInput">Or paste draft Notes to FS text</label>
        <textarea id="reviewTextInput" rows="8" placeholder="Paste your draft notes here for review..."></textarea>
      `;
      uploadedFiles.insertAdjacentElement('afterend', wrapper);

      const textarea = document.getElementById('reviewTextInput');
      textarea?.addEventListener('input', () => {
        state.reviewText = textarea.value;
        if (startReviewBtn) startReviewBtn.disabled = !canReview();
      });
    }

    uploadArea?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async (event) => {
      await handleFiles(Array.from(event.target.files || []));
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      uploadArea?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadArea.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      uploadArea?.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadArea.classList.remove('drag-over');
      });
    });

    uploadArea?.addEventListener('drop', async (event) => {
      const files = Array.from(event.dataTransfer?.files || []);
      await handleFiles(files);
    });

    startReviewBtn?.addEventListener('click', () => {
      const text = getCombinedUploadedText();
      if (!text) {
        reviewResults.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No readable notes found in uploads or pasted text.</p></div>';
        return;
      }

      reviewResults.innerHTML = renderReviewHtml(text);
      showToast('Notes review completed');
    });

    if (startReviewBtn) startReviewBtn.disabled = !canReview();
  }

  async function handleFiles(files) {
    if (!files.length) return;

    for (const file of files) {
      const extractedText = await extractTextFromFile(file);
      state.uploads.push({
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop(),
        text: extractedText,
        readable: !!extractedText
      });
    }

    renderUploadedFiles();
    const startReviewBtn = document.getElementById('startReviewBtn');
    if (startReviewBtn) startReviewBtn.disabled = !canReview();
    showToast('Files uploaded');
  }

  function renderUploadedFiles() {
    const container = document.getElementById('uploadedFiles');
    if (!container) return;

    if (!state.uploads.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = state.uploads.map((file, index) => `
      <div class="update-item" style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:10px;">
        <div>
          <strong>${escapeHtml(file.name)}</strong>
          <div class="text-muted small">${formatBytes(file.size)} • ${file.readable ? 'Text ready' : 'Review limited'}</div>
        </div>
        <button class="btn-sm" data-remove-upload="${index}">Remove</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-remove-upload]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.removeUpload);
        state.uploads.splice(idx, 1);
        renderUploadedFiles();
        const startReviewBtn = document.getElementById('startReviewBtn');
        if (startReviewBtn) startReviewBtn.disabled = !canReview();
      });
    });
  }

  function clearUploadedFiles() {
    const container = document.getElementById('uploadedFiles');
    if (container) container.innerHTML = '';
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    const reviewResults = document.getElementById('reviewResults');
    if (reviewResults) {
      reviewResults.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Upload financial statements to begin AI-powered review</p></div>';
    }
    const reviewTextInput = document.getElementById('reviewTextInput');
    if (reviewTextInput) reviewTextInput.value = '';
  }

  async function extractTextFromFile(file) {
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith('.txt') || name.endsWith('.md')) {
        return await file.text();
      }

      if (name.endsWith('.docx')) {
        await loadScript('https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result.value || '';
      }

      if (name.endsWith('.pdf')) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.js', 'pdfjsLib');
        if (window.pdfjsLib?.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';
        }
        const buffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        let text = '';
        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
          const page = await pdf.getPage(pageNo);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
      }

      if (name.endsWith('.xlsx')) {
        return `${file.name} uploaded. XLSX content parsing is not enabled in-browser yet, so review uses filename only.`;
      }
    } catch (error) {
      console.error(`Failed to parse ${file.name}:`, error);
      return '';
    }

    return '';
  }

  function canReview() {
    return state.uploads.some(file => file.text && file.text.trim()) || !!(state.reviewText && state.reviewText.trim());
  }

  function getCombinedUploadedText() {
    const uploadText = state.uploads
      .filter(file => file.text && file.text.trim())
      .map(file => `FILE: ${file.name}\n${file.text}`)
      .join('\n\n');

    return [uploadText, state.reviewText].filter(Boolean).join('\n\n');
  }

  function renderReviewHtml(text) {
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);
    const missing = [];
    const present = [];
    const findings = [];
    const lower = text.toLowerCase();

    required.forEach((label) => {
      const type = mapDisclosureToType(label);
      if (!type) return;
      const matched = NOTE_TOPIC_KEYWORDS[type]?.some(keyword => lower.includes(keyword));
      if (matched) present.push(label);
      else missing.push(label);
    });

    const placeholders = ['[entity name]', 'p -', 'tbd', 'note x', '[x]', 'insert', 'xxx']
      .filter(token => lower.includes(token));

    if (placeholders.length) {
      findings.push(`Placeholder text detected: ${placeholders.join(', ')}`);
    }

    const yearMatches = [...new Set((text.match(/20\d{2}/g) || []))];
    if (yearMatches.length) {
      findings.push(`Detected reporting years: ${yearMatches.join(', ')}`);
    } else {
      findings.push('No reporting year detected in the uploaded notes.');
    }

    if (!lower.includes('related party') && (state.entity.publiclyListed === 'true' || state.entity.industrySector !== 'general')) {
      findings.push('Related party disclosure appears missing or too limited for review.');
    }

    if (lower.includes('lease') && !lower.includes('right-of-use')) {
      findings.push('Lease note mentions leases but does not clearly mention right-of-use asset or lease liability.');
    }

    if (framework.name === 'Full PFRS' && !lower.includes('deferred tax')) {
      findings.push('Full PFRS entities commonly require deferred tax discussion; not clearly found.');
    }

    const score = Math.max(0, Math.min(100, Math.round(((present.length * 2) + Math.max(0, 10 - placeholders.length) + Math.max(0, 8 - missing.length)) / Math.max(1, (required.length * 2) + 18) * 100)));

    return `
      <div class="score-breakdown">
        <div class="update-item"><strong>Framework detected:</strong> ${escapeHtml(framework.name)}</div>
        <div class="update-item"><strong>Draft review score:</strong> ${score}%</div>
        <div class="update-item"><strong>Covered note areas:</strong> ${present.length ? escapeHtml(present.join(', ')) : 'None confidently detected'}</div>
        <div class="update-item"><strong>Missing / weak areas:</strong> ${missing.length ? escapeHtml(missing.join(', ')) : 'No major missing note themes detected from rule set'}</div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="card-header"><h3><i class="fas fa-list-check"></i> Review Findings</h3></div>
        <div class="card-body">
          <ul>${findings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="card-header"><h3><i class="fas fa-wand-magic-sparkles"></i> Suggested Next Step</h3></div>
        <div class="card-body">
          <p>Go to <strong>Disclosure Generator</strong> and use <strong>Full Notes to FS Pack</strong> to regenerate missing sections, then tailor the output to your actual balances and facts.</p>
        </div>
      </div>
    `;
  }

  function buildReviewText(text) {
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);
    const lower = text.toLowerCase();
    const covered = required.filter(label => {
      const type = mapDisclosureToType(label);
      return type && NOTE_TOPIC_KEYWORDS[type]?.some(keyword => lower.includes(keyword));
    });
    const missing = required.filter(label => !covered.includes(label));

    return [
      `NOTES TO FS REVIEW SUMMARY`,
      `Framework: ${framework.name}`,
      `Covered Areas: ${covered.join(', ') || 'None confidently detected'}`,
      `Missing or Weak Areas: ${missing.join(', ') || 'None'}`,
      lower.includes('p -') ? 'Warning: Placeholder amount "P -" detected.' : 'No common amount placeholder detected.',
      lower.includes('note x') ? 'Warning: Placeholder note numbering detected.' : 'Note numbering appears more specific than generic placeholders.'
    ].join('\n');
  }

  function refreshAll() {
    updateEntitySummary();
    updateFrameworkAnalysis();
    updateHeaderInfo();
    updateDashboardStats();
    updateChecklist();
    updateCompliance();
    updateDeadlines();
    updateGeneratedPlaceholder();
  }

  function getFramework() {
    const assets = Number(state.entity.totalAssets || 0);
    const liabilities = Number(state.entity.totalLiabilities || 0);
    const publiclyListed = String(state.entity.publiclyListed) === 'true';
    const industry = state.entity.industrySector || 'general';
    return detectFramework(assets, liabilities, publiclyListed, industry, 0);
  }

  function updateEntitySummary() {
    const summary = document.getElementById('entitySummary');
    if (!summary) return;

    if (!state.entity.entityName && !state.entity.totalAssets) {
      summary.innerHTML = '<p class="text-muted">No entity configured. Click Edit to set up.</p>';
      return;
    }

    summary.innerHTML = `
      <div class="update-item"><strong>Entity:</strong> ${escapeHtml(state.entity.entityName || 'Not set')}</div>
      <div class="update-item"><strong>SEC Reg No.:</strong> ${escapeHtml(state.entity.secRegNo || 'Not set')}</div>
      <div class="update-item"><strong>Total Assets:</strong> ${formatCurrency(state.entity.totalAssets)}</div>
      <div class="update-item"><strong>Total Liabilities:</strong> ${formatCurrency(state.entity.totalLiabilities)}</div>
      <div class="update-item"><strong>Industry:</strong> ${escapeHtml(state.entity.industrySector || 'general')}</div>
      <div class="update-item"><strong>Publicly Listed:</strong> ${String(state.entity.publiclyListed) === 'true' ? 'Yes' : 'No'}</div>
    `;
  }

  function updateFrameworkAnalysis() {
    const analysis = document.getElementById('frameworkAnalysis');
    const frameworkBadge = document.getElementById('frameworkBadge');
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);

    if (frameworkBadge) {
      frameworkBadge.innerHTML = `<i class="fas fa-building"></i><span>Framework: ${escapeHtml(framework.name)}</span>`;
    }

    if (!analysis) return;

    analysis.innerHTML = `
      <div class="update-item"><strong>Detected Framework:</strong> ${escapeHtml(framework.name)}</div>
      <div class="update-item"><strong>Expected Disclosures:</strong> ${required.length}</div>
      <div class="update-item"><strong>Audit Requirement:</strong> ${escapeHtml(String(framework.requirements?.audit ?? 'Depends on threshold'))}</div>
      <div class="update-item"><strong>Financial Instruments:</strong> ${escapeHtml(String(framework.requirements?.financialInstruments ?? 'Not specified'))}</div>
    `;
  }

  function updateHeaderInfo() {
    const entityInfo = document.getElementById('entityInfo');
    if (!entityInfo) return;
    entityInfo.innerHTML = `<i class="fas fa-building"></i><span>${escapeHtml(state.entity.entityName || 'No Entity Selected')}</span>`;
  }

  function updateDashboardStats() {
    const framework = getFramework();
    const disclosures = getRequiredDisclosures(framework);
    const statDisclosures = document.getElementById('statDisclosures');
    const statCompliance = document.getElementById('statCompliance');
    const statIssues = document.getElementById('statIssues');
    const statDays = document.getElementById('statDays');

    const reviewScore = getCombinedUploadedText() ? estimateReviewScore(getCombinedUploadedText()) : 0;
    const missing = disclosures.length - Math.round((reviewScore / 100) * disclosures.length);

    if (statDisclosures) statDisclosures.textContent = disclosures.length;
    if (statCompliance) statCompliance.textContent = `${reviewScore}%`;
    if (statIssues) statIssues.textContent = Math.max(0, missing);
    if (statDays) statDays.textContent = getDaysToDeadline();
  }

  function estimateReviewScore(text) {
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);
    const lower = text.toLowerCase();
    const hits = required.filter(label => {
      const type = mapDisclosureToType(label);
      return type && NOTE_TOPIC_KEYWORDS[type]?.some(keyword => lower.includes(keyword));
    }).length;
    return Math.round((hits / Math.max(1, required.length)) * 100);
  }

  function updateChecklist() {
    const checklistContainer = document.getElementById('secChecklist');
    const progress = document.getElementById('checklistProgress');
    const progressBar = document.getElementById('checklistProgressBar');
    if (!checklistContainer) return;

    const framework = getFramework();
    const items = [
      ...getRequiredDisclosures(framework).slice(0, 8).map(label => ({ label: `Draft ${label}`, done: checkTopicCoverage(label) })),
      { label: 'Entity profile completed', done: !!state.entity.entityName && !!state.entity.totalAssets },
      { label: 'Fiscal year end set', done: !!state.entity.fiscalYearEnd },
      { label: 'Uploaded notes available for review', done: canReview() }
    ];

    const completed = items.filter(item => item.done).length;
    const pct = Math.round((completed / Math.max(1, items.length)) * 100);

    checklistContainer.innerHTML = items.map(item => `
      <label class="update-item" style="display:flex; gap:10px; align-items:center;">
        <input type="checkbox" ${item.done ? 'checked' : ''} disabled>
        <span>${escapeHtml(item.label)}</span>
      </label>
    `).join('');

    if (progress) progress.textContent = `${pct}% Complete`;
    if (progressBar) progressBar.style.width = `${pct}%`;
  }

  function checkTopicCoverage(label) {
    const text = getCombinedUploadedText().toLowerCase();
    if (!text) return false;
    const type = mapDisclosureToType(label);
    return !!(type && NOTE_TOPIC_KEYWORDS[type]?.some(keyword => text.includes(keyword)));
  }

  function updateCompliance() {
    const overall = document.getElementById('overallScoreValue');
    const breakdown = document.getElementById('scoreBreakdown');
    const recommendations = document.getElementById('recommendationsList');
    const score = estimateReviewScore(getCombinedUploadedText() || '');
    const framework = getFramework();
    const required = getRequiredDisclosures(framework);
    const missing = required.filter(label => !checkTopicCoverage(label));

    if (overall) overall.textContent = `${score}%`;
    if (breakdown) {
      breakdown.innerHTML = `
        <div class="update-item"><strong>Notes coverage:</strong> ${score}%</div>
        <div class="update-item"><strong>Framework:</strong> ${escapeHtml(framework.name)}</div>
        <div class="update-item"><strong>Outstanding gaps:</strong> ${missing.length}</div>
      `;
    }

    if (recommendations) {
      const items = [];
      if (!state.entity.entityName) items.push('Complete the entity profile in Settings.');
      if (!state.entity.fiscalYearEnd) items.push('Set fiscal year end to compute filing deadlines.');
      if (missing.length) items.push(`Generate or strengthen these note areas: ${missing.slice(0, 5).join(', ')}.`);
      if (!canReview()) items.push('Upload or paste draft notes to run the review engine.');
      recommendations.innerHTML = `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No major recommendations at this time.</li>'}</ul>`;
    }
  }

  function updateDeadlines() {
    const deadlineList = document.getElementById('deadlineList');
    const deadlineCalendar = document.getElementById('deadlineCalendar');
    const deadlinePenalties = document.getElementById('deadlinePenalties');
    const fy = state.entity.fiscalYearEnd;

    if (!fy) {
      if (deadlineList) deadlineList.innerHTML = '<p class="text-muted">Set fiscal year end to see deadlines.</p>';
      if (deadlineCalendar) deadlineCalendar.innerHTML = '<p class="text-muted">Set fiscal year end to compute filing dates.</p>';
      if (deadlinePenalties) deadlinePenalties.innerHTML = '';
      return;
    }

    const deadline = calculateSECDeadline(fy, 'stock');
    const days = getDaysToDeadline();
    const lateDays = Math.max(0, -days);
    const penalty = calculatePenalty(lateDays, 5000);

    const html = `
      <div class="update-item"><strong>Fiscal Year End:</strong> ${escapeHtml(fy)}</div>
      <div class="update-item"><strong>Estimated SEC AFS Deadline:</strong> ${deadline.toDateString()}</div>
      <div class="update-item"><strong>Days to Deadline:</strong> ${days}</div>
    `;

    if (deadlineList) deadlineList.innerHTML = html;
    if (deadlineCalendar) deadlineCalendar.innerHTML = html;
    if (deadlinePenalties) {
      deadlinePenalties.innerHTML = `<div class="update-item"><strong>Estimated late filing penalty basis:</strong> ${lateDays ? formatCurrency(penalty) : 'No late penalty as of today'}</div>`;
    }
  }

  function getDaysToDeadline() {
    if (!state.entity.fiscalYearEnd) return 0;
    const deadline = calculateSECDeadline(state.entity.fiscalYearEnd, 'stock');
    const now = new Date();
    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  }

  function renderTemplates() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    const templates = Object.entries(TEMPLATE_LABELS).map(([key, label]) => ({ key, label }));
    templateList.innerHTML = templates.map(item => `
      <div class="update-item" style="display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:10px;">
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <div class="text-muted small">Reusable note template</div>
        </div>
        <button class="btn-sm" data-template="${item.key}">Load</button>
      </div>
    `).join('');

    templateList.querySelectorAll('[data-template]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const disclosureSelect = document.getElementById('disclosureType');
        const disclosureNav = document.querySelector('.nav-item[data-page="disclosure"]');
        if (disclosureSelect) disclosureSelect.value = btn.dataset.template;
        disclosureNav?.click();
      });
    });
  }

  function updateGeneratedPlaceholder() {
    const output = document.getElementById('generatedDisclosure');
    if (!output || output.textContent.trim()) return;
    output.textContent = 'Select a disclosure type and generate content.';
  }

  function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', () => {
      state.entity.darkMode = !state.entity.darkMode;
      saveState();
      applyTheme();
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) darkModeToggle.checked = state.entity.darkMode;
    });
    applyTheme();
  }

  function applyTheme() {
    document.body.classList.toggle('dark-mode', !!state.entity.darkMode);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.innerHTML = state.entity.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }

  function initializeInstallHelpers() {
    const offlineIndicator = document.getElementById('offline-indicator');
    window.addEventListener('online', () => {
      offlineIndicator?.classList.add('hidden');
    });
    window.addEventListener('offline', () => {
      offlineIndicator?.classList.remove('hidden');
    });
  }

  function initializeGlossary() {
    const searchInput = document.getElementById('glossarySearch');
    const resultsContainer = document.getElementById('glossaryResults');
    if (!searchInput || !resultsContainer || typeof pfrsGlossary === 'undefined') return;

    searchInput.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase().trim();
      if (!query) {
        resultsContainer.innerHTML = '';
        return;
      }

      const matches = pfrsGlossary.filter(item =>
        item.term.toLowerCase().includes(query) ||
        item.definition.toLowerCase().includes(query) ||
        item.standard.toLowerCase().includes(query)
      );

      if (!matches.length) {
        resultsContainer.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">No matching terms found. Try a different keyword.</p>';
        return;
      }

      resultsContainer.innerHTML = matches.map(item => `
        <div style="background:white; padding:15px; margin-bottom:10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); border-left:4px solid #1a73e8;">
          <h3 style="margin:0 0 5px 0; color:#1a73e8;">${highlightMatch(item.term, query)}</h3>
          <p style="margin:0 0 8px 0; color:#444; line-height:1.5;">${highlightMatch(item.definition, query)}</p>
          <span style="display:inline-block; background:#e8f0fe; color:#1a73e8; padding:3px 10px; border-radius:12px; font-size:0.8em; font-weight:bold;">${highlightMatch(item.standard, query)}</span>
        </div>
      `).join('');
    });
  }

  function initializeNews() {
    const newsFeed = document.getElementById('newsFeed');
    if (!newsFeed || typeof secUpdates === 'undefined') return;
    newsFeed.innerHTML = secUpdates.map(item => `
      <div style="background:white; padding:15px; margin-bottom:10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); border-left:4px solid #d32f2f;">
        <span style="font-size:0.8em; color:#666;">${escapeHtml(item.date)}</span>
        <h4 style="margin:5px 0;">${escapeHtml(item.title)}</h4>
        <p style="color:#444; font-size:0.9em;">${escapeHtml(item.description)}</p>
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8; font-size:0.9em;">Read more →</a>
      </div>
    `).join('');
  }

  function exportData() {
    const payload = {
      entity: state.entity,
      uploads: state.uploads.map(file => ({ name: file.name, readable: file.readable, textPreview: (file.text || '').slice(0, 1000) })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pfrs-expert-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2200);
  }

  function formatCurrency(value) {
    const num = Number(value || 0);
    if (!num) return 'PHP 0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fff3cd; padding:1px 3px; border-radius:2px;">$1</mark>');
  }

  function loadScript(src, globalName) {
    if (globalName && window[globalName]) return Promise.resolve();
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
});
