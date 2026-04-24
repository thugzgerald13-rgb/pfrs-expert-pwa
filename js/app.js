document.addEventListener('DOMContentLoaded', async () => {
  const state = { financialData:null, comparativeData:null, latestOutput:'' };
  const $ = (id)=>document.getElementById(id);

  const sidebar = $('sidebar');
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function openSidebar(){
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-locked');
  }

  function closeSidebar(){
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-locked');
  }

  $('menuToggle')?.addEventListener('click', openSidebar);
  $('closeSidebar')?.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(n=>{
    n.addEventListener('click',()=>{
      if(window.innerWidth < 900) closeSidebar();
    });
  });

  window.addEventListener('resize',()=>{
    if(window.innerWidth >= 900) closeSidebar();
  });

  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX');

  $('fileInput')?.addEventListener('change', async (e)=>{
    const file=e.target.files[0]; if(!file) return;
    const wb = XLSX.read(await file.arrayBuffer(),{type:'array'});
    state.financialData = CAPO_NOTES_ENGINE.parseWorkbook(wb);

    const b = state.financialData.balances;
    updateStats(b);

    const ruleBasis = CAPO_RULE_ENGINE.generateRuleBasis(b);
    setText('ruleBasis',ruleBasis);

    const output = CAPO_AUDIT_ENGINE.generateUploadOnlyAFSPack({},b,{},'PFRS');
    const finalOutput = ruleBasis + "\n\n" + output;

    state.latestOutput = finalOutput;
    setText('generatedDisclosure',finalOutput);

    const review = CAPO_RULE_ENGINE.reviewAgainstRules({balances:b,output:finalOutput});
    setText('ruleReview',CAPO_RULE_ENGINE.renderReview(review));

    const prod = CAPO_PRODUCTION_ENGINE.releaseChecklist(state.financialData,review);
    setText('releaseChecklist',CAPO_PRODUCTION_ENGINE.renderReleaseChecklist(prod));
    setText('validationDetails',JSON.stringify(prod.validation,null,2));
    setText('productionSummary',prod.status);
  });

  function updateStats(b){
    setText('statCash',b.cash||0);
    setText('statRevenue',b.revenue||0);
    setText('statAssets',b.totalAssets||0);
  }

  function setText(id,val){ if($(id)) $(id).textContent=val; }

  function loadScript(src,name){
    return new Promise(res=>{
      if(window[name]) return res();
      const s=document.createElement('script');
      s.src=src; s.onload=res; document.head.appendChild(s);
    });
  }
});