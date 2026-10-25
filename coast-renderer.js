(function(root){
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg';
  function visibleChunks(chunks,bounds){
    return chunks.filter(({bbox:b})=>b[2]>=bounds.left&&b[0]<=bounds.right&&b[3]>=bounds.top&&b[1]<=bounds.bottom);
  }
  function mount(group,chunks){
    const mounted=new Map();
    let signature='';
    return {
      update(left,top,right,bottom){
        // A padded, quantized window avoids per-frame path/DOM rebuilding.
        const bounds={left:Math.floor(left/64)*64-64,top:Math.floor(top/64)*64-64,
          right:Math.ceil(right/64)*64+64,bottom:Math.ceil(bottom/64)*64+64};
        const next=Object.values(bounds).join(':');
        if(next===signature)return;
        signature=next;
        const selected=visibleChunks(chunks,bounds),wanted=new Set(selected.map(c=>c.id));
        for(const [id,node] of mounted)if(!wanted.has(id)){node.remove();mounted.delete(id);}
        for(const chunk of selected){
          if(mounted.has(chunk.id))continue;
          const node=document.createElementNS(SVG_NS,'path');
          node.setAttribute('class','manual-trace-coast');node.setAttribute('d',chunk.d);
          node.setAttribute('vector-effect','non-scaling-stroke');node.dataset.coastChunk=chunk.id;
          group.appendChild(node);mounted.set(chunk.id,node);
        }
        group.dataset.coastVisible=String(selected.length);
        group.dataset.coastSegments=String(selected.reduce((n,c)=>n+c.segments,0));
        group.dataset.coastTotal=String(chunks.length);
      }
    };
  }
  const api={visibleChunks,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ROTTA_COAST_RENDERER=api;
})(typeof window!=='undefined'?window:null);
