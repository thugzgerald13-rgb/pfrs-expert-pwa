(function(){
  const KEY='capoSaasWorkspaceV1';
  function uid(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));return db}
  function init(){const db=load();db.clients=db.clients||[];db.projects=db.projects||[];db.settings=db.settings||{plan:'Free MVP',owner:'CAPO'};return save(db)}
  function createClient(data){const db=init();const client={id:uid(),name:data.name||'New Client',tin:data.tin||'',industry:data.industry||'',email:data.email||'',createdAt:new Date().toISOString()};db.clients.push(client);save(db);return client}
  function listClients(){return init().clients}
  function createProject(clientId,data){const db=init();const project={id:uid(),clientId,title:data.title||'AFS Engagement',period:data.period||'',status:'Draft',createdAt:new Date().toISOString(),outputs:[]};db.projects.push(project);save(db);return project}
  function listProjects(clientId){const db=init();return db.projects.filter(p=>!clientId||p.clientId===clientId)}
  function saveOutput(projectId,type,content){const db=init();const p=db.projects.find(x=>x.id===projectId);if(!p)return null;const out={id:uid(),type,content,createdAt:new Date().toISOString()};p.outputs.unshift(out);p.status='Generated';save(db);return out}
  function renderClients(){const clients=listClients();return clients.map(c=>`<div class="metric-row"><span>${c.name}</span><strong>${c.industry||'Client'}</strong></div>`).join('')||'<div>No clients yet.</div>'}
  function renderProjects(clientId){const projects=listProjects(clientId);return projects.map(p=>`<div class="metric-row"><span>${p.title} - ${p.period}</span><strong>${p.status}</strong></div>`).join('')||'<div>No projects yet.</div>'}
  function exportWorkspace(){const db=init();const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='capo-saas-workspace-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  window.CAPO_SAAS_ENGINE={init,createClient,listClients,createProject,listProjects,saveOutput,renderClients,renderProjects,exportWorkspace};
})();