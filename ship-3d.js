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
  const hulls={
    caravel:{name:'소형 카라벨',wakeScale:caravelScale,canvasSize:160,fallback:'caravel-topdown-v1.png',fallbackWidth:36},
    carrack:{name:'상업용 카라벨',wakeScale:1,canvasSize:160,fallback:'carrack-topdown-v1.png?v=1',fallbackWidth:36},
    nau:{name:'나우',wakeScale:1.4,canvasSize:256,fallback:'nau-topdown-v2.png',fallbackWidth:80},
    'ocean-carrack':{name:'카락',wakeScale:1.9,canvasSize:320,fallback:'ocean-carrack-topdown-v2.png',fallbackWidth:104},
    'grand-carrack':{name:'대형 카락',wakeScale:2.8,canvasSize:384,fallback:'grand-carrack-topdown-v2.png',fallbackWidth:156}
  };
  function buildModel(kind='carrack') {
    if(models.has(kind))return models.get(kind);
    const small=kind==='caravel';
    const ocean={nau:{length:18.4,beam:3.1,stern:3.9,bow:3.05,deck:2.25},
      'ocean-carrack':{length:24,beam:3.55,stern:6.3,bow:4.25,deck:2.75},
      'grand-carrack':{length:34,beam:4.0,stern:5.0,bow:3.85,deck:3.2}}[kind];
    const livery=kind==='grand-carrack'?[.085,.16,.21]:kind==='ocean-carrack'?[.29,.115,.085]:colors.wood;
    const data=[],sails=[];
    function tri(a,b,c,color,material=0) {
      const face=cross(sub(b,a),sub(c,a));if(Math.hypot(...face)<1e-8)return;
      const n=norm(face);
      const scale=small?caravelScale:1;
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
    // Stations retain the rounded stern, full belly and fine rising bow of the references.
    const stations=kind==='grand-carrack'?
      [[-1,.56,5.0],[-.94,.76,5.0],[-.75,.93,4.70],[-.47,1,3.45],
       [0,.98,3.2],[.42,.87,3.32],[.67,.64,3.55],[.87,.34,3.95],[.97,.012,4.25]]
        .map(([y,w,z])=>[y*ocean.length/2,w*ocean.beam,z]):ocean?
      [[-1,.42,ocean.stern],[-.91,.75,ocean.stern],[-.66,.96,ocean.stern-.15],
       [-.43,1,ocean.deck+.35],[0,.98,ocean.deck],[.42,.85,ocean.deck+.15],
       [.66,.62,ocean.bow],[.87,.31,ocean.bow+.15],[.97,.015,ocean.bow+.4]]
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
      const p=(u,v)=>[(u-.5)*(topWidth+(width-topWidth)*v),y+.12+Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(ocean?width*.22:small?1.45:.95),top-(top-bottom)*v+.44*Math.sin(Math.PI*u)*v*v];
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)quad(p(i/nx,j/nz),p((i+1)/nx,j/nz),p((i+1)/nx,(j+1)/nz),p(i/nx,(j+1)/nz),cloth,3);
      tube([-topWidth/2-.25,y,top+.06],[topWidth/2+.25,y,top+.06],.065,colors.trim,8,.05);
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
    function fitOceanShip(){
      const castle=kind!=='nau';
      const gold=[.67,.48,.25];
      const accent=castle?[.31,.12,.105]:[.32,.25,.14];
      const L=ocean.length,deck=ocean.deck;
      // Wide cargo belly, raised forecastle and a stepped aftercastle.
      for(const side of [-1,1]){
        rail(sternY,-L*.33,side);rail(L*.34,bowY,side);
        rail(-L*.19,L*.20,side);
        for(const z of [1.0,1.55]){
          for(let i=0;i<48;i++){
            const y=sternY+hullLength*i/48,yn=sternY+hullLength*(i+1)/48;
            const [w]=station(y),[wn]=station(yn);
            tube([side*w*.96,y,z],[side*wn*.96,yn,z],.07,gold,5);
          }
        }
      }
      box(0,sternY-.14,-1.05,.25,.46,4.4,colors.wood,1);
      for(const y of [-L*.12,L*.12]){
        box(0,y,deck+.10,1.80,1.30,.14,colors.dark);
        for(let x=-.78;x<.8;x+=.22)box(x,y,deck+.25,.07,1.18,.04,gold);
        for(let dy=-.5;dy<=.5;dy+=.25)box(0,y+dy,deck+.25,1.65,.065,.04,gold);
      }
      // Working deck fittings remain visible between the two forward masts.
      for(const [x,y] of [[-ocean.beam*.64,.8],[ocean.beam*.64,-1.1]]){
        box(x,y,deck+.13,.68,.74,.60,colors.wood,1);
        for(const h of [.10,.49])box(x,y,deck+.13+h,.71,.77,.055,gold);
      }
      const boatX=ocean.beam*.55,boatY=L*.14;
      for(let i=0;i<6;i++){
        const y=boatY-1.45+i*2.9/6,yn=y+2.9/6;
        const w=.43*Math.sin(Math.PI*i/6),wn=.43*Math.sin(Math.PI*(i+1)/6);
        for(const side of [-1,1])
          quad([boatX,y,deck+.31],[boatX+side*w,y,deck+.73],
            [boatX+side*wn,yn,deck+.73],[boatX,yn,deck+.31],colors.wood,1);
      }
      for(const y of [-.65,0,.65])box(boatX,boatY+y,deck+.69,.72,.16,.08,colors.deck,2);
      const tiers=castle?2:1;
      for(let floor=0;floor<tiers;floor++){
        const z=ocean.stern+.1+floor*.87;
        const y=sternY+1.18+floor*.31,w=ocean.beam*(1.24-floor*.13);
        const length=2.6-floor*.35;
        box(0,y,z,w,length,.74,colors.wood,1);
        box(0,y,z+.74,w+.19,length+.15,.10,colors.deck,2);
        // Dark glazing with a gold frame makes the stacked stern readable at game scale.
        box(0,y-length/2-.025,z+.15,w*.88,.055,.42,accent);
        for(let x=-w*.42;x<=w*.43;x+=.38)
          box(x,y-length/2-.065,z+.14,.055,.08,.46,gold);
        for(const h of [.12,.59])box(0,y-length/2-.07,z+h,w*.92,.09,.055,gold);
        for(const side of [-1,1]){
          box(side*(w/2+.035),y,z+.14,.08,length*.85,.43,accent);
          for(let off=-length*.37;off<=length*.38;off+=.36)
            box(side*(w/2+.09),y+off,z+.12,.06,.055,.48,gold);
          tube([side*w/2,y-length/2,z+.84],[side*w/2,y+length/2,z+.84],.06,gold);
        }
      }
      const roof=ocean.stern+.1+tiers*.87;
      for(const side of [-1,1]){
        const x=side*ocean.beam*.62;
        tube([x,sternY+.65,roof],[x,sternY+.65,roof+.64],.055,gold);
        box(x,sternY+.65,roof+.54,.24,.24,.36,gold);
        box(x,sternY+.65,roof+.62,.17,.25,.19,[.86,.70,.36]);
      }
      for(let i=0;i<9;i++)
        box(ocean.beam*.55,-L*.22-i*.14,deck+.16+i*(ocean.stern-deck)/9,.65,.21,.12,colors.deck,2);
      if(castle)for(const side of [-1,1]){
        for(let i=0;i<7;i++){
          const y=-L*.29+i*L*.073,[w]=station(y),z=deck-.24;
          box(side*(w*.97),y,z,.085,.40,.30,colors.dark);
          for(const h of [-.02,.30])box(side*(w*.99),y,z+h,.10,.45,.055,gold);
        }
      }
      // Main and fore courses spread across a full broad hull. The cargo tiers use a foremast, a mainmast and a lateen mizzen.
      const main=castle?22.8:18.6;
      const fore=castle?20.3:16.0;
      const aft=castle?15.7:12.2;
      const mastSpecs=[[L*.24,fore],[0,main],[-L*.31,aft]];
      for(const [y,top] of mastSpecs){
        const [w,z]=station(y);
        tube([0,y,z],[0,y,top],top===main?.19:.14,colors.dark,10,.055);
        for(let h=z+.4;h<top;h+=2.7)tube([0,y,h],[0,y,h+.11],.18,gold,8);
        const basketZ=top*.68;
        for(let i=0;i<12;i++){
          const a=i*TAU/12,b=(i+1)*TAU/12,r=.58;
          tri([0,y,basketZ],[r*Math.cos(a),y+r*Math.sin(a),basketZ],[r*Math.cos(b),y+r*Math.sin(b),basketZ],colors.deck,2);
          tube([r*Math.cos(a),y+r*Math.sin(a),basketZ],[r*1.15*Math.cos(a),y+r*1.15*Math.sin(a),basketZ+.48],.025,gold,4);
          tube([r*1.15*Math.cos(a),y+r*1.15*Math.sin(a),basketZ+.48],[r*1.15*Math.cos(b),y+r*1.15*Math.sin(b),basketZ+.48],.035,gold,4);
        }
        for(const side of [-1,1]){
          const ends=[];
          for(let i=0;i<4;i++){
            const dy=y-.70+i*.43,[width,height]=station(dy);
            const end=[side*(width+.08),dy,height+.1];ends.push(end);
            tube(end,[0,y,basketZ+.2],.023);
          }
          for(let t=.12;t<.92;t+=.095)
            tube(mix(ends[0],[0,y,basketZ+.2],t),mix(ends[3],[0,y,basketZ+.2],t),.014,colors.rope,4);
        }
      }
      // Space the lower course and topsail vertically, avoiding overlapping fabric.
      function rig(y,top,width,levels){
        const bottom=deck+1.35;
        const breakZ=top*.65;
        squareSail(y,breakZ-.30,bottom,width,width*.91);
        if(levels===2)squareSail(y,top-1.0,breakZ+.55,width*.69,width*.51);
        else{
          const upper=top-4.05;
          squareSail(y,upper-.28,breakZ+.40,width*.80,width*.67);
          squareSail(y,top-.90,upper+.32,width*.55,width*.42);
        }
      }
      rig(0,main,castle?10.0:8.6,castle?3:2);
      rig(L*.24,fore,castle?8.6:7.2,castle?3:2);
      function lateen(y,top,span){
        sails.push({type:'lateen',y,top,span});
        const a=[0,y+span*.48,top*.44],b=[0,y-span*.52,top],c=[1.0,y-span*.43,deck+1.0],n=12;
        const point=(u,v)=>{
          const p=a.map((x,i)=>x+u*(b[i]-x)+v*(c[i]-x));
          p[0]+=11*u*v*(1-u-v);return p;
        };
        for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){
          tri(point(i/n,j/n),point((i+1)/n,j/n),point(i/n,(j+1)/n),colors.cloth,3);
          if(i+j<n-1)tri(point((i+1)/n,j/n),point((i+1)/n,(j+1)/n),point(i/n,(j+1)/n),colors.cloth,3);
        }
        tube(a,b,.075,gold,8);tube(b,c,.021);tube(c,a,.021);
      }
      lateen(-L*.31,aft,castle?6.2:4.7);
      const bowTip=L*.5+3.2,bowZ=ocean.bow+2.5;
      tube([0,L*.35,ocean.bow-.1],[0,bowTip,bowZ],.13,colors.dark,10,.052);
      tube([0,0,main-.3],[0,bowTip,bowZ],.023);
      tube([0,L*.24,fore-.3],[0,bowTip,bowZ],.023);
      tube([0,bowTip,bowZ],[0,L*.43,.45],.025);
      if(castle)squareSail(L*.58,bowZ-.1,ocean.bow-.2,3.7,3.3);
      for(const [y,top] of mastSpecs)
        tri([0,y,top],[0,y-1.5,top-.28],[0,y,top-.65],accent);
    }
    function fitFlagship(){
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
          p[0]+=14*u*v*(1-u-v);return p;
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
    if(kind==='grand-carrack')fitFlagship();else if(ocean)fitOceanShip();else if(small)fitCaravel();else fitCarrack();

    const model={vertices:new Float32Array(data),triangles:data.length/30,sails};
    models.set(kind,model);
    return model;
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

  function drawShip(element,heading,pitch,zoom,speed=0,now=performance.now(),water=null,kind='carrack'){
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
    if(!gameRenderer||kind!==gameKind){
      try{
        gameRenderer?.dispose();
        gameCanvas??=document.createElement('canvas');
        gameCanvas.className='ship-model';
        gameCanvas.setAttribute('aria-label','3D '+hulls[kind].name);
        gameCanvas.style.width=gameCanvas.style.height=hulls[kind].canvasSize+'px';
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
    const model=gameRenderer.draw({heading,pitch,size:hulls[kind].canvasSize,scale:4,waterline:0,...pose,ratio:Math.min(2,globalThis.devicePixelRatio||1)*Math.max(1,screenScale)});
    drawWake(element,heading,pitch,frame,model?speed:0,zoom,screenScale,water,hulls[kind].wakeScale);
    return model;
  }
  const api={hulls,buildModel,createRenderer,drawShip,get stats(){return gameRenderer?{...gameRenderer.stats,wakePackets:wakePackets.length,wakePaints,wakeCoastTiles:coastTiles.size}:null}};
  if(typeof module==='object')module.exports=api;else window.ROTTA_SHIP_3D=api;
})();
