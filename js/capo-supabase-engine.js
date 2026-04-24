(function(){
  const LOCAL_KEY='capoSaasWorkspaceV1';
  const CONFIG_KEY='capoSupabaseConfigV1';
  let client=null;
  let session=null;

  function loadLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}')}catch(e){return {}}}
  function saveLocal(db){localStorage.setItem(LOCAL_KEY,JSON.stringify(db));return db}
  function initLocal(){const db=loadLocal();db.clients=db.clients||[];db.projects=db.projects||[];db.outputs=db.outputs||[];return saveLocal(db)}
  function saveConfig(url,anonKey){localStorage.setItem(CONFIG_KEY,JSON.stringify({url,anonKey}));return {url,anonKey}}
  function getConfig(){try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')}catch(e){return {}}}
  async function loadSupabaseLib(){if(window.supabase)return true;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});return !!window.supabase}
  async function connect(url,anonKey){if(!url||!anonKey)throw new Error('Supabase URL and anon key are required. Never use service_role key in browser.');await loadSupabaseLib();client=window.supabase.createClient(url,anonKey);saveConfig(url,anonKey);const res=await client.auth.getSession();session=res.data.session;return {connected:true,session};}
  async function reconnect(){const cfg=getConfig();if(cfg.url&&cfg.anonKey)return connect(cfg.url,cfg.anonKey);return {connected:false,reason:'No Supabase config saved'};}
  async function signUp(email,password){if(!client)await reconnect();return client.auth.signUp({email,password});}
  async function signIn(email,password){if(!client)await reconnect();const res=await client.auth.signInWithPassword({email,password});session=res.data.session;return res;}
  async function signOut(){if(!client)await reconnect();const res=await client.auth.signOut();session=null;return res;}
  async function user(){if(!client)await reconnect();const res=await client.auth.getUser();return res.data.user;}
  async function requireUser(){const u=await user();if(!u)throw new Error('Login required.');return u;}

  async function cloudCreateClient(data){if(!client)await reconnect();const u=await requireUser();const payload={user_id:u.id,name:data.name||'New Client',tin:data.tin||'',industry:data.industry||'',email:data.email||''};return client.from('clients').insert(payload).select().single();}
  async function cloudListClients(){if(!client)await reconnect();await requireUser();return client.from('clients').select('*').order('created_at',{ascending:false});}
  async function cloudCreateProject(clientId,data){if(!client)await reconnect();const u=await requireUser();const payload={user_id:u.id,client_id:clientId,title:data.title||'AFS Engagement',period:data.period||'',status:'Draft'};return client.from('projects').insert(payload).select().single();}
  async function cloudListProjects(clientId){if(!client)await reconnect();await requireUser();let q=client.from('projects').select('*').order('created_at',{ascending:false});if(clientId)q=q.eq('client_id',clientId);return q;}
  async function cloudSaveOutput(projectId,type,content){if(!client)await reconnect();const u=await requireUser();const payload={user_id:u.id,project_id:projectId,type,content};return client.from('afs_outputs').insert(payload).select().single();}

  async function syncLocalToCloud(){if(!client)await reconnect();const u=await requireUser();const db=initLocal();const result={clients:0,projects:0,outputs:0};
    for(const c of db.clients||[]){await client.from('clients').insert({user_id:u.id,name:c.name,tin:c.tin||'',industry:c.industry||'',email:c.email||''});result.clients++;}
    return result;
  }

  window.CAPO_SUPABASE_ENGINE={saveConfig,getConfig,connect,reconnect,signUp,signIn,signOut,user,cloudCreateClient,cloudListClients,cloudCreateProject,cloudListProjects,cloudSaveOutput,syncLocalToCloud};
})();