(function () {
  function safe(value) {
    return Number(value || 0);
  }

  function php(value) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2
    }).format(safe(value));
  }

  function buildFinancialStatements(entity, balances) {
    const yearEnd = entity.fiscalYearEnd || new Date().toISOString().slice(0, 10);
    const entityName = entity.entityName || '[Entity Name]';

    const statementOfFinancialPosition = {
      currentAssets: [
        ['Cash and cash equivalents', positive(balances.cash)],
        ['Receivables', positive(balances.receivables)],
        ['Inventory', positive(balances.inventory)],
        ['Prepayments and other current assets', positive(balances.prepaid)]
      ],
      nonCurrentAssets: [
        ['Property and equipment, net', positive(safe(balances.ppe) - Math.abs(safe(balances.accumulatedDepreciation)))],
        ['Intangible assets', positive(balances.intangibleAssets)],
        ['Right-of-use assets', positive(balances.rightOfUseAssets)]
      ],
      currentLiabilities: [
        ['Accounts payable and accrued expenses', abs(balances.payables)],
        ['Current lease liabilities', abs(balances.leaseLiabilities)],
        ['Current borrowings', abs(balances.borrowings)]
      ],
      nonCurrentLiabilities: [],
      equity: [
        ['Capital / Members’ equity', abs(balances.equity)],
        ['Retained earnings / Surplus', abs(balances.retainedEarnings)],
        ['Current year profit (loss)', safe(balances.netIncomeAfterTax)]
      ]
    };

    const currentAssetsTotal = sum(statementOfFinancialPosition.currentAssets);
    const nonCurrentAssetsTotal = sum(statementOfFinancialPosition.nonCurrentAssets);
    const totalAssets = balances.totalAssets || (currentAssetsTotal + nonCurrentAssetsTotal);

    const currentLiabilitiesTotal = sum(statementOfFinancialPosition.currentLiabilities);
    const nonCurrentLiabilitiesTotal = sum(statementOfFinancialPosition.nonCurrentLiabilities);
    const totalLiabilities = balances.totalLiabilities || (currentLiabilitiesTotal + nonCurrentLiabilitiesTotal);

    const equityTotal = balances.totalEquity || sum(statementOfFinancialPosition.equity);

    const statementOfComprehensiveIncome = {
      revenue: positive(balances.revenue),
      costOfSales: abs(balances.costOfSales),
      grossProfit: positive(balances.revenue) - abs(balances.costOfSales),
      operatingExpenses: abs(balances.operatingExpenses),
      profitBeforeTax: safe(balances.netIncomeBeforeTax),
      incomeTaxExpense: abs(balances.incomeTaxExpense),
      netIncome: safe(balances.netIncomeAfterTax)
    };

    return {
      entityName,
      yearEnd,
      statementOfFinancialPosition,
      totals: {
        currentAssetsTotal,
        nonCurrentAssetsTotal,
        totalAssets,
        currentLiabilitiesTotal,
        nonCurrentLiabilitiesTotal,
        totalLiabilities,
        totalEquity: equityTotal,
        totalLiabilitiesAndEquity: totalLiabilities + equityTotal
      },
      statementOfComprehensiveIncome
    };
  }

  function generateFSPack(entity, balances) {
    const fs = buildFinancialStatements(entity, balances);
    const lines = [];

    lines.push(fs.entityName);
    lines.push('DRAFT FINANCIAL STATEMENTS');
    lines.push(`As of / For the period ended ${fs.yearEnd}`);
    lines.push('');
    lines.push('STATEMENT OF FINANCIAL POSITION');
    lines.push('');
    lines.push('ASSETS');
    lines.push('Current Assets');
    fs.statementOfFinancialPosition.currentAssets.forEach(([label, value]) => {
      if (value) lines.push(`  ${label.padEnd(42, '.')} ${php(value)}`);
    });
    lines.push(`  Total Current Assets${'.'.repeat(23)} ${php(fs.totals.currentAssetsTotal)}`);
    lines.push('Non-Current Assets');
    fs.statementOfFinancialPosition.nonCurrentAssets.forEach(([label, value]) => {
      if (value) lines.push(`  ${label.padEnd(42, '.')} ${php(value)}`);
    });
    lines.push(`  Total Non-Current Assets${'.'.repeat(19)} ${php(fs.totals.nonCurrentAssetsTotal)}`);
    lines.push(`TOTAL ASSETS${'.'.repeat(35)} ${php(fs.totals.totalAssets)}`);
    lines.push('');
    lines.push('LIABILITIES AND EQUITY');
    lines.push('Current Liabilities');
    fs.statementOfFinancialPosition.currentLiabilities.forEach(([label, value]) => {
      if (value) lines.push(`  ${label.padEnd(42, '.')} ${php(value)}`);
    });
    lines.push(`  Total Current Liabilities${'.'.repeat(18)} ${php(fs.totals.currentLiabilitiesTotal)}`);
    lines.push(`TOTAL LIABILITIES${'.'.repeat(30)} ${php(fs.totals.totalLiabilities)}`);
    lines.push('Equity');
    fs.statementOfFinancialPosition.equity.forEach(([label, value]) => {
      if (value) lines.push(`  ${label.padEnd(42, '.')} ${php(value)}`);
    });
    lines.push(`TOTAL EQUITY${'.'.repeat(35)} ${php(fs.totals.totalEquity)}`);
    lines.push(`TOTAL LIABILITIES AND EQUITY${'.'.repeat(18)} ${php(fs.totals.totalLiabilitiesAndEquity)}`);
    lines.push('');
    lines.push('STATEMENT OF COMPREHENSIVE INCOME');
    lines.push(`Revenue${'.'.repeat(42)} ${php(fs.statementOfComprehensiveIncome.revenue)}`);
    lines.push(`Cost of sales / services${'.'.repeat(24)} ${php(fs.statementOfComprehensiveIncome.costOfSales)}`);
    lines.push(`GROSS PROFIT${'.'.repeat(35)} ${php(fs.statementOfComprehensiveIncome.grossProfit)}`);
    lines.push(`Operating expenses${'.'.repeat(29)} ${php(fs.statementOfComprehensiveIncome.operatingExpenses)}`);
    lines.push(`PROFIT BEFORE TAX${'.'.repeat(29)} ${php(fs.statementOfComprehensiveIncome.profitBeforeTax)}`);
    lines.push(`Income tax expense${'.'.repeat(28)} ${php(fs.statementOfComprehensiveIncome.incomeTaxExpense)}`);
    lines.push(`NET INCOME${'.'.repeat(39)} ${php(fs.statementOfComprehensiveIncome.netIncome)}`);
    lines.push('');
    lines.push('SYSTEM NOTE');
    lines.push('These draft financial statements were generated from uploaded workbook balances and still require reconciliation to the final trial balance, comparative balances, and management-approved classifications.');

    return lines.join('\n');
  }

  function sum(items) {
    return items.reduce((total, [, value]) => total + safe(value), 0);
  }

  function positive(value) {
    return Math.max(0, safe(value));
  }

  function abs(value) {
    return Math.abs(safe(value));
  }

  window.CAPO_FS_ENGINE = {
    buildFinancialStatements,
    generateFSPack,
    php
  };
})();