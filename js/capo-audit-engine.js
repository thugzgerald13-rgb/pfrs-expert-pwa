(function () {
  function safe(v){ return Number(v || 0); }
  function abs(v){ return Math.abs(safe(v)); }
  function php(v){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(safe(v)); }
  function name(entity){ return entity?.entityName || '[Entity Name]'; }
  function period(entity){ return entity?.fiscalYearEnd || new Date().toLocaleDateString(); }

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
      'Comparative amounts are generated from the comparative workbook if uploaded. If no comparative workbook is uploaded, the comparative column will default to zero or blank-equivalent values.'
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

  function generateAuditLevelPack(entity, current={}, prior={}, framework='PFRS', extra=''){
    const base = window.CAPO_AFS_ENGINE.generateFullAFSPack(entity, current, framework, extra || 'CAPO FINAL AUDIT LEVEL DRAFT');
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
    generatePPERollforward,
    generatePHTaxSchedule,
    generateSignaturePages,
    generateAuditLevelPack
  };
})();