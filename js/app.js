document.addEventListener('DOMContentLoaded', async () => {

  const state = {
    entity: JSON.parse(localStorage.getItem('pfrsExpertState') || '{}'),
    financialData: null,
    aiContext: {}
  };

  function detectMissingDisclosureAreas(balances = {}) {
    const missing = [];
    if (!balances.revenue) missing.push('revenue recognition');
    if (!balances.incomeTaxExpense && !balances.deferredTax) missing.push('income tax');
    if (!balances.relatedPartyBalances) missing.push('related party disclosures');
    if (!balances.ppe && !balances.accumulatedDepreciation) missing.push('property and equipment');
    if (!balances.leaseLiabilities && !balances.rightOfUseAssets) missing.push('leases (if applicable)');
    return missing;
  }

  function refreshAIContext() {
    state.entity = JSON.parse(localStorage.getItem('pfrsExpertState') || '{}');
    const balances = state.financialData?.balances || {};
    const missing = detectMissingDisclosureAreas(balances);
    state.aiContext = {
      entityName: state.entity.entityName,
      balances,
      missing,
      framework: 'PFRS',
      findings: missing.length ? [`Detected ${missing.length} possible note gaps from uploaded balances.`] : []
    };
  }

  // LOAD XLSX
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');

  // FILE UPLOAD (EXCEL → FS → NOTES)
  document.getElementById('fileInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const parsed = CAPO_NOTES_ENGINE.parseWorkbook(workbook);
      state.financialData = parsed;

      const fs = CAPO_FS_ENGINE.generateFSPack(
        state.entity,
        parsed.balances
      );

      document.getElementById('reviewResults').textContent = fs;
      refreshAIContext();
    }
  });

  // GENERATOR
  document.getElementById('generateDisclosureBtn')?.addEventListener('click', () => {
    const type = document.getElementById('disclosureType').value;

    let text = '';

    if (type === 'full_notes_pack') {
      text = CAPO_NOTES_ENGINE.generateFullNotesPack(
        state.entity,
        { name: 'PFRS' },
        state.financialData?.balances || {},
        ''
      );
    }

    if (type === 'full_fs_pack') {
      text = CAPO_FS_ENGINE.generateFSPack(
        state.entity,
        state.financialData?.balances || {}
      );
    }

    document.getElementById('generatedDisclosure').textContent = text;
  });

  // AI IMPROVE
  document.getElementById('aiImproveBtn')?.addEventListener('click', () => {
    const draft = document.getElementById('generatedDisclosure').textContent;

    const improved = CAPO_AI_LAYER.improveDraft(draft, state.entity);

    document.getElementById('generatedDisclosure').textContent = improved;
  });

  // AI CHAT
  document.getElementById('aiAskBtn')?.addEventListener('click', () => {
    const input = document.getElementById('aiInput').value;

    const reply = CAPO_AI_LAYER.chatReply(input, state.aiContext);

    document.getElementById('aiOutput').textContent = reply;
  });

  // AI SUGGESTED PROMPTS
  document.getElementById('aiSuggestBtn')?.addEventListener('click', () => {
    refreshAIContext();
    const prompts = CAPO_AI_LAYER.suggestPrompts(
      state.aiContext.missing || [],
      state.aiContext.balances || {}
    );

    document.getElementById('aiSuggestions').textContent = prompts.length
      ? prompts.map((prompt, i) => `${i + 1}. ${prompt}`).join('\n')
      : 'No prompt suggestions yet. Upload an XLSX trial balance first.';
  });

  function loadScript(src, global) {
    return new Promise((resolve) => {
      if (window[global]) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

});
