/* Player caravel and reference-built carrack: +Y bow, +Z up. No network assets or per-frame mesh creation. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const colors = {wood:[.30,.16,.085], deck:[.54,.36,.19], trim:[.65,.45,.22], dark:[.12,.075,.044], rope:[.19,.16,.12], cloth:[.91,.87,.74], iron:[.12,.14,.13]};
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const models=new Map();
  const caravelScale=.76;
  // Tier two defines the in-game length. Canvas export sizes include transparent padding.
  const sailingReferenceLength=16.173726081848145;
  const fallbackReferenceLength=36*756/512;
  const hulls={
    caravel:{name:'소형 카라벨',sailingScale:1,seaRadius:18,wakeScale:0.76,canvasSize:160,fallback:'caravel-topdown-v1.png',fallbackWidth:36},
    carrack:{name:'상업용 카라벨',sailingScale:1,seaRadius:24,wakeScale:1,canvasSize:160,fallback:'carrack-topdown-v1.png?v=1',fallbackWidth:36},
    nau:{name:'나우',sailingScale:sailingReferenceLength/42.15321159362793,seaRadius:24,wakeScale:1,canvasSize:384,fallback:'grand-carrack-topdown-v3.png',fallbackWidth:fallbackReferenceLength*384/350},
    'ocean-carrack':{name:'카락',sailingScale:sailingReferenceLength/49.442630767822266,seaRadius:24,wakeScale:1,canvasSize:384,fallback:'high-carrack-topdown-v3.png',fallbackWidth:fallbackReferenceLength*512/423},
    'royal-galleon':{name:'왕실 갤리온',sailingScale:sailingReferenceLength/65.0887279510498,seaRadius:24,wakeScale:1,canvasSize:400,fallback:'royal-galleon-topdown.png',fallbackWidth:fallbackReferenceLength*512/417}
  };
  function buildModel(kind='carrack') {
    if(models.has(kind))return models.get(kind);
    const small=kind==='caravel';
    const highCarrack=kind==='ocean-carrack';
    const ocean=kind==='nau'?{length:34,beam:4.0,stern:5.0,bow:3.85,deck:3.2}:null;
    const livery=kind==='nau'?[.085,.16,.21]:colors.wood;
    const data=[],sails=[];
    const finishes=kind==='royal-galleon'?new Map():null;
    function tri(a,b,c,color,material=0) {
      const face=cross(sub(b,a),sub(c,a));if(Math.hypot(...face)<1e-8)return;
      const n=norm(face);
      const scale=small?caravelScale:1;
      if(finishes)material=material===1?6:material===2?7:(finishes.get(color)??material);
      for(const p of [a,b,c])data.push(p[0]*scale,p[1]*scale,p[2]*scale,...n,...color,material);
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
    // Tier V. Stations run from the gallery to the stem. The bottom stations
    // sweep inboard lengthwise, so the forefoot and heel have a visible rake.
    function buildGalleon(){
      const oak=[.39,.205,.11], wales=[.21,.12,.084], deck=[.59,.395,.25], ochre=[.74,.525,.235];
      const brass=[.88,.65,.29], gilt=[.99,.78,.38], tar=[.145,.119,.104], line=[.375,.295,.19];
      const glass=[.21,.35,.38], red=[.51,.175,.125], canvas=[.965,.927,.824];
      const lantern=[1,.88,.54];
      finishes.set(brass,8);finishes.set(gilt,8);finishes.set(glass,9);finishes.set(lantern,10);
      const stations=[[-24,3.75,8.35],[-22,4.49,8.30],[-18,5.0,8.08],[-13,5.43,7.5],
        [-9,5.57,7.12],[-4,5.65,6.95],[3,5.6,6.92],[9,5.34,7.02],
        [14,4.78,7.25],[18,3.74,7.6],[21,2.52,7.94],[23,1.08,8.28],[24,.08,8.50]];
      function section(y){
        let i=1;while(i<stations.length-1&&stations[i][0]<y)i++;
        const a=stations[i-1],b=stations[i],t=(y-a[0])/(b[0]-a[0]);
        return [a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2])];
      }
      function shell(y,t,side,offset=0){
        const [width,top]=section(y),rake=(y<0?1.75:-4.7)*Math.pow(Math.abs(y)/24,4);
        const keel=-3.65+1.2*(y/24)**4;
        return [side*(width*Math.sin(t*Math.PI*.575)**.74+offset),y+rake*(1-t)**1.8,keel+(top-keel)*t];
      }
      const rod=(a,b,r,c=line)=>tube(a,b,r,c,4);
      const path=(points,r,c)=>{for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r,c)};
      function oval(center,radii,c){
        const point=(i,j)=>{const a=i*TAU/12,b=(j/6-.5)*Math.PI;
          return [center[0]+radii[0]*Math.cos(a)*Math.cos(b),center[1]+radii[1]*Math.sin(a)*Math.cos(b),center[2]+radii[2]*Math.sin(b)]};
        for(let i=0;i<12;i++)for(let j=0;j<6;j++)quad(point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1),c);
      }
      const deckZ=y=>section(y)[1]+(y<=-13?1.0:y>=14?.63:0);
      for(let y=-24;y<24;y++){
        for(const side of [-1,1]){
          for(let j=0;j<20;j++){
            const t=j/20,next=(j+1)/20,band=(j>=10&&j<=12)||(j>=15&&j<=17);
            const c=band?ochre:(j===9||j===14||j===18)?wales:oak;
            quad(shell(y,t,side),shell(y+1,t,side),shell(y+1,next,side),shell(y,next,side),c,1);
          }
          const a=shell(y,1,side),b=shell(y+1,1,side);
          rod(a,b,.12,wales);
          const zb=section(y+1)[1]+(y< -13?1:y>=14?.63:0);
          const height=y< -13?1:y>=14?.63:0;
          const dz=section(y)[1]+height;
          quad([a[0],y,dz],[b[0],y+1,zb],[0,y+1,zb+.045],[0,y,dz+.045],deck,2);
          if(height)quad(a,b,[b[0],y+1,zb],[a[0],y,dz],oak,1);
          const railZ=dz+.63;
          rod([a[0],y,railZ],[b[0],y+1,zb+.63],.085,wales);
          rod([a[0],y,dz],[a[0],y,railZ],.07,ochre);
        }
      }
      for(const y of [-13,14]){
        const [w,z]=section(y);box(0,y,z,1.92*w,.12,y<0?1:.63,oak,1);
        for(let j=0;j<5;j++)box(1.9,y+(y<0?1:-1)*(1.25-j*.25),z+j*(y<0?.2:.126),1.45,.31,.12,deck,2);
      }
      for(let j=0;j<20;j++)quad(shell(-24,j/20,-1),shell(-24,j/20,1),shell(-24,(j+1)/20,1),shell(-24,(j+1)/20,-1),oak,1);
      for(const side of [-1,1]){
        for(const [count,start,t] of [[11,-18.4,.801],[10,-17.2,.552]]){
          for(let k=0;k<count;k++){
            const y=start+3.22*k;
            const face=(dy,dt,out)=>shell(y+dy,t+dt,side,out);
            quad(face(-.49,-.043,.04),face(.49,-.043,.04),face(.49,.049,.04),face(-.49,.049,.04),tar);
            quad(face(-.54,.05,.04),face(.54,.05,.04),face(.54,.075,.69),face(-.54,.075,.69),red);
            const p=face(0,0,.02),end=[p[0]+side*.77,p[1],p[2]+.04];
            tube(p,end,.212,tar,8,.164);
            tube(end,[end[0]+side*.09,end[1],end[2]],.18,brass,8);
            const muzzle=[end[0]+side*.093,end[1],end[2]];
            for(let i=0;i<8;i++){const rim=a=>[muzzle[0],muzzle[1]+.128*Math.cos(a),muzzle[2]+.128*Math.sin(a)];tri(muzzle,rim(i*TAU/8),rim((i+1)*TAU/8),tar)}
          }
        }
        for(let y=-18;y<=17;y+=4.1)rod(shell(y,.49,side,.06),shell(y,.91,side,.09),.08,wales);
      }
      // Two glazed storeys wrap around the quarter galleries. Their back face
      // bows aft at the centre and the gilded rails follow that same curve.
      const gallery=(a,h,lip=0)=>[(4.19+lip)*Math.sin(a),-21.30-(3.86+lip)*Math.cos(a),h];
      for(let j=0;j<16;j++){
        const a=-Math.PI/2+j*Math.PI/16,b=a+Math.PI/16;
        for(const [lo,hi] of [[4.56,6.18],[6.28,8.07]]){
          const p=(u,z,out=0)=>gallery(a+(b-a)*u,z,out);
          quad(p(0,lo),p(1,lo),p(1,hi),p(0,hi),wales);
          quad(p(.10,lo+.22,.04),p(.90,lo+.22,.04),p(.90,hi-.15,.04),p(.10,hi-.15,.04),glass);
          for(const u of [.12,.51,.89])rod(p(u,lo+.22,.085),p(u,hi-.13,.085),.045,ochre);
          rod(p(.1,(lo+hi)/2,.08),p(.91,(lo+hi)/2,.08),.045,ochre);
          rod(p(0,lo,.09),p(1,lo,.09),.11,brass);
        }
        const p=(u,z,lip)=>gallery(a+(b-a)*u,z,lip);
        quad(p(0,6.21,0),p(1,6.21,0),p(1,6.21,.48),p(0,6.21,.48),deck,2);
        rod(p(0,6.21,.49),p(1,6.21,.49),.096,brass);
        rod(p(0,6.86,.49),p(1,6.86,.49),.09,gilt);
        for(const u of [0,.5])rod(p(u,6.22,.48),p(u,6.85,.49),.042,brass);
        const crown=u=>8.30+1.24*Math.cos(a+(b-a)*u)**2;
        quad(p(0,8.06,0),p(1,8.06,0),p(1,crown(1),0),p(0,crown(0),0),wales);
        rod(p(0,crown(0),.06),p(1,crown(1),.06),.075,brass);
        tri([0,-20,9.18],p(0,crown(0),0),p(1,crown(1),0),deck,2);
        rod(p(0,8.25,.06),p(1,8.25,.06),.055,gilt);
      }
      for(const x of [-2.25,0,2.25]){
        const a=Math.asin(x/4.19),[cx,cy]=gallery(a,0,.09),z=x?8.60:8.94,r=x?.205:.37;
        for(let i=0;i<16;i++){const point=k=>[cx+r*(k%2?.46:1)*Math.sin(k*TAU/16),cy-.08,z+r*(k%2?.46:1)*Math.cos(k*TAU/16)];tri([cx,cy-.13,z],point(i),point(i+1),gilt)}
      }
      for(const s of [-1,1]){
        const [x,y]=gallery(s*.88,0,.24);
        tube([x,y,8.36],[x,y,8.78],.12,wales,8,.085);
        tube([x,y,8.74],[x,y,9.27],.18,lantern,6,.26);
        for(let i=0;i<6;i++){const a=i*TAU/6;rod([x+.18*Math.cos(a),y+.18*Math.sin(a),8.74],[x+.26*Math.cos(a),y+.26*Math.sin(a),9.27],.035,brass)}
        tube([x,y,9.27],[x,y,9.54],.30,brass,6,.04);
      }
      box(0,-23.58,-3.7,.46,1.2,5.82,oak,1);
      for(const z of [-2.45,-.62,1.16])box(0,-23.65,z,.53,1.23,.16,tar);
      for(const s of [-1,1])path([[s*2.9,-24.05,4.55],[s*1.8,-24.14,2.81],[s*.30,-24,2.22]],.047,tar);
      for(const y of [-19.0,-8.3,3.3,16.7]){
        const z=deckZ(y)+.10;
        box(0,y,z,2.35,2.93,.18,wales);
        for(let i=-1;i<=1.01;i+=.25)box(i,y,z+.185,.085,2.69,.041,ochre);
        for(let i=-1.2;i<=1.21;i+=.24)box(0,y+i,z+.21,2.15,.077,.04,deck);
      }
      const wheel=[0,-16.6,deckZ(-16.6)+1.22];
      box(0,wheel[1],wheel[2]-1.24,.39,.53,1.14,wales);
      const spoke=(i,r)=>[r*Math.sin(i*TAU/10),wheel[1],wheel[2]+r*Math.cos(i*TAU/10)];
      for(let i=0;i<10;i++){rod(wheel,spoke(i,.84),.054,ochre);rod(spoke(i,.63),spoke(i+1,.63),.09,wales)}
      for(const s of [-1,1]){
        const x=s*5.17,y=-16.3,z=8.04;
        for(let j=0;j<12;j++){
          const rail=(i,side)=>[x+side*.8*Math.sin(Math.PI*i/12),y-2.50+i*5/12,z+.61+.21*Math.cos(i*Math.PI/12)**2];
          for(const side of [-1,1]){
            const a=rail(j,side),b=rail(j+1,side);
            quad([x,a[1],z],a,b,[x,b[1],z],oak,1);rod(a,b,.07,ochre);
          }
        }
        for(const dy of [-1.15,0,1.15])box(x,y+dy,z+.49,1.18,.19,.1,deck,2);
        for(const dy of [-1.43,1.43])path([[s*4.40,y+dy,8.3],[s*4.85,y+dy,9.94],[x,y+dy,9.90],[x,y+dy,z+.57]],.063,line);
        for(const h of [0,.52,.98])path([[s*2.98,19.8,7.49+h],[s*2.11,22.2,7.14+h],[s*1.14,24.35,7.47+h],[s*.36,25.86,8.21+h]],h===.52?.07:.125,h===.52?brass:wales);
      }
      // Raised bulwarks bracket an open waist. Pin rails, their belayed lines
      // and deck fittings break up the otherwise flush expanse of planking.
      for(const s of [-1,1]){
        for(const [start,end] of [[-22,-13],[-11,-5],[5,10],[15,21]]){
          for(let y=start;y<end;y++){
            const edge=(at,h)=>{const q=shell(at,1,s);return [q[0]-.07*s,at,deckZ(at)+h]};
            const height=at=>.60+.29*Math.min(1,(at-start)/.65,(end-at)/.65);
            quad(edge(y,.04),edge(y+1,.04),edge(y+1,height(y+1)),edge(y,height(y)),ochre,1);
            rod(edge(y,height(y)),edge(y+1,height(y+1)),.11,wales);
          }
        }
        for(const y of [-15.1,-1.9,12]){
          const x=s*(section(y)[0]-.54),z=deckZ(y)+.10;
          box(x,y,z+.56,.27,2.68,.13,wales);
          for(const d of [-1.14,1.14])box(x,y+d,z,.20,.23,.60,oak);
          for(let j=0;j<7;j++){
            const yy=y-1.05+.35*j;
            rod([x,yy,z+.41],[x,yy,z+.90],.056,ochre);
            if(j%2===0){
              const strand=[];
              for(let k=0;k<=10;k++){const a=k*TAU/10;strand.push([x-.10*s,yy+.094*Math.cos(a),z+.43+.29*Math.sin(a)])}
              path(strand,.035,line);
            }
          }
        }
        for(const [y,z] of [[-10,7.5],[7.8,7.26]]){
          const x=s*(section(y)[0]-1.30);
          box(x,y,z,.95,1.04,.34,oak);
          for(const d of [-.47,.47])tube([x-s*.19,y+d,z+.20],[x+s*.23,y+d,z+.20],.227,wales,8);
          tube([x-s*.50,y,z+.53],[x+s*1.04,y,z+.71],.24,tar,10,.18);
        }
        // Return glazing along the quarters, visible in profile as well as astern.
        for(let j=0;j<5;j++)for(const [lo,hi] of [[.65,.745],[.79,.894]]){
          const y=-23.72+j*.71;
          const panel=(dy,t)=>shell(y+dy,t,s,.11);
          quad(panel(0,lo),panel(.57,lo),panel(.57,hi),panel(0,hi),glass);
          rod(panel(0,lo),panel(.57,lo),.046,brass);
          rod(panel(.28,lo),panel(.28,hi),.035,ochre);
        }
      }
      for(const [y,scale] of [[18.45,.81],[-4.35,1]]){
        const h=deckZ(y);
        tube([0,y,h],[0,y,h+.14],.68*scale,wales,12);
        tube([0,y,h+.13],[0,y,h+.94],.47*scale,oak,12,.36*scale);
        tube([0,y,h+.94],[0,y,h+1.10],.55*scale,ochre,12);
        for(let j=0;j<6;j++){const a=j*TAU/6;rod([.35*Math.cos(a),y+.35*Math.sin(a),h+.90],[1.08*scale*Math.cos(a),y+1.08*scale*Math.sin(a),h+.92],.061,wales)}
      }
      for(const [x,y] of [[-2,-11.6],[-1.22,-11.51],[-2.05,-12.45],[2.22,5.40]]){
        const z=deckZ(y);
        tube([x,y,z],[x,y,z+.24],.34,oak,10,.43);
        tube([x,y,z+.24],[x,y,z+.81],.43,oak,10,.35);
        for(const [h,r] of [[.18,.408],[.64,.39]])tube([x,y,z+h],[x,y,z+h+.078],r,tar,10);
        for(let i=0;i<10;i++){const lid=k=>[x+.343*Math.cos(k*TAU/10),y+.343*Math.sin(k*TAU/10),z+.811];tri([x,y,z+.811],lid(i),lid(i+1),deck,2)}
      }
      for(const s of [-1,1]){
        const scroll=[];
        for(let i=0;i<=28;i++){
          const t=i/28,a=s*(.11+1.10*t);
          scroll.push(gallery(a,8.47+.63*Math.cos(a)**2+.13*Math.sin(t*TAU*2),.10));
        }
        path(scroll,.047,brass);
        const trim=[];
        for(let j=0;j<=20;j++){
          const t=j/20;
          trim.push([s*(2.85-2.53*t),20.4+4.97*t,7.83+.67*t+.16*Math.sin(t*TAU*2)]);
        }
        path(trim,.072,brass);
      }
      // Mane, brows, muzzle and spaced ears give the gilt figurehead a lion profile.
      oval([0,24.65,8.10],[.68,.85,1.0],brass);
      for(let i=0;i<9;i++){const a=i*TAU/9;oval([.55*Math.cos(a),24.94,8.26+.65*Math.sin(a)],[.21,.37,.27],ochre)}
      oval([0,25.20,8.42],[.52,.57,.56],gilt);oval([0,25.68,8.20],[.42,.38,.29],brass);
      for(const s of [-1,1]){oval([s*.37,25.02,8.89],[.175,.16,.21],brass);oval([s*.31,25.59,8.50],[.079,.065,.063],tar)}
      // Store smooth normals on the canvas grid. The curved foot, panel fluting
      // and corner creases stay continuous when inspecting a sail at close range.
      function loft(point,nx,ny,material=4){
        const grid=[];
        for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
          const u=i/nx,v=j/ny,d=.0005,p=point(u,v);
          const du=sub(point(Math.min(1,u+d),v),point(Math.max(0,u-d),v));
          const dv=sub(point(u,Math.min(1,v+d)),point(u,Math.max(0,v-d)));
          grid.push([...p,...norm(cross(du,dv)),...canvas,material]);
        }
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
          const a=j*(nx+1)+i,b=a+1,c=b+nx+1,d=c-1;
          for(const k of [a,b,c,a,c,d])data.push(...grid[k]);
        }
      }
      function course(y,top,width,drop,furled=false){
        const brace=.18;
        const point=(u,v)=>{
          const s=2*u-1,arch=1-s*s,full=Math.sin(Math.PI*v),panel=Math.cos(u*TAU*9);
          const x=s*width*.5*(1+v*.13-.078*full);
          if(furled)return [x,y+.23+brace*x+.40*full+.10*Math.cos(v*TAU*2),top-.12-v*(.48+arch*(.64+.57*Math.cos(u*TAU*3.5)**2))];
          const crease=.14*Math.sin(26*u+9*v)*Math.abs(s)**3*full;
          return [x,y+.19+brace*x+width*.17*(.31+.69*arch)*full+width*.037*arch*v+.075*panel*full+crease,
            top-drop*v+drop*.16*arch*v*v-.11*arch*full];
        };
        sails.push({type:furled?'furled':'square',y,top,width});
        loft(point,28,furled?5:11);
        const half=width*.5+.36;
        tube([-half,y-brace*half,top+.07],[half,y+brace*half,top+.07],width*.011,wales,8,width*.009);
        for(let i=0;i<=10;i++){
          const x=(i/10-.5)*width;
          rod([x,y+brace*x-.11,top+.12],[x,y+brace*x+.22,top-.13],.041,line);
          if(furled&&i%2===0)rod([x,y+brace*x+.39,top],point(i/10,.96),.046,line);
        }
        for(const u of [0,1]){
          const s=u?1:-1;
          if(y>24){
            rod(point(u,0),[0,y-4,7.74+(y-4-19.1)*.423],.036,line);
            rod(point(u,1),[s*.75,23.2,8.0],.033,line);
          }else{
            rod([0,y,top+1.8],point(u,0),.038,line);
            if(!furled){
              const pinY=y-1.68;
              rod(point(u,1),[s*(section(pinY)[0]-.48),pinY,deckZ(pinY)+.83],.034,line);
            }
          }
        }
      }
      const masts=[[12.0,38.4,[[21.6,16.9,10.4],[29.5,14.7,7.75],[34.96,10.2,5.20]]],
        [-1.9,41.4,[[21.0,18.8,10.3,true],[30.6,17.2,8.5],[37.0,12.8,6.2]]],
        [-15.2,30.7,[[17.65,12.27,6.2,true],[23.70,10.85,5.8],[27.97,7.72,4.04]]]];
      for(const [y,top,tiers] of masts){
        const z=deckZ(y),[lower,upper]=[tiers[0][0],tiers[1][0]];
        for(const [base,end,r] of [[z,lower,.385],[lower,upper,.295],[upper,top,.185]]){
          tube([0,y,base],[0,y,end],r,tar,10,r*.70);
          for(let h=base+.34;h<end-.2;h+=2.8)tube([0,y,h],[0,y,h+.14],r*1.03,wales,8);
        }
        tube([0,y,top],[0,y,top+.14],.21,brass,8);
        for(const [floor,w] of [[lower-.66,1.85],[upper-.68,1.36]]){
          box(0,y,floor-.15,w,1.13*w,.17,wales);box(0,y,floor,w*1.06,w*1.16,.10,deck,2);
        }
        for(const side of [-1,1]){
          const platform=[side*.84,y,lower-.56],width=section(y)[0];
          box(side*width,y-.73,z-.20,.73,4.28,.20,wales);
          for(const [baseX,baseZ,spread,target] of [[width+.21,z-.06,3.82,platform],[.86,lower-.50,1.64,[side*.55,y,upper-.53]]]){
            const foot=offset=>[side*baseX,y-.42+offset*spread,baseZ];
            const head=offset=>[target[0],target[1]+offset*.61,target[2]];
            for(let i=0;i<6;i++){const k=i/5-.5;rod(foot(k),head(k),.051,line)}
            const steps=Math.ceil((target[2]-baseZ)/.58);
            for(let i=1;i<steps;i++){const t=i/steps;rod(mix(foot(-.5),head(-.5),t),mix(foot(.5),head(.5),t),.032,line)}
          }
        }
        for(const spec of tiers)course(y,...spec);
        // Yard braces run aft to the rail or to the next mast. Each purchase
        // changes direction at a visible block before descending to its pin.
        for(const s of [-1,1])for(const [index,level] of tiers.entries()){
          const [h,w]=level,atY=Math.max(-21.7,y-8.2);
          const block=[s*(index===0?section(atY)[0]-.27:1.1),atY,index===0?deckZ(atY)+.89:h-4.55];
          const from=[s*w*.49,y+s*w*.49*.18,h+.05];
          rod(from,block,index===0?.046:.036,line);
          tube(block,[block[0],block[1]-.13,block[2]-.24],.11,wales,6,.085);
          if(index>0)rod(block,[s*(section(y)[0]-.44),y-.76+index*.43,z+.74],.034,line);
        }
      }
      const sparBase=[0,19.1,7.74],sparTip=[0,38.15,15.80];
      tube(sparBase,sparTip,.41,tar,12,.14);
      for(let i=1;i<9;i++){const a=i/9,r=.43-.26*a;tube(mix(sparBase,sparTip,a),mix(sparBase,sparTip,a+.011),r,ochre,8)}
      rod(sparTip,[0,23.4,4.2],.06,line);
      course(28.9,11.81,6.85,3.35);course(34.75,14.3,4.62,2.65);
      // Alongship sails have their own camber and seams. The two jibs do not
      // share a vertex at the tack, preserving the slot between them from above.
      function staysail(name,head,tack,clew,throat){
        const corner=throat||mix(head,tack,.013);
        const point=(u,v)=>{
          const p=mix(mix(head,corner,u),mix(tack,clew,u),v);
          p[0]+=.23*Math.sin(Math.PI*v)+1.22*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)
              +.28*Math.sin(Math.PI*u)*v;
          p[2]+=.54*Math.sin(Math.PI*u)*v;return p;
        };
        loft(point,12,12,5);sails.push({type:name});
        rod(head,tack,.041,line);rod(head,corner,.041,line);
      }
      staysail('jib',[0,14,33.8],[0,37.65,15.69],[.39,29.7,14.1]);
      staysail('jib',[0,13.1,29.35],[0,31.6,13.09],[.48,21.6,11.71]);
      staysail('stay',[0,-1.66,34.8],[0,1.1,24.8],[.46,10.2,24.0],[0,9.92,28.92]);
      staysail('stay',[0,-1.66,25.2],[0,.03,14.9],[.51,10.7,15.95],[0,10.12,21.34]);
      staysail('stay',[0,-14.92,26.6],[0,-13.53,19.25],[.49,-3.3,20.2],[0,-3.65,24.3]);
      const peak=[0,-24.88,22.1],throat=[0,-15.3,17.02],heel=[.1,-15.4,10.18],clew=[.75,-26.88,10.56];
      staysail('spanker',throat,heel,clew,peak);
      tube(throat,peak,.115,wales,8,.071);tube(heel,clew,.103,wales,8,.066);
      for(const [a,b] of [[[0,12,38.1],sparTip],[[0,-1.9,41.1],[0,12,34.8]],[[0,-15.2,30.4],[0,-1.9,37.1]],[[0,-15.2,30.3],peak]])rod(a,b,.055,line);
    }

    if(kind==='royal-galleon'||highCarrack){
      if(highCarrack)fitHighCarrack();else buildGalleon();
      const model={vertices:new Float32Array(data),triangles:data.length/30,sails};
      models.set(kind,model);return model;
    }
    // Stations retain the rounded stern, full belly and fine rising bow of the references.
    const stations=kind==='nau'?
      [[-1,.56,5.0],[-.94,.76,5.0],[-.75,.93,4.70],[-.47,1,3.45],
       [0,.98,3.2],[.42,.87,3.32],[.67,.64,3.55],[.87,.34,3.95],[.97,.012,4.25]]
        .map(([y,w,z])=>[y*ocean.length/2,w*ocean.beam,z]):small?
      [[-6,.66,2.06],[-5.2,1.26,2.00],[-3.9,1.55,1.88],[-2.1,1.71,1.48],[0,1.76,1.43],[1.8,1.61,1.49],[3.5,1.23,1.72],[4.9,.64,2.02],[5.8,.035,2.31]]:
      [[-6,.68,3.65],[-5.5,1.28,3.58],[-4.4,1.63,3.45],[-3.4,1.82,3.35],[-2.6,1.9,2.1],[-1.6,1.95,1.83],[0,1.93,1.8],[1.6,1.8,1.9],[2.5,1.55,2.18],[3.3,1.29,3.1],[4.2,.97,3.26],[5.1,.55,3.4],[5.8,.05,3.54]];
    function station(y){let i=1;while(i<stations.length-1&&stations[i][0]<y)i++;const a=stations[i-1],b=stations[i],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
    const sternY=stations[0][0],bowY=stations.at(-1)[0],hullLength=bowY-sternY;
    const keelY=ocean?ocean.length/2:6;
    function hull(y,t,side){const [w,z]=station(y);const keel=-1.35+Math.pow(Math.abs(y/keelY),4)*1.3;return [side*w*Math.pow(Math.sin(t*Math.PI/2),.68),y,keel+(z-keel)*t]}
    const slices=ocean?64:small?48:100,bands=small?12:18;
    for(let i=0;i<slices;i++)for(let j=0;j<bands;j++)for(const side of [-1,1]){
      const y=sternY+hullLength*i/slices,yn=sternY+hullLength*(i+1)/slices,t=j/bands,tn=(j+1)/bands;
      quad(hull(y,t,side),hull(yn,t,side),hull(yn,tn,side),hull(y,tn,side),j<5?[.38,.27,.15]:livery,1);
    }
    // Transom and narrow stern gallery.
    for(let j=0;j<18;j++){const a=j/18,b=(j+1)/18;quad(hull(sternY,a,-1),hull(sternY,a,1),hull(sternY,b,1),hull(sternY,b,-1),colors.wood,1)}
    for(let i=0;i<slices;i++){
      const y=sternY+hullLength*i/slices,yn=sternY+hullLength*(i+1)/slices;
      quad(hull(y,1,-1),hull(y,1,1),hull(yn,1,1),hull(yn,1,-1),colors.deck,2);
      for(const side of [-1,1])for(const [t,r,c] of [[1,.055,colors.trim],[.45,.10,colors.dark],[.84,.045,colors.trim]]){const ring=(at)=>{if(t!==.45)return hull(at,t,side);const [,z]=station(at),keel=-1.35+Math.pow(Math.abs(at/keelY),4)*1.3;return hull(at,(.35+.42*(at/keelY)**2-keel)/(z-keel),side)};tube(ring(y),ring(yn),r,c,5);}
    }
    function rail(y0,y1,side){
      const steps=Math.ceil((y1-y0)/.42);
      for(let i=0;i<=steps;i++){const y=y0+(y1-y0)*i/steps,[w,z]=station(y);tube([w*side,y,z],[w*side,y,z+.65],.035,colors.trim,5);
        if(i<steps){const yn=y0+(y1-y0)*(i+1)/steps,[wn,zn]=station(yn);for(const h of [.29,.65])tube([w*side,y,z+h],[wn*side,yn,zn+h],h===.65?.055:.038,colors.dark,5)}}
    }
    function squareSail(y,top,bottom,width,topWidth,cloth=colors.cloth){
      sails.push({type:'square',y,top,bottom,width});
      const nx=small||ocean?18:28,nz=small||ocean?14:22;
      const curved=Boolean(ocean);
      const p=(u,v)=>{
        const x=(u-.5)*(topWidth+(width-topWidth)*v);
        if(!curved)return [x,y+.12+Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(ocean?width*.22:small?1.45:.95),top-(top-bottom)*v+.44*Math.sin(Math.PI*u)*v*v];
        // A broad parabolic belly continues gently into the curved foot.
        // The yard and both clews remain fixed, while the middle carries the wind.
        const arch=4*u*(1-u),fill=3.2*v*(1-v)+.36*v;
        const belly=width*.27*arch*fill;
        const foot=Math.min((top-bottom)*.17,width*.105)*arch*v*v;
        return [x,y+.12+belly,top-(top-bottom)*v+foot];
      };
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quad(p(i/nx,j/nz),p((i+1)/nx,j/nz),p((i+1)/nx,(j+1)/nz),p(i/nx,(j+1)/nz),cloth,3);
      const yardHalf=topWidth/2+.25;
      tube([-yardHalf,y,top+.06],[yardHalf,y,top+.06],.065,colors.trim,8,.05);
      for(const u of [0,1]){for(let j=0;j<nz;j++)tube(p(u,j/nz),p(u,(j+1)/nz),.017,colors.trim,4);tube(p(u,1),[u===0?-1.65:1.65,y-1,2.25],.018)}
      for(let i=0;i<nx;i++)tube(p(i/nx,1),p((i+1)/nx,1),.018,colors.trim,4);
      tube([0,y,top+1.1],[-topWidth/2,y,top],.017);tube([0,y,top+1.1],[topWidth/2,y,top],.017);
    }
    function fitCaravel(){
      // One broad course forward and a smaller lateen aft. Low rails keep the working deck open.
      for(const side of [-1,1]){rail(-5.9,-3.7,side);rail(3.65,5.65,side)}
      box(0,-6.13,-.75,.22,.45,2.45,colors.wood,1);
      tube([0,-6.23,1.66],[0,-4.74,2.10],.085,colors.trim,7);
      box(0,-.78,1.52,1.42,1.15,.12,colors.dark);
      for(let x=-.56;x<.65;x+=.20)box(x,-.78,1.64,.085,1.05,.05,colors.trim);
      for(const x of [-.45,.45])box(x,-2.20,1.57,.70,.74,.52,colors.wood,1);
      const mainY=1.16,mizzenY=-3.52;
      tube([0,mainY,1.44],[0,mainY,10.1],.135,colors.dark,10,.062);
      tube([0,mizzenY,1.78],[0,mizzenY,6.82],.091,colors.dark,8,.048);
      tube([0,4.45,1.93],[0,7.11,3.38],.10,colors.trim,8,.045);
      tube([0,mainY,9.86],[0,7.08,3.36],.024);
      for(const [y,height] of [[mainY,9.25],[mizzenY,6.45]])for(const side of [-1,1]){
        for(const off of [-.65,.25]){
          const [w,h]=station(y+off);
          tube([side*w,y+off,h],[0,y,height],.026);
        }
      }
      squareSail(mainY,8.88,3.13,6.05,5.48);
      const tack=[-.30,-2.03,3.17],peak=[.12,-5.46,7.75],clew=[1.30,-5.29,2.76];
      tube(tack,peak,.068,colors.trim,8,.042);
      const point=(u,v)=>{
        const p=tack.map((x,i)=>x+u*(peak[i]-x)+v*(clew[i]-x));
        p[0]+=10*u*v*(1-u-v);
        return p;
      };
      const n=12;
      for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
        tri(point(i/n,j/n),point((i+1)/n,j/n),point(i/n,(j+1)/n),colors.cloth,3);
        if(i+j<n-1)tri(point((i+1)/n,j/n),point((i+1)/n,(j+1)/n),point(i/n,(j+1)/n),colors.cloth,3);
      }
      tube(peak,clew,.023,colors.trim);tube(clew,tack,.023,colors.trim);
      tube(clew,[.84,-5.66,2.07],.028);
    }
    function fitCarrack(){
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
    }
    // Four-masted Portuguese merchant carrack. Model space is metres, with the bow at +Y.
    function fitHighCarrack(){
      const oak=[.445,.252,.139],deck=[.61,.424,.278],pitch=[.204,.133,.105],honey=[.71,.489,.259];
      const gold=[.86,.635,.34],rope=[.355,.292,.218],glass=[.205,.30,.31];
      const white=[.965,.965,.965];
      const rod=(a,b,r,c=rope,n=5)=>tube(a,b,r,c,n);
      // A rising keel and flared stern tuck in under the overhanging castles.
      const sections=[[-19.6,2.73,7.63],[-18.3,3.47,7.52],[-16,4.18,7.05],[-13,4.77,6.46],
        [-10,5.05,5.81],[-7,5.20,5.25],[-2,5.26,4.96],[3,5.19,5.00],[8,4.92,5.27],
        [12,4.27,5.69],[15,3.24,6.22],[17.4,2.04,6.87],[19.1,.085,7.64]];
      function section(y){
        let i=1;while(i<sections.length-1&&sections[i][0]<y)i++;
        const a=sections[i-1],b=sections[i],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
        return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
      }
      function shell(y,t,s,off=0){
        const [w,h]=section(y),u=Math.min(1,Math.abs(y/19.6));
        const keel=-3.85+1.8*u**3,rake=(y<0?2.0:-4.0)*u**4*(1-t)**1.46;
        return [s*(w*Math.sin(t*Math.PI*.565)**.76+off),y+rake,keel+(h-keel)*t];
      }
      const railPoint=(y,s,h)=>{const a=shell(y,1,s);a[2]+=h;return a};
      const strip=[...sections.map(s=>s[0]),...Array.from({length:38},(_,i)=>i-19)].sort((a,b)=>a-b).filter((v,i,a)=>!i||v>a[i-1]);
      for(let i=1;i<strip.length;i++){
        const a=strip[i-1],b=strip[i];
        for(const s of [-1,1]){
          for(let k=0;k<16;k++){
            const p=[shell(a,k/16,s),shell(b,k/16,s),shell(b,(k+1)/16,s),shell(a,(k+1)/16,s)];
            if(s<0)p.reverse();
            quad(...p,k<4?[.37,.23,.15]:k===11||k===13?pitch:oak,6);
          }

        }
        quad(shell(a,1,-1),shell(a,1,1),shell(b,1,1),shell(b,1,-1),deck,7);
      }
      // Sweep a single ring through each join so the rubbing strakes and
      // external frames follow the rounded hull without cracks between timbers.
      function timber(spine,r,c,reference){
        let previous;
        for(let i=0;i<spine.length;i++){
          const axis=norm(sub(spine[Math.min(i+1,spine.length-1)],spine[Math.max(0,i-1)]));
          const u=norm(cross(axis,reference)),v=cross(axis,u);
          const ring=Array.from({length:6},(_,k)=>spine[i].map((n,j)=>n+r*(u[j]*Math.cos(k*TAU/6)+v[j]*Math.sin(k*TAU/6))));
          if(previous)for(let k=0;k<6;k++){const next=(k+1)%6;quad(previous[k],previous[next],ring[next],ring[k],c)}
          previous=ring;
        }
      }
      for(const side of [-1,1])for(const [t,r,c] of [[.50,.119,pitch],[.72,.125,pitch],[.86,.10,honey],[1,.138,pitch]])
        timber(strip.map(y=>shell(y,t,side,.037)),r,c,[0,0,1]);
      for(const [y,stern] of [[-19.6,true],[19.1,false]])for(let k=0;k<16;k++){
        const p=[shell(y,k/16,-1),shell(y,k/16,1),shell(y,(k+1)/16,1),shell(y,(k+1)/16,-1)];
        if(!stern)p.reverse();quad(...p,oak,6);
      }
      // The quarter galleries are lofted from the actual deck perimeter. Their
      // upper floor is shorter and narrower, with the aftmost bays carried on knees.
      function castle(y0,y1,height,upper=false,fore=false){
        const ys=Array.from({length:13},(_,i)=>y0+(y1-y0)*i/12);
        function corner(y,s,t){
          const base=upper?1.52:0,w=section(y)[0]*.979-(upper?.36:.02);
          return [s*(w-.32*t),y+(fore?.36:-.44)*t,section(y)[1]+base+height*t];
        }
        function panel(a,b,c,d,ink){
          quad(a,b,c,d,ink,ink===oak?6:0);
        }
        for(let i=1;i<ys.length;i++){
          const a=ys[i-1],b=ys[i];
          for(const s of [-1,1]){
            const p=(y,t,offset=0)=>{const v=corner(y,s,t);v[0]+=s*offset;return v};
            const sideWall=[p(a,0),p(b,0),p(b,1),p(a,1)];if(s<0)sideWall.reverse();
            panel(...sideWall,upper?white:oak);
            if(i%2===0||upper){
              panel(p(a+.12,.27,.009),p(b-.12,.27,.009),p(b-.15,.79,.009),p(a+.15,.79,.009),glass);
              rod(mix(p(a+.12,.27,.009),p(b-.12,.27,.009),.5),
                mix(p(a+.15,.79,.009),p(b-.15,.79,.009),.5),.038,honey);
            }
            rod(p(a,.12,.025),p(a,.95,.025),.076,pitch);
            for(const t of [.17,.98])rod(p(a,t,.055),p(b,t,.055),t>.9?.119:.067,t>.9?pitch:honey);
            rod(p(a,1),[p(a,1)[0],p(a,1)[1],p(a,1)[2]+.48],.056,honey);
            const top=(y)=>{const v=p(y,1);v[2]+=.48;return v};
            rod(top(a),top(b),.068,pitch);
          }
          quad(corner(a,-1,1),corner(a,1,1),corner(b,1,1),corner(b,-1,1),deck,7);
        }
        for(const y of [y0,y1]){
          const face=(u,t,off=0)=>{const v=mix(corner(y,-1,t),corner(y,1,t),u);v[1]+=(y===y0?-1:1)*off;return v};
          const wall=[face(0,0),face(1,0),face(1,1),face(0,1)];if(y===y1)wall.reverse();panel(...wall,oak);
          const end=y===y0&&!fore;
          if(end)for(let j=0;j<5;j++){
            const a=(j+.13)/5,b=(j+.87)/5,m=(a+b)/2;
            panel(face(a,.24,.034),face(b,.24,.034),face(b,.68,.034),face(a,.68,.034),glass);
            tri(face(a,.68,.034),face(b,.68,.034),face(m,.87,.034),glass);
            for(const [lo,hi] of [[[a,.22],[a,.69]],[[a,.69],[m,.88]],[[m,.88],[b,.69]],[[b,.69],[b,.22]],[[m,.23],[m,.82]]])
              rod(face(...lo,.068),face(...hi,.068),.037,honey);
          }
          for(const t of [.15,.97])rod(face(0,t,.048),face(1,t,.048),.095,end?gold:pitch);
        }
      }
      castle(-19.55,-9.9,1.52);castle(-19.47,-14.6,1.24,true);castle(11.6,18.25,1.03,false,true);
      for(const s of [-1,1]){
        for(let y=-9.8;y<11.3;y+=.86){
          const yn=Math.min(11.6,y+.86);
          rod(railPoint(y,s,.035),railPoint(y,s,.69),.068,honey);
          for(const h of [.29,.68])rod(railPoint(y,s,h),railPoint(yn,s,h),h>.6?.083:.041,pitch);
        }
        for(let y=-17.4;y<16;y+=2.06){
          const p=(t)=>shell(y,t,s,.065);
          timber([.37,.54,.73,.94].map(p),.096,pitch,[0,1,0]);
        }
        // Small recessed ports and strakes follow each local section of planking.
        for(let y=-15.2;y<13;y+=3.08){
          const p=(dy,t)=>shell(y+dy,t,s,.021);
          quad(p(-.36,.742),p(.36,.742),p(.36,.83),p(-.36,.83),pitch);
          rod(p(-.39,.836),p(.39,.836),.063,honey);
        }
      }
      const blade=[[-17.93,-2.27],[-19.36,-2.38],[-20.03,4.95],[-19.92,6.11],[-19.40,6.13]];
      for(const s of [-1,1])for(let j=1;j<blade.length-1;j++)
        tri([s*.155,...blade[0]],[s*.155,...blade[s>0?j+1:j]],[s*.155,...blade[s>0?j:j+1]],oak,6);
      for(let j=0;j<blade.length;j++){const a=blade[j],b=blade[(j+1)%blade.length];quad([-.155,...a],[.155,...a],[.155,...b],[-.155,...b],pitch)}
      for(const s of [-1,1]){
        for(let k=0;k<3;k++){
          const h=k*.36;
          const curve=t=>[s*(2.75*(1-t)**1.34+.16),15.9+7.03*t,5.77+h+.98*t+.84*t*t-.52*Math.sin(t*Math.PI)];
          for(let i=0;i<10;i++)rod(curve(i/10),curve((i+1)/10),k===2?.11:.077,k===1?honey:pitch);
          if(k===0)for(let i=2;i<10;i+=2){const a=curve(i/10);rod(a,[a[0],a[1],a[2]+.72],.047,honey)}
        }
      }
      const root=[0,14.8,6.32],tip=[0,27.9,11.63];
      tube(root,tip,.29,pitch,10,.092);
      for(let i=1;i<=5;i++){const t=i/6,r=.29-.198*t;tube(mix(root,tip,t),mix(root,tip,t+.014),r*.97,honey,10,r*1.15)}
      rod(tip,[0,18.28,3.27],.047,rope);
      // Light canvas awning on the poop, scalloped at the eaves. The passage
      // underneath and the handrails remain open when seen from the stern.
      const awning=(u,v)=>[(u-.5)*4.4,-19.66+v*2.86,11.68+.48*(1-(2*u-1)**2)-.12*Math.sin(v*Math.PI)-.29*v];
      for(let j=0;j<6;j++)for(let i=0;i<10;i++){
        const a=i/10,b=(i+1)/10,c=j/6,d=(j+1)/6;
        quad(awning(a,c),awning(b,c),awning(b,d),awning(a,d),white);
        if(j===0){
          const l=awning(a,c),r=awning(b,c),m=mix(l,r,.5);
          tri(r,l,[m[0],m[1],m[2]-.24],white);
        }
      }
      for(const u of [0,1])for(const v of [0,1]){
        const p=awning(u,v);rod([p[0],p[1],section(p[1]+.44)[1]+2.69],p,.069,pitch);
      }
      // Three thwarts and a dark interior read clearly from the sailing camera.
      const bx=-2.14,by=-.60,bz=5.08;
      const gunwale=(t,s)=>[bx+s*(.04+.85*Math.sin(Math.PI*t)**.74),by+5.05*(t-.5),bz+.75+.24*(2*t-1)**2];
      for(const s of [-1,1])for(let i=0;i<14;i++){
        const a=gunwale(i/14,s),b=gunwale((i+1)/14,s),ka=[bx,a[1],bz],kb=[bx,b[1],bz];
        if(s>0)quad(ka,kb,b,a,oak,6);else quad(a,b,kb,ka,oak,6);rod(a,b,.077,honey);
      }
      for(const t of [.25,.5,.75]){const p=gunwale(t,1);box(bx,p[1],p[2]-.19,(p[0]-bx)*1.84,.19,.11,honey)}
      for(const y of [-6.75,5.3]){
        const z=section(y)[1]-.035;box(.80,y,z,2.36,2.06,.14,pitch);
        for(let x=-.18;x<1.9;x+=.26)box(x,y,z+.131,.079,1.84,.044,honey);
        for(let j=-.78;j<=.8;j+=.26)box(.80,y+j,z+.164,2.10,.072,.046,oak);
      }
      for(const [y,dir,base,h] of [[-9.9,1,0,1.52],[-14.6,1,1.52,1.24],[11.6,-1,0,1.03]]){
        for(const x of [1.13,1.91]){
          const first=y+dir*1.64,last=y-dir*.04;
          rod([x,first,section(first)[1]+base-.028],[x,last,section(last)[1]+base+h-.075],.102,pitch,6);
        }
        for(let j=0;j<6;j++){
          const at=y+dir*(1.52-j*.272);box(1.52,at,section(at)[1]+base+(j+1)*h/6-.13,.99,.31,.15,deck,7);
        }
      }
      // Smooth two-sided canvas; the main course also carries a horizontal bonnet seam.
      function clothPatch(point,nx,ny,material){
        const vertices=[];
        for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
          const u=i/nx,v=j/ny,d=.001;
          const tangent=sub(point(Math.min(1,u+d),v),point(Math.max(0,u-d),v));
          const down=sub(point(u,Math.min(1,v+d)),point(u,Math.max(0,v-d)));
          vertices.push([...point(u,v),...norm(cross(tangent,down)),...white,material]);
        }
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
          const a=j*(nx+1)+i,b=a+1,c=b+nx+1;
          for(const k of [a,b,c,a,c,c-1])data.push(...vertices[k]);
        }
      }
      function square(y,top,bottom,head,foot,angle,bonnet=false){
        sails.push({type:'square',y,top,bottom,width:foot});
        const cloth=(u,v)=>{
          const lateral=2*u-1,arch=1-lateral*lateral,belly=Math.sin(Math.PI*v);
          const x=lateral*(head+(foot-head)*v)*.5*(1-.057*belly);
          const curl=.17*Math.sin(u*30+v*5)*Math.abs(lateral)**2*belly;
          return [x,y+.10+x*angle+foot*.165*(.27+.73*arch)*belly+foot*.054*arch*v+curl,
            top+(bottom-top)*v+(top-bottom)*.20*arch*v*v+.16*lateral];
        };
        clothPatch(cloth,26,12,bonnet?11:4);
        const end=(s)=>[s*(head*.5+.28),y+s*(head*.5+.28)*angle,top+.11+s*.16];
        tube(end(-1),end(1),head*.0125,pitch,8,head*.0095);
        for(let j=0;j<=8;j++){const u=j/8,p=cloth(u,0);rod([p[0],p[1]-.22,p[2]+.16],p,.038,rope)}
        for(const s of [-1,1]){
          const u=(s+1)/2,clew=cloth(u,1);
          const pinY=y>19?18:Math.max(-9.4,y-1.96);
          const target=railPoint(pinY,s,.32);
          rod(clew,target,.034,rope);
          const peak=y>19?mix(root,tip,.96):[0,y,top+1.37];
          rod(peak,end(s),.041,rope);
        }
      }
      const masts=[[9.15,26.0,17.46],[-2.5,33.7,22.12],[-11.78,24.32,13.75],[-17.13,18.16,12.82]];
      for(const [i,[y,top,crow]] of masts.entries()){
        const base=section(y)[1]+(i===2?1.52:i===3?2.76:0),r=[.273,.387,.196,.155][i];
        tube([0,y,base-.20],[0,y,crow],r,pitch,12,r*.83);
        tube([0,y,crow-.03],[0,y,top],r*.72,oak,10,r*.27);
        for(let h=base+.24;h<crow-.2;h+=2.1){
          const radius=r*(1-.17*(h-base)/(crow-base));
          tube([0,y,h],[0,y,h+.15],radius*.962,honey,12,radius*1.09);
        }
        if(i<2){
          const radius=i===1?1.17:.88;
          tube([0,y,crow-.69],[0,y,crow],radius*.50,pitch,14,radius);
          for(let j=0;j<14;j++){
            const ring=(k,h,r)=>[r*Math.cos(k*TAU/14),y+r*Math.sin(k*TAU/14),crow+h];
            tri([0,y,crow],ring(j,0,radius),ring(j+1,0,radius),deck,7);
            rod(ring(j,0,radius),ring(j,.42,radius*1.04),.043,honey);
            rod(ring(j,.42,radius*1.04),ring(j+1,.42,radius*1.04),.060,pitch);
          }
        }
        for(const s of [-1,1]){
          const foot=k=>railPoint(y-.50+k*(i<2?3.15:1.60),s,.08);
          const head=k=>[s*(i<2?.71:.11),y+k*.40,crow-.24];
          for(let k=0;k<=4;k++)rod(foot(k*.25-.5),head(k*.25-.5),.049,rope);
          for(let t=.06;t<.96;t+=.059)rod(mix(foot(-.5),head(-.5),t),mix(foot(.5),head(.5),t),.033,rope,4);
        }
        const stay=i?[0,masts[i-1][0],masts[i-1][2]+.27]:tip;
        rod([0,y,top-.57],stay,.049,rope);
      }
      square(-2.5,20.88,7.55,16.4,17.80,.34,true);
      square(-2.5,27.89,21.24,11.08,13.08,.32);
      square(-2.5,31.78,28.30,6.01,7.83,.30);
      square(9.15,16.34,7.47,12.78,14.01,.27);
      square(9.15,21.75,16.67,8.87,10.83,.26);
      square(9.15,24.64,22.07,4.96,6.67,.25);
      square(23.88,10.02,5.96,5.45,5.98,.13);
      for(const [y,top,span,foot] of [[-11.78,24.32,11.3,9.15],[-17.13,18.16,8.19,11.40]]){
        const a=[-.49,y+span*.47,foot+1.15],b=[.66,y-span*.53,top-.20],c=[1.53,y-span*.46,foot];
        const peak=(top+foot)*.5+.29;
        sails.push({type:'lateen',y,top,span});
        tube(a,b,.138,pitch,9,.070);rod([0,y,peak],mix(a,b,.54),.12,rope);
        const point=(u,v)=>{const p=mix(mix(a,b,u),mix(a,c,u),v);p[0]+=1.23*Math.sin(Math.PI*u*.96)*Math.sin(Math.PI*v)*u+.29*Math.sin(Math.PI*u)*v;return p};
        // Collapse the common tack to a single vertex (no zero-area grid column).
        const rows=17;
        const sail=(i,j)=>{
          const u=(i+j)/rows,v=(i+j)?j/(i+j):0;
          return point(u,v);
        };
        for(let i=0;i<rows;i++)for(let j=0;j<rows-i;j++){
          tri(sail(i,j),sail(i+1,j),sail(i,j+1),white,5);
          if(i+j+1<rows)tri(sail(i+1,j),sail(i+1,j+1),sail(i,j+1),white,5);
        }
        rod(b,[0,y,top-.35],.039,rope);rod(c,railPoint(-19,-1,.30),.045,rope);
      }
      // Long narrow streamers give the standing spars a readable wind direction.
      for(const [y,z,length] of [[-2.5,33.64,5.56],[9.15,25.93,3.11]]){
        const point=(t,v)=>[.10+Math.sin(t*TAU*1.08)*.29*t,y-length*t,z-.27*t+.20*Math.sin(t*TAU*1.16)-v*(1-.93*t)*.80];
        for(let i=0;i<16;i++)quad(point(i/16,0),point((i+1)/16,0),point((i+1)/16,1),point(i/16,1),white);
      }
    }
    function fitNau(){
      const L=ocean.length,deck=ocean.deck;
      const navy=[.075,.16,.23],gold=[.86,.65,.29],lightGold=[.97,.78,.40];
      const cream=[.87,.80,.62],glass=[.12,.27,.32];
      // A long continuous two-tier broadside replaces the stubby merchant hull silhouette.
      for(const side of [-1,1]){
        rail(sternY,-L*.25,side);rail(-L*.22,L*.35,side);rail(L*.37,bowY,side);
        for(const z of [.65,1.85,2.75]){
          for(let i=0;i<64;i++){
            const y=sternY+hullLength*i/64,yn=sternY+hullLength*(i+1)/64;
            const p=(at)=>{
              const [,rim]=station(at),keel=-1.35+Math.pow(Math.abs(at/keelY),4)*1.3;
              const point=hull(at,Math.max(0,Math.min(1,(z-keel)/(rim-keel))),side);
              point[0]+=side*.05;return point;
            };
            tube(p(y),p(yn),.085,gold,5);
          }
        }
        for(const [z,count,start,step] of [[1.05,14,-L*.36,L*.052],[2.15,12,-L*.32,L*.054]]){
          for(let i=0;i<count;i++){
            const y=start+i*step,[w,rim]=station(y);
            const keel=-1.35+Math.pow(Math.abs(y/keelY),4)*1.3;
            const x=side*w*Math.pow(Math.sin((z-keel)/(rim-keel)*Math.PI/2),.68);
            box(x+side*.055,y,z,.11,.64,.40,colors.dark);
            for(const h of [-.035,.42])box(x+side*.11,y,z+h,.13,.72,.075,gold);
            // Short visible muzzles with end disks, attached to the two gun decks.
            tube([x,y,z+.19],[x+side*.38,y,z+.19],.085,colors.iron,6);
          }
        }
      }
      box(0,sternY-.2,-.95,.30,.66,5.7,colors.wood,1);
      // Three glazed tiers use curved galleries around the transom rather than square cabins.
      for(let floor=0;floor<3;floor++){
        const z=4.65+floor*.92;
        const width=5.55-floor*.35;
        const back=sternY+.35+floor*.20;
        box(0,back+1.10,z,width,2.45,.82,navy,1);
        box(0,back-.145,z+.10,width*.91,.07,.49,glass);
        for(let x=-width*.43;x<width*.46;x+=.43)
          box(x,back-.20,z+.07,.065,.11,.57,gold);
        for(const h of [.055,.66])box(0,back-.2,z+h,width*.96,.12,.075,gold);
        const ring=(t,h)=>[Math.sin(t)*width*.58,back+.12-Math.cos(t)*.75,z+h];
        for(let i=0;i<20;i++){
          const a=-Math.PI/2+i*Math.PI/20,b=a+Math.PI/20;
          quad(ring(a,.81),ring(b,.81),[ring(b,.81)[0]*.88,ring(b,.81)[1]+.18,z+.81],[ring(a,.81)[0]*.88,ring(a,.81)[1]+.18,z+.81],colors.deck,2);
          tube(ring(a,.87),ring(b,.87),.065,gold,5);
          tube(ring(a,1.22),ring(b,1.22),.055,gold,5);
          tube(ring(a,.87),ring(a,1.22),.035,lightGold,4);
        }
        for(const side of [-1,1]){
          box(side*width/2,back+1.1,z+.1,.12,2.0,.50,glass);
          for(let y=.20;y<2.1;y+=.36)box(side*(width/2+.08),back+y,z+.04,.12,.06,.60,gold);
        }
      }
      // Crest, pilasters and hanging stern lanterns.
      for(const side of [-1,1]){
        tube([side*2.0,sternY-.50,4.55],[side*1.65,sternY+.15,8.05],.11,gold,7);
        for(let i=0;i<18;i++){
          const a=i*TAU/18,b=(i+1)*TAU/18;
          tube([side*1.6+.38*Math.cos(a),sternY-.58,6.2+.38*Math.sin(a)],
            [side*1.6+.38*Math.cos(b),sternY-.58,6.2+.38*Math.sin(b)],.055,lightGold,4);
        }
        tube([side*2.7,sternY+.5,7.9],[side*3.2,sternY+.2,8.5],.065,gold);
        box(side*3.2,sternY+.2,8.38,.34,.34,.55,gold);
        box(side*3.2,sternY+.2,8.49,.23,.35,.29,cream);
      }
      const crestY=sternY-.4;
      tri([-.65,crestY,7.9],[0,crestY,8.85],[.65,crestY,7.9],gold);
      box(0,crestY-.06,8.0,.13,.13,.82,lightGold);
      // Detailed open waist, paired boats and hatches, with stairs up to the quarterdeck.
      for(const y of [-3.7,2.5]){
        box(0,y,deck+.08,2.3,1.8,.15,colors.dark);
        for(let x=-1.0;x<=1;x+=.24)box(x,y,deck+.24,.065,1.65,.045,gold);
        for(let off=-.65;off<.7;off+=.26)box(0,y+off,deck+.24,2.2,.07,.045,gold);
      }
      for(const side of [-1,1]){
        for(let i=0;i<8;i++){
          const y=-2.5+i*.60,yn=y+.60;
          const w=.57*Math.sin(Math.PI*i/8),wn=.57*Math.sin(Math.PI*(i+1)/8);
          for(const edge of [-1,1])quad([side*2.1,y,deck+.25],[side*2.1+edge*w,y,deck+.91],[side*2.1+edge*wn,yn,deck+.91],[side*2.1,yn,deck+.25],colors.wood,1);
        }
        for(const y of [-1.5,0,1.5])box(side*2.1,y,deck+.85,1.0,.18,.09,colors.deck,2);
        for(let i=0;i<12;i++)box(side*2.55,-L*.19-i*.29,deck+.12+i*.145,.62,.34,.12,colors.deck,2);
      }
      // Three spaced full-rigged masts. Nine square sails create the flagship's defining mass.
      const mastSpecs=[{y:L*.28,top:24.8,width:10.5,bottom:5.0},
        {y:0,top:28.4,width:12.3,bottom:4.85},
        {y:-L*.29,top:22.6,width:8.4,bottom:7.3}];
      for(const {y,top,width,bottom}of mastSpecs){
        const [,base]=station(y);
        tube([0,y,base],[0,y,top],.22,colors.dark,10,.07);
        for(let h=base+.5;h<top;h+=2.8)tube([0,y,h],[0,y,h+.12],.24,gold,8);
        const levels=[[top*.56,bottom,width,width*.90],
          [top*.79,top*.56+.70,width*.78,width*.63],
          [top-1.0,top*.79+.60,width*.51,width*.39]];
        for(const [a,b,w,tw]of levels)squareSail(y,a,b,w,tw);
        const basketZ=top*.57;
        for(let i=0;i<12;i++){
          const a=i*TAU/12,b=(i+1)*TAU/12,r=.76;
          tri([0,y,basketZ],[r*Math.cos(a),y+r*Math.sin(a),basketZ],[r*Math.cos(b),y+r*Math.sin(b),basketZ],colors.deck,2);
          tube([r*Math.cos(a),y+r*Math.sin(a),basketZ],[r*1.12*Math.cos(a),y+r*1.12*Math.sin(a),basketZ+.5],.032,gold,4);
          tube([r*1.12*Math.cos(a),y+r*1.12*Math.sin(a),basketZ+.5],[r*1.12*Math.cos(b),y+r*1.12*Math.sin(b),basketZ+.5],.05,gold,5);
        }
        for(const side of [-1,1]){
          const ends=[];
          for(let i=0;i<5;i++){
            const dy=y-1.3+i*.61,[w,z]=station(dy);
            const end=[side*(w+.12),dy,z+.12];ends.push(end);tube(end,[0,y,basketZ+.3],.027);
          }
          for(let t=.08;t<.93;t+=.075)
            tube(mix(ends[0],[0,y,basketZ+.3],t),mix(ends.at(-1),[0,y,basketZ+.3],t),.016,colors.rope,4);
        }
        tri([0,y,top],[0,y-2.7,top-.4],[0,y,top-.85],navy);
      }
      const tip=L*.5+7.5,tipZ=5.5;
      tube([0,L*.34,3.7],[0,tip,tipZ],.19,colors.dark,10,.07);
      for(const [y,top]of [[L*.28,24.1],[0,27.7],[-L*.29,21.9]])
        tube([0,y,top],[0,tip,tipZ],.027);
      tube([0,tip,tipZ],[0,L*.41,.65],.035);
      // Three overlapping head sails, each built as a curved triangular surface.
      function jib(a,b,c){
        sails.push({type:'jib'});
        const n=12;
        const point=(u,v)=>{
          const p=a.map((x,i)=>x+(b[i]-x)*u+(c[i]-x)*v);
          p[0]+=18*u*v*(1-u-v);return p;
        };
        for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
          tri(point(i/n,j/n),point((i+1)/n,j/n),point(i/n,(j+1)/n),colors.cloth,3);
          if(i+j<n-1)tri(point((i+1)/n,j/n),point((i+1)/n,(j+1)/n),point(i/n,(j+1)/n),colors.cloth,3);
        }
        tube(a,b,.025);tube(b,c,.025);tube(c,a,.025);
      }
      jib([0,L*.30,18.7],[0,tip-1.0,tipZ+.45],[.3,L*.42,6.2]);
      jib([0,L*.30,14.4],[0,tip-3.4,tipZ+.20],[.6,L*.36,5.2]);
      jib([0,L*.30,10.8],[0,tip-5.7,tipZ],[.7,L*.31,4.7]);
      squareSail(L*.63,4.35,1.80,4.7,4.3);
      jib([0,-L*.29,15.2],[0,-L*.46,12.8],[.8,-L*.43,8.2]);
      // Extended beakhead and gilded figurehead.
      for(const side of [-1,1]){
        tube([side*1.75,L*.39,3.6],[side*.55,L*.58,3.0],.095,gold,6);
        tube([side*1.75,L*.39,4.1],[side*.55,L*.58,3.5],.065,gold,5);
      }
      tube([0,L*.47,3.9],[0,L*.57,5.15],.29,gold,8,.15);
      tube([0,L*.57,5.15],[0,L*.60,5.0],.15,lightGold,8,.11);
    }
    if(kind==='nau')fitNau();else if(small)fitCaravel();else fitCarrack();

    const model={vertices:new Float32Array(data),triangles:data.length/30,sails};
    models.set(kind,model);
    return model;
  }
  const vertex=`precision highp float;
attribute vec3 a_position,a_normal,a_color;attribute float a_material;
uniform vec2 u_size;uniform float u_heading,u_pitch,u_scale,u_center,u_heave;
uniform vec4 u_hull_rotation;
varying vec3 v_position,v_normal,v_color;varying mediump vec3 v_view;varying float v_material;
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
v_view=vec3(s*sp,-c*sp,cp);v_position=a_position;v_normal=rock(a_normal);v_color=a_color;v_material=a_material;v_surface_height=p.z;}`;
  const fragment=`precision mediump float;
varying vec3 v_position,v_normal,v_color;varying mediump vec3 v_view;varying float v_material;uniform float u_waterline;
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
}else if(v_material>10.5){
 float panel=abs(fract(p.x*.74+.024*sin(p.z*.63))-.5);
 float seam=1.0-smoothstep(.012,.050,panel);
 float bonnet=1.0-smoothstep(.025,.080,abs(p.z-(10.70+.86*(1.0-pow(p.x/9.0,2.0)))));
 color*=.966-.071*seam-.08*bonnet+.026*cos(p.x*5.3+.44*sin(p.z))+.016*sin(p.z*3.0+p.x*2.0);
 sun=.42+.58*abs(dot(n,normalize(vec3(-.52,.50,.82))));
}else if(v_material>7.5){
 vec3 light=normalize(vec3(-.52,.50,1.0));
 float shine=pow(max(0.0,dot(n,normalize(light+v_view))),16.0);
 float fresnel=pow(1.0-abs(dot(n,v_view)),3.0);
 if(v_material>9.5){gl_FragColor=vec4(color*(.92+.08*sun),1.0);return;}
 if(v_material>8.5){color=mix(color*.54,vec3(.61,.73,.72),.16+.43*fresnel+.20*shine);}
 else{color*=.60+.46*sun;color+=vec3(.52,.42,.22)*shine+.08*fresnel;}
 gl_FragColor=vec4(color,1.0);return;
}else if(v_material>5.5){
 float deck=step(6.5,v_material);float across=mix(p.z,p.x,deck);
 float course=across*mix(3.25,3.7,deck),row=floor(course),f=fract(course);
 float seam=smoothstep(.0,.075,f)*(1.0-smoothstep(.925,1.0,f));
 float along=p.y+2.2*sin(row*13.61);
 float join=smoothstep(.012,.034,abs(fract(along*.17)-.5));
 float fibre=sin(across*57.0+.53*sin(along*.83)+.14*sin(along*3.0));
 float shade=.955+.046*sin(row*8.31)+.022*fibre+.022*sin(along*.91+row*4.61);
 color*=shade*(.79+.21*seam)*(.87+.13*join);
 if(deck>.5){
  float mast=min(min(abs(p.y-12.0),abs(p.y+1.9)),abs(p.y+15.2));
  float foot=smoothstep(.28,1.30,length(vec2(p.x,mast)));
  color*=mix(.74,1.0,foot)*(.94+.06*cos(p.x*.56));
 }
}else if(v_material>3.5){
 float u=v_material>4.5?p.y:p.x;
 float panel=u*.82+.035*sin(p.z*.66);
 float edge=abs(fract(panel)-.5);
 float seam=1.0-smoothstep(.012,.050,edge);
 float slub=sin(u*28.0+p.z*.61)*sin(p.z*32.0)*.014;
 float worn=.024*sin(p.z*1.3+u*.43)*sin(u*1.78-p.z*.71);
 float streak=.026*cos(u*4.2+.4*sin(p.z*.56))+.016*cos(u*10.5+p.z*.24);
 color*=.968+.029*sin(floor(panel+.5)*7.13)-.082*seam+slub+worn+streak;
 sun=.48+.52*abs(dot(n,normalize(vec3(-.52,.50,.82))));
}else if(v_material>2.5){float seam=pow(.5+.5*cos(p.x*15.0),28.0);float weave=sin(p.x*165.0)*sin(p.z*165.0)*.012;color*=1.0-seam*.075+weave;sun=.35+.65*abs(dot(n,normalize(vec3(-.6,.35,1.0))));}
color*=.48+.53*sun+fill;gl_FragColor=vec4(color,1.0);}`;
  function createRenderer(canvas,model=buildModel()){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false});if(!gl)return null;
    let program,buffer,locations,draws=0,last='',disposed=false;
    function initialize(){
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
      program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,model.vertices,gl.STATIC_DRAW);
      for(const [name,size,offset] of [['position',3,0],['normal',3,12],['color',3,24],['material',1,36]]){const a=gl.getAttribLocation(program,'a_'+name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset)}
      locations=Object.fromEntries(['size','heading','pitch','scale','center','waterline','heave','hull_rotation'].map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
      gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);last='';
    }
    initialize();
    function lost(e){e.preventDefault();last='';canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    function restored(){initialize();canvas.dispatchEvent(new Event('shiprendererchange',{bubbles:true}))}
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
    return {
      get stats(){return {triangles:model.triangles,draws,drawCallsPerFrame:1,bufferBytes:model.vertices.byteLength}},
      draw({heading=0,pitch=0,size=160,scale=4,center=0,waterline=-10,roll=0,hullPitch=0,heave=0,firstVertex=0,vertexCount=model.vertices.length/10,force=false,ratio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
        if(disposed||gl.isContextLost())return false;
        const key=[heading,pitch,size,scale,center,waterline,roll,hullPitch,heave,firstVertex,vertexCount,ratio].join(':');if(!force&&key===last)return true;last=key;
        const pixels=Math.round(size*ratio);if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels}gl.viewport(0,0,pixels,pixels);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(locations.size,size,size);gl.uniform1f(locations.heading,heading*Math.PI/180);gl.uniform1f(locations.pitch,pitch*Math.PI/180);gl.uniform1f(locations.scale,scale);gl.uniform1f(locations.center,center);gl.uniform1f(locations.waterline,waterline);
        gl.uniform1f(locations.heave,heave);
        gl.uniform4f(locations.hull_rotation,Math.cos(roll),Math.sin(roll),Math.cos(hullPitch),Math.sin(hullPitch));
        gl.drawArrays(gl.TRIANGLES,firstVertex,vertexCount);draws++;return true;
      },
      dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);gl.deleteBuffer(buffer);gl.deleteProgram(program)}
    };
  }
  const MOTION_FPS=12;
  const WAKE_SIZE=272,WAKE_LIFETIME=4.8,MAX_WAKE_PACKETS=20;
  const stillPose={roll:0,hullPitch:0,heave:0};
  let gameRenderer,gameCanvas,gameKind,motionPreference,failed=false;
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

  function drawWake(element,heading,pitch,frame,speed,zoom,screenScale,water,hullScale){
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
    const units=screenScale*hullScale/zoom;
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

  const screenScaleAt=zoom=>(.62+Math.max(0,Math.min(1,(zoom-1)/9))*.73)*Math.min(1,zoom/3);
  function drawShip(element,heading,pitch,zoom,speed=0,now=performance.now(),water=null,kind='carrack'){
    if(failed)return false;
    const canvasSize=160;
    speed=speed>.025?Math.min(1,speed):0;
    const screenScale=screenScaleAt(zoom);
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
    if(!gameRenderer||kind!==gameKind){
      try{
        gameRenderer?.dispose();
        gameCanvas??=document.createElement('canvas');
        gameCanvas.className='ship-model';
        gameCanvas.setAttribute('aria-label','3D '+hulls[kind].name);
        gameCanvas.style.width=gameCanvas.style.height=canvasSize+'px';
        gameRenderer=createRenderer(gameCanvas,buildModel(kind));
        if(!gameRenderer){failed=true;return false}
        if(!gameKind)element.appendChild(gameCanvas);
        gameKind=kind;
        drawWake(element,heading,pitch,-1,0,zoom,screenScale,water,1);
      }catch(error){console.warn('Ship 3D unavailable',error);failed=true;return false}
    }
    motionPreference??=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    const frame=motionPreference?.matches?-1:Math.floor(now*MOTION_FPS/1000);
    const motionFrame=speed&&frame>=0?frame:undefined;
    if(motionFrame!==lastMotionFrame){
      pose=motionFrame===undefined?stillPose:sailingPose(motionFrame/MOTION_FPS,speed);
      lastMotionFrame=motionFrame;
    }
    // Use the sailing frame loop. Rocking and foam are sampled at 12 Hz.
    const model=gameRenderer.draw({heading,pitch,size:canvasSize,scale:4*hulls[kind].sailingScale,waterline:0,...pose,ratio:Math.min(2,globalThis.devicePixelRatio||1)*Math.max(1,screenScale)});
    drawWake(element,heading,pitch,frame,model?speed:0,zoom,screenScale,water,hulls[kind].wakeScale);
    return model;
  }
  const api={hulls,screenScaleAt,buildModel,createRenderer,drawShip,get stats(){return gameRenderer?{...gameRenderer.stats,wakePackets:wakePackets.length,wakePaints,wakeCoastTiles:coastTiles.size}:null}};
  if(typeof module==='object')module.exports=api;else window.ROTTA_SHIP_3D=api;
})();
