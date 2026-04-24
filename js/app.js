document.addEventListener('DOMContentLoaded', async () => {
  const storageKey = 'pfrsExpertState';
  const state = { entity: JSON.parse(localStorage.getItem(storageKey) || '{}'), financialData: null, review: null, aiContext: {} };
  const el = (id) => document.getElementById(id);

  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');

  bindEntity(); bindWorkbook(); bindGenerator(); bindReview(); bindAI(); refreshEntity();

  function bindEntity(){
    el('saveEntityBtn').onclick=()=>{ state.entity={entityName:el('entityName').value,fiscalYearEnd:el('fiscalYearEnd').value,frameworkName:el('frameworkSelect').value}; localStorage.setItem(storageKey,JSON.stringify(state.entity)); refreshEntity(); };
  }

  function bindWorkbook(){
    el('fileInput').onchange=async(e)=>{
      const f=e.target.files[0]; if(!f)return;
      const data=await f.arrayBuffer();
      const wb=XLSX.read(data,{type:'array'});
      const parsed=CAPO_NOTES_ENGINE.parseWorkbook(wb);
      state.financialData=parsed;
      const pack=CAPO_AFS_ENGINE.generateFullAFSPack(state.entity,parsed.balances,'PFRS','');
      el('reviewResults').textContent=pack;
    };
  }

  function bindGenerator(){
    el('generateDisclosureBtn').onclick=()=>{
      const t=el('disclosureType').value;
      const b=state.financialData?.balances||{};
      let out='';
      if(t==='full_afs_pack') out=CAPO_AFS_ENGINE.generateFullAFSPack(state.entity,b,'PFRS','');
      else if(t==='full_notes_pack') out=CAPO_NOTES_ENGINE.generateFullNotesPack(state.entity,{name:'PFRS'},b,'');
      else out=CAPO_FS_ENGINE.generateFSPack(state.entity,b);
      el('generatedDisclosure').textContent=out;
    };
  }

  function bindReview(){
    el('reviewNotesBtn').onclick=()=>{
      const txt=el('notesDraftInput').value;
      const res=CAPO_NOTES_ENGINE.reviewNotesDraft(txt,{balances:state.financialData?.balances||{}});
      el('reviewFindings').textContent=JSON.stringify(res,null,2);
    };
  }

  function bindAI(){
    el('aiAskBtn').onclick=()=>{
      el('aiOutput').textContent=CAPO_AI_LAYER.chatReply(el('aiInput').value,state.aiContext);
    };
  }

  function refreshEntity(){
    el('entitySummary').textContent=state.entity.entityName||'No entity';
  }

  function loadScript(src,g){return new Promise(r=>{if(window[g])return r();const s=document.createElement('script');s.src=src;s.onload=r;document.head.appendChild(s);});}
});