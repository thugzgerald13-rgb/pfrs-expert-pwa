document.addEventListener('DOMContentLoaded', async () => {
  const storageKey = 'pfrsExpertState';
  const state = { entity: JSON.parse(localStorage.getItem(storageKey) || '{}'), financialData: null };
  const el = (id) => document.getElementById(id);

  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');

  bindEntity(); bindWorkbook(); bindGenerator();

  function bindEntity(){
    el('saveEntityBtn').onclick=()=>{
      state.entity={entityName:el('entityName').value,fiscalYearEnd:el('fiscalYearEnd').value};
      localStorage.setItem(storageKey,JSON.stringify(state.entity));
    };
  }

  function bindWorkbook(){
    el('fileInput').onchange=async(e)=>{
      const f=e.target.files[0]; if(!f)return;
      const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
      const parsed=CAPO_NOTES_ENGINE.parseWorkbook(wb);
      state.financialData=parsed;
      el('reviewResults').textContent=CAPO_AFS_ENGINE.generateFullAFSPack(state.entity,parsed.balances,'PFRS','CLIENT');
    };
  }

  function bindGenerator(){
    el('generateDisclosureBtn').onclick=()=>{
      const b=state.financialData?.balances||{};
      const pack=CAPO_AFS_ENGINE.generateFullAFSPack(state.entity,b,'PFRS','CLIENT READY');
      el('generatedDisclosure').textContent=pack;

      // EXPORT AUTOMATICALLY
      CAPO_EXPORT_ENGINE.exportHtml(state.entity,pack,{frameworkName:'PFRS'});
    };
  }

  function loadScript(src,g){return new Promise(r=>{if(window[g])return r();const s=document.createElement('script');s.src=src;s.onload=r;document.head.appendChild(s);});}
});