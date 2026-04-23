(function () {
  function safe(value) {
    return Number(value || 0);
  }

  function abs(value) {
    return Math.abs(safe(value));
  }

  function php(value) {
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

  function generateSCE(entity, balances) {
    const beginningCapital = abs(balances.equity);
    const beginningRetained = abs(balances.retainedEarnings);
    const netIncome = safe(balances.netIncomeAfterTax);
    const dividends = 0;
    const ending = beginningCapital + beginningRetained + netIncome - dividends;

    return [
      entityName(entity),
      'STATEMENT OF CHANGES IN EQUITY',
      `For the period ended ${periodLabel(entity)}`,
      '',
      `Beginning capital / members’ equity${'.'.repeat(18)} ${php(beginningCapital)}`,
      `Beginning retained earnings / surplus${'.'.repeat(13)} ${php(beginningRetained)}`,
      `Net income for the period${'.'.repeat(24)} ${php(netIncome)}`,
      `Dividends / distributions${'.'.repeat(23)} ${php(dividends)}`,
      `ENDING EQUITY${'.'.repeat(39)} ${php(ending)}`,
      '',
      'SYSTEM NOTE',
      'This draft SCE is auto-assembled from uploaded balances. Final equity rollforward should be reconciled to prior year balances, owner transactions, appropriations, and dividends.'
    ].join('\n');
  }

  function generateCashFlow(entity, balances) {
    const depreciation = abs(balances.accumulatedDepreciation);
    const receivablesChangeProxy = -safe(balances.receivables);
    const inventoryChangeProxy = -safe(balances.inventory);
    const prepaidChangeProxy = -safe(balances.prepaid);
    const payablesChangeProxy = abs(balances.payables);
    const investing = -(safe(balances.ppe) + safe(balances.intangibleAssets) + safe(balances.rightOfUseAssets));
    const financing = abs(balances.borrowings) + abs(balances.leaseLiabilities);
    const cfo = safe(balances.netIncomeAfterTax) + depreciation + payablesChangeProxy + receivablesChangeProxy + inventoryChangeProxy + prepaidChangeProxy;
    const netChange = cfo + investing + financing;

    return [
      entityName(entity),
      'STATEMENT OF CASH FLOWS',
      `For the period ended ${periodLabel(entity)}`,
      'Indirect Method',
      '',
      `Net income after tax${'.'.repeat(28)} ${php(balances.netIncomeAfterTax)}`,
      'Adjustments for non-cash and working capital items',
      `  Depreciation proxy${'.'.repeat(32)} ${php(depreciation)}`,
      `  Change in receivables (proxy)${'.'.repeat(21)} ${php(receivablesChangeProxy)}`,
      `  Change in inventory (proxy)${'.'.repeat(23)} ${php(inventoryChangeProxy)}`,
      `  Change in prepayments (proxy)${'.'.repeat(20)} ${php(prepaidChangeProxy)}`,
      `  Change in payables (proxy)${'.'.repeat(23)} ${php(payablesChangeProxy)}`,
      `NET CASH FROM OPERATING ACTIVITIES${'.'.repeat(12)} ${php(cfo)}`,
      '',
      `Net cash used in investing activities${'.'.repeat(11)} ${php(investing)}`,
      `Net cash from financing activities${'.'.repeat(13)} ${php(financing)}`,
      `NET INCREASE (DECREASE) IN CASH${'.'.repeat(14)} ${php(netChange)}`,
      `Cash at end of period${'.'.repeat(28)} ${php(balances.cash)}`,
      '',
      'SYSTEM NOTE',
      'This draft cash flow statement uses limited browser-side proxies based on ending balances only. Final cash flow presentation should be rebuilt from comparative balances, detailed general ledger movement, and non-cash adjustments.'
    ].join('\n');
  }

  function generateTaxRecon(entity, balances) {
    const accountingIncome = safe(balances.netIncomeBeforeTax);
    const nonDeductibleProxy = Math.max(0, abs(balances.operatingExpenses) * 0.05);
    const nonTaxableProxy = Math.max(0, safe(balances.otherIncome) * 0.15);
    const taxableIncome = accountingIncome + nonDeductibleProxy - nonTaxableProxy;
    const regularRate = 0.25;
    const taxDue = taxableIncome * regularRate;

    return [
      entityName(entity),
      'TAX RECONCILIATION SCHEDULE',
      `For the period ended ${periodLabel(entity)}`,
      '',
      `Accounting income before tax${'.'.repeat(20)} ${php(accountingIncome)}`,
      `Add: non-deductible items (proxy)${'.'.repeat(16)} ${php(nonDeductibleProxy)}`,
      `Less: non-taxable items (proxy)${'.'.repeat(17)} ${php(nonTaxableProxy)}`,
      `TAXABLE INCOME (PROXY)${'.'.repeat(25)} ${php(taxableIncome)}`,
      `Regular corporate income tax @25%${'.'.repeat(15)} ${php(taxDue)}`,
      `Booked income tax expense${'.'.repeat(23)} ${php(abs(balances.incomeTaxExpense))}`,
      '',
      'SYSTEM NOTE',
      'This schedule is a drafting aid only. Final tax reconciliation must be based on the actual tax computation, permanent and temporary differences, tax incentives, MCIT/RCIT rules, and jurisdiction-specific tax treatment.'
    ].join('\n');
  }

  function wrapSECFormat(entity, sections, frameworkName, extraContext) {
    const cover = [
      entityName(entity),
      'DRAFT ANNUAL FINANCIAL STATEMENTS PACK',
      `For the period ended ${periodLabel(entity)}`,
      `Framework: ${frameworkName || 'PFRS'}`,
      'Prepared in draft form for review against SEC Rule 68 presentation requirements.',
      extraContext ? `Context: ${extraContext}` : ''
    ].filter(Boolean).join('\n');

    return [cover].concat(sections).join('\n\n' + '='.repeat(72) + '\n\n');
  }

  function generateFullAFSPack(entity, balances, framework, extraContext) {
    const frameworkName = framework?.name || framework || 'PFRS';
    const fs = window.CAPO_FS_ENGINE.generateFSPack(entity, balances);
    const sce = generateSCE(entity, balances);
    const cashFlow = generateCashFlow(entity, balances);
    const taxRecon = generateTaxRecon(entity, balances);
    const notes = window.CAPO_NOTES_ENGINE.generateFullNotesPack(entity, { name: frameworkName }, balances, extraContext || '');
    return wrapSECFormat(entity, [fs, sce, cashFlow, taxRecon, notes], frameworkName, extraContext);
  }

  window.CAPO_AFS_ENGINE = {
    generateSCE,
    generateCashFlow,
    generateTaxRecon,
    wrapSECFormat,
    generateFullAFSPack
  };
})();