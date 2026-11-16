(() => {
  const canvas=document.querySelector('#vessel'),stage=canvas.parentElement;
  const yaw=document.querySelector('#yaw'),pitch=document.querySelector('#pitch'),zoom=document.querySelector('#zoom');
  let renderer;try{renderer=window.ROTTA_SHIP_3D.createRenderer(canvas)}catch(e){console.error(e)}
  if(!renderer){document.querySelector('#error').hidden=false;return}
  let frame=0;
  function draw(){frame=0;const size=Math.min(stage.clientWidth,stage.clientHeight);renderer.draw({heading:+yaw.value,pitch:+pitch.value,size,scale:size/22*(+zoom.value),center:6});document.querySelector('#yawValue').textContent=yaw.value+'°';document.querySelector('#pitchValue').textContent=pitch.value+'°';document.querySelector('#zoomValue').textContent=Number(zoom.value).toFixed(2)+'×';for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',b.dataset.view===`${yaw.value},${pitch.value}`)}
  const queue=()=>{if(!frame)frame=requestAnimationFrame(draw)};
  for(const input of [yaw,pitch,zoom])input.addEventListener('input',queue);
  for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{[yaw.value,pitch.value]=button.dataset.view.split(',');queue()};
  let drag=null;
  canvas.onpointerdown=e=>{if(e.button!==0&&e.button!==2)return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,yaw:+yaw.value,pitch:+pitch.value};canvas.focus()};
  canvas.onpointermove=e=>{if(!drag)return;yaw.value=(drag.yaw+(e.clientX-drag.x)*.45+720)%360;pitch.value=Math.max(0,Math.min(85,drag.pitch+(e.clientY-drag.y)*.35));queue()};
  canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null};canvas.oncontextmenu=e=>e.preventDefault();
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom.value=Math.max(.65,Math.min(1.6,+zoom.value+(e.deltaY<0?.05:-.05)));queue()},{passive:false});
  canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')yaw.value=(+yaw.value+(e.key==='ArrowLeft'?-5:5)+360)%360;else pitch.value=Math.max(0,Math.min(85,+pitch.value+(e.key==='ArrowUp'?-5:5)));queue()};
  new ResizeObserver(queue).observe(stage);canvas.addEventListener('shiprendererchange',queue);queue();
  window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame)},{once:true});
})();
