// Presentation-layer actions only; existing navigation and posting handlers remain authoritative.
document.addEventListener("DOMContentLoaded",()=>{
 const root=document.getElementById("feed");
 if(!root)return;
 const avatar=document.getElementById("nxRefComposerAvatar");
 const original=document.getElementById("composerAvatar");
 const sync=()=>{
   if(!avatar||!original)return;
   avatar.innerHTML=original.innerHTML;
   avatar.className=original.className;
   avatar.id="nxRefComposerAvatar";
 };
 sync();
 if(original)new MutationObserver(sync).observe(original,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["style","class"]});
 root.addEventListener("click",event=>{
   const button=event.target.closest("[data-ref-create],[data-ref-polls],[data-ref-games]");
   if(!button)return;
   if(button.hasAttribute("data-ref-create")){document.getElementById("openCreatePost")?.click();return;}
   const page=button.hasAttribute("data-ref-polls")?"predictions":"games";
   const nav=document.querySelector('.main-nav [data-page="'+page+'"]');
   if(nav)nav.click();
 });
});
