document.addEventListener("DOMContentLoaded",()=>{
 const profile=document.getElementById("profile"),tabs=profile?.querySelectorAll("[data-profile-tab]");if(!profile||!tabs?.length)return;
 const panes={posts:document.getElementById("myPosts"),polls:document.getElementById("nxProfilePolls"),likes:document.getElementById("nxProfileLikes")};
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let active="posts",request=0;
 const card=(p,liked=false)=>'<article class="nx-profile-entry"><div class="nx-profile-entry-top"><strong>@'+esc(p.username||"istifadeci")+'</strong><span>'+new Date(p.created_at).toLocaleDateString("az-AZ")+'</span></div><h3>'+esc(p.question)+'</h3><p>'+p.options.reduce((n,o)=>n+Number(o.votes||0),0)+' səs'+(liked?' · ♥ Bəyənmisən':'')+'</p><button type="button" class="nx-profile-open-poll" data-open-poll="'+esc(p.id)+'">Anketə bax →</button></article>';
 async function update(){
  const token=++request,pane=panes[active];if(!pane||active==="posts")return;
  pane.innerHTML='<div class="empty-state">Yüklənir...</div>';
  try{
   const sb=window.nexoraSupabase;if(!sb)throw Error("Bağlantı yoxdur");
   const {data:{user},error:ue}=await sb.auth.getUser();if(ue||!user)throw Error("Hesaba daxil ol");
   let rows=[];
   if(active==="polls"){const {data:polls,error:pe}=await sb.rpc("nexora_poll_feed");if(pe)throw pe;rows=Array.isArray(polls)?polls:[];}
   if(token!==request)return;
   if(active==="polls"){const own=rows.filter(p=>p.author_id===user.id);pane.innerHTML=own.length?own.map(p=>card(p)).join(""):'<div class="empty-state">Hələ anket yaratmamısan.</div>';return;}
   const [postLikes]=await Promise.all([
    sb.from("nexora_post_likes").select("post_id").eq("user_id",user.id).limit(500)
   ]);
   if(postLikes.error)throw postLikes.error;
   const postIds=(postLikes.data||[]).map(x=>x.post_id);
   let postRows=[];
   if(postIds.length){const result=await sb.from("nexora_posts").select("id,user_id,body,created_at").in("id",postIds.slice(0,100)).order("created_at",{ascending:false});if(result.error)throw result.error;postRows=result.data||[];}
   if(token!==request)return;
   pane.replaceChildren();
   if(!postRows.length){pane.innerHTML='<div class="empty-state">Hələ heç bir göndəri bəyənməmisən.</div>';return;}
   document.dispatchEvent(new CustomEvent("nexora:render-liked-posts",{detail:{ids:postRows.map(p=>p.id)}}));
  }catch(err){if(token===request)pane.innerHTML='<div class="empty-state">'+esc(err.message)+'</div>';}
 }
 function select(tab){active=tab;tabs.forEach(b=>{const on=b.dataset.profileTab===tab;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});Object.entries(panes).forEach(([k,v])=>{if(v)v.hidden=k!==tab;});update();}
 tabs.forEach(b=>b.addEventListener("click",()=>select(b.dataset.profileTab)));
 profile.addEventListener("click",e=>{const poll=e.target.closest("[data-open-poll]");if(poll){location.hash="predictions";document.querySelector('[data-page="predictions"]')?.click();setTimeout(()=>{const target=document.querySelector('#nxPollList [data-share="'+poll.dataset.openPoll+'"]');target?.closest(".nx-poll-card")?.scrollIntoView({behavior:"smooth",block:"center"});},600);}const post=e.target.closest("[data-open-post]");if(post){location.hash="feed";document.querySelector('[data-page="feed"]')?.click();}});
 document.querySelectorAll('[data-page="profile"]').forEach(b=>b.addEventListener("click",()=>{if(active!=="posts")update();}));
 select("posts");
});