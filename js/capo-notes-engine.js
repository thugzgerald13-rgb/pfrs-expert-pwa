(function () {
  function parseWorkbook(workbook) {
    const records = [];
    const sheetNames = workbook.SheetNames || [];

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const extracted = extractRows(rows, sheetName);
      records.push(...extracted);
    });

    const normalized = normalizeRecords(records);
    const balances = summarizeBalances(normalized);
    return { records: normalized, balances };
  }

  function extractRows(rows, sheetName) {
    const records = [];
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

      records.push({ sheetName, account: accountCell, amount, raw: cells });
    });
    return records;
  }

  function looksLikeHeader(cells) {
    const joined = cells.join(' ').toLowerCase();
    return ['account', 'description', 'debit', 'credit', 'balance', 'amount'].some((word) => joined.includes(word));
  }

  function looksLikeAmount(value) {
    return /^\(?-?[\d,]+(?:\.\d+)?\)?$/.test(String(value).trim());
  }

  function parseAmount(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (!looksLikeAmount(raw)) return null;
    const negative = raw.startsWith('(') && raw.endsWith(')');
    const cleaned = raw.replace(/[(),]/g, '');
    const num = Number(cleaned);
    if (Number.isNaN(num)) return null;
    return negative ? -num : num;
  }

  function normalizeRecords(records) {
    return records.map((record) => ({
      ...record,
      normalizedAccount: normalizeText(record.account)
    }));
  }

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
      equity: matchTotal(records, ['capital stock', 'share capital', 'retained earnings', 'equity', 'members equity']),
      revenue: matchTotal(records, ['revenue', 'sales', 'service income', 'service revenue', 'contract revenue']),
      costOfSales: matchTotal(records, ['cost of sales', 'cost of goods sold', 'cost of service']),
      operatingExpenses: matchTotal(records, ['salary', 'salaries', 'wages', 'rent', 'utilities', 'professional fee', 'supplies expense', 'administrative expense', 'selling expense', 'operating expense', 'depreciation expense']),
      incomeTaxExpense: matchTotal(records, ['income tax expense', 'provision for income tax', 'current tax', 'deferred tax expense']),
      deferredTax: matchTotal(records, ['deferred tax asset', 'deferred tax liability', 'deferred tax']),
      relatedPartyBalances: matchTotal(records, ['due from related parties', 'due to related parties', 'related party']),
      rightOfUseAssets: matchTotal(records, ['right of use', 'right-of-use', 'rou asset']),
      retainedEarnings: matchTotal(records, ['retained earnings', 'surplus']),
      totalAssets: matchTotal(records, ['total assets']),
      totalLiabilities: matchTotal(records, ['total liabilities']),
      totalEquity: matchTotal(records, ['total equity'])
    };

    if (!map.totalAssets) {
      map.totalAssets = positive(map.cash) + positive(map.receivables) + positive(map.inventory) + positive(map.prepaid) + positive(map.ppe - Math.abs(map.accumulatedDepreciation)) + positive(map.intangibleAssets) + positive(map.rightOfUseAssets);
    }
    if (!map.totalLiabilities) {
      map.totalLiabilities = Math.abs(map.payables) + Math.abs(map.borrowings) + Math.abs(map.leaseLiabilities);
    }
    if (!map.totalEquity) {
      map.totalEquity = Math.abs(map.equity) || Math.max(0, map.totalAssets - map.totalLiabilities);
    }
    map.netIncomeBeforeTax = (map.revenue - Math.abs(map.costOfSales) - Math.abs(map.operatingExpenses));
    map.netIncomeAfterTax = map.netIncomeBeforeTax - Math.abs(map.incomeTaxExpense);
    return map;
  }

  function positive(value) {
    return Number(value || 0) > 0 ? Number(value || 0) : 0;
  }

  function matchTotal(records, keywords) {
    const normalizedKeywords = keywords.map(normalizeText);
    return records
      .filter((record) => normalizedKeywords.some((keyword) => record.normalizedAccount.includes(keyword)))
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  function balanceTable(balances) {
    const rows = [
      ['Cash and cash equivalents', balances.cash],
      ['Receivables', balances.receivables],
      ['Inventory', balances.inventory],
      ['Property and equipment, net', balances.ppe - Math.abs(balances.accumulatedDepreciation)],
      ['Payables and accruals', balances.payables],
      ['Borrowings', balances.borrowings],
      ['Revenue', balances.revenue],
      ['Income tax expense', balances.incomeTaxExpense],
      ['Total assets', balances.totalAssets],
      ['Total liabilities', balances.totalLiabilities],
      ['Total equity', balances.totalEquity]
    ];
    return rows
      .filter(([, value]) => Number(value || 0) !== 0)
      .map(([label, value]) => `- ${label}: ${formatCurrency(value)}`)
      .join('\n');
  }

  function generateNote(type, ctx) {
    const { entityName, balances, frameworkName, context, periodLabel } = ctx;
    const year = periodLabel || new Date().getFullYear();
    switch (type) {
      case 'compliance':
        return `NOTE 1 - STATEMENT OF COMPLIANCE WITH PHILIPPINE FINANCIAL REPORTING STANDARDS\n\nThe accompanying financial statements of ${entityName} have been prepared in accordance with ${frameworkName} as issued by the Financial Reporting Standards Council and the applicable provisions of SRC Rule 68, as amended. Management used the entity’s uploaded accounting data and trial balance as a starting point for these draft notes for the period ended ${year}.`;
      case 'basis':
        return `NOTE 2 - BASIS OF PREPARATION\n\nThe financial statements have been prepared on the historical cost basis unless otherwise indicated. The financial statements are presented in Philippine Peso (PHP), which is the functional and presentation currency of ${entityName}.\n\nBased on the uploaded balances, the draft statement of financial position includes approximately:\n${balanceTable(balances) || '- No material balances were detected from the uploaded workbook.'}`;
      case 'judgments':
        return `NOTE 3 - SIGNIFICANT ACCOUNTING JUDGMENTS AND ESTIMATES\n\nIn preparing the financial statements, management exercised judgment over revenue recognition, impairment of receivables, useful lives of depreciable assets, recognition of deferred tax, and whether liabilities and contingencies require separate disclosure. These draft notes should be finalized against the entity’s signed trial balance, schedules, and tax computations.`;
      case 'ppe':
        return `NOTE 4 - PROPERTY AND EQUIPMENT\n\nProperty and equipment are carried at cost less accumulated depreciation and impairment, if any. Based on the uploaded workbook, gross property and equipment balances detected approximate ${formatCurrency(balances.ppe)} and accumulated depreciation approximate ${formatCurrency(Math.abs(balances.accumulatedDepreciation))}. The resulting net carrying amount approximates ${formatCurrency(balances.ppe - Math.abs(balances.accumulatedDepreciation))}.\n\nA full movement schedule should still be reconciled to additions, disposals, transfers, and depreciation expense for the period.`;
      case 'revenue':
        return `NOTE 5 - REVENUE\n\nRevenue is recognized when control of goods or services is transferred to customers in an amount that reflects the consideration expected to be received. Based on the uploaded workbook, revenue-related balances detected approximate ${formatCurrency(balances.revenue)}. Management should align the final note with the actual nature of revenue streams, billing terms, and performance obligations.`;
      case 'related_party':
        return `NOTE 6 - RELATED PARTY DISCLOSURES\n\nRelated parties include shareholders, directors, key management personnel, close family members, and entities under common control or significant influence. Uploaded balances indicate approximately ${formatCurrency(balances.relatedPartyBalances)} in accounts that may relate to related parties or due to/due from affiliates. These balances must be validated against supporting schedules and board-approved related party transaction policies.`;
      case 'income_tax':
        return `NOTE 7 - INCOME TAXES\n\nCurrent income tax is based on taxable profit for the year. Deferred tax is recognized on temporary differences when required by the applicable framework. Based on the uploaded workbook, income tax expense balances detected approximate ${formatCurrency(Math.abs(balances.incomeTaxExpense))} and deferred tax-related balances approximate ${formatCurrency(balances.deferredTax)}. A proper reconciliation between accounting income and taxable income should still be prepared.`;
      case 'financial_risk':
        return `NOTE 8 - FINANCIAL RISK MANAGEMENT\n\nThe entity’s principal financial assets appear to include cash of approximately ${formatCurrency(balances.cash)} and receivables of approximately ${formatCurrency(balances.receivables)}. Principal financial liabilities detected include payables of approximately ${formatCurrency(Math.abs(balances.payables))}, borrowings of approximately ${formatCurrency(Math.abs(balances.borrowings))}, and lease liabilities of approximately ${formatCurrency(Math.abs(balances.leaseLiabilities))}. Management should supplement this draft with maturity profiles, credit risk policies, and any market risk exposures.`;
      case 'going_concern':
        return `NOTE 9 - GOING CONCERN\n\nManagement prepared these financial statements on a going concern basis. Based on the uploaded data, estimated total assets amount to ${formatCurrency(balances.totalAssets)}, total liabilities amount to ${formatCurrency(Math.abs(balances.totalLiabilities))}, and estimated net income before tax amounts to ${formatCurrency(balances.netIncomeBeforeTax)}. Final going concern conclusions should consider cash flows, debt maturities, covenants, and post-reporting events.`;
      case 'leases':
        return `NOTE 10 - LEASES\n\nThe entity recognizes right-of-use assets and lease liabilities for leases, except where exemptions apply. Uploaded balances indicate approximately ${formatCurrency(balances.rightOfUseAssets)} in right-of-use assets and ${formatCurrency(Math.abs(balances.leaseLiabilities))} in lease liabilities. The final note should be supported by a lease rollforward, maturity analysis, and discount rate documentation.`;
      default:
        return `NOTE - ${type}\n\nNo data-driven template available yet.`;
    }
  }

  function generateFullNotesPack(entity, framework, balances, extraContext) {
    const entityName = entity.entityName || '[Entity Name]';
    const periodLabel = entity.fiscalYearEnd || new Date().toLocaleDateString();
    const ctx = { entityName, balances, frameworkName: framework.name, context: extraContext || '', periodLabel };
    const types = ['compliance', 'basis', 'judgments', 'ppe', 'revenue', 'related_party', 'income_tax', 'financial_risk', 'going_concern'];
    if (Math.abs(balances.leaseLiabilities) || Math.abs(balances.rightOfUseAssets)) types.push('leases');
    const notes = types.map((type) => generateNote(type, ctx));
    return `${entityName}\nNOTES TO FINANCIAL STATEMENTS\nPeriod End: ${periodLabel}\nFramework: ${framework.name}\n\nSource: Uploaded workbook / trial balance${extraContext ? `\nContext: ${extraContext}` : ''}\n\n${notes.join('\n\n')}`;
  }

  function renderSummaryHtml(balances) {
    const entries = [
      ['Cash', balances.cash],
      ['Receivables', balances.receivables],
      ['Inventory', balances.inventory],
      ['PPE, net', balances.ppe - Math.abs(balances.accumulatedDepreciation)],
      ['Payables', balances.payables],
      ['Borrowings', balances.borrowings],
      ['Revenue', balances.revenue],
      ['Tax Expense', balances.incomeTaxExpense],
      ['Total Assets', balances.totalAssets],
      ['Total Liabilities', balances.totalLiabilities],
      ['Total Equity', balances.totalEquity]
    ];
    return `<div class="score-breakdown">${entries.filter(([,v]) => Number(v || 0) !== 0).map(([label, value]) => `<div class="update-item"><strong>${label}:</strong> ${formatCurrency(value)}</div>`).join('') || '<div class="update-item">No major balances detected yet.</div>'}</div>`;
  }

  window.CAPO_NOTES_ENGINE = {
    parseWorkbook,
    generateFullNotesPack,
    generateNote,
    renderSummaryHtml,
    formatCurrency
  };
})();