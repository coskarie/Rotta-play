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
uniform vec2 u_size;uniform float u_heading,u_pitch,u_scale,u_center,u_heave;
uniform vec4 u_hull_rotation;
varying vec3 v_position,v_normal,v_color;varying float v_material;
varying mediump float v_surface_height;
vec3 rock(vec3 p){
 float rollCos=u_hull_rotation.x,rollSin=u_hull_rotation.y;
 float pitchCos=u_hull_rotation.z,pitchSin=u_hull_rotation.w;
 vec3 rolled=vec3(p.x*rollCos-p.z*rollSin,p.y,p.x*rollSin+p.z*rollCos);
 return vec3(rolled.x,rolled.y*pitchCos-rolled.z*pitchSin,rolled.y*pitchSin+rolled.z*pitchCos);
}
void main(){float c=cos(u_heading),s=sin(u_heading),cp=cos(u_pitch),sp=sin(u_pitch);
vec3 p=rock(a_position);p.z+=u_heave;
float x=p.x*c+p.y*s,y=p.x*s-p.y*c,z=p.z-u_center;
float vertical=y*cp-z*sp,depth=y*sp+z*cp;
gl_Position=vec4(x*u_scale*2.0/u_size.x,-vertical*u_scale*2.0/u_size.y,-depth/60.0,1.0);
v_position=a_position;v_normal=rock(a_normal);v_color=a_color;v_material=a_material;v_surface_height=p.z;}`;
  const fragment=`precision mediump float;
varying vec3 v_position,v_normal,v_color;varying float v_material;uniform float u_waterline;
varying mediump float v_surface_height;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){if(v_surface_height<u_waterline)discard;vec3 n=normalize(v_normal);if(!gl_FrontFacing)n=-n;
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
      locations=Object.fromEntries(['size','heading','pitch','scale','center','waterline','heave','hull_rotation'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
      gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);last='';
    }
    initialize();
    function lost(e){e.preventDefault();last='';canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    function restored(){initialize();canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
    return {
      get stats(){return {triangles:buildModel().triangles,draws,drawCallsPerFrame:1,bufferBytes:buildModel().vertices.byteLength}},
      draw({heading=0,pitch=0,size=160,scale=4,center=0,waterline=-10,roll=0,hullPitch=0,heave=0,ratio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
        if(disposed||gl.isContextLost())return false;
        const key=[heading,pitch,size,scale,center,waterline,roll,hullPitch,heave,ratio].join(':');if(key===last)return true;last=key;
        const pixels=Math.round(size*ratio);if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels}gl.viewport(0,0,pixels,pixels);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(locations.size,size,size);gl.uniform1f(locations.heading,heading*Math.PI/180);gl.uniform1f(locations.pitch,pitch*Math.PI/180);gl.uniform1f(locations.scale,scale);gl.uniform1f(locations.center,center);gl.uniform1f(locations.waterline,waterline);
        gl.uniform1f(locations.heave,heave);
        gl.uniform4f(locations.hull_rotation,Math.cos(roll),Math.sin(roll),Math.cos(hullPitch),Math.sin(hullPitch));
        gl.drawArrays(gl.TRIANGLES,0,buildModel().vertices.length/10);draws++;return true;
      },
      dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);gl.deleteBuffer(buffer);gl.deleteProgram(program)}
    };
  }
  const MOTION_FPS=12;
  const WAKE_SIZE=272,WAKE_LIFETIME=4.8,MAX_WAKE_PACKETS=20;
  const stillPose={roll:0,hullPitch:0,heave:0};
  let gameRenderer,gameCanvas,motionPreference,failed=false;
  let pose=stillPose,lastMotionFrame;
  let wakeCanvas,wakeContext,foamStamp,wakeRatio,lastWakeFrame,wakePaints=0;
  let wakePackets=[],lastWakePosition,lastWakeZoom,lastEmission=-Infinity,emissionIndex=0;
  let departureWakeStarted;
  const COAST_TILE_SIZE=64,MAX_COAST_TILES=128;
  const coastTiles=new Map();
  let coastWaterSource;

  function coastLandRectangles(column,row,isWater){
    const key=column+':'+row;
    const cached=coastTiles.get(key);
    if(cached)return cached;
    const rectangles=[];
    const left=column*COAST_TILE_SIZE,top=row*COAST_TILE_SIZE;
    let previous=new Map();
    for(let y=0;y<COAST_TILE_SIZE;y++){
      const current=new Map();
      let x=0;
      while(x<COAST_TILE_SIZE){
        if(isWater(left+x+.5,top+y+.5)){x++;continue;}
        const start=x++;
        while(x<COAST_TILE_SIZE&&!isWater(left+x+.5,top+y+.5))x++;
        const spanKey=start*(COAST_TILE_SIZE+1)+x;
        let rectangle=previous.get(spanKey);
        if(rectangle)rectangle.height++;
        else{
          rectangle={x:left+start,y:top+y,width:x-start,height:1};
          rectangles.push(rectangle);
        }
        current.set(spanKey,rectangle);
      }
      previous=current;
    }
    coastTiles.set(key,rectangles);
    if(coastTiles.size>MAX_COAST_TILES)coastTiles.delete(coastTiles.keys().next().value);
    return rectangles;
  }

  function eraseWakeOnLand(ctx,water,project,origin,zoom,screenScale){
    if(!water?.isWater||!water.unproject)return;
    if(coastWaterSource!==water.isWater){
      coastTiles.clear();
      coastWaterSource=water.isWater;
    }
    const radius=WAKE_SIZE/2*screenScale;
    const corners=[[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius]]
      .map(([x,y])=>water.unproject(origin.x+x,origin.y+y));
    if(corners.some(point=>!Number.isFinite(point.x)||!Number.isFinite(point.y))){
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,wakeCanvas.width,wakeCanvas.height);
      return;
    }
    const padding=.75/zoom;
    const left=Math.min(...corners.map(point=>point.x))-padding;
    const right=Math.max(...corners.map(point=>point.x))+padding;
    const top=Math.min(...corners.map(point=>point.y))-padding;
    const bottom=Math.max(...corners.map(point=>point.y))+padding;
    const factor=wakeRatio/screenScale;
    const edgeStep=16/zoom;
    let hasLand=false;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.beginPath();
    function vertex(x,y,first=false){
      const point=project(x,y);
      const px=WAKE_SIZE/2*wakeRatio+(point.x-origin.x)*factor;
      const py=WAKE_SIZE/2*wakeRatio+(point.y-origin.y)*factor;
      if(first)ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    }
    for(let row=Math.floor(top/COAST_TILE_SIZE);row<=Math.floor(bottom/COAST_TILE_SIZE);row++){
      for(let column=Math.floor(left/COAST_TILE_SIZE);column<=Math.floor(right/COAST_TILE_SIZE);column++){
        for(const rectangle of coastLandRectangles(column,row,water.isWater)){
          const x0=Math.max(left,rectangle.x-padding),x1=Math.min(right,rectangle.x+rectangle.width+padding);
          const y0=Math.max(top,rectangle.y-padding),y1=Math.min(bottom,rectangle.y+rectangle.height+padding);
          if(x0>=x1||y0>=y1)continue;
          hasLand=true;
          vertex(x0,y0,true);
          const horizontalSteps=Math.max(1,Math.ceil((x1-x0)/edgeStep));
          const verticalSteps=Math.max(1,Math.ceil((y1-y0)/edgeStep));
          for(let step=1;step<=horizontalSteps;step++)vertex(x0+(x1-x0)*step/horizontalSteps,y0);
          for(let step=1;step<=verticalSteps;step++)vertex(x1,y0+(y1-y0)*step/verticalSteps);
          for(let step=horizontalSteps-1;step>=0;step--)vertex(x0+(x1-x0)*step/horizontalSteps,y1);
          for(let step=verticalSteps-1;step>0;step--)vertex(x0,y0+(y1-y0)*step/verticalSteps);
          ctx.closePath();
        }
      }
    }
    if(hasLand){
      // Erase the union of land rectangles. Overlapping margins cannot reopen a land pixel.
      ctx.globalCompositeOperation='destination-out';
      ctx.globalAlpha=1;
      ctx.fillStyle='#000';
      ctx.fill();
    }
    ctx.restore();
  }


  function sailingPose(seconds,speed){
    const swell=seconds*TAU/3.7,ripple=seconds*TAU/2.15;
    return {
      roll:speed*(.029*Math.sin(swell)+.009*Math.sin(ripple+.9)),
      hullPitch:speed*(.015*Math.sin(swell+1.6)+.006*Math.sin(ripple)),
      heave:speed*(.14*Math.sin(swell-.65)+.045*Math.sin(ripple+1.8))
    };
  }

  function createFoamStamp(){
    const stamp=document.createElement('canvas');
    stamp.width=stamp.height=32;
    const ctx=stamp.getContext('2d');
    if(!ctx)return null;
    const foam=ctx.createRadialGradient(16,16,0,16,16,16);
    foam.addColorStop(0,'rgba(220,238,225,.78)');
    foam.addColorStop(.4,'rgba(196,226,218,.40)');
    foam.addColorStop(1,'rgba(196,226,218,0)');
    ctx.fillStyle=foam;
    ctx.fillRect(0,0,32,32);
    return stamp;
  }

  function paintWakePacket(ctx,packet,seconds){
    const age=seconds-packet.born;
    const life=age/packet.lifetime;
    if(life<=0||life>=1)return;
    const envelope=Math.sin(Math.PI*life)**1.3*(1-life)*packet.speed;
    const aft=age*(22+packet.speed*4);
    const halfWidth=2+aft*.354;
    const curve=2+age*1.6,seed=packet.seed;
    // A broad, shaded crest catches light on one side and darkens the other.
    ctx.beginPath();
    for(let i=0;i<=20;i++){
      const across=i/10-1;
      const x=across*halfWidth;
      const y=aft+(1-across*across)*curve
        +Math.sin(across*5.3+seed)*(.3+age*.28);
      if(i===0||i===5+packet.gap||i===14+packet.gap)ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.globalAlpha=envelope*.13;
    ctx.strokeStyle='#123f47';
    ctx.lineWidth=4.5+life*2;
    ctx.stroke();
    ctx.globalAlpha=envelope*.19;
    ctx.strokeStyle='#c7e4db';
    ctx.lineWidth=2.1;
    ctx.stroke();

    // Broken, short edge ripples make the divergent waves visible without a solid V.
    for(const side of [-1,1]){
      const edge=side*halfWidth;
      ctx.globalAlpha=envelope*(.12+.04*Math.sin(seed));
      ctx.strokeStyle='#e2eee0';
      ctx.lineWidth=.9;
      ctx.beginPath();
      ctx.moveTo(edge-side*3,aft+1);
      ctx.quadraticCurveTo(edge+side*1.2,aft-1,edge+side*2.3,aft-4);
      ctx.stroke();
    }
    // Small translucent foam patches break up the ridge into aerated water.
    for(let i=0;foamStamp&&i<5;i++){
      const scatter=Math.sin(seed+i*2.7);
      const x=scatter*halfWidth*.58;
      const y=aft+3+Math.cos(seed*1.7+i)*3;
      const radius=1.4+life*2.8+(1+Math.sin(seed+i))*1.1;
      ctx.globalAlpha=envelope*.42;
      ctx.drawImage(foamStamp,x-radius,y-radius,radius*2,radius*2);
    }
    ctx.globalAlpha=1;
  }

  function paintDepartureWash(ctx,seconds,speed,opacity){
    const spread=.75+.25*speed;
    const wash=ctx.createLinearGradient(0,-25,0,50);
    wash.addColorStop(0,'rgba(230,251,238,.09)');
    wash.addColorStop(.18,'rgba(230,251,238,.77)');
    wash.addColorStop(.42,'rgba(197,242,230,.40)');
    wash.addColorStop(1,'rgba(171,229,220,0)');
    // The waterline ends near y=-22 at the stem and y=24 at the transom.
    for(const side of [-1,1]){
      const x=side*spread;
      const flutter=Math.sin(seconds*3.2+side)*1.1;
      ctx.globalAlpha=opacity*speed*.43;
      ctx.fillStyle=wash;
      ctx.beginPath();
      ctx.moveTo(0,-25);
      ctx.bezierCurveTo(9*x,-24,11*x,-5,17*x,8);
      ctx.quadraticCurveTo((29+flutter)*x,31,32*x,44);
      ctx.quadraticCurveTo((21+flutter)*x,22,12*x,9);
      ctx.bezierCurveTo(7*x,-1,5*x,-20,0,-25);
      ctx.fill();

      ctx.globalAlpha=opacity*speed;
      ctx.strokeStyle=wash;
      ctx.lineWidth=1.2;
      ctx.beginPath();
      ctx.moveTo(1*x,-23);
      ctx.bezierCurveTo(8*x,-21,9*x,-7,15*x,5);
      ctx.quadraticCurveTo((20+flutter)*x,15,27*x,26);
      ctx.stroke();

      // Irregular foam streaks stretch out and fade as they slip astern.
      ctx.strokeStyle='#def4e8';
      for(let i=0;i<6;i++){
        const age=(seconds*(.43+.17*speed)+i/6+(side>0?.08:0))%1;
        const drift=Math.sin(i*2.8+side)*2.25;
        const y=15+age*(37+27*speed);
        const edge=x*(6+age*15+drift);
        const inner=i%3===0?.42:1;
        ctx.globalAlpha=opacity*speed*(.28+.09*Math.sin(i*4))*Math.sin(Math.PI*age);
        ctx.lineWidth=i%3===0?1.45:.75;
        ctx.beginPath();
        ctx.moveTo(edge*inner,y);
        ctx.quadraticCurveTo((edge+1.6*x)*inner,y+2,(edge+2.2*x)*inner,y+3+i%3);
        ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  }

  function drawWake(element,heading,pitch,frame,speed,zoom,screenScale,water){
    if(!speed||frame<0){
      if(wakeCanvas&&!wakeCanvas.hidden)wakeCanvas.hidden=true;
      wakePackets.length=0;
      lastWakeFrame=undefined;
      lastWakePosition=undefined;
      departureWakeStarted=undefined;
      lastEmission=-Infinity;
      return;
    }
    if(frame===lastWakeFrame)return;
    if(!wakeCanvas){
      const canvas=document.createElement('canvas');
      wakeRatio=Math.min(1.25,globalThis.devicePixelRatio||1);
      canvas.width=canvas.height=Math.round(WAKE_SIZE*wakeRatio);
      wakeRatio=canvas.width/WAKE_SIZE;
      const ctx=canvas.getContext('2d');
      if(!ctx)return;
      ctx.lineCap='round';
      canvas.className='ship-water-wake';
      canvas.setAttribute('aria-hidden','true');
      element.appendChild(canvas);
      wakeCanvas=canvas;
      wakeContext=ctx;
      foamStamp=createFoamStamp();
    }
    const seconds=frame/MOTION_FPS;
    departureWakeStarted??=seconds;
    const angle=heading*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    // Compatibility with standalone callers that have no chart projection.
    const position=water??{x:s*seconds*speed,y:-c*seconds*speed};
    const units=screenScale/zoom;
    const moved=lastWakePosition?Math.hypot(position.x-lastWakePosition.x,position.y-lastWakePosition.y):0;
    if(lastWakeFrame!==undefined&&(frame-lastWakeFrame>MOTION_FPS*1.5||
        Math.abs(zoom/(lastWakeZoom||zoom)-1)>.12||moved>80)){
      wakePackets.length=0;
      lastEmission=-Infinity;
    }
    wakePackets=wakePackets.filter(packet=>seconds-packet.born<packet.lifetime);
    if((!lastWakePosition||moved>.00001)&&seconds-lastEmission>=.28){
      const seed=emissionIndex++*2.39996;
      wakePackets.push({
        x:position.x+s*22*units,y:position.y-c*22*units,
        c,s,units,born:seconds,speed,seed,gap:emissionIndex%3,
        lifetime:WAKE_LIFETIME-.5*(1+Math.sin(seed))
      });
      if(wakePackets.length>MAX_WAKE_PACKETS)wakePackets.shift();
      lastEmission=seconds;
    }
    const project=water?.project??((x,y)=>({x:x*zoom,y:y*zoom*Math.cos(pitch*Math.PI/180)}));
    const origin=project(position.x,position.y);
    const ctx=wakeContext;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,wakeCanvas.width,wakeCanvas.height);
    for(const packet of wakePackets){
      const base=project(packet.x,packet.y);
      const right=project(packet.x+packet.c*packet.units,packet.y+packet.s*packet.units);
      const aft=project(packet.x-packet.s*packet.units,packet.y+packet.c*packet.units);
      const ratio=wakeRatio/screenScale;
      ctx.setTransform(
        (right.x-base.x)*ratio,(right.y-base.y)*ratio,
        (aft.x-base.x)*ratio,(aft.y-base.y)*ratio,
        (WAKE_SIZE/2+(base.x-origin.x)/screenScale)*wakeRatio,
        (WAKE_SIZE/2+(base.y-origin.y)/screenScale)*wakeRatio);
      paintWakePacket(ctx,packet,seconds);
    }
    // Layer the original bow wash and stern spray over the continuing Kelvin wake.
    const departureAge=seconds-departureWakeStarted;
    if(departureAge<4.5){
      const progress=Math.max(0,Math.min(1,(departureAge-3)/1.5));
      const opacity=1-progress*progress*(3-2*progress);
      const right=project(position.x+c*units,position.y+s*units);
      const aft=project(position.x-s*units,position.y+c*units);
      const ratio=wakeRatio/screenScale;
      ctx.setTransform(
        (right.x-origin.x)*ratio,(right.y-origin.y)*ratio,
        (aft.x-origin.x)*ratio,(aft.y-origin.y)*ratio,
        WAKE_SIZE/2*wakeRatio,WAKE_SIZE/2*wakeRatio);
      paintDepartureWash(ctx,seconds,speed,opacity);
    }
    eraseWakeOnLand(ctx,water,project,origin,zoom,screenScale);
    if(wakeCanvas.hidden)wakeCanvas.hidden=false;
    lastWakeFrame=frame;
    lastWakePosition={x:position.x,y:position.y};
    lastWakeZoom=zoom;
    wakePaints++;
  }

  function drawShip(element,heading,pitch,zoom,speed=0,now=performance.now(),water=null){
    if(failed)return false;
    speed=speed>.025?Math.min(1,speed):0;
    const screenScale=.62+Math.max(0,Math.min(1,(zoom-1)/9))*.73;
    const radius=WAKE_SIZE/2*screenScale;
    const offscreen=water?.viewWidth>0&&water.viewHeight>0&&(
      water.screenX+radius<0||water.screenY+radius<0||
      water.screenX-radius>water.viewWidth||water.screenY-radius>water.viewHeight);
    if(offscreen){
      if(wakeCanvas&&!wakeCanvas.hidden)wakeCanvas.hidden=true;
      wakePackets.length=0;
      lastWakeFrame=undefined;
      lastWakePosition=undefined;
      lastEmission=-Infinity;
      if(speed)departureWakeStarted??=Math.floor(now*MOTION_FPS/1000)/MOTION_FPS;
      else departureWakeStarted=undefined;
      return Boolean(gameRenderer);
    }
    if(!gameRenderer){try{gameCanvas=document.createElement('canvas');gameCanvas.className='ship-model';gameCanvas.setAttribute('aria-label','3D 카락 무역선');gameRenderer=createRenderer(gameCanvas);if(!gameRenderer){failed=true;return false}element.appendChild(gameCanvas)}catch(error){console.warn('Ship 3D unavailable',error);failed=true;return false}}
    motionPreference??=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const frame=motionPreference?.matches?-1:Math.floor(now*MOTION_FPS/1000);
    const motionFrame=speed&&frame>=0?frame:undefined;
    if(motionFrame!==lastMotionFrame){
      pose=motionFrame===undefined?stillPose:sailingPose(motionFrame/MOTION_FPS,speed);
      lastMotionFrame=motionFrame;
    }
    // Use the sailing frame loop. Rocking and foam are sampled at 12 Hz.
    const model=gameRenderer.draw({heading,pitch,size:160,scale:4,waterline:0,...pose,ratio:Math.min(2,globalThis.devicePixelRatio||1)*Math.max(1,screenScale)});
    drawWake(element,heading,pitch,frame,model?speed:0,zoom,screenScale,water);
    return model;
  }
  const api={buildModel,createRenderer,drawShip,get stats(){return gameRenderer?{...gameRenderer.stats,wakePackets:wakePackets.length,wakePaints,wakeCoastTiles:coastTiles.size}:null}};
  if(typeof module==='object')module.exports=api;else window.ROTTA_SHIP_3D=api;
})();
