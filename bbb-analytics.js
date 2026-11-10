/* Big Brain Brotherhood: combined growth + anonymous creator counter. */
(()=>{
const style=document.createElement('style');style.textContent=`
#bbb-analytics,#bbb-missing{margin:18px 0;padding:18px;border:1px solid var(--line,#444);border-radius:14px;background:var(--panel,#20242b);color:var(--text,#fff)}
#bbb-analytics *,#bbb-missing *{box-sizing:border-box}#bbb-analytics h2,#bbb-missing h2{margin:0 0 12px;font-size:1.2rem}
.bbb-controls{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px}.bbb-controls button{border:1px solid var(--line,#555);background:var(--panel2,#30353d);color:inherit;border-radius:7px;padding:7px 12px;cursor:pointer}.bbb-controls button.active{outline:2px solid var(--accent,#aab)}
.bbb-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}.bbb-tile{padding:13px;background:var(--panel2,#30353d);border-radius:10px}.bbb-tile small{display:block;color:var(--muted,#aaa)}.bbb-tile strong{font-size:clamp(1.25rem,3vw,1.9rem)}
.bbb-note{color:var(--muted,#aaa);font-size:.83rem;margin:10px 0}.bbb-chart{width:100%;height:190px;display:block;background:var(--panel2,#30353d);border-radius:9px;margin-bottom:10px}
.bbb-week{margin:0 0 16px;padding:14px;border:1px solid var(--line,#555);border-radius:10px}.bbb-week h3{margin:0 0 10px;font-size:1rem}.bbb-counter{font-size:clamp(1.4rem,5vw,2.6rem);font-weight:800;text-align:center;margin:14px 0}.bbb-joke{text-align:center;color:var(--muted,#aaa)}
@media(max-width:550px){.bbb-summary{grid-template-columns:1fr}}
`;document.head.appendChild(style);
const growth=document.createElement('section');growth.id='bbb-analytics';growth.innerHTML='<h2>Brotherhood Growth</h2><p class="bbb-note">Loading…</p>';
const missing=document.createElement('section');missing.id='bbb-missing';missing.innerHTML='<h2>👻 The Missing Creator</h2><p class="bbb-note">Awaiting the latest sighting…</p>';
const anchor=document.getElementById('combined-views-goal');const parent=anchor?.closest('section')||anchor?.parentElement?.parentElement;
if(parent?.parentElement)parent.insertAdjacentElement('afterend',growth);else(document.querySelector('main')||document.body).appendChild(growth);
growth.insertAdjacentElement('afterend',missing);
const fmt=n=>Math.round(n).toLocaleString('en-GB');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const add=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const monday=s=>add(s,-((new Date(s+'T00:00:00Z').getUTCDay()+6)%7));
let snapshots=[],period='week',metric='views';
const byDate=new Map();const sum=s=>{const entries=Object.values(s?.channels||{});return entries.reduce((a,c)=>({views:a.views+(Number(c.views)||0),subs:a.subs+(Number(c.subscribers)||0)}),{views:0,subs:0})};
const diff=(a,b)=>{const start=byDate.get(a),end=byDate.get(b);if(!start||!end)return null;const x=sum(start),y=sum(end);return {views:y.views-x.views,subs:y.subs-x.subs}};
const value=v=>v==null?'—':(v>=0?'+':'')+fmt(v);const percent=(cur,prev)=>!Number.isFinite(cur)||!Number.isFinite(prev)||prev===0?'—':((cur-prev)/Math.abs(prev)*100>=0?'+':'')+((cur-prev)/Math.abs(prev)*100).toFixed(1)+'%';
function chart(points){const svg=growth.querySelector('svg');if(!svg)return;const vals=points.map(x=>x.value).filter(Number.isFinite),min=Math.min(0,...vals),max=Math.max(1,...vals),range=max-min||1;let path='';points.forEach((x,i)=>{if(!Number.isFinite(x.value)){path='';return}const px=35+i*730/Math.max(1,points.length-1),py=165-(x.value-min)/range*135;const cmd=(path?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);svg.insertAdjacentHTML('beforeend',`<circle cx="${px}" cy="${py}" r="3" fill="var(--accent,#8da9ff)"><title>${esc(x.date)}: ${fmt(x.value)}</title></circle>`);path+=cmd+' ';});if(path)svg.insertAdjacentHTML('afterbegin',`<path d="${path}" stroke="var(--accent,#8da9ff)" stroke-width="3" fill="none"/>`)}
function render(){if(!snapshots.length){growth.innerHTML='<h2>Brotherhood Growth</h2><p class="bbb-note">History starts after the first scheduled snapshot.</p>';return}
const latest=snapshots.at(-1).date,week=monday(latest);let a,b,c,d,label;
if(period==='day'){a=add(latest,-1);b=latest;c=add(latest,-2);d=add(latest,-1);label='Latest recorded day'}
if(period==='week'){a=add(week,-8);b=add(week,-1);c=add(week,-15);d=add(week,-8);label='Last completed Monday–Sunday week'}
if(period==='year'){const year=Number(latest.slice(0,4));a=year+'-01-01';b=latest;c=(year-1)+'-01-01';d=(year-1)+latest.slice(4);label='Year to date'}
const now=diff(a,b),prev=diff(c,d),tile=(field,name)=>`<div class="bbb-tile"><small>${name} · ${label}</small><strong>${value(now?.[field])}</strong><small>Previous: ${value(prev?.[field])} · Change: ${now&&prev?percent(now[field],prev[field]):'—'}</small></div>`;
const weekStart=monday(latest);
const priorWeekStart=add(weekStart,-7);
const elapsedDays=Math.round((new Date(latest+'T00:00:00Z')-new Date(weekStart+'T00:00:00Z'))/86400000);
const priorEquivalent=add(priorWeekStart,elapsedDays);
const thisWeek=diff(weekStart,latest);
const lastWeekSamePoint=diff(priorWeekStart,priorEquivalent);
const weekTile=(field,label)=>{
 const v=thisWeek?.[field],p=lastWeekSamePoint?.[field];
 return `<div class="bbb-tile"><small>${label}</small><strong>${value(v)}</strong><small>vs equivalent point last week: ${v!=null&&p!=null?percent(v,p):'—'}</small></div>`;
};
const weekPanel=`<div class="bbb-week"><h3>This Week So Far</h3><div class="bbb-summary">${weekTile('views','Combined views gained')}${weekTile('subs','Combined subscribers gained')}</div><p class="bbb-note">${thisWeek?'From Monday '+weekStart+' to '+latest+' (UTC).':'Collecting baseline data. A Monday '+weekStart+' snapshot is needed for an exact Monday-to-present total.'}</p></div>`;
const points=snapshots.filter(s=>s.date>=a&&s.date<=b).map(s=>({date:s.date,value:diff(add(s.date,-1),s.date)?.[metric]??null}));
growth.innerHTML=`<h2>Brotherhood Growth</h2><div class="bbb-controls">${[['day','Daily'],['week','Weekly'],['year','This year']].map(([k,n])=>`<button data-period="${k}" class="${period===k?'active':''}">${n}</button>`).join('')}${[['views','Views chart'],['subs','Subscribers chart']].map(([k,n])=>`<button data-metric="${k}" class="${metric===k?'active':''}">${n}</button>`).join('')}</div>${weekPanel}<div class="bbb-summary">${tile('views','Combined views gained')}${tile('subs','Combined subscribers gained')}</div><svg class="bbb-chart" viewBox="0 0 800 190" preserveAspectRatio="none" role="img" aria-label="Combined Brotherhood daily growth"></svg><p class="bbb-note">Combined totals across all tracked channels. No channel-level breakdown. Missing baselines display —. Public subscriber counts may be rounded. Daily snapshots are collected near midnight UTC.</p>`;
chart(points);growth.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;render()});growth.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;render()});}
const missingJokeSubjects=["The upload button","The YouTube algorithm","The notification bell","The subscriber count","The editing timeline","The render queue","The thumbnail designer","The channel homepage","The abandoned microphone","The recording software","The analytics dashboard","The community tab","The video description","The end screen","The pinned comment","The content calendar","The premiere countdown","The camera battery","The studio lighting","The capture card","The hard drive","The export settings","The intro sequence","The outro music","The keyboard shortcut","The mouse cursor","The watch-time graph","The recommendations feed","The search bar","The creator dashboard","The upload schedule","The editing chair","The unused tripod","The dusty webcam","The audio waveform","The empty playlist","The scheduled uploads tab","The copyright checker","The progress bar","The Wi-Fi router"];
const missingJokeEndings=["has started wondering whether the channel is on permanent holiday.","has started a support group for abandoned equipment.","has requested a transfer to a more active channel.","has been spotted updating its CV on LinkedIn.","has officially given up waiting for the next video."];
const missingJokes=missingJokeSubjects.flatMap(subject=>missingJokeEndings.map(ending=>subject+' '+ending));
// 40 subjects × 5 punchlines = 200 distinct jokes. Pick on page load, not every clock tick.
function pickMissingJoke(){
 let previous=-1;
 try{previous=Number(sessionStorage.getItem('bbb-last-missing-joke')??-1)}catch(e){}
 let index=Math.floor(Math.random()*missingJokes.length);
 if(index===previous)index=(index+1+Math.floor(Math.random()*(missingJokes.length-1)))%missingJokes.length;
 try{sessionStorage.setItem('bbb-last-missing-joke',String(index))}catch(e){}
 return missingJokes[index];
}
const missingJoke=pickMissingJoke();
let lastUpload=null;
function clock(){
 if(!lastUpload)return;
 const ms=Date.now()-new Date(lastUpload).getTime();
 if(!Number.isFinite(ms)||ms<0)return;
 const days=Math.floor(ms/86400000);
 missing.innerHTML=`<h2>👻 The Missing Creator</h2><p class="bbb-note" style="text-align:center">TIME SINCE LAST UPLOAD</p><div class="bbb-counter">${fmt(days)} days</div><p class="bbb-joke">${esc(missingJoke)}</p><p class="bbb-note" style="text-align:center">Identity classified. This creator is not included in Brotherhood statistics.</p>`;
}
async function load(){try{const r=await fetch('./history.json?t='+Date.now());if(!r.ok)throw Error('History unavailable');const h=await r.json();snapshots=(h.snapshots||[]).map(s=>({date:s.date,channels:Object.fromEntries((s.channels||[]).map(c=>[c.channel_id,c]))})).sort((a,b)=>a.date.localeCompare(b.date));byDate.clear();snapshots.forEach(s=>byDate.set(s.date,s));render()}catch(e){growth.innerHTML='<h2>Brotherhood Growth</h2><p class="bbb-note">'+esc(e.message)+'</p>'}
try{const r=await fetch('./missing_creator.json?t='+Date.now());if(r.ok){const j=await r.json();lastUpload=j.last_upload_at||null;clock()}}catch(e){/* keep anonymous status */}}
load();setInterval(load,300000);setInterval(clock,60000);
})();
