(function () {
  function safe(value) {
    return Number(value || 0);
  }

  function abs(value) {
    return Math.abs(safe(value));
  }

  function positive(value) {
    return Math.max(0, safe(value));
  }

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function looksLikeAmount(value) {
    return /^\(?-?[\d,]+(?:\.\d+)?\)?$/.test(String(value).trim());
  }

  function parseAmount(value) {
    const raw = String(value ?? '').trim();
    if (!raw || !looksLikeAmount(raw)) return null;
    const negative = raw.startsWith('(') && raw.endsWith(')');
    const cleaned = raw.replace(/[(),]/g, '');
    const num = Number(cleaned);
    if (Number.isNaN(num)) return null;
    return negative ? -num : num;
  }

  function looksLikeHeader(cells) {
    const joined = cells.join(' ').toLowerCase();
    return ['account', 'description', 'debit', 'credit', 'balance', 'amount'].some((word) => joined.includes(word));
  }

  function parseWorkbook(workbook) {
    const records = [];
    (workbook.SheetNames || []).forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      rows.forEach((row, index) => {
        const cells = row.map((cell) => String(cell ?? '').trim());
        if (!cells.some(Boolean)) return;
        if (index === 0 && looksLikeHeader(cells)) return;
        const accountCell = cells.find((cell) => /[A-Za-z]/.test(cell) && !looksLikeAmount(cell)) || '';
        if (!accountCell) return;
        const numericCells = cells.map(parseAmount).filter((value) => value !== null);
        if (!numericCells.length) return;
        let amount = numericCells[numericCells.length - 1] || 0;
        if (numericCells.length >= 2) {
          const debit = numericCells[numericCells.length - 2] || 0;
          const credit = numericCells[numericCells.length - 1] || 0;
          if (debit && credit) amount = debit - credit;
        }
        records.push({
          sheetName,
          account: accountCell,
          amount,
          raw: cells,
          normalizedAccount: normalizeText(accountCell)
        });
      });
    });

    const balances = summarizeBalances(records);
    return { records, balances };
  }

  function matchTotal(records, keywords) {
    const normalizedKeywords = keywords.map(normalizeText);
    return records
      .filter((record) => normalizedKeywords.some((keyword) => record.normalizedAccount.includes(keyword)))
      .reduce((sum, record) => sum + safe(record.amount), 0);
  }

  function summarizeBalances(records) {
    const map = {
      cash: matchTotal(records, ['cash', 'cash in bank', 'cash on hand', 'cash and cash equivalents']),
      receivables: matchTotal(records, ['receivable', 'accounts receivable', 'trade receivable', 'other receivable']),
      inventory: matchTotal(records, ['inventory', 'merchandise inventory', 'finished goods']),
      prepaid: matchTotal(records, ['prepaid', 'prepayments']),
      ppe: matchTotal(records, ['property plant equipment', 'property and equipment', 'ppe', 'furniture', 'fixture', 'machinery', 'building', 'computer equipment', 'transportation equipment']),
      accumulatedDepreciation: matchTotal(records, ['accumulated depreciation', 'accum dep']),
      intangibleAssets: matchTotal(records, ['intangible', 'software', 'goodwill']),
      payables: matchTotal(records, ['accounts payable', 'trade payable', 'accrued expenses', 'other payable', 'liabilities']),
      borrowings: matchTotal(records, ['loan payable', 'notes payable', 'borrowings', 'bank loan']),
      leaseLiabilities: matchTotal(records, ['lease liability', 'lease liabilities']),
      equity: matchTotal(records, ['capital stock', 'share capital', 'members equity', 'equity']),
      retainedEarnings: matchTotal(records, ['retained earnings', 'surplus']),
      revenue: matchTotal(records, ['revenue', 'sales', 'service income', 'service revenue', 'contract revenue']),
      otherIncome: matchTotal(records, ['other income', 'interest income', 'gain on sale']),
      costOfSales: matchTotal(records, ['cost of sales', 'cost of goods sold', 'cost of service']),
      operatingExpenses: matchTotal(records, ['salary', 'salaries', 'wages', 'rent', 'utilities', 'professional fee', 'supplies expense', 'administrative expense', 'selling expense', 'operating expense', 'depreciation expense']),
      financeCosts: matchTotal(records, ['finance cost', 'interest expense', 'bank charges']),
      incomeTaxExpense: matchTotal(records, ['income tax expense', 'provision for income tax', 'current tax', 'deferred tax expense']),
      deferredTax: matchTotal(records, ['deferred tax asset', 'deferred tax liability', 'deferred tax']),
      relatedPartyBalances: matchTotal(records, ['due from related parties', 'due to related parties', 'related party']),
      rightOfUseAssets: matchTotal(records, ['right of use', 'right-of-use', 'rou asset']),
      totalAssets: matchTotal(records, ['total assets']),
      totalLiabilities: matchTotal(records, ['total liabilities']),
      totalEquity: matchTotal(records, ['total equity'])
    };

    if (!map.totalAssets) {
      map.totalAssets = positive(map.cash) + positive(map.receivables) + positive(map.inventory) + positive(map.prepaid) + positive(map.ppe - abs(map.accumulatedDepreciation)) + positive(map.intangibleAssets) + positive(map.rightOfUseAssets);
    }
    if (!map.totalLiabilities) {
      map.totalLiabilities = abs(map.payables) + abs(map.borrowings) + abs(map.leaseLiabilities);
    }
    if (!map.totalEquity) {
      map.totalEquity = abs(map.equity) + abs(map.retainedEarnings);
      if (!map.totalEquity) map.totalEquity = Math.max(0, map.totalAssets - map.totalLiabilities);
    }

    map.netIncomeBeforeTax = positive(map.revenue) + positive(map.otherIncome) - abs(map.costOfSales) - abs(map.operatingExpenses) - abs(map.financeCosts);
    map.netIncomeAfterTax = map.netIncomeBeforeTax - abs(map.incomeTaxExpense);
    return map;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2
    }).format(safe(value));
  }

  function entityName(entity) {
    return entity?.entityName || '[Entity Name]';
  }

  function periodLabel(entity) {
    return entity?.fiscalYearEnd || new Date().toLocaleDateString();
  }

  function noteTemplate(title, body) {
    return `${title}\n\n${body}`;
  }

  function generateStandardNotes(ctx) {
    const entity = entityName(ctx.entity);
    const period = periodLabel(ctx.entity);
    const framework = ctx.frameworkName || 'PFRS';
    const b = ctx.balances || {};
    const hasLeases = abs(b.leaseLiabilities) || abs(b.rightOfUseAssets);

    const notes = [
      noteTemplate('NOTE 1 - CORPORATE INFORMATION', `${entity} is the reporting entity covered by these draft notes to financial statements for the period ended ${period}. These notes were auto-drafted from uploaded balances and should be finalized against the signed trial balance, board-approved accounting policies, tax returns, and supporting schedules.`),
      noteTemplate('NOTE 2 - STATEMENT OF COMPLIANCE', `The accompanying financial statements have been prepared in accordance with ${framework}, the applicable pronouncements of the Financial Reporting Standards Council, and relevant regulatory presentation requirements. Final compliance wording should be aligned to the actual reporting framework used by management and the external auditor.`),
      noteTemplate('NOTE 3 - BASIS OF PREPARATION AND PRESENTATION', `The financial statements have been prepared on the historical cost basis except where a different measurement basis is required by the applicable framework. The financial statements are presented in Philippine Peso (PHP), which is the functional and presentation currency of ${entity}. Management remains responsible for validating final classifications, comparative balances, and all disclosures.`),
      noteTemplate('NOTE 4 - SIGNIFICANT ACCOUNTING POLICIES, JUDGMENTS, AND ESTIMATES', `Management uses judgment in classifying assets and liabilities as current or non-current, assessing expected credit losses, estimating useful lives of depreciable assets, determining provisions and contingencies, evaluating deferred tax, and assessing going concern. Final wording should be customized to the entity’s actual operations, contracts, and regulatory environment.`),
      noteTemplate('NOTE 5 - CASH AND CASH EQUIVALENTS', `Uploaded balances indicate cash and cash equivalents of approximately ${formatCurrency(b.cash)} as at ${period}. Final disclosure should distinguish unrestricted cash, petty cash, cash in bank, short-term placements, and any amounts subject to restriction or lien.`),
      noteTemplate('NOTE 6 - RECEIVABLES AND CREDIT RISK', `Uploaded balances indicate receivables of approximately ${formatCurrency(b.receivables)}. Final disclosure should include aging, expected credit loss methodology, related allowance accounts, and a discussion of concentration of credit risk where material.`),
      noteTemplate('NOTE 7 - PROPERTY AND EQUIPMENT', `Gross property and equipment balances detected approximate ${formatCurrency(b.ppe)} while accumulated depreciation approximates ${formatCurrency(abs(b.accumulatedDepreciation))}. The resulting net carrying amount approximates ${formatCurrency(b.ppe - abs(b.accumulatedDepreciation))}. Final disclosure should include movements for additions, disposals, transfers, depreciation, and any impairment losses.`),
      noteTemplate('NOTE 8 - ACCOUNTS PAYABLE, ACCRUALS, AND OTHER LIABILITIES', `Uploaded balances indicate payables and accruals of approximately ${formatCurrency(abs(b.payables))}. Final disclosure should distinguish trade payables, accrued expenses, taxes payable, contract liabilities, and other material liabilities.`),
      noteTemplate('NOTE 9 - BORROWINGS AND FINANCE COSTS', `Uploaded balances indicate borrowings of approximately ${formatCurrency(abs(b.borrowings))} and finance costs of approximately ${formatCurrency(abs(b.financeCosts))}. Final disclosure should include borrowing terms, interest rates, maturity profile, collateral, covenant compliance, and current versus non-current split.`),
      noteTemplate('NOTE 10 - EQUITY', `Uploaded balances indicate capital or members’ equity of approximately ${formatCurrency(abs(b.equity))}, retained earnings or surplus of approximately ${formatCurrency(abs(b.retainedEarnings))}, and current period net income after tax of approximately ${formatCurrency(b.netIncomeAfterTax)}. Final disclosure should reflect authorized capital, issued shares, subscriptions, appropriations, and dividend declarations where applicable.`),
      noteTemplate('NOTE 11 - REVENUE', `Revenue-related balances detected approximate ${formatCurrency(b.revenue)}. Final disclosure should identify major revenue streams, timing of recognition, performance obligations, significant payment terms, and whether revenue is recognized over time or at a point in time.`),
      noteTemplate('NOTE 12 - COSTS AND OPERATING EXPENSES', `Uploaded balances indicate cost of sales or services of approximately ${formatCurrency(abs(b.costOfSales))} and operating expenses of approximately ${formatCurrency(abs(b.operatingExpenses))}. Final disclosure should present material expense captions, nature of expenses, employee benefit expense, depreciation, and professional fees when material.`),
      noteTemplate('NOTE 13 - INCOME TAXES', `Detected income tax expense approximates ${formatCurrency(abs(b.incomeTaxExpense))} and deferred tax-related balances approximate ${formatCurrency(b.deferredTax)}. Final disclosure should include current tax, deferred tax, temporary differences, and reconciliation of accounting income to taxable income or the statutory rate reconciliation, as appropriate.`),
      noteTemplate('NOTE 14 - RELATED PARTY TRANSACTIONS', `Balances that may relate to related parties or due to/due from affiliates approximate ${formatCurrency(b.relatedPartyBalances)}. Final disclosure should identify the nature of relationships, transactions during the year, outstanding balances, key management personnel compensation, and approval processes.`),
      noteTemplate('NOTE 15 - FINANCIAL RISK MANAGEMENT', `Principal financial assets detected include cash of ${formatCurrency(b.cash)} and receivables of ${formatCurrency(b.receivables)}. Principal financial liabilities detected include payables of ${formatCurrency(abs(b.payables))} and borrowings of ${formatCurrency(abs(b.borrowings))}. Final disclosure should address credit risk, liquidity risk, market risk, and capital management.`),
      noteTemplate('NOTE 16 - GOING CONCERN', `Uploaded balances suggest total assets of approximately ${formatCurrency(b.totalAssets)}, total liabilities of approximately ${formatCurrency(abs(b.totalLiabilities))}, and net income before tax of approximately ${formatCurrency(b.netIncomeBeforeTax)}. Management should finalize the going concern assessment using updated cash flow forecasts, refinancing plans, post-reporting events, and covenant status.`),
      noteTemplate('NOTE 17 - COMMITMENTS, CONTINGENCIES, AND SUBSEQUENT EVENTS', `These draft notes do not automatically detect unrecorded commitments, legal contingencies, guarantees, or post-reporting date events. Management and legal counsel should complete this note manually based on signed contracts, board minutes, and post-period developments.`)
    ];

    if (hasLeases) {
      notes.splice(10, 0, noteTemplate('NOTE 11A - LEASES', `Uploaded balances indicate right-of-use assets of approximately ${formatCurrency(b.rightOfUseAssets)} and lease liabilities of approximately ${formatCurrency(abs(b.leaseLiabilities))}. Final disclosure should include maturity analysis, additions, interest expense, depreciation on right-of-use assets, short-term or low-value lease exemptions, and discount rates used.`));
    }

    return notes;
  }

  function generateNote(type, ctx) {
    const notes = {
      note_revenue: 'NOTE 11 - REVENUE',
      note_ppe: 'NOTE 7 - PROPERTY AND EQUIPMENT',
      note_income_tax: 'NOTE 13 - INCOME TAXES',
      note_related_party: 'NOTE 14 - RELATED PARTY TRANSACTIONS',
      note_going_concern: 'NOTE 16 - GOING CONCERN',
      note_leases: 'NOTE 11A - LEASES'
    };
    const list = generateStandardNotes(ctx);
    const desired = notes[type];
    return list.find((item) => item.startsWith(desired)) || list[0];
  }

  function generateFullNotesPack(entity, framework, balances, extraContext) {
    const ctx = {
      entity,
      frameworkName: framework?.name || framework || 'PFRS',
      balances: balances || {},
      extraContext: extraContext || ''
    };
    const header = [
      entityName(entity),
      'NOTES TO FINANCIAL STATEMENTS',
      `Period End: ${periodLabel(entity)}`,
      `Framework: ${ctx.frameworkName}`,
      'Status: Draft generated from uploaded balances; requires management and audit finalization.'
    ];
    if (ctx.extraContext) header.push(`Context: ${ctx.extraContext}`);
    return `${header.join('\n')}\n\n${generateStandardNotes(ctx).join('\n\n')}`;
  }

  function reviewNotesDraft(text, options = {}) {
    const draft = String(text || '');
    const clean = draft.toLowerCase();
    const findings = [];
    const missing = [];
    const strengths = [];
    let score = 100;

    const requiredAreas = [
      ['corporate information', /corporate information|nature of operations|entity information/],
      ['statement of compliance', /statement of compliance|prepared in accordance/],
      ['basis of preparation', /basis of preparation|historical cost|presentation currency/],
      ['significant accounting policies', /significant accounting policies|judgments|estimates/],
      ['cash note', /cash and cash equivalents/],
      ['receivables note', /receivables|accounts receivable|trade receivables/],
      ['property and equipment note', /property and equipment|property, plant and equipment|ppe/],
      ['payables note', /payables|accounts payable|accrued expenses/],
      ['equity note', /equity|capital stock|members.? equity|retained earnings/],
      ['revenue note', /revenue/],
      ['expense note', /operating expenses|cost of sales|cost of services/],
      ['income tax note', /income tax|deferred tax/],
      ['related party note', /related party/],
      ['financial risk note', /financial risk|credit risk|liquidity risk/],
      ['going concern note', /going concern/],
      ['commitments / contingencies / subsequent events note', /commitments|contingencies|subsequent events/]
    ];

    requiredAreas.forEach(([label, pattern]) => {
      if (!pattern.test(clean)) {
        missing.push(label);
        score -= 4;
      }
    });

    if ((options.balances?.leaseLiabilities || options.balances?.rightOfUseAssets) && !/lease/.test(clean)) {
      missing.push('lease note');
      score -= 5;
    }

    if (!/note\s+\d+/i.test(draft)) {
      findings.push('No clear note numbering detected. Use sequential note numbering for formal FS presentation.');
      score -= 10;
    } else {
      strengths.push('Note numbering detected.');
    }

    const placeholderMatches = draft.match(/\[(.*?)\]|\bTBD\b|\bto be provided\b|\bxxx\b/gi) || [];
    if (placeholderMatches.length) {
      findings.push(`Placeholder text detected (${placeholderMatches.slice(0, 6).join(', ')}). Replace all drafting placeholders before issuance.`);
      score -= Math.min(18, placeholderMatches.length * 3);
    }

    if (!/philippine peso|php|presentation currency/i.test(clean)) {
      findings.push('Presentation currency wording is not clearly stated.');
      score -= 4;
    } else {
      strengths.push('Presentation currency wording detected.');
    }

    if (!/management/i.test(clean)) {
      findings.push('Management responsibility / judgment wording is weak or missing.');
      score -= 4;
    }

    if (!/period ended|year ended|as of/i.test(clean)) {
      findings.push('Reporting period wording is weak or missing.');
      score -= 5;
    }

    if ((draft.match(/NOTE\s+\d+/gi) || []).length >= 8) {
      strengths.push('Multi-note structure detected.');
    }

    if (draft.length < 1800) {
      findings.push('Draft appears short for a full notes pack and may still be incomplete.');
      score -= 6;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      findings,
      missing,
      strengths,
      prompts: buildSuggestedPrompts(missing, options.balances || {}),
      explanation: buildReviewExplanation(findings, missing, options.frameworkName || 'PFRS')
    };
  }

  function buildSuggestedPrompts(missing = [], balances = {}) {
    const prompts = [];
    missing.slice(0, 8).forEach((item) => {
      prompts.push(`Draft the ${item} in formal notes-to-financial-statements style using my uploaded balances.`);
    });
    if (balances.revenue) prompts.push('Rewrite the revenue note in audit-ready format with major revenue streams and recognition wording.');
    if (balances.ppe) prompts.push('Prepare a formal property and equipment note with policy wording and movement schedule placeholders.');
    if (balances.incomeTaxExpense || balances.deferredTax) prompts.push('Prepare a formal income tax note with current tax, deferred tax, and reconciliation narrative.');
    if (balances.leaseLiabilities || balances.rightOfUseAssets) prompts.push('Prepare a full leases note with right-of-use assets, lease liabilities, maturity analysis, and discount rate wording.');
    return prompts;
  }

  function buildReviewExplanation(findings = [], missing = [], framework = 'PFRS') {
    const lines = [`AI REVIEW EXPLANATION`, `Framework context: ${framework}`, ''];
    if (missing.length) {
      lines.push('Missing areas that usually matter in a full notes pack:');
      missing.forEach((item) => lines.push(`- ${item}: reviewers typically expect this area to be covered explicitly when relevant.`));
      lines.push('');
    }
    if (findings.length) {
      lines.push('Draft issues detected:');
      findings.forEach((item) => lines.push(`- ${item}`));
      lines.push('');
    }
    lines.push('Recommended fix order:');
    lines.push('- Replace placeholders and finalize note numbering first.');
    lines.push('- Add missing mandatory notes next.');
    lines.push('- Reconcile narrative disclosures to the signed trial balance and schedules.');
    return lines.join('\n');
  }

  function renderSummaryHtml(balances) {
    const entries = [
      ['Cash and cash equivalents', balances.cash],
      ['Receivables', balances.receivables],
      ['Inventory', balances.inventory],
      ['Property and equipment, net', safe(balances.ppe) - abs(balances.accumulatedDepreciation)],
      ['Payables and accruals', abs(balances.payables)],
      ['Borrowings', abs(balances.borrowings)],
      ['Revenue', balances.revenue],
      ['Income tax expense', abs(balances.incomeTaxExpense)],
      ['Total assets', balances.totalAssets],
      ['Total liabilities', abs(balances.totalLiabilities)],
      ['Total equity', balances.totalEquity],
      ['Net income after tax', balances.netIncomeAfterTax]
    ];

    return entries
      .filter(([, value]) => safe(value) !== 0)
      .map(([label, value]) => `<div class="metric-row"><span>${label}</span><strong>${formatCurrency(value)}</strong></div>`)
      .join('') || '<div>No major balances detected yet.</div>';
  }

  window.CAPO_NOTES_ENGINE = {
    parseWorkbook,
    generateFullNotesPack,
    generateNote,
    reviewNotesDraft,
    buildSuggestedPrompts,
    buildReviewExplanation,
    renderSummaryHtml,
    formatCurrency
  };
})();