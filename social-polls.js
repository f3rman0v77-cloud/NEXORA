/* NEXORA sosial anketlər — Supabase-də saxlanır. */
document.addEventListener("DOMContentLoaded", () => {
 const root=document.getElementById("nxPollsRoot"); if(!root)return;
 const $=(s,r=root)=>r.querySelector(s);
 const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const notify=s=>{const t=document.getElementById("toast");if(t){t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),4000);}else alert(s);};
 let polls=[],filter="latest",busy=false,channel=null;
 const client=()=>window.nexoraSupabase;
 const session=async()=>{const sb=client();if(!sb)throw Error("Supabase bağlantısı yoxdur.");const {data,error}=await sb.auth.getUser();if(error||!data?.user)throw Error("Anketlər üçün hesaba daxil ol.");return data.user;};
 const timeLeft=s=>{const ms=new Date(s).getTime()-Date.now();if(ms<=0)return "Bitib";const h=Math.ceil(ms/3600000);return h<24?h+" saat qalıb":Math.ceil(h/24)+" gün qalıb";};
 function card(p){
 const ended=Date.parse(p.ends_at)<=Date.now(),mine=!!p.my_option_id,total=p.options.reduce((n,o)=>n+Number(o.votes),0);
 const opts=p.options.map(o=>{const percent=total?Math.round(Number(o.votes)*100/total):0;return '<button type="button" class="nx-poll-option '+(p.my_option_id===o.id?'chosen':'')+'" data-vote="'+escape(o.id)+'" data-poll="'+escape(p.id)+'" '+(ended?'disabled':'')+'><span class="nx-poll-option-text">'+escape(o.label)+'</span>'+(mine||ended?'<span class="nx-poll-percent">'+percent+'%</span>':'<span class="nx-poll-circle">○</span>')+(mine||ended?'<span class="nx-poll-bar" style="width:'+percent+'%"></span>':'')+'</button>';}).join("");
 return '<article class="nx-poll-card"><div class="nx-poll-meta"><strong>@'+escape(p.username)+'</strong><span>'+new Date(p.created_at).toLocaleDateString("az-AZ")+'</span></div><h3>'+escape(p.question)+'</h3>'+(p.description?'<p class="nx-poll-description">'+escape(p.description)+'</p>':'')+'<div class="nx-poll-options">'+opts+'</div><div class="nx-poll-bottom"><span>'+total+' səs · '+timeLeft(p.ends_at)+'</span><span>'+(ended?'Anket bağlanıb':mine?'Seçimini dəyişə bilərsən':'Səs vermək üçün seç')+'</span></div></article>';
 }
 function render(){
 const list=$("#nxPollList");if(!list)return;
 let rows=[...polls];if(filter==="active")rows=rows.filter(p=>Date.parse(p.ends_at)>Date.now());if(filter==="mine"){const id=localStorage.getItem("nexoraSupabaseUserId");rows=rows.filter(p=>p.author_id===id);}
 if(filter==="popular")rows.sort((a,b)=>b.options.reduce((s,o)=>s+Number(o.votes),0)-a.options.reduce((s,o)=>s+Number(o.votes),0));
 list.innerHTML=rows.length?rows.map(card).join(""):'<div class="empty-state">Bu bölmədə hələ anket yoxdur. İlk anketi sən yarat!</div>';
 root.querySelectorAll("[data-poll-filter]").forEach(b=>b.classList.toggle("active",b.dataset.pollFilter===filter));
 }
 async function load(){if(busy)return;busy=true;try{await session();const {data,error}=await client().rpc("nexora_poll_feed");if(error)throw error;polls=Array.isArray(data)?data:[];render();}catch(e){$("#nxPollList").innerHTML='<div class="empty-state">'+escape(e.message)+'<p>Supabase SQL Editor-də supabase-social-polls.sql faylını işlət.</p></div>';}finally{busy=false;}}
 root.addEventListener("click",async e=>{
 const f=e.target.closest("[data-poll-filter]");if(f){filter=f.dataset.pollFilter;render();return;}
 if(e.target.closest("#nxPollRefresh")){await load();return;}
 const v=e.target.closest("[data-vote]");if(v){if(v.disabled)return;v.disabled=true;try{await session();const {error}=await client().rpc("nexora_vote_poll",{p_poll_id:v.dataset.poll,p_option_id:v.dataset.vote});if(error)throw error;await load();}catch(err){notify(err.message);v.disabled=false;}return;}
 if(e.target.closest("#nxPollNew")){$("#nxPollComposer").hidden=false;$("#nxPollQuestion").focus();return;}
 if(e.target.closest("#nxPollCancel")){$("#nxPollComposer").hidden=true;return;}
 if(e.target.closest("#nxPollAddOption")){const box=$("#nxPollOptionFields");if(box.children.length>=6)return notify("Ən çox 6 variant olar.");const input=document.createElement("input");input.className="nx-poll-input nx-poll-answer";input.maxLength=100;input.required=true;input.placeholder=(box.children.length+1)+". cavab";box.append(input);return;}
 });
 $("#nxPollCreateForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,btn=form.querySelector('button[type="submit"]');if(btn.disabled)return;
 const question=$("#nxPollQuestion").value.trim(),description=$("#nxPollDescription").value.trim(),answers=[...root.querySelectorAll(".nx-poll-answer")].map(x=>x.value.trim()).filter(Boolean),hours=Number($("#nxPollDuration").value);
 if(question.length<5||question.length>280)return notify("Sual 5–280 simvol olmalıdır.");
 if(answers.length<2||answers.length>6||new Set(answers.map(x=>x.toLocaleLowerCase("az"))).size!==answers.length)return notify("2–6 fərqli cavab yaz.");
 btn.disabled=true;btn.textContent="Yaradılır...";
 let createdId=null;
 try{const user=await session(),sb=client();const {data:p,error:pe}=await sb.from("nexora_polls").insert({author_id:user.id,question,description,ends_at:new Date(Date.now()+hours*3600000).toISOString()}).select("id").single();if(pe)throw pe;createdId=p.id;
 const {error:oe}=await sb.from("nexora_poll_options").insert(answers.map((label,position)=>({poll_id:p.id,label,position})));if(oe)throw oe;
 form.reset();$("#nxPollOptionFields").innerHTML='<input class="nx-poll-input nx-poll-answer" maxlength="100" placeholder="1. cavab" required><input class="nx-poll-input nx-poll-answer" maxlength="100" placeholder="2. cavab" required>';
 $("#nxPollComposer").hidden=true;notify("Anket yaradıldı.");await load();
 }catch(err){if(createdId)await client().from("nexora_polls").delete().eq("id",createdId);notify("Anket yaradılmadı: "+err.message);}finally{btn.disabled=false;btn.textContent="Anketi paylaş";}
 });
 document.querySelectorAll('[data-page="predictions"]').forEach(a=>a.addEventListener("click",()=>load()));
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!root.closest(".page")?.hidden)load();});
 const connect=async()=>{try{await session();channel=client().channel("nx-polls-updates").on("postgres_changes",{event:"*",schema:"public",table:"nexora_poll_votes"},()=>load()).on("postgres_changes",{event:"*",schema:"public",table:"nexora_polls"},()=>load()).subscribe();}catch{}};
 connect();setInterval(()=>{if(!root.closest(".page")?.classList.contains("active")&&!root.closest(".page")?.classList.contains("is-active"))return;load();},30000);
 if(location.hash==="#predictions")load();
});
