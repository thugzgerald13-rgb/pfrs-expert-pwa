document.addEventListener('DOMContentLoaded', async () => {
  const storageKey = 'pfrsExpertState';
  const state = {
    entity: safeJson(localStorage.getItem(storageKey), {}),
    financialData: null,
    comparativeData: null,
    latestOutput: '',
    latestReview: null,
    deferredInstallPrompt: null
  };

  const $ = (id) => document.getElementById(id);

  initShell();
  refreshEntityUI();
  await initXlsx();
  bindEntity();
  bindWorkbookUploads();
  bindGenerator();
  bindReview();
  bindAssistant();
  bindExports();
  bindPwa();
  bindUtilityButtons();

  function safeJson(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value;
  }

  function setHtml(id, value) {
    const node = $(id);
    if (node) node.innerHTML = value;
  }

  function notify(message) {
    console.log('[PFRS Expert]', message);
  }

  async function initXlsx() {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
      notify('XLSX library ready');
    } catch (error) {
      setText('reviewResults', 'Excel parser failed to load. Check your internet connection and refresh the app.');
      console.error(error);
    }
  }

  function initShell() {
    document.querySelectorAll('[data-page-link]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const page = link.getAttribute('data-page-link');
        showPage(page);
      });
    });

    $('menuToggle')?.addEventListener('click', () => $('sidebar')?.classList.toggle('open'));
    $('closeSidebar')?.addEventListener('click', () => $('sidebar')?.classList.remove('open'));
    $('themeToggle')?.addEventListener('click', () => document.body.classList.toggle('dark'));

    window.addEventListener('online', () => $('offlineIndicator')?.classList.add('hidden'));
    window.addEventListener('offline', () => $('offlineIndicator')?.classList.remove('hidden'));
    if (!navigator.onLine) $('offlineIndicator')?.classList.remove('hidden');
  }

  function showPage(page) {
    document.querySelectorAll('.page').forEach((section) => section.classList.remove('active'));
    document.querySelectorAll('[data-page-link]').forEach((link) => link.classList.remove('active'));
    $(`page-${page}`)?.classList.add('active');
    document.querySelector(`[data-page-link="${page}"]`)?.classList.add('active');
  }

  function bindEntity() {
    $('saveEntityBtn')?.addEventListener('click', () => {
      state.entity = getEntityFromInputs();
      localStorage.setItem(storageKey, JSON.stringify(state.entity));
      refreshEntityUI();
    });

    $('clearStateBtn')?.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      state.entity = {};
      state.financialData = null;
      state.comparativeData = null;
      state.latestOutput = '';
      refreshEntityUI();
      setText('generatedDisclosure', 'Generated output will appear here.');
      setText('reviewResults', 'No AFS pack generated yet.');
      setHtml('balanceSummary', 'Upload a workbook to see the extracted financial balance summary here.');
    });
  }

  function getEntityFromInputs() {
    return {
      entityName: $('entityName')?.value?.trim() || state.entity.entityName || '[Entity Name]',
      fiscalYearEnd: $('fiscalYearEnd')?.value?.trim() || state.entity.fiscalYearEnd || new Date().toISOString().slice(0, 10),
      frameworkName: $('frameworkSelect')?.value || state.entity.frameworkName || 'PFRS',
      industryContext: $('industryContext')?.value?.trim() || state.entity.industryContext || ''
    };
  }

  function refreshEntityUI() {
    if ($('entityName')) $('entityName').value = state.entity.entityName || '';
    if ($('fiscalYearEnd')) $('fiscalYearEnd').value = state.entity.fiscalYearEnd || '';
    if ($('frameworkSelect')) $('frameworkSelect').value = state.entity.frameworkName || 'PFRS';
    if ($('industryContext')) $('industryContext').value = state.entity.industryContext || '';
    setText('entitySummary', state.entity.entityName || 'No entity loaded yet');
    setText('frameworkBadge', `Framework: ${state.entity.frameworkName || 'PFRS'} draft mode`);
    const setupStatus = $('setupStatus');
    if (setupStatus) {
      setupStatus.textContent = state.entity.entityName ? 'Setup saved' : 'Setup incomplete';
      setupStatus.className = `status-chip ${state.entity.entityName ? '' : 'warn'}`;
    }
  }

  function bindWorkbookUploads() {
    $('fileInput')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        state.financialData = await parseWorkbookFile(file);
        setText('uploadedWorkbookName', file.name);
        setText('uploadStatus', 'Workbook loaded');
        $('uploadStatus')?.classList.remove('warn');
        updateBalanceDashboard(state.financialData.balances);
        const preview = generatePack('audit_level_pack');
        setText('reviewResults', preview);
      } catch (error) {
        console.error(error);
        setText('reviewResults', `Workbook upload failed: ${error.message || error}`);
      }
    });

    $('comparativeFileInput')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        state.comparativeData = await parseWorkbookFile(file);
        setText('uploadedComparativeName', file.name);
        setText('reviewResults', 'Comparative workbook loaded. Generate CAPO AUDIT-LEVEL PACK to include comparative schedules.');
      } catch (error) {
        console.error(error);
        setText('reviewResults', `Comparative workbook upload failed: ${error.message || error}`);
      }
    });
  }

  async function parseWorkbookFile(file) {
    if (!window.XLSX) throw new Error('XLSX parser not available.');
    if (!window.CAPO_NOTES_ENGINE?.parseWorkbook) throw new Error('Notes engine not loaded.');
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
    return window.CAPO_NOTES_ENGINE.parseWorkbook(workbook);
  }

  function updateBalanceDashboard(balances = {}) {
    const fmt = window.CAPO_NOTES_ENGINE?.formatCurrency || ((value) => String(value || 0));
    setText('statCash', fmt(balances.cash || 0));
    setText('statRevenue', fmt(balances.revenue || 0));
    setText('statAssets', fmt(balances.totalAssets || 0));
    if (window.CAPO_NOTES_ENGINE?.renderSummaryHtml) {
      setHtml('balanceSummary', window.CAPO_NOTES_ENGINE.renderSummaryHtml(balances));
    }
  }

  function bindGenerator() {
    $('generateDisclosureBtn')?.addEventListener('click', () => {
      const type = $('disclosureType')?.value || 'audit_level_pack';
      const output = generatePack(type);
      state.latestOutput = output;
      setText('generatedDisclosure', output);
      setText('reviewResults', output);
      showPage('generator');
    });
  }

  function generatePack(type) {
    const entity = getEntityFromInputs();
    state.entity = entity;
    localStorage.setItem(storageKey, JSON.stringify(entity));
    refreshEntityUI();

    const balances = state.financialData?.balances || {};
    const prior = state.comparativeData?.balances || {};
    const framework = entity.frameworkName || 'PFRS';
    const extra = $('extraContext')?.value?.trim() || entity.industryContext || '';

    if (!state.financialData && ['audit_level_pack', 'full_afs_pack', 'full_fs_pack'].includes(type)) {
      return 'Upload a current-year Excel workbook first, then generate the AFS pack.';
    }

    try {
      if (type === 'audit_level_pack' && window.CAPO_AUDIT_ENGINE?.generateAuditLevelPack) {
        return window.CAPO_AUDIT_ENGINE.generateAuditLevelPack(entity, balances, prior, framework, extra);
      }
      if (type === 'full_afs_pack' && window.CAPO_AFS_ENGINE?.generateFullAFSPack) {
        return window.CAPO_AFS_ENGINE.generateFullAFSPack(entity, balances, framework, extra);
      }
      if (type === 'full_notes_pack' && window.CAPO_NOTES_ENGINE?.generateFullNotesPack) {
        return window.CAPO_NOTES_ENGINE.generateFullNotesPack(entity, { name: framework }, balances, extra);
      }
      if (type === 'full_fs_pack' && window.CAPO_FS_ENGINE?.generateFSPack) {
        return window.CAPO_FS_ENGINE.generateFSPack(entity, balances);
      }
      if (window.CAPO_NOTES_ENGINE?.generateNote) {
        return window.CAPO_NOTES_ENGINE.generateNote(type, { entity, frameworkName: framework, balances, extraContext: extra });
      }
      return 'Required generator engine is not loaded.';
    } catch (error) {
      console.error(error);
      return `Generation failed: ${error.message || error}`;
    }
  }

  function bindExports() {
    $('exportHtmlBtn')?.addEventListener('click', () => exportCurrent('html'));
    $('exportDocBtn')?.addEventListener('click', () => exportCurrent('doc'));
    $('exportTextBtn')?.addEventListener('click', () => exportCurrent('txt'));
    $('copyGeneratedBtn')?.addEventListener('click', async () => {
      const output = state.latestOutput || $('generatedDisclosure')?.textContent || '';
      if (!output || output.includes('Generated output will appear')) return;
      await navigator.clipboard.writeText(output);
      setText('copyGeneratedBtn', 'Copied');
      setTimeout(() => setText('copyGeneratedBtn', 'Copy Output'), 1200);
    });
  }

  function exportCurrent(format) {
    const output = state.latestOutput || $('generatedDisclosure')?.textContent || '';
    if (!output || output.includes('Generated output will appear')) {
      setText('generatedDisclosure', 'Generate an output first before exporting.');
      return;
    }
    const entity = getEntityFromInputs();
    if (!window.CAPO_EXPORT_ENGINE) {
      downloadText(`${entity.entityName || 'PFRS'}-AFS-Pack.txt`, output, 'text/plain;charset=utf-8');
      return;
    }
    if (format === 'html') window.CAPO_EXPORT_ENGINE.exportHtml(entity, output, { frameworkName: entity.frameworkName || 'PFRS' });
    if (format === 'doc') window.CAPO_EXPORT_ENGINE.exportWordCompatible(entity, output, { frameworkName: entity.frameworkName || 'PFRS' });
    if (format === 'txt') window.CAPO_EXPORT_ENGINE.exportTextPack(entity, output);
  }

  function bindReview() {
    $('notesFileInput')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      if ($('notesDraftInput')) $('notesDraftInput').value = text;
      setText('uploadedNotesName', file.name);
    });

    $('reviewNotesBtn')?.addEventListener('click', () => {
      const draft = $('notesDraftInput')?.value || '';
      if (!draft.trim()) {
        setText('reviewFindings', 'Paste or upload notes first before running review.');
        return;
      }
      const review = window.CAPO_NOTES_ENGINE.reviewNotesDraft(draft, {
        balances: state.financialData?.balances || {},
        frameworkName: state.entity.frameworkName || 'PFRS'
      });
      state.latestReview = review;
      renderReview(review);
    });

    $('clearNotesBtn')?.addEventListener('click', () => {
      if ($('notesDraftInput')) $('notesDraftInput').value = '';
      setText('reviewFindings', 'Run a review to see missing disclosures, weak areas, and draft issues.');
      setText('suggestedPrompts', 'The app will suggest follow-up prompts after a review.');
      setText('aiExplanation', 'Explanations for review findings will appear here.');
      setText('reviewStatus', 'No review yet');
      $('reviewStatus')?.classList.add('warn');
    });
  }

  function renderReview(review) {
    const findings = [
      `Score: ${review.score}/100`,
      '',
      'Missing Disclosures:',
      ...(review.missing.length ? review.missing.map((item) => `- ${item}`) : ['- None detected']),
      '',
      'Findings:',
      ...(review.findings.length ? review.findings.map((item) => `- ${item}`) : ['- No major issues detected']),
      '',
      'Strengths:',
      ...(review.strengths.length ? review.strengths.map((item) => `- ${item}`) : ['- No strengths detected yet'])
    ].join('\n');
    setText('reviewFindings', findings);
    setText('suggestedPrompts', (review.prompts || []).map((p) => `- ${p}`).join('\n') || 'No suggested prompts.');
    setText('aiExplanation', review.explanation || 'No explanation generated.');
    setText('reviewStatus', `${review.score}/100`);
    $('reviewStatus')?.classList.toggle('danger', review.score < 70);
    $('reviewStatus')?.classList.toggle('warn', review.score >= 70 && review.score < 85);
  }

  function bindAssistant() {
    $('loadReviewPromptBtn')?.addEventListener('click', () => {
      const prompt = state.latestReview
        ? `Review these findings and draft fixes:\n${JSON.stringify(state.latestReview, null, 2)}`
        : 'Review my uploaded balances and generated AFS pack. Identify missing disclosures and improvement points.';
      if ($('aiInput')) $('aiInput').value = prompt;
    });

    $('aiAskBtn')?.addEventListener('click', () => {
      const question = $('aiInput')?.value || '';
      if (!question.trim()) {
        setText('aiOutput', 'Enter a question first.');
        return;
      }
      const context = {
        entity: state.entity,
        balances: state.financialData?.balances || {},
        comparative: state.comparativeData?.balances || {},
        latestReview: state.latestReview,
        latestOutput: state.latestOutput
      };
      const reply = window.CAPO_AI_LAYER?.chatReply
        ? window.CAPO_AI_LAYER.chatReply(question, context)
        : fallbackAssistantReply(question, context);
      setText('aiOutput', reply);
    });
  }

  function fallbackAssistantReply(question, context) {
    return [
      'PFRS Assistant Reply',
      '',
      `Question: ${question}`,
      '',
      'Available context:',
      `- Entity: ${context.entity?.entityName || 'not set'}`,
      `- Current balances loaded: ${state.financialData ? 'yes' : 'no'}`,
      `- Comparative balances loaded: ${state.comparativeData ? 'yes' : 'no'}`,
      '',
      'Recommended action:',
      '- Generate the CAPO AUDIT-LEVEL PACK, then run Notes Review against the generated notes or uploaded draft.'
    ].join('\n');
  }

  function bindPwa() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      if ($('installBtn')) $('installBtn').hidden = false;
    });

    $('installBtn')?.addEventListener('click', async () => {
      if (!state.deferredInstallPrompt) return;
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      if ($('installBtn')) $('installBtn').hidden = true;
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker registration failed', error));
    }
  }

  function bindUtilityButtons() {
    window.CAPO_APP_STATE = state;
    window.CAPO_GENERATE_PACK = () => {
      const output = generatePack($('disclosureType')?.value || 'audit_level_pack');
      state.latestOutput = output;
      setText('generatedDisclosure', output);
      return output;
    };
  }

  function downloadText(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function loadScript(src, globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
});
