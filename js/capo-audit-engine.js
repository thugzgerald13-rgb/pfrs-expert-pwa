(function () {
  function safe(v){ return Number(v || 0); }
  function abs(v){ return Math.abs(safe(v)); }
  function php(v){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(safe(v)); }
  function pct(v){ return `${(safe(v)*100).toFixed(2)}%`; }
  function name(entity){ return entity?.entityName || '[Entity Name from Trial Balance]'; }
  function period(entity){ return entity?.fiscalYearEnd || 'Current Reporting Period'; }

  function line(label, current, prior){
    return `${String(label).padEnd(42,'.')} ${php(current).padStart(18)} ${php(prior).padStart(18)} ${php(safe(current)-safe(prior)).padStart(18)}`;
  }

  function generateComparativeSummary(entity, current={}, prior={}){
    return [
      name(entity),
      'COMPARATIVE FINANCIAL STATEMENT SUMMARY',
      `For the period ended ${period(entity)}`,
      '',
      `${'Account'.padEnd(42)} ${'Current'.padStart(18)} ${'Comparative'.padStart(18)} ${'Movement'.padStart(18)}`,
      '-'.repeat(100),
      line('Cash and cash equivalents', current.cash, prior.cash),
      line('Receivables', current.receivables, prior.receivables),
      line('Inventory', current.inventory, prior.inventory),
      line('Property and equipment, net', safe(current.ppe)-abs(current.accumulatedDepreciation), safe(prior.ppe)-abs(prior.accumulatedDepreciation)),
      line('Total assets', current.totalAssets, prior.totalAssets),
      line('Payables and accruals', abs(current.payables), abs(prior.payables)),
      line('Borrowings', abs(current.borrowings), abs(prior.borrowings)),
      line('Total liabilities', abs(current.totalLiabilities), abs(prior.totalLiabilities)),
      line('Total equity', current.totalEquity, prior.totalEquity),
      line('Revenue', current.revenue, prior.revenue),
      line('Net income after tax', current.netIncomeAfterTax, prior.netIncomeAfterTax),
      '',
      'SYSTEM NOTE',
      'Comparative amounts are generated from the comparative workbook if uploaded. If no comparative workbook is uploaded, the comparative column defaults to zero or blank-equivalent values.'
    ].join('\n');
  }

  function generateRetainedEarningsStatement(entity, current={}, prior={}){
    const beginningRE = abs(prior.retainedEarnings || current.retainedEarnings || 0);
    const netIncome = safe(current.netIncomeAfterTax);
    const dividends = 0;
    const appropriations = 0;
    const endingRE = beginningRE + netIncome - dividends - appropriations;
    return [
      name(entity),
      'STATEMENT OF RETAINED EARNINGS',
      `For the period ended ${period(entity)}`,
      '',
      `Retained earnings, beginning${'.'.repeat(28)} ${php(beginningRE)}`,
      `Add: Net income for the period${'.'.repeat(23)} ${php(netIncome)}`,
      `Less: Dividends declared${'.'.repeat(29)} ${php(dividends)}`,
      `Less: Appropriations${'.'.repeat(34)} ${php(appropriations)}`,
      `RETAINED EARNINGS, ENDING${'.'.repeat(25)} ${php(endingRE)}`,
      '',
      'SYSTEM NOTE',
      'Dividends, appropriations, prior period adjustments, treasury shares, and other equity movements must be manually validated against board minutes, GL details, and audited prior year balances.'
    ].join('\n');
  }

  function generateSRCAnnex68D(entity, current={}, prior={}){
    const beginning = abs(prior.retainedEarnings || current.retainedEarnings || 0);
    const netIncome = safe(current.netIncomeAfterTax);
    const unrealizedIncome = 0;
    const nonActualLosses = 0;
    const dividends = 0;
    const appropriations = 0;
    const reversals = 0;
    const ppa = 0;
    const treasury = 0;
    const available = beginning + netIncome - unrealizedIncome + nonActualLosses - dividends - appropriations + reversals + ppa - treasury;
    return [
      name(entity),
      'SRC RULE 68 - ANNEX 68-D',
      'RECONCILIATION OF RETAINED EARNINGS AVAILABLE FOR DIVIDEND DECLARATION',
      `As of ${period(entity)}`,
      '',
      `Unappropriated retained earnings, beginning${'.'.repeat(15)} ${php(beginning)}`,
      '',
      'Add: Net income actually earned / realized during the period',
      `Net income during the period closed to retained earnings${'.'.repeat(5)} ${php(netIncome)}`,
      '',
      'Less: Non-actual / unrealized income, net of tax',
      `Equity in net income of associate / JV${'.'.repeat(18)} ${php(0)}`,
      `Unrealized foreign exchange gain${'.'.repeat(24)} ${php(0)}`,
      `Unrealized actuarial gain${'.'.repeat(29)} ${php(0)}`,
      `Fair value adjustment gains${'.'.repeat(28)} ${php(0)}`,
      `Other unrealized gains / PFRS adjustments${'.'.repeat(13)} ${php(0)}`,
      `Subtotal non-actual income${'.'.repeat(28)} ${php(unrealizedIncome)}`,
      '',
      'Add: Non-actual losses',
      `Depreciation on revaluation increment, after tax${'.'.repeat(9)} ${php(0)}`,
      `PFRS deviation loss / FV loss, after tax${'.'.repeat(16)} ${php(0)}`,
      `Subtotal non-actual losses${'.'.repeat(28)} ${php(nonActualLosses)}`,
      '',
      `Net income actually earned during the period${'.'.repeat(13)} ${php(netIncome - unrealizedIncome + nonActualLosses)}`,
      '',
      'Add (Less):',
      `Dividend declarations during the period${'.'.repeat(18)} ${php(dividends)}`,
      `Appropriations of retained earnings${'.'.repeat(20)} ${php(appropriations)}`,
      `Reversals of appropriations${'.'.repeat(27)} ${php(reversals)}`,
      `Effects of prior period adjustments${'.'.repeat(20)} ${php(ppa)}`,
      `Treasury shares${'.'.repeat(39)} ${php(treasury)}`,
      '',
      `TOTAL RETAINED EARNINGS AVAILABLE FOR DIVIDEND DECLARATION${'.'.repeat(2)} ${php(available)}`,
      '',
      'SYSTEM NOTE',
      'This Annex 68-D draft uses trial-balance-derived net income and retained earnings. All unrealized gains/losses, appropriations, dividends, treasury shares, and prior period adjustments must be reviewed and manually completed before filing.'
    ].join('\n');
  }

  function generateSRCAnnex68E(entity, current={}, prior={}){
    const totalAssets = safe(current.totalAssets);
    const totalLiabilities = abs(current.totalLiabilities);
    const equity = safe(current.totalEquity) || Math.max(0,totalAssets-totalLiabilities);
    const currentAssets = safe(current.cash)+safe(current.receivables)+safe(current.inventory)+safe(current.prepaid);
    const currentLiabilities = abs(current.payables)+abs(current.borrowings)+abs(current.leaseLiabilities);
    const netIncome = safe(current.netIncomeAfterTax);
    const revenue = safe(current.revenue);
    const currentRatio = currentLiabilities ? currentAssets/currentLiabilities : 0;
    const debtEquity = equity ? totalLiabilities/equity : 0;
    const assetEquity = equity ? totalAssets/equity : 0;
    const solvency = totalAssets ? netIncome/totalAssets : 0;
    const profitability = revenue ? netIncome/revenue : 0;
    return [
      name(entity),
      'SRC RULE 68 - ANNEX 68-E',
      'SCHEDULE OF FINANCIAL SOUNDNESS INDICATORS',
      `As of / For the period ended ${period(entity)}`,
      '',
      `${'Indicator'.padEnd(42)} ${'Formula'.padEnd(38)} ${'Result'.padStart(14)}`,
      '-'.repeat(100),
      `${'Current / Liquidity Ratio'.padEnd(42)} ${'Current Assets / Current Liabilities'.padEnd(38)} ${currentRatio.toFixed(2).padStart(14)}`,
      `${'Debt-to-Equity Ratio'.padEnd(42)} ${'Total Liabilities / Total Equity'.padEnd(38)} ${debtEquity.toFixed(2).padStart(14)}`,
      `${'Asset-to-Equity Ratio'.padEnd(42)} ${'Total Assets / Total Equity'.padEnd(38)} ${assetEquity.toFixed(2).padStart(14)}`,
      `${'Solvency Ratio'.padEnd(42)} ${'Net Income / Total Assets'.padEnd(38)} ${pct(solvency).padStart(14)}`,
      `${'Net Profit Margin'.padEnd(42)} ${'Net Income / Revenue'.padEnd(38)} ${pct(profitability).padStart(14)}`,
      '',
      'Supporting Amounts',
      `Current assets${'.'.repeat(40)} ${php(currentAssets)}`,
      `Current liabilities${'.'.repeat(35)} ${php(currentLiabilities)}`,
      `Total assets${'.'.repeat(42)} ${php(totalAssets)}`,
      `Total liabilities${'.'.repeat(37)} ${php(totalLiabilities)}`,
      `Total equity${'.'.repeat(42)} ${php(equity)}`,
      `Revenue${'.'.repeat(47)} ${php(revenue)}`,
      `Net income${'.'.repeat(44)} ${php(netIncome)}`,
      '',
      'SYSTEM NOTE',
      'This Annex 68-E schedule is automatically computed from mapped trial balance totals. Validate all classifications before filing.'
    ].join('\n');
  }

  function generatePPERollforward(entity, current={}, prior={}){
    const openingCost = safe(prior.ppe);
    const additionsProxy = Math.max(0, safe(current.ppe) - safe(prior.ppe));
    const disposalsProxy = Math.max(0, safe(prior.ppe) - safe(current.ppe));
    const closingCost = safe(current.ppe);
    const openingAD = abs(prior.accumulatedDepreciation);
    const depreciationProxy = Math.max(0, abs(current.accumulatedDepreciation) - abs(prior.accumulatedDepreciation));
    const closingAD = abs(current.accumulatedDepreciation);
    return [
      name(entity),
      'PROPERTY AND EQUIPMENT ROLLFORWARD SCHEDULE',
      `For the period ended ${period(entity)}`,
      '',
      'COST',
      `Opening balance${'.'.repeat(43)} ${php(openingCost)}`,
      `Additions / reclassifications proxy${'.'.repeat(25)} ${php(additionsProxy)}`,
      `Disposals / derecognition proxy${'.'.repeat(27)} ${php(disposalsProxy)}`,
      `Closing balance${'.'.repeat(43)} ${php(closingCost)}`,
      '',
      'ACCUMULATED DEPRECIATION',
      `Opening balance${'.'.repeat(43)} ${php(openingAD)}`,
      `Depreciation expense proxy${'.'.repeat(33)} ${php(depreciationProxy)}`,
      `Closing balance${'.'.repeat(43)} ${php(closingAD)}`,
      '',
      `NET BOOK VALUE${'.'.repeat(44)} ${php(closingCost-closingAD)}`,
      '',
      'SYSTEM NOTE',
      'This PPE rollforward uses current and comparative balances as a proxy. Final audit-level rollforward must be reconciled to fixed asset register, additions, disposals, depreciation, impairment, and reclassifications.'
    ].join('\n');
  }

  function generatePHTaxSchedule(entity, b={}, options={}){
    const accountingIncome = safe(b.netIncomeBeforeTax);
    const nonDeductible = Math.max(0, abs(b.operatingExpenses) * 0.05);
    const nonTaxable = Math.max(0, safe(b.otherIncome) * 0.15);
    const taxable = accountingIncome + nonDeductible - nonTaxable;
    const rcitRate = 0.25;
    const rcit = taxable * rcitRate;
    const grossIncome = Math.max(0, safe(b.revenue) - abs(b.costOfSales));
    const mcit = grossIncome * 0.02;
    const taxDue = Math.max(rcit, mcit);
    return [
      name(entity),
      'PHILIPPINE TAX RECONCILIATION AND RCIT/MCIT CHECK',
      `For the period ended ${period(entity)}`,
      '',
      `Accounting income before tax${'.'.repeat(22)} ${php(accountingIncome)}`,
      `Add: non-deductible expenses proxy${'.'.repeat(16)} ${php(nonDeductible)}`,
      `Less: non-taxable income proxy${'.'.repeat(19)} ${php(nonTaxable)}`,
      `Estimated taxable income${'.'.repeat(28)} ${php(taxable)}`,
      '',
      `RCIT at 25% proxy${'.'.repeat(34)} ${php(rcit)}`,
      `Gross income proxy${'.'.repeat(35)} ${php(grossIncome)}`,
      `MCIT at 2% proxy${'.'.repeat(35)} ${php(mcit)}`,
      `Estimated income tax due proxy${'.'.repeat(21)} ${php(taxDue)}`,
      `Booked income tax expense${'.'.repeat(27)} ${php(abs(b.incomeTaxExpense))}`,
      '',
      'PEZA / RBE NOTE',
      'If the entity is PEZA/RBE or subject to special tax regime, this schedule must be replaced with the applicable incentive regime computation, including any separate remittance, LGU share, or regular activity segregation where applicable.',
      '',
      'SYSTEM NOTE',
      'This is not a filed tax computation. It is an audit drafting schedule requiring validation against the final ITR, tax credits, MCIT rules, incentive regime, permanent differences, temporary differences, and BIR guidance.'
    ].join('\n');
  }

  function generateSignaturePages(entity){
    return [
      name(entity),
      'MANAGEMENT APPROVAL AND SIGNATURE PAGE',
      `For the period ended ${period(entity)}`,
      '',
      'The management of the entity is responsible for the preparation and fair presentation of these financial statements, including the notes thereto, in accordance with the applicable financial reporting framework.',
      '',
      'Prepared by:',
      '',
      '______________________________',
      'Accounting / Bookkeeping Preparer',
      'Date: ________________________',
      '',
      'Reviewed by:',
      '',
      '______________________________',
      'Management / Finance Officer',
      'Date: ________________________',
      '',
      'Approved by:',
      '',
      '______________________________',
      'President / General Manager / Authorized Representative',
      'Date: ________________________',
      '',
      '='.repeat(72),
      '',
      'INDEPENDENT AUDITOR REPORT PLACEHOLDER',
      '',
      'Insert the independent auditor’s report here. This application does not issue an audit opinion and does not replace the work of an independent CPA auditor.'
    ].join('\n');
  }

  function generateUploadOnlyAFSPack(entity, current={}, prior={}, framework='PFRS', extra=''){
    const fs = window.CAPO_FS_ENGINE.generateFSPack(entity, current);
    const sciPack = fs;
    const cashFlow = window.CAPO_AFS_ENGINE.generateCashFlow(entity, current);
    const sce = window.CAPO_AFS_ENGINE.generateSCE(entity, current);
    const retained = generateRetainedEarningsStatement(entity, current, prior || {});
    const annex68d = generateSRCAnnex68D(entity, current, prior || {});
    const annex68e = generateSRCAnnex68E(entity, current, prior || {});
    const notes = window.CAPO_NOTES_ENGINE.generateFullNotesPack(entity, {name:framework}, current, extra || 'Generated from uploaded trial balance');
    return [
      'CAPO TRIAL BALANCE TO AFS PACKAGE',
      'Generated directly from uploaded trial balance. Entity save is not required.',
      fs,
      cashFlow,
      sce,
      retained,
      annex68d,
      annex68e,
      notes
    ].join('\n\n' + '='.repeat(72) + '\n\n');
  }

  function generateAuditLevelPack(entity, current={}, prior={}, framework='PFRS', extra=''){
    const base = generateUploadOnlyAFSPack(entity, current, prior, framework, extra || 'CAPO FINAL AUDIT LEVEL DRAFT');
    const comparative = generateComparativeSummary(entity, current, prior || {});
    const ppe = generatePPERollforward(entity, current, prior || {});
    const tax = generatePHTaxSchedule(entity, current, {});
    const signatures = generateSignaturePages(entity);
    const eafs = window.CAPO_EXPORT_ENGINE ? window.CAPO_EXPORT_ENGINE.buildEafsChecklist(entity, {frameworkName:framework}) : '';
    return [
      'CAPO FINAL AUDIT-LEVEL AFS PACKAGE',
      base,
      comparative,
      ppe,
      tax,
      signatures,
      eafs
    ].join('\n\n' + '='.repeat(72) + '\n\n');
  }

  window.CAPO_AUDIT_ENGINE = {
    generateComparativeSummary,
    generateRetainedEarningsStatement,
    generateSRCAnnex68D,
    generateSRCAnnex68E,
    generatePPERollforward,
    generatePHTaxSchedule,
    generateSignaturePages,
    generateUploadOnlyAFSPack,
    generateAuditLevelPack
  };
})();