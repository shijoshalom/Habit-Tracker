const KEY="habit-tracker-v1";
const state=JSON.parse(localStorage.getItem(KEY)||"null")||{
  habits:[
    {id:crypto.randomUUID(),name:"Study 8 hours"},
    {id:crypto.randomUUID(),name:"Exercise"},
    {id:crypto.randomUUID(),name:"No unnecessary YouTube"},
    {id:crypto.randomUUID(),name:"Sleep before 12 AM"}
  ],logs:{}
};
let selectedDate=new Date(); selectedDate.setHours(0,0,0,0);
let reportDate=new Date(); reportDate.setDate(1);
let editingId=null;
const $=s=>document.querySelector(s);
function keyDate(d){return d.toISOString().slice(0,10)}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function fmtDate(d){return d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short",year:"numeric"})}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function getLog(date){const k=keyDate(date);if(!state.logs[k])state.logs[k]={};return state.logs[k]}
function isDone(date,id){return !!getLog(date)[id]}
function toggle(date,id){const l=getLog(date);l[id]=!l[id];if(!l[id])delete l[id];save();render()}
function pctForDate(d){if(!state.habits.length)return 0;return Math.round(state.habits.filter(h=>isDone(d,h.id)).length/state.habits.length*100)}
function render(){
  $("#selectedDateLabel").textContent=fmtDate(selectedDate);
  $("#todayHint").textContent=keyDate(selectedDate)===keyDate(new Date())?"Today":"";
  const total=state.habits.length, done=state.habits.filter(h=>isDone(selectedDate,h.id)).length;
  const pct=total?Math.round(done/total*100):0;
  $("#dailyPercent").textContent=pct+"%";$("#dailyBar").style.width=pct+"%";
  $("#completedCount").textContent=done;$("#habitCount").textContent=total;$("#streakCount").textContent=streak();
  renderHabits();renderManage();renderMonth();
}
function renderHabits(){
  const box=$("#habitList");box.innerHTML="";
  if(!state.habits.length){box.innerHTML='<div class="empty">No habits yet. Add your first habit.</div>';return}
  state.habits.forEach(h=>{
    const done=isDone(selectedDate,h.id), row=document.createElement("div");
    row.className="habit"+(done?" done":"");
    row.innerHTML=`<button class="check" type="button" aria-label="${done?"Mark incomplete":"Mark complete"}">${done?"✓":""}</button><div class="habit-info"><div class="habit-name"></div><div class="habit-status">${done?"Completed":"Not completed"}</div></div>`;
    row.querySelector(".habit-name").textContent=h.name;
    row.querySelector(".check").addEventListener("click",()=>toggle(selectedDate,h.id));
    box.appendChild(row);
  });
}
function renderManage(){
  const box=$("#manageList");box.innerHTML="";
  if(!state.habits.length){box.innerHTML='<div class="empty">No habits configured.</div>';return}
  state.habits.forEach(h=>{
    const row=document.createElement("div");row.className="manage-row";
    const name=document.createElement("span");name.textContent=h.name;
    const edit=document.createElement("button");edit.className="edit";edit.type="button";edit.textContent="Edit";edit.onclick=()=>openDialog(h.id);
    const del=document.createElement("button");del.className="danger";del.type="button";del.textContent="Delete";del.onclick=()=>removeHabit(h.id);
    row.append(name,edit,del);box.appendChild(row);
  });
}
function removeHabit(id){
  const h=state.habits.find(x=>x.id===id);if(!h)return;
  if(!confirm(`Delete "${h.name}"? Existing records for this habit will also be removed.`))return;
  state.habits=state.habits.filter(x=>x.id!==id);
  Object.values(state.logs).forEach(l=>delete l[id]);save();render();
}
function renderMonth(){
  const y=reportDate.getFullYear(),m=reportDate.getMonth();
  $("#monthLabel").textContent=reportDate.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const days=new Date(y,m+1,0).getDate();let total=0,best=-1,bestDayNum=null;
  const chart=$("#chart");chart.innerHTML="";
  for(let i=1;i<=days;i++){
    const d=new Date(y,m,i);const p=pctForDate(d);total+=p;
    if(p>best){best=p;bestDayNum=i}
    const wrap=document.createElement("div");wrap.className="bar-wrap";wrap.title=`${d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}: ${p}%`;
    const bar=document.createElement("div");bar.className="bar";bar.style.height=Math.max(p,1)+"%";
    if(keyDate(d)===keyDate(new Date()))bar.classList.add("today");
    const lab=document.createElement("span");lab.className="bar-label";lab.textContent=i;
    wrap.append(bar,lab);chart.appendChild(wrap);
  }
  $("#monthPercent").textContent=Math.round(total/days)+"%";
  $("#bestDay").textContent=bestDayNum?`${bestDayNum} (${best}%)`:"—";
}
function streak(){
  if(!state.habits.length)return 0;let d=new Date();d.setHours(0,0,0,0);let n=0;
  while(pctForDate(d)===100){n++;d.setDate(d.getDate()-1);if(n>10000)break}
  return n;
}
function openDialog(id=null){
  editingId=id;$("#dialogTitle").textContent=id?"Edit habit":"Add habit";
  $("#habitName").value=id?(state.habits.find(h=>h.id===id)?.name||""):"";
  $("#habitDialog").showModal();setTimeout(()=>$("#habitName").focus(),30);
}
$("#addHabitBtn").onclick=()=>openDialog();
$("#cancelDialog").onclick=()=>$("#habitDialog").close();
$("#habitForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#habitName").value.trim();if(!name)return;
  if(editingId){const h=state.habits.find(x=>x.id===editingId);if(h)h.name=name}
  else state.habits.push({id:crypto.randomUUID(),name});
  save();$("#habitDialog").close();render();
});
$("#prevDay").onclick=()=>{selectedDate.setDate(selectedDate.getDate()-1);render()};
$("#nextDay").onclick=()=>{selectedDate.setDate(selectedDate.getDate()+1);render()};
$("#prevMonth").onclick=()=>{reportDate.setMonth(reportDate.getMonth()-1);renderMonth()};
$("#nextMonth").onclick=()=>{reportDate.setMonth(reportDate.getMonth()+1);renderMonth()};
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").classList.remove("hidden")});
$("#installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt=null;$("#installBtn").classList.add("hidden")};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();