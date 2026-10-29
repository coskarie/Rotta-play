(() => {
 'use strict';
 // A ledger convention: everyday supplies first, luxury goods last.
 const categories=['식료품','조미료','가축','잡화','섬유','광석','공업품','주류','직물','염료','의약품','기호품','무기류','총포류','공예품','향신료','향료','미술품','귀금속','보석'];
 const ranks=new Map(categories.map((name,index)=>[name,index]));
 const labels={default:'상품',category:'종류',stock:'수량',buy:'구매가',sell:'판매가'};
 let port=null,column='default',ascending=true;

 function orderedKeys(keys,values,field,asc=true){
  if(field==='default')return [...keys];
  return keys.map((key,index)=>({key,index})).sort((a,b)=>{
   const av=values[a.key],bv=values[b.key];
   const delta=field==='category'
    ?((av.requiredLevel??1)-(bv.requiredLevel??1))||((ranks.get(av.category)??categories.length)-(ranks.get(bv.category)??categories.length))
    :av[field]-bv[field];
   // Ties always retain the port's original display order, including descending.
   return (asc?delta:-delta)||a.index-b.index;
  }).map(item=>item.key);
 }

 function mount(container,{port:nextPort,keys,values}){
  const list=container.querySelector('.market-rows');
  if(!list)return;
  if(port!==nextPort){port=nextPort;column='default';ascending=true}
  const rows=new Map([...list.querySelectorAll('[data-market-good]')].map(row=>[row.dataset.marketGood,row]));
  const buttons=[...container.querySelectorAll('[data-market-sort]')];
  function apply(){
   // Move existing rows only: selection, chart, shutter animation and focus survive.
   for(const key of orderedKeys(keys,values,column,ascending))list.appendChild(rows.get(key));
   list.scrollTop=0;
   for(const button of buttons){
    const field=button.dataset.marketSort,active=field===column;
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',labels[field]+(active&&field!=='default'?(ascending?' 오름차순':' 내림차순'):''));
    button.dataset.direction=active&&field!=='default'?(ascending?'asc':'desc'):'';
   }
  }
  for(const button of buttons)button.onclick=()=>{
   const next=button.dataset.marketSort;
   ascending=next==='default'||next!==column?true:!ascending;
   column=next;apply();
  };
  apply();
 }
 window.ROTTA_MARKET_SORT={mount,orderedKeys,categories};
})();
