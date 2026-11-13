/* NEXORA sosial anketlər — Supabase-də saxlanır. */
document.addEventListener("DOMContentLoaded", () => {
 const root=document.getElementById("nxPollsRoot"); if(!root)return;
 const $=(s,r=root)=>r.querySelector(s);
 const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const notify=s=>{const t=document.getElementById("toast");if(t){t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),4000);}else alert(s);};
 let polls=[],filter="latest",busy=false,channel=null,currentUserId="",openComments=new Set();
 const composer=$("#nxPollComposer");
 const overlay=document.createElement("div");overlay.className="nx-poll-create-overlay";overlay.hidden=true;overlay.setAttribute("role","presentation");
 composer.parentNode.insertBefore(overlay,composer);overlay.appendChild(composer);
 composer.setAttribute("role","dialog");composer.setAttribute("aria-modal","true");composer.setAttribute("aria-label","Yeni anket yarat");
 const closeComposer=()=>{overlay.hidden=true;composer.hidden=true;document.body.classList.remove("nx-poll-modal-open");$("#nxPollNew")?.focus();};
 const openComposer=()=>{composer.hidden=false;overlay.hidden=false;document.body.classList.add("nx-poll-modal-open");$("#nxPollQuestion")?.focus();};
 overlay.addEventListener("click",e=>{if(e.target===overlay)closeComposer();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden){e.preventDefault();closeComposer();}});
 const client=()=>window.nexoraSupabase;
 const session=async()=>{const sb=client();if(!sb)throw Error("Supabase bağlantısı yoxdur.");const {data,error}=await sb.auth.getUser();if(error||!data?.user)throw Error("Anketlər üçün hesaba daxil ol.");return data.user;};
 const timeLeft=s=>{const ms=new Date(s).getTime()-Date.now();if(ms<=0)return "Bitib";const h=Math.ceil(ms/3600000);return h<24?h+" saat qalıb":Math.ceil(h/24)+" gün qalıb";};
 function card(p){
 const ended=Date.parse(p.ends_at)<=Date.now(),mine=!!p.my_option_id,total=p.options.reduce((n,o)=>n+Number(o.votes),0);
 const owner=p.author_id===currentUserId;
 const social='<div class="nx-poll-social"><button type="button" data-like="'+escape(p.id)+'" class="nx-poll-social-btn '+(p.liked_by_me?'liked':'')+'">'+(p.liked_by_me?'♥':'♡')+' '+Number(p.like_count||0)+'</button><button type="button" class="nx-poll-social-btn" data-comments="'+escape(p.id)+'">♧ '+Number(p.comment_count||0)+' Şərh</button><button type="button" class="nx-poll-social-btn" data-share="'+escape(p.id)+'">↗ Paylaş</button>'+(owner?'<button type="button" class="nx-poll-social-btn nx-poll-danger" data-delete-poll="'+escape(p.id)+'">Sil</button>':'')+'</div>';
 const comments=openComments.has(p.id)?'<section class="nx-poll-comments" data-comment-area="'+escape(p.id)+'"><div class="nx-poll-comment-list">Şərhlər yüklənir...</div><form class="nx-poll-comment-form" data-comment-form="'+escape(p.id)+'"><input maxlength="1000" required placeholder="Şərh yaz..." aria-label="Şərh yaz"><button type="submit" class="nx-poll-action">Göndər</button></form></section>':'';
 const opts=p.options.map(o=>{const percent=total?Math.round(Number(o.votes)*100/total):0;return '<button type="button" class="nx-poll-option '+(p.my_option_id===o.id?'chosen':'')+'" data-vote="'+escape(o.id)+'" data-poll="'+escape(p.id)+'" '+(ended?'disabled':'')+'><span class="nx-poll-option-text">'+escape(o.label)+'</span>'+(p.my_option_id===o.id?'<span class="nx-poll-voted-mark" aria-label="Sənin seçimin">✓ Sənin səsin</span>':'')+(mine||ended?'<span class="nx-poll-percent">'+percent+'%</span>':'<span class="nx-poll-circle">○</span>')+(mine||ended?'<span class="nx-poll-bar" style="width:'+percent+'%"></span>':'')+'</button>';}).join("");
 return '<article class="nx-poll-card"><div class="nx-poll-meta"><strong>@'+escape(p.username)+'</strong><span>'+new Date(p.created_at).toLocaleDateString("az-AZ")+'</span></div><h3>'+escape(p.question)+'</h3>'+(p.description?'<p class="nx-poll-description">'+escape(p.description)+'</p>':'')+'<div class="nx-poll-options">'+opts+'</div><div class="nx-poll-bottom"><span>'+total+' səs · '+timeLeft(p.ends_at)+'</span><span>'+(ended?'Anket bağlanıb':mine?'Seçimini dəyişə bilərsən':'Səs vermək üçün seç')+'</span></div>'+social+comments+'</article>';
 }
 function render(){
 const list=$("#nxPollList");if(!list)return;
 let rows=[...polls];if(filter==="active")rows=rows.filter(p=>Date.parse(p.ends_at)>Date.now());if(filter==="mine"){const id=localStorage.getItem("nexoraSupabaseUserId");rows=rows.filter(p=>p.author_id===id);}
 if(filter==="popular")rows.sort((a,b)=>b.options.reduce((s,o)=>s+Number(o.votes),0)-a.options.reduce((s,o)=>s+Number(o.votes),0));
 list.innerHTML=rows.length?rows.map(card).join(""):'<div class="empty-state">Bu bölmədə hələ anket yoxdur. İlk anketi sən yarat!</div>';
 root.querySelectorAll("[data-poll-filter]").forEach(b=>b.classList.toggle("active",b.dataset.pollFilter===filter));
 }
 async function load(){if(busy)return;busy=true;try{const user=await session();currentUserId=user.id;const {data,error}=await client().rpc("nexora_poll_feed");if(error)throw error;polls=Array.isArray(data)?data:[];render();}catch(e){$("#nxPollList").innerHTML='<div class="empty-state">'+escape(e.message)+'<p>Supabase SQL Editor-də supabase-social-polls.sql faylını işlət.</p></div>';}finally{busy=false;}}
 root.addEventListener("click",async e=>{
 const f=e.target.closest("[data-poll-filter]");if(f){filter=f.dataset.pollFilter;render();return;}
 if(e.target.closest("#nxPollRefresh")){await load();return;}
 const del=e.target.closest("[data-delete-poll]");if(del){if(!confirm("Anket və onun bütün səsləri, şərhləri silinsin?"))return;del.disabled=true;try{const user=await session();const {data,error}=await client().from("nexora_polls").delete().eq("id",del.dataset.deletePoll).eq("author_id",user.id).select("id");if(error)throw error;if(!data?.length)throw Error("Yalnız öz anketini silə bilərsən.");notify("Anket silindi.");await load();}catch(err){notify(err.message);del.disabled=false;}return;}
 const like=e.target.closest("[data-like]");if(like){like.disabled=true;try{const user=await session(),p=polls.find(x=>x.id===like.dataset.like);if(!p)throw Error("Anket tapılmadı.");const q=client().from("nexora_poll_likes");const {error}=p.liked_by_me?await q.delete().eq("poll_id",p.id).eq("user_id",user.id):await q.insert({poll_id:p.id,user_id:user.id});if(error)throw error;await load();}catch(err){notify(err.message);like.disabled=false;}return;}
 const share=e.target.closest("[data-share]");if(share){const poll=polls.find(p=>p.id===share.dataset.share);if(!poll)return notify("Anket tapılmadı.");document.dispatchEvent(new CustomEvent("nexora:share-poll",{detail:{id:poll.id,question:poll.question,options:(poll.options||[]).map(o=>o.label)}}));return;}
 const comments=e.target.closest("[data-comments]");if(comments){const id=comments.dataset.comments;if(openComments.has(id)){openComments.delete(id);render();}else{openComments.add(id);render();await loadComments(id);}return;}
 const v=e.target.closest("[data-vote]");if(v){if(v.disabled)return;v.disabled=true;try{await session();const {error}=await client().rpc("nexora_vote_poll",{p_poll_id:v.dataset.poll,p_option_id:v.dataset.vote});if(error)throw error;await load();}catch(err){notify(err.message);v.disabled=false;}return;}
 if(e.target.closest("#nxPollNew")){openComposer();return;}
 if(e.target.closest("#nxPollCancel")){closeComposer();return;}
 if(e.target.closest("#nxPollAddOption")){const box=$("#nxPollOptionFields");if(box.children.length>=6)return notify("Ən çox 6 variant olar.");const input=document.createElement("input");input.className="nx-poll-input nx-poll-answer";input.maxLength=100;input.required=true;input.placeholder=(box.children.length+1)+". cavab";box.append(input);return;}
 });
 async function loadComments(id){try{const {data,error}=await client().from("nexora_poll_comments").select("id,author_id,body,created_at").eq("poll_id",id).order("created_at",{ascending:true}).limit(100);if(error)throw error;const ids=[...new Set((data||[]).map(x=>x.author_id))];let names={};if(ids.length){const result=await client().from("nexora_profiles").select("id,username").in("id",ids);if(!result.error)names=Object.fromEntries((result.data||[]).map(x=>[x.id,x.username]));}const html=(data||[]).length?(data||[]).map(x=>'<div class="nx-poll-comment"><div><strong>@'+escape(names[x.author_id]||"istifadəçi")+'</strong> '+escape(x.body)+'</div>'+(x.author_id===currentUserId?'<button type="button" data-delete-comment="'+escape(x.id)+'" data-comment-poll="'+escape(id)+'">Sil</button>':'')+'</div>').join(""):'<p>İlk şərhi sən yaz.</p>';const area=root.querySelector('[data-comment-area="'+id+'"] .nx-poll-comment-list');if(area)area.innerHTML=html;}catch(err){notify("Şərhlər yüklənmədi: "+err.message);}}
 root.addEventListener("submit",async e=>{const form=e.target.closest("[data-comment-form]");if(!form)return;e.preventDefault();const id=form.dataset.commentForm,inp=form.querySelector("input"),body=inp.value.trim();if(!body)return;const btn=form.querySelector("button");btn.disabled=true;try{const user=await session();const {error}=await client().from("nexora_poll_comments").insert({poll_id:id,author_id:user.id,body});if(error)throw error;inp.value="";await loadComments(id);await load();}catch(err){notify("Şərh göndərilmədi: "+err.message);}finally{btn.disabled=false;}});
 root.addEventListener("click",async e=>{const b=e.target.closest("[data-delete-comment]");if(!b)return;if(!confirm("Şərh silinsin?"))return;try{const user=await session();const {error}=await client().from("nexora_poll_comments").delete().eq("id",b.dataset.deleteComment).eq("author_id",user.id);if(error)throw error;await loadComments(b.dataset.commentPoll);await load();}catch(err){notify(err.message);}});
 $("#nxPollCreateForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,btn=form.querySelector('button[type="submit"]');if(btn.disabled)return;
 const question=$("#nxPollQuestion").value.trim(),description=$("#nxPollDescription").value.trim(),answers=[...root.querySelectorAll(".nx-poll-answer")].map(x=>x.value.trim()).filter(Boolean),hours=Number($("#nxPollDuration").value);
 if(![1,24,72,168].includes(hours))return notify("Anket müddəti düzgün deyil.");
 if(question.length<5||question.length>280)return notify("Sual 5–280 simvol olmalıdır.");
 if(answers.length<2||answers.length>6||new Set(answers.map(x=>x.toLocaleLowerCase("az"))).size!==answers.length)return notify("2–6 fərqli cavab yaz.");
 const fee=({1:0,24:100,72:250,168:500})[hours];
 if(fee && !confirm(`Bu anket üçün ${fee} NX tutulacaq. Davam edilsin?`))return;
 btn.disabled=true;btn.textContent="Yaradılır...";
 let createdId=null;
 try{const user=await session(),sb=client();const {data:p,error:pe}=await sb.from("nexora_polls").insert({author_id:user.id,question,description,ends_at:new Date(Date.now()+hours*3600000).toISOString()}).select("id").single();if(pe)throw pe;createdId=p.id;
 const {error:oe}=await sb.from("nexora_poll_options").insert(answers.map((label,position)=>({poll_id:p.id,label,position})));if(oe)throw oe;
 form.reset();$("#nxPollOptionFields").innerHTML='<input class="nx-poll-input nx-poll-answer" maxlength="100" placeholder="1. cavab" required><input class="nx-poll-input nx-poll-answer" maxlength="100" placeholder="2. cavab" required>';
 closeComposer();notify("Anket yaradıldı.");await load();
 }catch(err){if(createdId)await client().from("nexora_polls").delete().eq("id",createdId);notify("Anket yaradılmadı: "+err.message);}finally{btn.disabled=false;btn.textContent="Anketi paylaş";}
 });
 document.addEventListener("nexora:open-poll",async e=>{
  const id=e.detail?.id;if(!id)return;
  filter="latest";render();
  if(!polls.some(p=>p.id===id))await load();
  const found=polls.some(p=>p.id===id);
  if(!found){notify("Anket silinib və ya artıq əlçatan deyil.");return;}
  filter="latest";render();
  const target=[...root.querySelectorAll("[data-share]")].find(el=>el.dataset.share===id)?.closest(".nx-poll-card");
  if(target){target.scrollIntoView({behavior:"smooth",block:"center"});target.classList.add("nx-poll-highlight");setTimeout(()=>target.classList.remove("nx-poll-highlight"),2500);}
 });
 document.querySelectorAll('[data-page="predictions"]').forEach(a=>a.addEventListener("click",()=>load()));
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!root.closest(".page")?.hidden)load();});
 const connect=async()=>{try{await session();channel=client().channel("nx-polls-updates").on("postgres_changes",{event:"*",schema:"public",table:"nexora_poll_votes"},()=>load()).on("postgres_changes",{event:"*",schema:"public",table:"nexora_polls"},()=>load()).subscribe();}catch{}};
 connect();setInterval(()=>{if(!root.closest(".page")?.classList.contains("active")&&!root.closest(".page")?.classList.contains("is-active"))return;load();},30000);
 if(location.hash.startsWith("#predictions"))load();
});
