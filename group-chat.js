/* NEXORA group messaging: isolated from existing one-to-one chat. */
document.addEventListener("DOMContentLoaded", () => {
 const page=document.getElementById("messages");
 if(!page)return;
 const layout=document.getElementById("chatLayout");
 const mount=document.createElement("div");
 mount.id="nxGroupsRoot";mount.className="page";mount.hidden=true;
 mount.innerHTML=`<div class="nx-groups-header"><button type="button" id="nxGroupsBack">← Şəxsi mesajlar</button><h2>Qrup söhbətləri</h2><button type="button" id="nxNewGroup">＋ Qrup yarat</button></div>
 <div class="nx-groups-layout"><aside class="nx-groups-sidebar"><label class="nx-group-filter">⌕ <input id="nxGroupFilter" type="search" placeholder="Qruplarda axtar"></label><div id="nxGroupList" class="nx-groups-list"></div></aside><div class="nx-groups-conversation"><div class="nx-groups-header"><span class="nx-group-title-wrap"><span id="nxGroupAvatar" class="nx-group-avatar">👥</span><strong id="nxGroupTitle">Qrup seç</strong></span><button type="button" id="nxGroupInfo" hidden>ⓘ Qrup haqqında</button><button type="button" id="nxChangeGroupLogo" hidden>Loqonu dəyiş</button><button type="button" id="nxLeaveGroup" hidden>Qrupdan çıx</button></div><div id="nxGroupMessages" class="nx-group-messages"></div><div id="nxGroupExtras" class="nx-group-extras" hidden><button type="button" id="nxGroupAttach">📎 Şəkil / video</button><button type="button" id="nxGroupSticker">☺ Stiker</button><button type="button" id="nxGroupShare">↗ Paylaşım / hekayə / anket</button></div><input id="nxGroupMediaFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" hidden><form id="nxGroupSendForm"><button type="button" id="nxGroupExtrasToggle" aria-label="Əlavə et">＋</button><button type="button" id="nxGroupStickerQuick" aria-label="Stiker seç">☺</button><input id="nxGroupText" maxlength="4000" placeholder="Qrupa mesaj yaz..."><button type="submit">Göndər ➤</button></form></div></div>
 <dialog id="nxGroupDialog"><form id="nxGroupCreateForm" class="nx-group-create"><h2>Yeni qrup</h2><label>Qrup adı<input id="nxGroupName" minlength="2" maxlength="60" required></label><label>Qrup loqosu (istəyə bağlı)<input id="nxGroupLogo" type="file" accept="image/png,image/jpeg,image/webp"></label><label>İştirakçı axtar<input id="nxGroupSearch" type="search" placeholder="İstifadəçi adı"></label><div id="nxGroupCandidates"></div><div class="nx-group-actions"><button type="button" id="nxGroupCancel">Ləğv et</button><button type="submit">Qrupu yarat</button></div></form></dialog><dialog id="nxGroupInfoDialog"><div class="nx-group-info-head"><h2>Qrup haqqında</h2><button type="button" id="nxGroupInfoClose">✕</button></div><div id="nxGroupInfoSummary"></div><label class="nx-group-filter">⌕ <input id="nxGroupMemberSearch" type="search" placeholder="İştirakçı axtar"></label><div id="nxGroupInfoMembers"></div><button type="button" id="nxGroupAddMember" hidden>＋ İştirakçı əlavə et</button></dialog>`;
 page.parentElement.append(mount);
 const toggle=document.createElement("button");toggle.type="button";toggle.id="nxGroupsToggle";toggle.textContent="👥 Qruplar";toggle.className="outline-button";
 page.querySelector(".page-heading")?.append(toggle);
 const el=id=>document.getElementById(id);
 const sb=()=>window.nexoraSupabase;
 let me=null,groups=[],people=[],active=null,poll=null,chosen=new Set(),loading=false;
 const logoBucket="nexora-group-logos";const mediaBucket="nexora-group-media";let memberReads=[];
 function logoUrl(g){if(!g?.logo_path)return null;return sb().storage.from(logoBucket).getPublicUrl(g.logo_path).data.publicUrl;}
 function logoAvatar(g){const span=document.createElement("span");span.className="nx-group-avatar";const url=logoUrl(g);if(url){const img=document.createElement("img");img.src=url;img.alt="";img.onerror=()=>{img.remove();span.textContent="👥";};span.append(img);}else span.textContent="👥";return span;}
 async function uploadLogo(g,file){if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024)throw Error("Loqo PNG, JPG və ya WebP formatında, 2 MB-dan kiçik olmalıdır.");const ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type];const path=`${g.id}/logo-${Date.now()}.${ext}`;const {error}=await sb().storage.from(logoBucket).upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {error:saveError}=await sb().from("nexora_groups").update({logo_path:path}).eq("id",g.id).eq("owner_id",me);if(saveError)throw saveError;g.logo_path=path;}

 const customDialog=document.createElement("dialog");customDialog.id="nxGroupActionDialog";customDialog.innerHTML='<div class="nx-action-shell"><h2 id="nxActionTitle"></h2><p id="nxActionDescription"></p><input id="nxActionSearch" type="search" placeholder="İstifadəçi axtar"><div id="nxActionChoices"></div><div class="nx-action-footer"><button type="button" id="nxActionCancel">Ləğv et</button><button type="button" id="nxActionConfirm">Təsdiqlə</button></div></div>';mount.append(customDialog);
 function chooseMember(title,description,candidates,{search=true,confirmText="Əlavə et"}={}){
  return new Promise(resolve=>{
   el("nxActionTitle").textContent=title;el("nxActionDescription").textContent=description;
   const input=el("nxActionSearch"),list=el("nxActionChoices"),submit=el("nxActionConfirm");
   input.hidden=!search;input.value="";submit.textContent=confirmText;submit.disabled=true;
   let selected=null,settled=false;
   const done=value=>{if(settled)return;settled=true;customDialog.close();resolve(value);};
   const draw=()=>{list.replaceChildren();selected=null;submit.disabled=true;const term=input.value.toLocaleLowerCase("az").trim();
    for(const p of candidates.filter(p=>(p.name||"").toLocaleLowerCase("az").includes(term)||(p.username||"").toLocaleLowerCase("az").includes(term)).slice(0,80)){
     const btn=document.createElement("button");btn.type="button";btn.className="nx-action-choice";
     btn.textContent=(p.name||p.username||"İstifadəçi")+(p.username?" (@"+p.username+")":"");
     btn.onclick=()=>{list.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");selected=p;submit.disabled=false;};
     list.append(btn);
    }
    if(!list.children.length)list.textContent="Uyğun istifadəçi tapılmadı.";
   };
   input.oninput=draw;el("nxActionCancel").onclick=()=>done(null);submit.onclick=()=>done(selected);
   customDialog.oncancel=e=>{e.preventDefault();done(null);};draw();customDialog.showModal();if(search)input.focus();
  });
 }
 function groupConfirm(title,description,confirmText="Təsdiqlə"){
  return new Promise(resolve=>{
   el("nxActionTitle").textContent=title;el("nxActionDescription").textContent=description;
   el("nxActionSearch").hidden=true;el("nxActionChoices").replaceChildren();
   const submit=el("nxActionConfirm");submit.disabled=false;submit.textContent=confirmText;
   let settled=false;const done=v=>{if(settled)return;settled=true;customDialog.close();resolve(v);};
   el("nxActionCancel").onclick=()=>done(false);submit.onclick=()=>done(true);
   customDialog.oncancel=e=>{e.preventDefault();done(false);};customDialog.showModal();
  });
 }
 const notice=msg=>{const box=el("nxGroupMessages");box.textContent=msg;};
 const safeError=e=>{console.error("NEXORA group chat:",e);const message=String(e?.message||"Naməlum xəta");const code=e?.code?" ("+e.code+")":"";notice("Xəta: "+message+code);const dialog=el("nxGroupDialog");if(dialog?.open){let warning=el("nxGroupCreateError");if(!warning){warning=document.createElement("p");warning.id="nxGroupCreateError";warning.setAttribute("role","alert");dialog.querySelector(".nx-group-actions").before(warning);}warning.textContent="Qrup yaradılmadı: "+message+code;}};
 async function session(){const {data,error}=await sb().auth.getUser();if(error)throw error;me=data.user?.id;return me;}
 async function loadGroups(){
  if(!await session())return notice("Qruplara baxmaq üçün daxil ol.");
  const {data,error}=await sb().from("nexora_group_members").select("group_id,nexora_groups(id,name,owner_id,created_at,logo_path)").eq("user_id",me);
  if(error)throw error;
  groups=(data||[]).map(x=>x.nexora_groups).filter(Boolean).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const list=el("nxGroupList");list.replaceChildren();
  if(!groups.length)list.textContent="Hələ qrup yoxdur. Yeni qrup yarat.";
  const filter=(el("nxGroupFilter")?.value||"").toLocaleLowerCase("az");
  for(const g of groups.filter(g=>g.name.toLocaleLowerCase("az").includes(filter))){const b=document.createElement("button");b.type="button";b.append(logoAvatar(g),document.createTextNode(g.name));b.className="nx-group-entry"+(active?.id===g.id?" selected":"");b.onclick=()=>openGroup(g);list.append(b);}
  if(active&&!groups.some(g=>g.id===active.id)){active=null;el("nxGroupTitle").textContent="Qrup seç";el("nxLeaveGroup").hidden=true;el("nxGroupInfo").hidden=true;el("nxGroupMessages").replaceChildren();}
 }
 async function loadMessages(){
  if(!active||!me)return;
  const id=active.id;
  const {data,error}=await sb().from("nexora_group_messages").select("id,sender_id,body,created_at,media_path,media_type,share_url").eq("group_id",id).order("created_at",{ascending:false}).limit(150);
  if(error)throw error;
  if(active?.id!==id)return;
  const {data:reads, error:readError}=await sb().from("nexora_group_members").select("user_id,last_read_at").eq("group_id",id);
  if(!readError)memberReads=reads||[];
  const box=el("nxGroupMessages");const near=box.scrollHeight-box.scrollTop-box.clientHeight<90;box.replaceChildren();
  for(const m of (data||[]).reverse()){
   const p=document.createElement("div");p.className="nx-group-bubble"+(m.sender_id===me?" mine":"");
   const author=document.createElement("strong");author.textContent=m.sender_id===me?"Sən":(people.find(x=>x.id===m.sender_id)?.name||people.find(x=>x.id===m.sender_id)?.username||"İstifadəçi");
   const body=document.createElement("p");body.textContent=m.body||"";
   if(m.share_url){const card=document.createElement("a");card.href=m.share_url;card.target="_blank";card.rel="noopener noreferrer";card.className="nx-group-share-card";const tag=document.createElement("span");tag.textContent="NEXORA · Paylaşım";const title=document.createElement("strong");title.textContent="↗ Paylaşılan məzmuna bax";const detail=document.createElement("small");detail.textContent=new URL(m.share_url).pathname+new URL(m.share_url).hash;card.append(tag,title,detail);p.append(card);}
   if(m.media_path){const {data:signed,error:signError}=await sb().storage.from(mediaBucket).createSignedUrl(m.media_path,600);if(!signError&&signed?.signedUrl){const media=document.createElement(m.media_type?.startsWith("video/")?"video":"img");media.src=signed.signedUrl;media.className="nx-group-media";if(media.tagName==="VIDEO"){media.controls=true;media.preload="metadata";}else{media.alt="Qrupda paylaşılan şəkil";media.loading="lazy";}p.append(media);}}
   const time=document.createElement("small");time.textContent=new Date(m.created_at).toLocaleString("az-AZ",{hour:"2-digit",minute:"2-digit"});
   if(m.sender_id===me){const seen=memberReads.filter(x=>x.user_id!==me&&x.last_read_at&&new Date(x.last_read_at)>=new Date(m.created_at)).length;time.textContent+=" · "+(seen?seen+" nəfər oxudu":"Göndərildi");}
   p.append(author,body,time);box.append(p);
  }
  if(near)box.scrollTop=box.scrollHeight;
  const {error:markError}=await sb().from("nexora_group_members").update({last_read_at:new Date().toISOString()}).eq("group_id",id).eq("user_id",me);
  if(markError)console.warn("Group read receipt:",markError);
 }
 async function openGroup(g){active=g;el("nxGroupTitle").textContent=g.name;el("nxGroupAvatar").replaceWith(Object.assign(logoAvatar(g),{id:"nxGroupAvatar"}));el("nxGroupInfo").hidden=false;el("nxChangeGroupLogo").hidden=g.owner_id!==me;el("nxLeaveGroup").hidden=false;await loadGroups();await loadMessages();}
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
  document.querySelectorAll(".page.active").forEach(p=>p.classList.remove("active"));
  mount.hidden=false;mount.classList.add("active");
  document.querySelectorAll(".nav-link").forEach(l=>l.classList.toggle("active",l.dataset.page==="messages"));
  history.pushState(null,"","#groups");window.scrollTo(0,0);
  try{await session();await loadPeople();await loadGroups();if(active)await loadMessages();}
  catch(e){safeError(e);}
  stopPoll();poll=setInterval(()=>{if(!mount.hidden&&active)loadMessages().catch(safeError);},5000);
 }
 function hideGroups(){stopPoll();mount.hidden=true;mount.classList.remove("active");}
 document.addEventListener("click",event=>{if(event.target.closest("[data-page]")&&!mount.hidden)hideGroups();},true);
 toggle.onclick=showGroups;el("nxGroupsBack").onclick=()=>{hideGroups();page.classList.add("active");history.pushState(null,"","#messages");window.scrollTo(0,0);};
 el("nxNewGroup").onclick=()=>{chosen=new Set();el("nxGroupName").value="";el("nxGroupLogo").value="";el("nxGroupLogoPreview")?.remove();el("nxGroupSearch").value="";drawCandidates();el("nxGroupCreateError")?.remove();el("nxGroupDialog").showModal();};
 el("nxGroupSearch").oninput=drawCandidates;
 el("nxGroupLogo").onchange=()=>{el("nxGroupLogoPreview")?.remove();const file=el("nxGroupLogo").files?.[0];if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024){alert("Loqo PNG/JPG/WebP və maksimum 2 MB olmalıdır.");el("nxGroupLogo").value="";return;}const img=document.createElement("img");img.id="nxGroupLogoPreview";img.alt="Seçilmiş qrup loqosu";img.style.cssText="width:72px;height:72px;border-radius:50%;object-fit:cover;margin:auto";const url=URL.createObjectURL(file);img.src=url;img.onload=()=>URL.revokeObjectURL(url);el("nxGroupLogo").parentElement.after(img);};
 el("nxGroupCancel").onclick=()=>el("nxGroupDialog").close();
 el("nxGroupCreateForm").onsubmit=async e=>{
  e.preventDefault();if(loading)return;loading=true;
  const name=el("nxGroupName").value.trim();
  try{
   if(!await session())throw Error("Login required");
   if(!chosen.size){alert("Ən azı bir iştirakçı seç.");return;}
   const {data:groupId,error}=await sb().rpc("nx_create_group",{p_name:name,p_members:[...chosen]});
   if(error)throw error;
   if(!groupId)throw Error("Qrup identifikatoru qaytarılmadı");
   const g={id:groupId,name,owner_id:me,created_at:new Date().toISOString(),logo_path:null};
   const logo=el("nxGroupLogo").files[0];if(logo){try{await uploadLogo(g,logo);}catch(logoError){console.error(logoError);alert("Qrup yaradıldı, amma loqo yüklənmədi: "+logoError.message);}}
   el("nxGroupDialog").close();await loadGroups();await openGroup(g);
  }catch(err){safeError(err);}finally{loading=false;}
 };
 el("nxChangeGroupLogo").onclick=()=>{if(!active||active.owner_id!==me)return;const picker=document.createElement("input");picker.type="file";picker.accept="image/png,image/jpeg,image/webp";picker.onchange=async()=>{const file=picker.files?.[0];if(!file)return;try{await uploadLogo(active,file);await loadGroups();await openGroup(active);}catch(error){console.error(error);alert("Loqo yenilənmədi: "+error.message);}};picker.click();};
 async function sendGroupMessage(payload){if(!active)throw Error("Qrup seç");const {error}=await sb().from("nexora_group_messages").insert({group_id:active.id,sender_id:me,body:"",...payload});if(error)throw error;await loadMessages();}
 el("nxGroupFilter").oninput=()=>loadGroups().catch(safeError);
 el("nxGroupExtrasToggle").onclick=()=>{el("nxGroupExtras").hidden=!el("nxGroupExtras").hidden;};
 el("nxGroupAttach").onclick=()=>el("nxGroupMediaFile").click();
 el("nxGroupMediaFile").onchange=async()=>{const file=el("nxGroupMediaFile").files?.[0];if(!file||!active)return;const types=["image/png","image/jpeg","image/webp","image/gif","video/mp4","video/webm"];if(!types.includes(file.type)||file.size>20*1024*1024){alert("PNG, JPG, WebP, GIF, MP4 və ya WebM; maksimum 20 MB.");return;}const path=active.id+"/"+crypto.randomUUID()+"."+({ "image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/gif":"gif","video/mp4":"mp4","video/webm":"webm"}[file.type]);try{const {error}=await sb().storage.from(mediaBucket).upload(path,file,{contentType:file.type});if(error)throw error;await sendGroupMessage({media_path:path,media_type:file.type});el("nxGroupExtras").hidden=true;}catch(e){safeError(e);}finally{el("nxGroupMediaFile").value="";}};
 el("nxGroupStickerQuick").onclick=()=>el("nxGroupSticker").click();
 el("nxGroupSticker").onclick=()=>{const picker=document.createElement("div");picker.className="nx-group-stickers";for(const emoji of ["😀","😂","🥳","❤️","👍","🔥","🎉","😎","🤝","💯","✨","👏"]){const b=document.createElement("button");b.type="button";b.textContent=emoji;b.onclick=async()=>{picker.remove();try{await sendGroupMessage({body:emoji});}catch(e){safeError(e);}};picker.append(b);}el("nxGroupExtras").after(picker);picker.addEventListener("mouseleave",()=>picker.remove(),{once:true});};
 el("nxGroupShare").onclick=async()=>{const url=prompt("NEXORA göndərişi, hekayəsi və ya anketinin linkini daxil et:",location.origin+"/");if(!url)return;try{const parsed=new URL(url,location.origin);if(parsed.origin!==location.origin)throw Error("Yalnız NEXORA linkləri paylaşılır");await sendGroupMessage({share_url:parsed.href});el("nxGroupExtras").hidden=true;}catch(e){safeError(e);}};
 async function renderGroupInfo(){
 if(!active)return;
 const g=active,owner=g.owner_id===me;
 const {data,error}=await sb().from("nexora_group_members").select("user_id,joined_at").eq("group_id",g.id).order("joined_at");
 if(error)throw error;
 const members=data||[],search=el("nxGroupMemberSearch").value.toLocaleLowerCase("az");
 const list=el("nxGroupInfoMembers");list.replaceChildren();
 el("nxGroupInfoSummary").textContent=g.name+" · "+members.length+" iştirakçı";
 el("nxGroupAddMember").hidden=!owner;
 for(const m of members){
  const profile=people.find(p=>p.id===m.user_id);
  const name=profile?.name||profile?.username||"İstifadəçi";
  if(!name.toLocaleLowerCase("az").includes(search)&&!(profile?.username||"").toLocaleLowerCase("az").includes(search))continue;
  const row=document.createElement("div");row.className="nx-group-member-row";
  const label=document.createElement("span");label.textContent=name+(m.user_id===g.owner_id?" · Yaradıcı":"");
  row.append(label);
  if(owner&&m.user_id!==g.owner_id){
   const remove=document.createElement("button");remove.type="button";remove.textContent="Çıxart";
   remove.onclick=async()=>{if(!await groupConfirm("İştirakçını çıxart",name+" qrupdan çıxarılsın?","Çıxart"))return;remove.disabled=true;try{const {error}=await sb().rpc("nx_group_manage_member",{p_group:g.id,p_user:m.user_id,p_action:"remove"});if(error)throw error;await renderGroupInfo();}catch(e){alert(e.message);}finally{remove.disabled=false;}};
   row.append(remove);
  }
  list.append(row);
 }
 }
 el("nxGroupInfo").onclick=async()=>{try{el("nxGroupMemberSearch").value="";await renderGroupInfo();el("nxGroupInfoDialog").showModal();}catch(e){safeError(e);}};
 el("nxGroupInfoClose").onclick=()=>el("nxGroupInfoDialog").close();
 el("nxGroupMemberSearch").oninput=()=>renderGroupInfo().catch(safeError);
 el("nxGroupAddMember").onclick=async()=>{
  if(!active||active.owner_id!==me)return;
  const {data:members,error:memberError}=await sb().from("nexora_group_members").select("user_id").eq("group_id",active.id);
  if(memberError){safeError(memberError);return;}
  const ids=new Set((members||[]).map(m=>m.user_id));
  const user=await chooseMember("İştirakçı əlavə et","Qrupa əlavə etmək istədiyin istifadəçini seç.",people.filter(p=>!ids.has(p.id)));
  if(!user)return;
  try{const {error}=await sb().rpc("nx_group_manage_member",{p_group:active.id,p_user:user.id,p_action:"add"});if(error)throw error;await renderGroupInfo();}
  catch(e){safeError(e);}
 };
 el("nxGroupSendForm").onsubmit=async e=>{
  e.preventDefault();const body=el("nxGroupText").value.trim();if(!body||!active)return;
  const button=e.currentTarget.querySelector("button[type=submit]");button.disabled=true;
  try{await sendGroupMessage({body});el("nxGroupText").value="";}
  catch(err){safeError(err);}finally{button.disabled=false;}
 };
 el("nxLeaveGroup").onclick=async()=>{
  if(!active)return;
  const owner=active.owner_id===me;
  const message=owner?"Qrupun yaradıcısısan. Çıxsan, idarəetmə ən əvvəl qoşulan başqa üzvə keçəcək. Qrupda tək qalmısansa, qrup silinəcək.":"Bu qrupdan çıxmaq istəyirsən?";
  if(!await groupConfirm("Qrupdan çıx",message,"Qrupdan çıx"))return;
  try{
   const {error}=await sb().rpc("nx_leave_group",{p_group:active.id});if(error)throw error;
   active=null;el("nxGroupTitle").textContent="Qrup seç";el("nxLeaveGroup").hidden=true;el("nxGroupInfo").hidden=true;
   el("nxChangeGroupLogo").hidden=true;el("nxGroupMessages").replaceChildren();await loadGroups();
  }catch(err){safeError(err);}
 };
 window.addEventListener("hashchange",()=>{if(location.hash==="#groups"&&mount.hidden){showGroups().catch(safeError);}else if(location.hash!=="#groups"&&!mount.hidden){hideGroups();}});
});
