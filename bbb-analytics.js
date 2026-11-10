/* Big Brain Brotherhood: additive analytics, preserves existing dashboard. */
(() => {
  const css = `
  #bbb-analytics{margin:18px 0;padding:18px;border:1px solid var(--line,#444);border-radius:14px;background:var(--panel,#20242b);color:var(--text,#fff)}
  #bbb-analytics *{box-sizing:border-box}#bbb-analytics h2{margin:0 0 12px;font-size:1.2rem}
  .bbb-controls{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px}.bbb-controls button{border:1px solid var(--line,#555);background:var(--panel2,#30353d);color:inherit;border-radius:7px;padding:7px 12px;cursor:pointer}
  .bbb-controls button.active{outline:2px solid var(--accent,#aab)}
  .bbb-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}
  .bbb-tile{padding:13px;background:var(--panel2,#30353d);border-radius:10px}.bbb-tile small{display:block;color:var(--muted,#aaa)}.bbb-tile strong{font-size:clamp(1.25rem,3vw,1.9rem)}
  .bbb-note{color:var(--muted,#aaa);font-size:.83rem;margin:10px 0}.bbb-legend{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.bbb-legend span{font-size:.78rem;white-space:nowrap}
  .bbb-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
  .bbb-chart{width:100%;height:190px;display:block;background:var(--panel2,#30353d);border-radius:9px;margin-bottom:10px}
  .bbb-table{width:100%;border-collapse:collapse;font-size:.85rem}.bbb-table th,.bbb-table td{text-align:left;border-bottom:1px solid var(--line,#444);padding:8px 5px}.bbb-table td:nth-child(n+2){text-align:right}.bbb-table th:nth-child(n+2){text-align:right}
  @media(max-width:550px){.bbb-summary{grid-template-columns:1fr}.bbb-table{font-size:.75rem}}
  `;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
  const box=document.createElement('section');box.id='bbb-analytics';box.innerHTML='<h2>Brotherhood growth</h2><p class="bbb-note">Loading historical data…</p>';
  const anchor=document.getElementById('combined-views-goal');
  const parent=anchor?.closest('section') || anchor?.parentElement?.parentElement;
  if(parent?.parentElement) parent.insertAdjacentElement('afterend',box);
  else (document.querySelector('main')||document.body).appendChild(box);
  const fmt=n=>Math.round(n).toLocaleString('en-GB');
  const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dayAdd=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
  const startWeek=s=>{const d=new Date(s+'T00:00:00Z');return dayAdd(s,-((d.getUTCDay()+6)%7))};
  const sum=s=>Object.values(s.channels||{}).reduce((a,c)=>({views:a.views+(+c.views||0),subs:a.subs+(+c.subscribers||0)}),{views:0,subs:0});
  let period='day',metric='views',hist=[],colors={},current=[];
  const first=s=>hist.find(x=>x.date===s);
  const delta=(start,end,id)=>{
    const a=first(start),b=first(end);if(!a||!b)return null;
    const get=(snap)=>id?snap.channels[id]:sum(snap);
    const aa=get(a),bb=get(b);if(!aa||!bb)return null;
    return {views:bb.views-aa.views,subs:bb.subs-aa.subs};
  };
  const fmtDelta=v=>v==null?'—':(v>=0?'+':'')+fmt(v);
  const pct=(v,prev)=>prev==null||prev===0?'—':(v-prev>=0?'+':'')+((v-prev)/Math.abs(prev)*100).toFixed(1)+'%';
  function drawChart(canvas,series){
    const W=800,H=190,p=28;const all=series.flatMap(x=>x.values.filter(Number.isFinite));
    const max=Math.max(1,...all),min=Math.min(0,...all);const span=max-min||1;
    const paths=series.map(s=>{const points=s.values.map((v,i)=>Number.isFinite(v)?[p+(W-2*p)*i/Math.max(1,s.values.length-1),H-p-(v-min)/span*(H-2*p)]:null);let d='';points.forEach(pt=>{if(pt){d+=(d?' L':'M')+pt.map(x=>x.toFixed(1)).join(' ')}else d+=' ';});return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round"/>`}).join('');
    canvas.innerHTML=`<line x1="${p}" y1="${H-p}" x2="${W-p}" y2="${H-p}" stroke="currentColor" opacity=".3"/>${paths}`;
  }
  function render(){
    if(!hist.length){box.innerHTML='<h2>Brotherhood growth</h2><p class="bbb-note">Historical data will appear after the first daily snapshot.</p>';return}
    const latest=hist.at(-1).date;
    // Completed UTC days only. Snapshot is collected at 23:45 UTC.
    const yesterday=dayAdd(latest,-1),weekStart=startWeek(latest),lastWeekStart=dayAdd(weekStart,-7);
    let curStart,curEnd,prevStart,prevEnd,label;
    if(period==='day'){curStart=dayAdd(latest,-1);curEnd=latest;prevStart=dayAdd(latest,-2);prevEnd=dayAdd(latest,-1);label='Last recorded day'}
    if(period==='week'){curStart=dayAdd(lastWeekStart,-1);curEnd=dayAdd(weekStart,-1);prevStart=dayAdd(lastWeekStart,-8);prevEnd=dayAdd(lastWeekStart,-1);label='Last completed week'}
    if(period==='year'){const yr=latest.slice(0,4);curStart=yr+'-01-01';curEnd=latest;prevStart=(+yr-1)+'-01-01';prevEnd=(+yr-1)+latest.slice(4);label='Year to date'}
    const cur=delta(curStart,curEnd),prev=delta(prevStart,prevEnd);
    const metricTile=(field,name)=>`<div class="bbb-tile"><small>${name} · ${label}</small><strong>${fmtDelta(cur?.[field])}</strong><small>Previous: ${fmtDelta(prev?.[field])} · Change: ${cur&&prev?pct(cur[field],prev[field]):'—'}</small></div>`;
    const controls=`<div class="bbb-controls">${[['day','Daily'],['week','Weekly'],['year','This year']].map(([k,v])=>`<button data-period="${k}" class="${period===k?'active':''}">${v}</button>`).join('')}<button data-metric="views" class="${metric==='views'?'active':''}">Views chart</button><button data-metric="subs" class="${metric==='subs'?'active':''}">Subscribers chart</button></div>`;
    const channels=current.map(c=>({id:c.channel_id,name:c.channel,color:colors[c.channel_id]?.primary||'#9cb7d1'})).sort((a,b)=>a.name.localeCompare(b.name));
    const rows=channels.map(c=>{const d=delta(curStart,curEnd,c.id),p=delta(prevStart,prevEnd,c.id);return `<tr><td><i class="bbb-dot" style="background:${c.color}"></i>${safe(c.name)}</td><td>${fmtDelta(d?.views)}</td><td>${fmtDelta(d?.subs)}</td><td>${d&&p?pct(d.views,p.views):'—'}</td><td>${d&&p?pct(d.subs,p.subs):'—'}</td></tr>`}).join('');
    const dates=hist.map(s=>s.date).filter(s=>s>=curStart&&s<=curEnd);
    const series=channels.map(c=>({name:c.name,color:c.color,values:dates.map(date=>{const d=delta(dayAdd(date,-1),date,c.id);return d?.[metric]??null})}));
    box.innerHTML=`<h2>Brotherhood growth</h2>${controls}<div class="bbb-summary">${metricTile('views','Views gained')}${metricTile('subs','Subscribers gained')}</div><svg class="bbb-chart" viewBox="0 0 800 190" preserveAspectRatio="none" role="img" aria-label="Daily growth by channel"></svg><div class="bbb-legend">${channels.map(c=>`<span><i class="bbb-dot" style="background:${c.color}"></i>${safe(c.name)}</span>`).join('')}</div><table class="bbb-table"><thead><tr><th>Channel</th><th>Views</th><th>Subs</th><th>Views %</th><th>Subs %</th></tr></thead><tbody>${rows}</tbody></table><p class="bbb-note">UTC snapshot comparisons. Missing baseline dates show —. Public subscriber counts are rounded. Year-to-date needs a 1 January baseline; it cannot be backfilled from current totals.</p>`;
    drawChart(box.querySelector('svg'),series);
    box.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;render()});
    box.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{metric=b.dataset.metric;render()});
  }
  async function load(){
    try{
      const [h,p,f]=await Promise.all(['history.json','channel_colors.json','channels.json'].map(x=>fetch('./'+x+'?t='+Date.now()).then(r=>{if(!r.ok)throw Error(x+' HTTP '+r.status);return r.json()})));
      colors=p;current=f.channels||[];
      hist=(h.snapshots||[]).map(s=>({date:s.date,channels:Object.fromEntries((s.channels||[]).map(c=>[c.channel_id,c]))})).sort((a,b)=>a.date.localeCompare(b.date));
      // Existing channelColor() function reads this map when available.
      window.BBB_PROFILE_COLORS=colors;
      if(typeof window.render==='function'&&window.currentData)window.render(window.currentData);
      render();
    }catch(e){box.innerHTML='<h2>Brotherhood growth</h2><p class="bbb-note">Historical feed not ready: '+safe(e.message)+'</p>'}
  }
  load();setInterval(load,300000);
})();
