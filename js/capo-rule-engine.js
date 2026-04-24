(function(){
  function safe(v){ return Number(v || 0); }
  function abs(v){ return Math.abs(safe(v)); }
  function has(v){ return abs(v) > 0.005; }
  function php(v){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(safe(v)); }

  const FRAMEWORKS = {
    PFRS: {
      label: 'Philippine Financial Reporting Standards',
      notes: 'Full PFRS reporting logic for general-purpose financial statements. This engine uses structured disclosure rules and does not reproduce copyrighted standards text.'
    },
    SME: {
      label: 'PFRS for SMEs',
      notes: 'SME framework logic with simplified recognition and disclosure orientation. Use when the entity qualifies and management adopts the framework.'
    },
    SE: {
      label: 'PFRS for Small Entities',
      notes: 'Small Entities simplified framework logic. Use only when the entity qualifies under SEC rules and has no public accountability.'
    }
  };

  const RULES = [
    {
      id:'FS-PRESENTATION-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Financial Statement Presentation', severity:'high',
      applies:()=>true,
      requirement:'Prepare a complete FS set with financial position, performance, cash flows, equity/retained earnings where applicable, and notes.',
      generate:(ctx)=>'Ensure the AFS package includes SFP, Income Statement/SCI, Cash Flow, Changes in Equity, Retained Earnings where applicable, and Notes to FS.',
      validate:(ctx)=> ctx.output && /STATEMENT OF FINANCIAL POSITION|DRAFT FINANCIAL STATEMENTS/i.test(ctx.output)
    },
    {
      id:'NOTES-BASIS-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Basis of Preparation', severity:'high',
      applies:()=>true,
      requirement:'Disclose framework, basis of preparation, functional/presentation currency, and significant judgments/estimates.',
      generate:(ctx)=>`Basis of preparation should identify ${ctx.frameworkLabel}, historical cost or applicable measurement basis, Philippine Peso presentation, and key estimates used by management.`,
      validate:(ctx)=> /basis of preparation|statement of compliance|presentation currency|philippine peso|php/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'CASH-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Cash', severity:'medium',
      applies:(b)=>has(b.cash),
      requirement:'Disclose cash and cash equivalents and any restrictions.',
      generate:(ctx)=>`Cash and cash equivalents detected: ${php(ctx.b.cash)}. Review cash in bank, cash on hand, placements, restrictions, and liens.`,
      validate:(ctx)=>/cash and cash equivalents/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'RECEIVABLES-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Receivables / Credit Risk', severity:'medium',
      applies:(b)=>has(b.receivables),
      requirement:'Disclose receivables, impairment/allowance, credit risk, and aging where material.',
      generate:(ctx)=>`Receivables detected: ${php(ctx.b.receivables)}. Include aging, impairment allowance, expected collectability, and concentration risk if material.`,
      validate:(ctx)=>/receivable|credit risk|impairment|allowance/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'INVENTORY-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Inventories', severity:'medium',
      applies:(b)=>has(b.inventory),
      requirement:'Disclose inventory measurement, cost formula, write-downs, and inventory pledged as security where applicable.',
      generate:(ctx)=>`Inventories detected: ${php(ctx.b.inventory)}. Disclose measurement at lower of cost and NRV, cost formula, write-downs, and pledged inventory if any.`,
      validate:(ctx)=>/inventor|net realizable|nrv|cost formula/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'PPE-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Property and Equipment', severity:'high',
      applies:(b)=>has(b.ppe) || has(b.accumulatedDepreciation),
      requirement:'Disclose PPE accounting policy, useful lives, depreciation, carrying amounts, additions, disposals, and impairment where material.',
      generate:(ctx)=>`PPE detected. Gross PPE: ${php(ctx.b.ppe)}; accumulated depreciation: ${php(abs(ctx.b.accumulatedDepreciation))}. Include PPE movement schedule and depreciation policy.`,
      validate:(ctx)=>/property and equipment|ppe|depreciation|carrying amount/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'LEASES-001', source:'PFRS/PFRS for SMEs', area:'Leases', severity:'high',
      applies:(b)=>has(b.rightOfUseAssets) || has(b.leaseLiabilities),
      requirement:'Disclose lease assets/liabilities, maturity, expense, interest, depreciation, and practical expedients where applicable.',
      generate:(ctx)=>`Leases detected. ROU assets: ${php(ctx.b.rightOfUseAssets)}; lease liabilities: ${php(abs(ctx.b.leaseLiabilities))}. Include maturity analysis and lease policy.`,
      validate:(ctx)=>/lease|right.of.use|lease liabilit/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'REVENUE-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Revenue', severity:'high',
      applies:(b)=>has(b.revenue),
      requirement:'Disclose revenue recognition policy, major revenue streams, timing, and significant terms.',
      generate:(ctx)=>`Revenue detected: ${php(ctx.b.revenue)}. Disclose revenue streams, recognition timing, performance obligations or simplified SME/SE equivalent, and payment terms.`,
      validate:(ctx)=>/revenue|sales|service income|performance obligation|recognition/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'TAX-001', source:'NIRC', area:'Income Tax', severity:'high',
      applies:(b)=>has(b.revenue) || has(b.incomeTaxExpense) || has(b.deferredTax),
      requirement:'Prepare tax reconciliation and consider RCIT/MCIT and applicable incentives. Do not treat proxy computation as final tax return.',
      generate:(ctx)=>`Income tax review required. RCIT/MCIT proxy should be reconciled to actual ITR, tax credits, incentives, and permanent/temporary differences.`,
      validate:(ctx)=>/income tax|rcit|mcit|tax reconciliation|deferred tax/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'RELATED-PARTY-001', source:'PFRS/PFRS for SMEs', area:'Related Parties', severity:'medium',
      applies:(b)=>has(b.relatedPartyBalances),
      requirement:'Disclose related party relationships, balances, transactions, terms, and key management compensation where applicable.',
      generate:(ctx)=>`Related party balance indicator detected: ${php(ctx.b.relatedPartyBalances)}. Include relationship, transaction nature, balances, terms, and approvals.`,
      validate:(ctx)=>/related part/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'RISK-001', source:'PFRS/PFRS for SMEs', area:'Financial Risk', severity:'medium',
      applies:(b)=>has(b.cash)||has(b.receivables)||has(b.payables)||has(b.borrowings),
      requirement:'Disclose credit, liquidity, market/capital risk where relevant.',
      generate:(ctx)=>'Financial risk disclosure required: credit risk for cash/receivables, liquidity risk for payables/borrowings, and capital management if material.',
      validate:(ctx)=>/credit risk|liquidity risk|financial risk|capital management/i.test(ctx.notes || ctx.output || '')
    },
    {
      id:'SRC68-D-001', source:'SRC Rule 68', area:'Annex 68-D', severity:'high',
      applies:()=>true,
      requirement:'Generate retained earnings available for dividend declaration schedule when applicable and require manual review of unrealized gains/losses and appropriations.',
      generate:(ctx)=>'SRC Annex 68-D schedule should reconcile retained earnings available for dividend declaration and identify non-actual/unrealized items.',
      validate:(ctx)=>/ANNEX 68-D|RECONCILIATION OF RETAINED EARNINGS AVAILABLE FOR DIVIDEND DECLARATION/i.test(ctx.output || '')
    },
    {
      id:'SRC68-E-001', source:'SRC Rule 68', area:'Annex 68-E', severity:'high',
      applies:()=>true,
      requirement:'Generate financial soundness indicators schedule using current/liquidity, solvency, debt-to-equity, asset-to-equity, and profitability indicators.',
      generate:(ctx)=>'SRC Annex 68-E should show financial soundness indicators and supporting amounts.',
      validate:(ctx)=>/ANNEX 68-E|FINANCIAL SOUNDNESS INDICATORS/i.test(ctx.output || '')
    },
    {
      id:'GOING-CONCERN-001', source:'PFRS/PFRS for SMEs/PFRS for SEs', area:'Going Concern', severity:'high',
      applies:(b)=>true,
      requirement:'Assess going concern using net asset position, profitability, liquidity, and known subsequent events.',
      generate:(ctx)=>`Going concern review: total assets ${php(ctx.b.totalAssets)}, liabilities ${php(abs(ctx.b.totalLiabilities))}, net income ${php(ctx.b.netIncomeAfterTax)}. Management must validate forecasts and post-reporting events.`,
      validate:(ctx)=>/going concern/i.test(ctx.notes || ctx.output || '')
    }
  ];

  function resolveFramework(input){
    const raw = String(input || 'PFRS').toLowerCase();
    if(raw.includes('small entit') || raw.includes('se')) return {key:'SE',...FRAMEWORKS.SE};
    if(raw.includes('sme')) return {key:'SME',...FRAMEWORKS.SME};
    return {key:'PFRS',...FRAMEWORKS.PFRS};
  }

  function applicableRules(balances={}, framework='PFRS'){
    const fw = resolveFramework(framework);
    return RULES.filter(rule=>{
      if(fw.key==='SE' && /LEASES|RELATED-PARTY|RISK/.test(rule.id)) return true;
      return rule.applies(balances || {});
    });
  }

  function generateRuleBasis(balances={}, framework='PFRS'){
    const fw = resolveFramework(framework);
    const ctx = {b: balances || {}, frameworkLabel: fw.label};
    return [
      'CAPO RULE ENGINE v1',
      `Framework: ${fw.label}`,
      fw.notes,
      '',
      'Applicable Rule Basis:',
      ...applicableRules(balances, framework).map(rule=>`- [${rule.id}] ${rule.area}: ${rule.generate(ctx)}`)
    ].join('\n');
  }

  function reviewAgainstRules({balances={}, framework='PFRS', notes='', output=''}={}){
    const fw = resolveFramework(framework);
    const ctx = {b: balances || {}, frameworkLabel: fw.label, notes, output};
    const results = applicableRules(balances, framework).map(rule=>{
      const passed = !!rule.validate(ctx);
      return {id:rule.id, source:rule.source, area:rule.area, severity:rule.severity, passed, requirement:rule.requirement, recommendation:rule.generate(ctx)};
    });
    const failed = results.filter(r=>!r.passed);
    const highFailed = failed.filter(r=>r.severity==='high').length;
    const score = Math.max(0, Math.round(100 - (highFailed*12) - ((failed.length-highFailed)*6)));
    return {framework:fw.label, score, results, failed};
  }

  function renderReview(review){
    return [
      `Framework: ${review.framework}`,
      `Rule Compliance Score: ${review.score}/100`,
      '',
      'Failed / Missing Rule Items:',
      ...(review.failed.length ? review.failed.map(r=>`- [${r.id}] ${r.area} (${r.source}): ${r.recommendation}`) : ['- None detected']),
      '',
      'All Rule Results:',
      ...review.results.map(r=>`${r.passed?'[x]':'[ ]'} ${r.id} - ${r.area}`)
    ].join('\n');
  }

  function enhanceNotesHeader(entity={}, balances={}, framework='PFRS'){
    return [
      'RULE-BASED BASIS FOR NOTES GENERATION',
      generateRuleBasis(balances, framework),
      '',
      'The notes below are generated from structured rule logic and uploaded trial balance classifications. Final wording must be reviewed against the official standard and signed supporting schedules.'
    ].join('\n');
  }

  window.CAPO_RULE_ENGINE = {FRAMEWORKS,RULES,resolveFramework,applicableRules,generateRuleBasis,reviewAgainstRules,renderReview,enhanceNotesHeader};
})();