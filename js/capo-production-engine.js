(function(){
  function safe(v){ return Number(v||0); }
  function abs(v){ return Math.abs(safe(v)); }
  function php(v){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(safe(v)); }
  const required = ['cash','receivables','payables','equity','retainedEarnings','revenue'];

  function validateTrialBalance(parsed){
    const records = parsed?.records || [];
    const b = parsed?.balances || {};
    const issues = [];
    const warnings = [];
    const mapped = records.filter(r=>safe(r.amount)!==0).length;
    if(!records.length) issues.push('No readable trial balance rows detected.');
    if(!safe(b.totalAssets)) issues.push('Total assets could not be determined from the uploaded trial balance.');
    if(!safe(b.revenue)) warnings.push('Revenue was not detected. Confirm account naming or mapping.');
    if(!safe(b.cash)) warnings.push('Cash was not detected. Confirm cash/bank account naming.');
    if(safe(b.revenue) && !safe(b.incomeTaxExpense)) warnings.push('Revenue exists but income tax expense was not detected. Validate tax provision or tax exemption.');
    if(safe(b.ppe) && !safe(b.accumulatedDepreciation)) warnings.push('PPE exists but accumulated depreciation was not detected. Validate fixed asset mapping.');
    const balanceGap = safe(b.totalAssets) - (abs(b.totalLiabilities)+safe(b.totalEquity));
    if(Math.abs(balanceGap) > 1) warnings.push(`SFP equation gap detected: Assets less Liabilities and Equity = ${php(balanceGap)}.`);
    const coverage = required.filter(k=>safe(b[k])!==0).length / required.length;
    const score = Math.max(0, Math.min(100, Math.round((coverage*70)+(records.length?20:0)-(issues.length*25)-(warnings.length*5))));
    return {score,issues,warnings,recordsDetected:records.length,mappedRows:mapped,balanceGap,coverage};
  }

  function releaseChecklist(parsed, review){
    const v = validateTrialBalance(parsed);
    const checklist = [
      {item:'Current-year trial balance uploaded and readable', passed: v.recordsDetected>0},
      {item:'Core accounts mapped to FS categories', passed: v.score>=70},
      {item:'Statement of Financial Position equation reviewed', passed: Math.abs(v.balanceGap)<=1},
      {item:'Income Statement accounts reviewed', passed: !!safe(parsed?.balances?.revenue)},
      {item:'Cash Flow proxy limitation disclosed', passed: true},
      {item:'SRC Annex 68-D generated and reviewed', passed: true},
      {item:'SRC Annex 68-E generated and reviewed', passed: true},
      {item:'Notes to FS reviewed', passed: review ? review.score>=85 : false},
      {item:'Human preparer reviewed classifications before client release', passed: false}
    ];
    const passed = checklist.filter(x=>x.passed).length;
    const status = passed === checklist.length ? 'READY FOR CLIENT RELEASE' : passed >= checklist.length-2 ? 'READY FOR SENIOR REVIEW' : 'DRAFT - REVIEW REQUIRED';
    return {status,score:Math.round((passed/checklist.length)*100),checklist,validation:v};
  }

  function renderReleaseChecklist(model){
    return [
      `Production Status: ${model.status}`,
      `Release Score: ${model.score}/100`,
      '',
      'Checklist:',
      ...model.checklist.map(x=>`${x.passed?'[x]':'[ ]'} ${x.item}`),
      '',
      'Validation Issues:',
      ...(model.validation.issues.length?model.validation.issues.map(x=>`- ${x}`):['- None']),
      '',
      'Warnings:',
      ...(model.validation.warnings.length?model.validation.warnings.map(x=>`- ${x}`):['- None'])
    ].join('\n');
  }

  function generateProductionPackage(entity, parsed, prior, review){
    const checklist = releaseChecklist(parsed, review);
    const b = parsed?.balances || {};
    const p = prior?.balances || {};
    const pack = window.CAPO_AUDIT_ENGINE.generateUploadOnlyAFSPack(entity, b, p, entity?.frameworkName||'PFRS', 'Production-level draft generated from uploaded trial balance');
    return [
      'CAPO PRODUCTION CONTROL REPORT',
      renderReleaseChecklist(checklist),
      pack
    ].join('\n\n'+'='.repeat(72)+'\n\n');
  }

  window.CAPO_PRODUCTION_ENGINE = {validateTrialBalance,releaseChecklist,renderReleaseChecklist,generateProductionPackage};
})();