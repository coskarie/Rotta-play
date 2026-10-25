(function(){
 'use strict';
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>Math.round(n).toLocaleString('ko-KR');
 const HEIGHT=160;
 function render({name,bars,selected,width:availableWidth}){
  if(!bars.length)return '';
  const current=bars[bars.length-1],chosen=bars.find(b=>b.stamp===selected)||current;
  const low=Math.min(...bars.map(b=>b.close)),high=Math.max(...bars.map(b=>b.close)),padding=Math.max(2,(high-low)*.18);
  const min=Math.max(0,low-padding),max=high+padding,y=value=>4+(max-value)/(max-min)*132;
  const width=Math.max(240,Number(availableWidth)||580),left=38,right=width-10,step=(right-left)/Math.max(5,bars.length),offset=(right-left-step*bars.length)/2;
  const positions=bars.map((b,i)=>({bar:b,x:left+offset+step*(i+.5),y:y(b.close)}));
  const ticks=Array.from({length:3},(_,i)=>{const value=min+(max-min)*i/2;return`<text x="${left-8}" y="${y(value)+3}" text-anchor="end">${number(value)}</text>`}).join('');
  const points=positions.map(({bar:b,x,y})=>{
   const active=b.stamp===chosen.stamp,label=`${b.month}월 ${number(b.close)}`;
   return`<g class="chart-point${active?' active':''}" tabindex="0" role="button" aria-pressed="${active}" aria-label="${label}" data-chart-month="${b.stamp}"><title>${label}</title><rect class="point-hit" x="${x-step*.45}" y="2" width="${step*.9}" height="156"/><circle class="point-dot" cx="${x}" cy="${y}" r="${active?3:2}"/><text x="${x}" y="154" text-anchor="middle">${b.month}월</text></g>`;
  }).join('');
  const line=positions.map(p=>`${p.x},${p.y}`).join(' ');
  return`<svg class="market-line-chart" viewBox="0 0 ${width} ${HEIGHT}" role="group" aria-label="${escape(name)} 시세"><defs><pattern id="marketGridFine" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0H0V8" class="grid-fine"/></pattern><pattern id="marketGridMajor" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="grid-major"/></pattern></defs><rect class="chart-paper" x="${left}" y="4" width="${right-left}" height="132"/><rect x="${left}" y="4" width="${right-left}" height="132" fill="url(#marketGridFine)"/><rect x="${left}" y="4" width="${right-left}" height="132" fill="url(#marketGridMajor)"/>${ticks}<polyline class="price-line" points="${line}"/>${points}</svg>`;
 }
 window.ROTTA_MARKET_CHART={render,HEIGHT};
})();
