/* Reference-built carrack: +Y bow, +Z up. No network assets or per-frame mesh creation. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const colors = {wood:[.30,.16,.085], deck:[.54,.36,.19], trim:[.65,.45,.22], dark:[.12,.075,.044], rope:[.19,.16,.12], cloth:[.91,.87,.74], iron:[.12,.14,.13]};
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  let cached;
  function buildModel() {
    if(cached)return cached;
    const data=[];
    function tri(a,b,c,color,material=0) {
      const face=cross(sub(b,a),sub(c,a));if(Math.hypot(...face)<1e-8)return;
      const n=norm(face);
      for(const p of [a,b,c])data.push(...p,...n,...color,material);
    }
    function quad(a,b,c,d,color,material=0){tri(a,b,c,color,material);tri(a,c,d,color,material)}
    function tube(a,b,r,color=colors.rope,sides=6,r2=r){
      const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[2])>.9?[1,0,0]:[0,0,1])),v=cross(axis,u);
      const point=(p,angle,radius)=>p.map((x,j)=>x+radius*(u[j]*Math.cos(angle)+v[j]*Math.sin(angle)));
      for(let i=0;i<sides;i++){const t=i*TAU/sides,s=(i+1)*TAU/sides;quad(point(a,t,r),point(a,s,r),point(b,s,r2),point(b,t,r2),color)}
    }
    function box(x,y,z,w,l,h,c=colors.wood,m=0){
      const p=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,d])=>[x+a*w/2,y+b*l/2,z+d*h]);
      for(const f of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])quad(...f.map(i=>p[i]),c,m);
    }
    // Stations retain the rounded stern, full belly and fine rising bow of the references.
    const stations=[[-6,.68,3.65],[-5.5,1.28,3.58],[-4.4,1.63,3.45],[-3.4,1.82,3.35],[-2.6,1.9,2.1],[-1.6,1.95,1.83],[0,1.93,1.8],[1.6,1.8,1.9],[2.5,1.55,2.18],[3.3,1.29,3.1],[4.2,.97,3.26],[5.1,.55,3.4],[5.8,.05,3.54]];
    function station(y){let i=1;while(i<stations.length-1&&stations[i][0]<y)i++;const a=stations[i-1],b=stations[i],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
    function hull(y,t,side){const [w,z]=station(y);const keel=-1.35+Math.pow(Math.abs(y/6),4)*1.3;return [side*w*Math.pow(Math.sin(t*Math.PI/2),.68),y,keel+(z-keel)*t]}
    for(let i=0;i<100;i++)for(let j=0;j<18;j++)for(const side of [-1,1]){
      const y=-6+11.8*i/100,yn=-6+11.8*(i+1)/100,t=j/18,tn=(j+1)/18;
      quad(hull(y,t,side),hull(yn,t,side),hull(yn,tn,side),hull(y,tn,side),j<5?[.38,.27,.15]:colors.wood,1);
    }
    // Transom and narrow stern gallery.
    for(let j=0;j<18;j++){const a=j/18,b=(j+1)/18;quad(hull(-6,a,-1),hull(-6,a,1),hull(-6,b,1),hull(-6,b,-1),colors.wood,1)}
    for(let i=0;i<100;i++){
      const y=-6+11.8*i/100,yn=-6+11.8*(i+1)/100;
      quad(hull(y,1,-1),hull(y,1,1),hull(yn,1,1),hull(yn,1,-1),colors.deck,2);
      for(const side of [-1,1])for(const [t,r,c] of [[1,.055,colors.trim],[.45,.10,colors.dark],[.84,.045,colors.trim]]){const ring=(at)=>{if(t!==.45)return hull(at,t,side);const [,z]=station(at),keel=-1.35+Math.pow(Math.abs(at/6),4)*1.3;return hull(at,(.35+.42*(at/6)**2-keel)/(z-keel),side)};tube(ring(y),ring(yn),r,c,5);}
    }
    function rail(y0,y1,side){
      const steps=Math.ceil((y1-y0)/.42);
      for(let i=0;i<=steps;i++){const y=y0+(y1-y0)*i/steps,[w,z]=station(y);tube([w*side,y,z],[w*side,y,z+.65],.035,colors.trim,5);
        if(i<steps){const yn=y0+(y1-y0)*(i+1)/steps,[wn,zn]=station(yn);for(const h of [.29,.65])tube([w*side,y,z+h],[wn*side,yn,zn+h],h===.65?.055:.038,colors.dark,5)}}
    }
    for(const side of [-1,1]){rail(-6,-3.4,side);rail(3.3,5.8,side);rail(-2.5,2.5,side)}
    for(const y of [-6,-3.4,3.3]){const [w,z]=station(y);for(const h of [.3,.65])tube([-w,y,z+h],[w,y,z+h],.045,colors.dark);for(let x=-w;x<=w;x+=.32)tube([x,y,z],[x,y,z+.65],.03,colors.trim)}
    // Stern rudder, carved gallery, windows, lanterns and rail on the transom.
    box(0,-6.14,-1.1,.21,.48,3.4,colors.wood,1);
    for(const z of [-.4,.5,1.4])box(0,-6.4,z,.25,.05,.09,colors.iron);
    for(const z of [1.8,2.65,3.4])box(0,-6.10,z,1.6,.12,.085,colors.trim);
    for(const x of [-.44,.44]){box(x,-6.12,2.83,.36,.12,.42,colors.trim);box(x,-6.20,2.89,.24,.025,.29,[.075,.12,.12]);box(x,-6.23,2.89,.025,.03,.29,colors.trim)}
    for(const x of [-.85,.85]){tube([x,-5.7,4.1],[x,-5.7,4.65],.045,colors.trim);box(x,-5.7,4.62,.19,.19,.3,colors.trim);box(x,-5.7,4.67,.13,.2,.18,[.78,.65,.32])}
    // Deck hatches, companionway, stairs and cargo details.
    for(const y of [.6,-1.5]){box(0,y,1.88,1.15,.9,.12,colors.dark);for(let x=-.5;x<=.5;x+=.15)box(x,y,2.01,.035,.82,.025,colors.trim);for(let dy=-.35;dy<=.35;dy+=.15)box(0,y+dy,2.01,1.05,.035,.025,colors.trim)}
    for(let i=0;i<8;i++)box(.9,-2.45-i*.12,1.95+i*.18,.58,.17,.10,colors.deck,2);
    tube([.56,-2.35,2.5],[.56,-3.4,4.0],.03,colors.trim);tube([1.22,-2.35,2.5],[1.22,-3.4,4],.03,colors.trim);
    box(0,-4.4,3.52,.8,.85,.33,colors.wood,2);
    for(const [x,y] of [[-1.25,-1.9],[1.2,1.5],[-1.1,1.4]]){tube([x,y,1.92],[x,y,2.42],.22,colors.deck,10);for(const h of [2,2.34])for(let i=0;i<10;i++){const t=i*TAU/10,s=(i+1)*TAU/10;tube([x+.225*Math.cos(t),y+.225*Math.sin(t),h],[x+.225*Math.cos(s),y+.225*Math.sin(s),h],.025,colors.iron,4)}}
    // Masts, collars and tapered spars.
    const masts=[{y:3.15,base:2.6,top:10.7,r:.11},{y:-.3,base:1.8,top:15.1,r:.16},{y:-4.6,base:3.5,top:10.1,r:.10}];
    for(const m of masts){tube([0,m.y,m.base],[0,m.y,m.top],m.r,colors.dark,12,m.r*.35);for(let z=m.base+.4;z<m.top-1;z+=2.4)tube([0,m.y,z],[0,m.y,z+.10],m.r*1.15,colors.trim,10)}
    tube([0,4.5,2.9],[0,9,6.4],.10,colors.dark,10,.045);
    tube([-.85,7.7,5.4],[.85,7.7,5.4],.04,colors.trim);
    // Crow's nest, open balusters so it reads as a basket at side angles.
    for(let i=0;i<20;i++){const a=i*TAU/20,b=(i+1)*TAU/20;quad([0,-.3,10.6],[.53*Math.cos(a),-.3+.53*Math.sin(a),10.6],[.53*Math.cos(b),-.3+.53*Math.sin(b),10.6],[0,-.3,10.6],colors.wood);tube([.53*Math.cos(a),-.3+.53*Math.sin(a),10.6],[.7*Math.cos(a),-.3+.7*Math.sin(a),11.3],.025,colors.trim,4);tube([.7*Math.cos(a),-.3+.7*Math.sin(a),11.3],[.7*Math.cos(b),-.3+.7*Math.sin(b),11.3],.055,colors.dark,5)}
    function squareSail(y,top,bottom,width,topWidth){
      const nx=28,nz=22;
      const p=(u,v)=>[(u-.5)*(topWidth+(width-topWidth)*v),y+.12+Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*.95,top-(top-bottom)*v+.44*Math.sin(Math.PI*u)*v*v];
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quad(p(i/nx,j/nz),p((i+1)/nx,j/nz),p((i+1)/nx,(j+1)/nz),p(i/nx,(j+1)/nz),colors.cloth,3);
      tube([-topWidth/2-.25,y,top+.06],[topWidth/2+.25,y,top+.06],.065,colors.trim,8,.05);
      for(const u of [0,1]){for(let j=0;j<nz;j++)tube(p(u,j/nz),p(u,(j+1)/nz),.017,colors.trim,4);tube(p(u,1),[u===0?-1.65:1.65,y-1,2.25],.018)}
      for(let i=0;i<nx;i++)tube(p(i/nx,1),p((i+1)/nx,1),.018,colors.trim,4);
      tube([0,y,top+1.1],[-topWidth/2,y,top],.017);tube([0,y,top+1.1],[topWidth/2,y,top],.017);
    }
    squareSail(-.3,10.45,4.1,6.8,6.5);
    squareSail(-.3,13.65,11.3,4.2,3.25);
    squareSail(3.15,8.65,4.1,4.35,4.1);
    const a=[0,-2.7,5.3],b=[0,-7.1,10.0],c=[0,-6.2,4.5],n=24;
    const lateen=(u,v)=>{const p=a.map((x,i)=>x+(b[i]-x)*u+(c[i]-x)*v);p[0]+=.65*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*Math.sin(Math.PI*(u+v));return p};
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){tri(lateen(i/n,j/n),lateen((i+1)/n,j/n),lateen(i/n,(j+1)/n),colors.cloth,3);if(i+j<n-1)tri(lateen((i+1)/n,j/n),lateen((i+1)/n,(j+1)/n),lateen(i/n,(j+1)/n),colors.cloth,3)}
    tube(a,b,.065,colors.trim,8);tube(b,c,.02,colors.trim);tube(c,a,.02,colors.trim);
    // Stays and shrouds. Ratlines are geometry, not transparent image planes.
    for(const m of masts){
      tube([0,m.y,m.top-.35],[0,8.8,6.2],.018);
      for(const side of [-1,1]){
        const ends=[];for(let i=0;i<5;i++){const y=m.y-.9+i*.31,[w,z]=station(y);const end=[side*(w+.12),y,z+.1];ends.push(end);tube(end,[0,m.y,m.top*.72],.022);tube([side*w,y,z],[side*(w+.2),y,z],.05,colors.trim)}
        for(let t=.08;t<.9;t+=.065)tube(mix(ends[0],[0,m.y,m.top*.72],t),mix(ends[4],[0,m.y,m.top*.72],t),.012,colors.rope,4);
      }
    }
    tube([0,9,6.4],[0,5.3,.5],.025);tube([0,-.3,14.7],[0,-5.8,3.7],.022);
    cached={vertices:new Float32Array(data),triangles:data.length/30};
    return cached;
  }
  const vertex=`precision highp float;
attribute vec3 a_position,a_normal,a_color;attribute float a_material;
uniform vec2 u_size;uniform float u_heading,u_pitch,u_scale,u_center;
varying vec3 v_position,v_normal,v_color;varying float v_material;
void main(){float c=cos(u_heading),s=sin(u_heading),cp=cos(u_pitch),sp=sin(u_pitch);
vec3 p=a_position;float x=p.x*c+p.y*s,y=p.x*s-p.y*c,z=p.z-u_center;
float vertical=y*cp-z*sp,depth=y*sp+z*cp;
gl_Position=vec4(x*u_scale*2.0/u_size.x,-vertical*u_scale*2.0/u_size.y,-depth/60.0,1.0);
v_position=p;v_normal=a_normal;v_color=a_color;v_material=a_material;}`;
  const fragment=`precision mediump float;
varying vec3 v_position,v_normal,v_color;varying float v_material;uniform float u_waterline;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){if(v_position.z<u_waterline)discard;vec3 n=normalize(v_normal);if(!gl_FrontFacing)n=-n;
float sun=max(0.0,dot(n,normalize(vec3(-.6,.35,1.0))));float fill=abs(n.z)*.08;
vec3 color=v_color;vec3 p=v_position;
if(v_material>.5&&v_material<2.5){
 float deck=step(1.5,v_material);float across=mix(p.z,p.x,deck),along=p.y;
 float row=floor(across*5.5),f=fract(across*5.5);float seam=smoothstep(.01,.07,f)*(1.0-smoothstep(.93,.99,f));
 float grain=sin(along*46.0+sin(across*57.0)*1.2)*.032+sin(along*127.0+across*83.0)*.016;
 float ends=step(.022,fract((along+hash(vec2(row,2.0))*4.0)/2.2));
 color*= (.78+.22*seam)*(.92+.08*ends)*( .92+hash(vec2(row,1.0))*.16+grain);
}else if(v_material>2.5){float seam=pow(.5+.5*cos(p.x*15.0),28.0);float weave=sin(p.x*165.0)*sin(p.z*165.0)*.012;color*=1.0-seam*.075+weave;sun=.35+.65*abs(dot(n,normalize(vec3(-.6,.35,1.0))));}
color*=.48+.53*sun+fill;gl_FragColor=vec4(color,1.0);}`;
  function createRenderer(canvas){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false});if(!gl)return null;
    let program,buffer,locations,draws=0,last='',disposed=false;
    function initialize(){
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
      program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,buildModel().vertices,gl.STATIC_DRAW);
      for(const [name,size,offset] of [['position',3,0],['normal',3,12],['color',3,24],['material',1,36]]){const a=gl.getAttribLocation(program,'a_'+name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset)}
      locations=Object.fromEntries(['size','heading','pitch','scale','center','waterline'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
      gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);last='';
    }
    initialize();
    function lost(e){e.preventDefault();last='';canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    function restored(){initialize();canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
    return {
      get stats(){return {triangles:buildModel().triangles,draws,drawCallsPerFrame:1,bufferBytes:buildModel().vertices.byteLength}},
      draw({heading=0,pitch=0,size=160,scale=4,center=0,waterline=-10,ratio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
        if(disposed||gl.isContextLost())return false;
        const key=[heading,pitch,size,scale,center,waterline,ratio].join(':');if(key===last)return true;last=key;
        const pixels=Math.round(size*ratio);if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels}gl.viewport(0,0,pixels,pixels);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(locations.size,size,size);gl.uniform1f(locations.heading,heading*Math.PI/180);gl.uniform1f(locations.pitch,pitch*Math.PI/180);gl.uniform1f(locations.scale,scale);gl.uniform1f(locations.center,center);gl.uniform1f(locations.waterline,waterline);gl.drawArrays(gl.TRIANGLES,0,buildModel().vertices.length/10);draws++;return true;
      },
      dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);gl.deleteBuffer(buffer);gl.deleteProgram(program)}
    };
  }
  let gameRenderer,gameCanvas,failed=false;
  function drawShip(element,heading,pitch,zoom){
    if(failed)return false;
    if(!gameRenderer){try{gameCanvas=document.createElement('canvas');gameCanvas.className='ship-model';gameCanvas.setAttribute('aria-label','3D 카락 무역선');gameRenderer=createRenderer(gameCanvas);if(!gameRenderer){failed=true;return false}element.appendChild(gameCanvas)}catch(error){console.warn('Ship 3D unavailable',error);failed=true;return false}}
    // Render at final display resolution; no independently running animation loop.
    const screenScale=.62+Math.max(0,Math.min(1,(zoom-1)/9))*.73;
    return gameRenderer.draw({heading,pitch,size:160,scale:4,waterline:0,ratio:Math.min(2,globalThis.devicePixelRatio||1)*Math.max(1,screenScale)});
  }
  const api={buildModel,createRenderer,drawShip,get stats(){return gameRenderer?.stats??null}};
  if(typeof module==='object')module.exports=api;else window.ROTTA_SHIP_3D=api;
})();
