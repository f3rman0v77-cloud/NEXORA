(function(){
 let queue=Promise.resolve();
 function show({title="NEXORA",message="",confirmText="Təsdiqlə",cancelText="Ləğv et",danger=false,notice=false}){
  const run=()=>new Promise(resolve=>{
   const dialog=document.createElement("dialog");dialog.className="nexora-modal";dialog.setAttribute("aria-label",title);
   const card=document.createElement("div");card.className="nexora-modal-card";
   const eyebrow=document.createElement("div");eyebrow.className="nexora-modal-eyebrow";eyebrow.textContent="NEXORA";
   const heading=document.createElement("h2");heading.textContent=title;
   const description=document.createElement("p");description.textContent=String(message);
   const actions=document.createElement("div");actions.className="nexora-modal-actions";
   const cancel=document.createElement("button");cancel.type="button";cancel.className="nexora-modal-cancel";cancel.textContent=notice?"Bağla":cancelText;
   const ok=document.createElement("button");ok.type="button";ok.className="nexora-modal-ok"+(danger?" is-danger":"");ok.textContent=confirmText;
   if(notice)actions.append(cancel);else actions.append(cancel,ok);
   card.append(eyebrow,heading,description,actions);dialog.append(card);document.body.append(dialog);
   let finished=false;const finish=value=>{if(finished)return;finished=true;dialog.close();dialog.remove();resolve(value);};
   cancel.onclick=()=>finish(false);ok.onclick=()=>finish(true);
   dialog.addEventListener("cancel",event=>{event.preventDefault();finish(false);});
   dialog.addEventListener("click",event=>{if(event.target===dialog)finish(false);});
   dialog.showModal();(notice?cancel:ok).focus();
  });
  const result=queue.then(run,run);queue=result.then(()=>{},()=>{});return result;
 }
 window.nexoraConfirm=(message,options={})=>show({title:options.title||"Təsdiq",message,confirmText:options.confirmText||"Təsdiqlə",cancelText:options.cancelText||"Ləğv et",danger:options.danger??true});
 window.nexoraAlert=(message,options={})=>show({title:options.title||"Məlumat",message,notice:true});
 const style=document.createElement("style");style.textContent=`
 .nexora-modal{border:0;padding:0;width:min(92vw,430px);max-height:85vh;border-radius:22px;background:transparent;color:inherit;box-shadow:0 24px 70px #0005}
 .nexora-modal::backdrop{background:rgba(5,9,22,.65);backdrop-filter:blur(5px)}
 .nexora-modal-card{padding:26px;background:var(--card-bg,var(--surface,#fff));color:var(--text-color,inherit);border:1px solid #8883;border-radius:22px}
 .nexora-modal-eyebrow{font-size:11px;font-weight:800;letter-spacing:2px;color:#7386d9;margin-bottom:12px}
 .nexora-modal h2{font-size:21px;line-height:1.3;margin:0 0 12px}
 .nexora-modal p{font-size:14px;line-height:1.65;opacity:.82;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 22px}
 .nexora-modal-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
 .nexora-modal-actions button{border-radius:12px;padding:11px 17px;font:inherit;font-weight:700;cursor:pointer}
 .nexora-modal-cancel{background:transparent;border:1px solid #8886;color:inherit}
 .nexora-modal-ok{background:#5269e8;border:1px solid #5269e8;color:#fff}
 .nexora-modal-ok.is-danger{background:#d93c50;border-color:#d93c50}
 @media(prefers-reduced-motion:no-preference){.nexora-modal[open] .nexora-modal-card{animation:nxModalPop .16s ease-out}@keyframes nxModalPop{from{opacity:.5;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}}
 `;document.head.append(style);
})();