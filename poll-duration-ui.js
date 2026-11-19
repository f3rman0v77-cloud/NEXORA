document.addEventListener("DOMContentLoaded", () => {
 const picker=document.querySelector(".nx-duration-picker");
 const trigger=document.getElementById("nxDurationTrigger");
 const menu=document.getElementById("nxDurationMenu");
 const select=document.getElementById("nxPollDuration");
 const label=document.getElementById("nxDurationLabel");
 if(!picker||!trigger||!menu||!select||!label)return;
 const close=()=>{menu.hidden=true;trigger.setAttribute("aria-expanded","false");};
 trigger.addEventListener("click",()=>{const open=menu.hidden;menu.hidden=!open;trigger.setAttribute("aria-expanded",String(open));});
 menu.querySelectorAll("[data-duration]").forEach(button=>button.addEventListener("click",()=>{
  select.value=button.dataset.duration;
  select.dispatchEvent(new Event("change",{bubbles:true}));
  label.textContent=select.selectedOptions[0].textContent;
  menu.querySelectorAll("[data-duration]").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
  close();
 }));
 document.addEventListener("click",event=>{if(!picker.contains(event.target))close();});
 document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
});