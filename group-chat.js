/* NEXORA group messaging: isolated from existing one-to-one chat. */
document.addEventListener("DOMContentLoaded", () => {
 const page=document.getElementById("messages");
 if(!page)return;
 const layout=document.getElementById("chatLayout");
 const mount=document.createElement("div");
 mount.id="nxGroupsRoot";mount.hidden=true;
 mount.innerHTML=`<div class="nx-groups-header"><button type="button" id="nxGroupsBack">← Şəxsi mesajlar</button><h2>Qrup söhbətləri</h2><button type="button" id="nxNewGroup">＋ Qrup yarat</button></div>
 <div class="nx-groups-layout"><aside id="nxGroupList" class="nx-groups-list"></aside><div class="nx-groups-conversation"><div class="nx-groups-header"><span class="nx-group-title-wrap"><span id="nxGroupAvatar" class="nx-group-avatar">👥</span><strong id="nxGroupTitle">Qrup seç</strong></span><button type="button" id="nxChangeGroupLogo" hidden>Loqonu dəyiş</button><button type="button" id="nxLeaveGroup" hidden>Qrupdan çıx</button></div><div id="nxGroupMessages" class="nx-group-messages"></div><form id="nxGroupSendForm"><input id="nxGroupText" maxlength="4000" placeholder="Qrupa mesaj yaz..." required><button type="submit">Göndər</button></form></div></div>
 <dialog id="nxGroupDialog"><form id="nxGroupCreateForm" class="nx-group-create"><h2>Yeni qrup</h2><label>Qrup adı<input id="nxGroupName" minlength="2" maxlength="60" required></label><label>Qrup loqosu (istəyə bağlı)<input id="nxGroupLogo" type="file" accept="image/png,image/jpeg,image/webp"></label><label>İştirakçı axtar<input id="nxGroupSearch" type="search" placeholder="İstifadəçi adı"></label><div id="nxGroupCandidates"></div><div class="nx-group-actions"><button type="button" id="nxGroupCancel">Ləğv et</button><button type="submit">Qrupu yarat</button></div></form></dialog>`;
 layout.after(mount);
 const toggle=document.createElement("button");toggle.type="button";toggle.id="nxGroupsToggle";toggle.textContent="👥 Qruplar";toggle.className="outline-button";
 page.querySelector(".page-heading")?.append(toggle);
 const el=id=>document.getElementById(id);
 const sb=()=>window.nexoraSupabase;
 let me=null,groups=[],people=[],active=null,poll=null,chosen=new Set(),loading=false;
 const logoBucket="nexora-group-logos";
 function logoUrl(g){if(!g?.logo_path)return null;return sb().storage.from(logoBucket).getPublicUrl(g.logo_path).data.publicUrl;}
 function logoAvatar(g){const span=document.createElement("span");span.className="nx-group-avatar";const url=logoUrl(g);if(url){const img=document.createElement("img");img.src=url;img.alt="";img.onerror=()=>{img.remove();span.textContent="👥";};span.append(img);}else span.textContent="👥";return span;}
 async function uploadLogo(g,file){if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024)throw Error("Loqo PNG, JPG və ya WebP formatında, 2 MB-dan kiçik olmalıdır.");const ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type];const path=`${g.id}/logo-${Date.now()}.${ext}`;const {error}=await sb().storage.from(logoBucket).upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {error:saveError}=await sb().from("nexora_groups").update({logo_path:path}).eq("id",g.id).eq("owner_id",me);if(saveError)throw saveError;g.logo_path=path;}

 const notice=msg=>{const box=el("nxGroupMessages");box.textContent=msg;};
 const safeError=e=>{console.error("NEXORA group chat:",e);notice("Əməliyyat alınmadı. Supabase qrup cədvəllərini və icazələri yoxla.");};
 async function session(){const {data,error}=await sb().auth.getUser();if(error)throw error;me=data.user?.id;return me;}
 async function loadGroups(){
  if(!await session())return notice("Qruplara baxmaq üçün daxil ol.");
  const {data,error}=await sb().from("nexora_group_members").select("group_id,nexora_groups(id,name,owner_id,created_at,logo_path)").eq("user_id",me);
  if(error)throw error;
  groups=(data||[]).map(x=>x.nexora_groups).filter(Boolean).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const list=el("nxGroupList");list.replaceChildren();
  if(!groups.length)list.textContent="Hələ qrup yoxdur. Yeni qrup yarat.";
  for(const g of groups){const b=document.createElement("button");b.type="button";b.append(logoAvatar(g),document.createTextNode(g.name));b.className="nx-group-entry"+(active?.id===g.id?" selected":"");b.onclick=()=>openGroup(g);list.append(b);}
  if(active&&!groups.some(g=>g.id===active.id)){active=null;el("nxGroupTitle").textContent="Qrup seç";el("nxLeaveGroup").hidden=true;el("nxGroupMessages").replaceChildren();}
 }
 async function loadMessages(){
  if(!active||!me)return;
  const id=active.id;
  const {data,error}=await sb().from("nexora_group_messages").select("id,sender_id,body,created_at").eq("group_id",id).order("created_at",{ascending:false}).limit(150);
  if(error)throw error;
  if(active?.id!==id)return;
  const box=el("nxGroupMessages");const near=box.scrollHeight-box.scrollTop-box.clientHeight<90;box.replaceChildren();
  for(const m of (data||[]).reverse()){
   const p=document.createElement("div");p.className="nx-group-bubble"+(m.sender_id===me?" mine":"");
   const author=document.createElement("strong");author.textContent=m.sender_id===me?"Sən":(people.find(x=>x.id===m.sender_id)?.name||people.find(x=>x.id===m.sender_id)?.username||"İstifadəçi");
   const body=document.createElement("p");body.textContent=m.body;
   const time=document.createElement("small");time.textContent=new Date(m.created_at).toLocaleString("az-AZ",{hour:"2-digit",minute:"2-digit"});
   p.append(author,body,time);box.append(p);
  }
  if(near)box.scrollTop=box.scrollHeight;
 }
 async function openGroup(g){active=g;el("nxGroupTitle").textContent=g.name;el("nxGroupAvatar").replaceWith(Object.assign(logoAvatar(g),{id:"nxGroupAvatar"}));el("nxChangeGroupLogo").hidden=g.owner_id!==me;el("nxLeaveGroup").hidden=g.owner_id===me;await loadGroups();await loadMessages();}
 async function loadPeople(){
  const {data,error}=await sb().from("nexora_profiles").select("id,username,name").order("username").limit(1000);
  if(error)throw error;people=data||[];
 }
 function drawCandidates(){
  const term=el("nxGroupSearch").value.trim().toLocaleLowerCase("az");
  const box=el("nxGroupCandidates");box.replaceChildren();
  for(const p of people.filter(p=>p.id!==me&&(p.username||"").toLocaleLowerCase("az").includes(term)).slice(0,50)){
   const label=document.createElement("label"),input=document.createElement("input"),span=document.createElement("span");
   input.type="checkbox";input.checked=chosen.has(p.id);input.onchange=()=>input.checked?chosen.add(p.id):chosen.delete(p.id);
   span.textContent=p.name? p.name+" (@"+p.username+")":"@"+p.username;
   label.append(input,span);box.append(label);
  }
 }
 function stopPoll(){if(poll){clearInterval(poll);poll=null;}}
 async function showGroups(){
  if(!sb())return notice("Supabase bağlantısı yoxdur.");
  layout.hidden=true;mount.hidden=false;toggle.hidden=true;
  try{await session();await loadPeople();await loadGroups();if(active)await loadMessages();}
  catch(e){safeError(e);}
  stopPoll();poll=setInterval(()=>{if(!mount.hidden&&active)loadMessages().catch(safeError);},5000);
 }
 function hideGroups(){stopPoll();mount.hidden=true;layout.hidden=false;toggle.hidden=false;}
 toggle.onclick=showGroups;el("nxGroupsBack").onclick=hideGroups;
 el("nxNewGroup").onclick=()=>{chosen=new Set();el("nxGroupName").value="";el("nxGroupLogo").value="";el("nxGroupSearch").value="";drawCandidates();el("nxGroupDialog").showModal();};
 el("nxGroupSearch").oninput=drawCandidates;
 el("nxGroupCancel").onclick=()=>el("nxGroupDialog").close();
 el("nxGroupCreateForm").onsubmit=async e=>{
  e.preventDefault();if(loading)return;loading=true;
  const name=el("nxGroupName").value.trim();
  try{
   if(!await session())throw Error("Login required");
   if(!chosen.size){alert("Ən azı bir iştirakçı seç.");return;}
   const {data:g,error}=await sb().from("nexora_groups").insert({name,owner_id:me}).select("id,name,owner_id,created_at,logo_path").single();
   if(error)throw error;
   const {error:membersError}=await sb().from("nexora_group_members").insert([...chosen].map(user_id=>({group_id:g.id,user_id})));
   if(membersError){alert("Qrup yaradıldı, amma iştirakçıları əlavə etmək mümkün olmadı. İcazələri yoxla.");throw membersError;}
   const logo=el("nxGroupLogo").files[0];if(logo){try{await uploadLogo(g,logo);}catch(logoError){console.error(logoError);alert("Qrup yaradıldı, amma loqo yüklənmədi: "+logoError.message);}}
   el("nxGroupDialog").close();await loadGroups();await openGroup(g);
  }catch(err){safeError(err);}finally{loading=false;}
 };
 el("nxChangeGroupLogo").onclick=()=>{if(!active||active.owner_id!==me)return;const picker=document.createElement("input");picker.type="file";picker.accept="image/png,image/jpeg,image/webp";picker.onchange=async()=>{const file=picker.files?.[0];if(!file)return;try{await uploadLogo(active,file);await loadGroups();await openGroup(active);}catch(error){console.error(error);alert("Loqo yenilənmədi: "+error.message);}};picker.click();};
 el("nxGroupSendForm").onsubmit=async e=>{
  e.preventDefault();const body=el("nxGroupText").value.trim();if(!body||!active)return;
  const id=active.id;const button=e.currentTarget.querySelector("button");button.disabled=true;
  try{const {error}=await sb().from("nexora_group_messages").insert({group_id:id,sender_id:me,body});if(error)throw error;el("nxGroupText").value="";await loadMessages();}
  catch(err){safeError(err);}finally{button.disabled=false;}
 };
 el("nxLeaveGroup").onclick=async()=>{
  if(!active||!confirm("Bu qrupdan çıxmaq istəyirsən?"))return;
  try{const {error}=await sb().from("nexora_group_members").delete().eq("group_id",active.id).eq("user_id",me);if(error)throw error;active=null;el("nxGroupTitle").textContent="Qrup seç";el("nxLeaveGroup").hidden=true;el("nxGroupMessages").replaceChildren();await loadGroups();}
  catch(err){safeError(err);}
 };
 window.addEventListener("hashchange",()=>{if(location.hash!=="#messages"&&!mount.hidden)hideGroups();});
});
