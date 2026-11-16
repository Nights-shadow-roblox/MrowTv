/* Stream Deck TV - VR add-on (Meta Quest / WebXR) */
(function(){
const T=window.SDTV;if(!T)return;
const CSS="/* VR Glass style */\nbody.vr{--glass:rgba(18,20,44,.6);--line:rgba(255,255,255,.22);--mute:#b7bedf}\nbody.vr :is(.pill,.back,.more,.chip,.tab,.seg button,.sab){border-radius:22px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(18px);padding:14px 22px;font-size:15px}\nbody.vr .pill.primary,body.vr #bVR{background:linear-gradient(135deg,#6f9bff,#a07bff);color:#fff;border-color:transparent}\nbody.vr :is(#guide,.box,.fbox){border-radius:28px;background:rgba(18,20,44,.6);backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.2);box-shadow:0 20px 60px rgba(0,0,0,.5)}\nbody.vr #guide{top:4vh;bottom:4vh;left:2vw;height:auto}\nbody.vr .ch{border-radius:18px;padding:14px 16px}\nbody.vr #osd{background:none}\nbody.vr .rowo{background:rgba(18,20,44,.55);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.2);border-radius:28px;padding:14px 22px}\nbody.vr #top{background:linear-gradient(rgba(0,0,0,.45),transparent)}\nbody.vr :is(.lg,.field,#toast){border-radius:16px}\nbody.vr .tg{border-radius:999px}\n";
const DF={vrEnv:'galaxy',vrSize:'7',vrDist:'5',vrCurve:'0.5',vrHeight:'0',vrBright:'1',vrLight:'0.5',vrMenu:'1'};
const S=()=>T.S(),n=k=>+S()[k],fill=()=>{const s=S();for(const k in DF)if(s[k]===undefined)s[k]=DF[k]};fill();
const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
const btn=document.createElement('button');btn.className='pill';btn.id='bVR';btn.textContent='Enter VR';document.getElementById('bSet').after(btn);
const OPT={
 vrEnv:{l:'Environment',o:[['galaxy','Galaxy'],['space','Starfield'],['cinema','Cinema'],['lounge','Lounge'],['void','Void']]},
 vrSize:{l:'Screen size',o:[['3','Small'],['5','Medium'],['7','Large'],['10','Huge'],['16','Giant']]},
 vrDist:{l:'Screen distance',o:[['3','Close'],['5','Normal'],['8','Far'],['12','Very far']]},
 vrCurve:{l:'Screen curve',o:[['0','Flat'],['0.5','Soft'],['1','Curved']]},
 vrHeight:{l:'Screen height',o:[['-0.4','Low'],['0','Normal'],['0.5','High']]},
 vrBright:{l:'Screen brightness',o:[['0.7','Dim'],['1','Normal'],['1.3','Bright']]},
 vrLight:{l:'Room lights',o:[['0.15','Dark'],['0.5','Dim'],['1','Normal']]},
 vrMenu:{l:'Menu size',o:[['0.8','Small'],['1','Normal'],['1.3','Large']]}
};
const sc=T.SCHEMA;sc.splice(sc.findIndex(r=>r.sec==='Controls'),0,{sec:'VR (Meta Quest)'},...Object.keys(OPT).map(k=>({k,l:OPT[k].l,o:OPT[k].o})));const th=sc.find(r=>r.k==='theme'),o0=th.o;th.o=()=>o0().concat([['vr','VR Glass']]);
const vcls=()=>document.body.classList.toggle('vr',S().theme==='vr');vcls();
document.getElementById('sbody').addEventListener('click',()=>{fill();vcls()});
document.getElementById('sReset').addEventListener('click',()=>{fill();vcls();T.buildSets()});
T.buildSets();
const loadThree=()=>new Promise((res,rej)=>{if(window.THREE)return res();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=res;s.onerror=()=>rej(new Error('three.js failed to load'));document.head.appendChild(s)});
if(navigator.xr)loadThree().catch(()=>{});
let R,scene,cam,envG,screenM,menu,mtex,cv,ctx,tex,session=null,rays=[],tab='ch',scroll=0,vg='',regions=[],hov='',menuOn=true,dirty=true,aspect=16/9,cs='',place=0,lock=0,lastDraw=0,prevA={},lc={},kp='',lastSeen=-1,prevCh=-1,spin=null,gt=null;
const VW=1024,VH=704,ROWS=7,sy=()=>Math.max(1.6,n('vrSize')/aspect/2+.3)+n('vrHeight');

async function enter(){
 if(session){session.end();return}
 let ok=false;try{ok=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr')}catch(e){}
 if(!ok){T.say('VR is not available here. Open this page in the Meta Quest Browser over https and try again.');return}
 try{await loadThree()}catch(e){T.say(e.message);return}
 init();
 try{session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']})}catch(e){T.say('Could not start VR ('+e.message+')');return}
 session.addEventListener('end',()=>{session=null;R.setAnimationLoop(null);btn.textContent='Enter VR'});
 await R.xr.setSession(session);
 btn.textContent='Exit VR';menuOn=true;place=3;cs='';R.setAnimationLoop(frame);
}
btn.onclick=enter;

function init(){
 if(R)return;
 R=new THREE.WebGLRenderer({antialias:true});R.xr.enabled=true;R.xr.setReferenceSpaceType('local-floor');R.outputEncoding=THREE.sRGBEncoding;
 scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(70,1,.1,200);
 tex=new THREE.VideoTexture(T.v);tex.encoding=THREE.sRGBEncoding;tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
 envG=new THREE.Group();scene.add(envG);
 cv=document.createElement('canvas');cv.width=VW;cv.height=VH;ctx=cv.getContext('2d');
 mtex=new THREE.CanvasTexture(cv);mtex.encoding=THREE.sRGBEncoding;
 menu=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6*VH/VW),new THREE.MeshBasicMaterial({map:mtex,transparent:true,toneMapped:false}));scene.add(menu);
 for(let i=0;i<2;i++){
  const c=R.xr.getController(i);
  c.addEventListener('selectstart',()=>click(c));
  c.addEventListener('squeezestart',()=>{menuOn=!menuOn;if(menuOn)placeMenu();dirty=true});
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]),new THREE.LineBasicMaterial({color:0x8fb4ff}));
  c.add(ln);c.userData.line=ln;scene.add(c);rays.push(c);
 }
}

/* environments */
function glow(){if(!gt){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);gt=new THREE.CanvasTexture(c)}return gt}
function clearEnv(){spin=null;for(const o of [...envG.children]){envG.remove(o);o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material&&m.material.dispose)m.material.dispose()})}}
function buildEnv(){
 clearEnv();
 const e=S().vrEnv,L=n('vrLight'),d=n('vrDist'),w=n('vrSize'),h=w/aspect,top=sy()+h/2;
 const add=(g,m,x,y,z,rx,ry)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;if(ry)o.rotation.y=ry;envG.add(o);return o};
 const St=(c,x)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.9,side:THREE.DoubleSide},x));
 envG.add(new THREE.AmbientLight(0xffffff,L));
 const pl=new THREE.PointLight(0xaabbff,.8,80);pl.position.set(0,sy(),-d+1.5);envG.add(pl);
 scene.background=new THREE.Color(e==='space'?0x01010a:0x000000);

 if(e==='galaxy'){
  const rnd=Math.random,col=new THREE.Color(),AB=THREE.AdditiveBlending;
  const sp=new Float32Array(7500),sc2=new Float32Array(7500);
  for(let i=0;i<7500;i+=3){const u=rnd()*2-1,a=rnd()*6.283,r=Math.sqrt(1-u*u);sp[i]=r*Math.cos(a)*95;sp[i+1]=u*95;sp[i+2]=r*Math.sin(a)*95;col.setHSL(rnd()<.3?.6:.1,.4,.7+rnd()*.3);col.toArray(sc2,i)}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('color',new THREE.BufferAttribute(sc2,3));
  envG.add(new THREE.Points(sg,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,vertexColors:true})));
  const N=9000,gp=new Float32Array(N*3),gc=new Float32Array(N*3);
  for(let i=0;i<N;i++){const arm=i%3,r=Math.pow(rnd(),.65)*60,a=r*.1+arm*2.094+(rnd()-.5)*.6;gp[i*3]=Math.cos(a)*r+(rnd()-.5)*3;gp[i*3+1]=(rnd()-.5)*2.5*(1-r/70);gp[i*3+2]=Math.sin(a)*r+(rnd()-.5)*3;col.setHSL(.1+.5*r/60,.8,.6+.3*(1-r/60));col.toArray(gc,i*3)}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(gp,3));gg.setAttribute('color',new THREE.BufferAttribute(gc,3));
  const gh=new THREE.Group();gh.position.set(-10,28,-85);gh.rotation.set(.45,0,.25);
  gh.add(new THREE.Points(gg,new THREE.PointsMaterial({size:2,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85,blending:AB,depthWrite:false})));
  const spr=(c,o,x,y,z,sz)=>{const q=new THREE.Sprite(new THREE.SpriteMaterial({map:glow(),color:c,transparent:true,opacity:o,blending:AB,depthWrite:false}));q.position.set(x,y,z);q.scale.set(sz,sz,1);return q};
  gh.add(spr(0xffe0a0,.8,0,0,0,26));envG.add(gh);spin=gh;
  [[0xff4fa0,-70,10,-60,80],[0x4f7fff,75,-5,-70,90],[0x9a5aff,10,-30,-90,100]].forEach(q=>envG.add(spr(q[0],.3,q[1],q[2],q[3],q[4])));
  envG.add(spr(0xfff2cc,.9,45,16,-60,30));
  add(new THREE.SphereGeometry(9,40,28),St(0x3a6ea5),-32,-6,-48);
  add(new THREE.RingGeometry(13,19,64),new THREE.MeshBasicMaterial({color:0xbfae8a,transparent:true,opacity:.55,side:THREE.DoubleSide}),-32,-6,-48,Math.PI/2.3);
  add(new THREE.SphereGeometry(2.6,24,18),St(0xc2603a),26,10,-34);
  const dl=new THREE.DirectionalLight(0xfff0d0,1.2);dl.position.set(45,16,-30);envG.add(dl);
  add(new THREE.RingGeometry(1.6,1.75,64),new THREE.MeshBasicMaterial({color:0x8fb4ff,side:THREE.DoubleSide}),0,.01,0,-Math.PI/2);
  add(new THREE.CircleGeometry(1.75,64),new THREE.MeshBasicMaterial({color:0x0a0f24,transparent:true,opacity:.5,side:THREE.DoubleSide}),0,.005,0,-Math.PI/2);
  return;
 }
 if(e==='space'||e==='void'){
  add(new THREE.CircleGeometry(4,48),St(0x14141c),0,0,0,-Math.PI/2);
  if(e==='void')envG.add(new THREE.GridHelper(60,60,0x445577,0x1a2233));
  else{
   const p=new Float32Array(9000);
   for(let i=0;i<9000;i+=3){const u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);p[i]=r*Math.cos(a)*90;p[i+1]=u*90;p[i+2]=r*Math.sin(a)*90}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
   envG.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false})));
   add(new THREE.SphereGeometry(18,32,24),St(0x2a4a8a),-45,-8,-70);
   const sun=new THREE.DirectionalLight(0xffffff,.9);sun.position.set(30,20,10);envG.add(sun);
  }
  return;
 }
 const cin=e==='cinema',W=Math.max(14,w+8),D=d+12,zc=(10-d)/2,H=Math.max(cin?9:4.2,top+1),wc=cin?0x16161f:0x6b5646,fc=cin?0x3a0f18:0x5a3d28;
 add(new THREE.PlaneGeometry(W,D),St(fc),0,0,zc,-Math.PI/2);
 add(new THREE.PlaneGeometry(W,D),St(wc),0,H,zc,Math.PI/2);
 add(new THREE.PlaneGeometry(W,H),St(wc),0,H/2,-d-1);
 add(new THREE.PlaneGeometry(W,H),St(wc),0,H/2,11);
 add(new THREE.PlaneGeometry(D,H),St(wc),-W/2,H/2,zc,0,Math.PI/2);
 add(new THREE.PlaneGeometry(D,H),St(wc),W/2,H/2,zc,0,-Math.PI/2);
 if(cin){
  const sm=St(0x6a1020),lm=new THREE.MeshBasicMaterial({color:0xffb070});
  for(const z of [3,5.5])for(let x=-3.6;x<=3.6;x+=1.2){add(new THREE.BoxGeometry(.9,.8,.9),sm,x,.4,z);add(new THREE.BoxGeometry(.9,1,.2),sm,x,.9,z+.5)}
  for(let z=-d+2;z<10;z+=3){add(new THREE.BoxGeometry(.08,1.2,.3),lm,-W/2+.1,2.2,z);add(new THREE.BoxGeometry(.08,1.2,.3),lm,W/2-.1,2.2,z)}
 }else{
  const lm=new THREE.MeshBasicMaterial({color:0xffd9a0});
  [-1,1].forEach(s=>{add(new THREE.SphereGeometry(.25,16,12),lm,s*(W/2-1),1.8,-d+2);const p=new THREE.PointLight(0xffc880,.5,12);p.position.set(s*(W/2-1),1.8,-d+2);envG.add(p)});
 }
}
function buildScreen(){
 if(screenM){scene.remove(screenM);screenM.geometry.dispose();screenM.material.dispose()}
 const w=n('vrSize'),h=w/aspect,c=n('vrCurve'),d=n('vrDist'),g=new THREE.PlaneGeometry(w,h,64,1),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),f=x/d;p.setX(i,(1-c)*x+c*d*Math.sin(f));p.setZ(i,-((1-c)*d+c*d*Math.cos(f)))}
 const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,side:THREE.DoubleSide});m.color.setScalar(n('vrBright'));
 screenM=new THREE.Mesh(g,m);screenM.position.y=sy();scene.add(screenM);
}

/* menu */
function rr(x,y,w,h,r,f){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fillStyle=f;ctx.fill()}
function list(){const a=T.all();if(lc.a!==a||lc.g!==vg||lc.n!==a.length)lc={a,g:vg,n:a.length,l:a.map((c,i)=>i).filter(i=>!vg||a[i].group===vg)};return lc.l}
function cyc(k,d){const o=OPT[k].o,i=o.findIndex(x=>x[0]===String(S()[k]));T.change(k,o[(i+d+o.length)%o.length][0])}
const fmt=t=>{t=Math.max(0,t|0);return (t/60|0)+':'+String(t%60).padStart(2,'0')};
function draw(){
 const c=ctx,all=T.all(),cur=T.cur(),v=T.v,acc=getComputedStyle(document.body).getPropertyValue('--accent').trim()||'#7aa7ff';
 regions=[];c.clearRect(0,0,VW,VH);rr(0,0,VW,VH,36,'rgba(12,14,34,.94)');
 const tx=(s,x,y,sz,col,al,w)=>{c.font=(w||'600')+' '+sz+'px Sora,system-ui,sans-serif';c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='middle';c.fillText(s,x,y)};
 const B=(id,x,y,w,h,label,fn,on)=>{regions.push({id,x,y,w,h,fn});rr(x,y,w,h,18,on?acc:hov===id?'rgba(255,255,255,.3)':'rgba(255,255,255,.12)');if(label)tx(label,x+w/2,y+h/2,26,on?'#08102a':'#fff','center')};
 tx('Stream Deck TV',36,44,28,'#fff');
 [['ch','Channels'],['pl','Player'],['kp','Keypad'],['set','Settings']].forEach((t,i)=>B('t'+i,290+i*152,16,144,56,t[1],()=>{tab=t[0]},tab===t[0]));
 B('x',900,16,100,56,'Hide',()=>{menuOn=false});
 if(tab==='ch'){
  const l=list(),mx=Math.max(0,l.length-ROWS);scroll=Math.max(0,Math.min(scroll,mx));
  if(!l.length)tx(all.length?'No channels in this group':'No playlist loaded. Load one in flat mode first.',44,300,26,'#97a0c0');
  for(let k=0;k<ROWS&&scroll+k<l.length;k++){
   const i=l[scroll+k],ch=all[i],y=90+k*62,on=i===cur;
   B('c'+i,36,y,850,56,'',()=>T.play(i),on);
   tx((i+1)+'   '+ch.name.slice(0,32),56,y+28,26,on?'#08102a':'#fff','left');
   tx(ch.group.slice(0,16),866,y+28,18,on?'#1c2f5a':'#97a0c0','right','400');
  }
  B('up',900,90,100,120,'Up',()=>{scroll-=ROWS-1});
  B('dn',900,226,100,120,'Down',()=>{scroll+=ROWS-1});
  if(l.length)tx((scroll+1)+'-'+Math.min(l.length,scroll+ROWS)+' of '+l.length,950,380,18,'#97a0c0','center','400');
  B('prev',36,540,140,64,'Prev',()=>T.step(-1));
  B('pp',186,540,160,64,v.paused?'Play':'Pause',()=>T.togglePlay());
  B('next',356,540,140,64,'Next',()=>T.step(1));
  B('mute',506,540,150,64,v.muted?'Unmute':'Mute',()=>T.toggleMute());
  B('grp',666,540,334,64,'Group: '+(vg||'All').slice(0,16),()=>{const G=[''].concat([...new Set(all.map(x=>x.group))].sort());vg=G[(G.indexOf(vg)+1)%G.length];scroll=0});
 }else if(tab==='pl'){
  const d=v.duration,fin=isFinite(d)&&d>0,sk=x=>()=>{if(fin)v.currentTime=Math.max(0,Math.min(d,v.currentTime+x))};
  tx(all[cur]?(cur+1)+'  '+all[cur].name.slice(0,34):'Nothing playing',36,112,30,'#fff');
  tx(fin?fmt(v.currentTime)+' / '+fmt(d):'LIVE',1000,112,24,'#97a0c0','right','400');
  regions.push({id:'bar',x:36,y:150,w:964,h:44,fn:p=>{if(fin&&p)v.currentTime=Math.max(0,Math.min(1,(p.x-36)/964))*d}});
  rr(36,162,964,20,10,hov==='bar'?'rgba(255,255,255,.3)':'rgba(255,255,255,.14)');
  if(fin)rr(36,162,Math.max(20,964*v.currentTime/d),20,10,acc);
  B('s1',36,215,140,70,'-30s',sk(-30));B('s2',186,215,140,70,'-10s',sk(-10));B('s3',336,215,140,70,'+10s',sk(10));B('s4',486,215,140,70,'+30s',sk(30));
  B('pp',636,215,190,70,v.paused?'Play':'Pause',()=>T.togglePlay());B('mute',836,215,164,70,v.muted?'Unmute':'Mute',()=>T.toggleMute());
  const vol=x=>()=>{v.muted=false;T.change('vol',Math.max(0,Math.min(1,v.volume+x)).toFixed(2))},SP=['0.75','1','1.25','1.5','2'];
  tx('Volume '+Math.round(v.volume*100)+'%',36,330,26,'#fff');
  B('vm',280,295,130,70,'Vol -',vol(-.1));B('vp',420,295,130,70,'Vol +',vol(.1));
  B('spd',560,295,210,70,'Speed '+(+S().speed)+'x',()=>T.change('speed',SP[(SP.indexOf(String(S().speed))+1)%SP.length]));
  B('lst',780,295,220,70,'Last channel',()=>{if(prevCh>=0)T.play(prevCh)});
  B('pv',36,380,150,70,'Prev ch',()=>T.step(-1));B('nx',196,380,150,70,'Next ch',()=>T.step(1));
  B('sm',356,380,160,70,'Screen -',()=>cyc('vrSize',-1));B('sp',526,380,160,70,'Screen +',()=>cyc('vrSize',1));
  B('env',696,380,160,70,'Environment',()=>cyc('vrEnv',1));B('rc',866,380,134,70,'Move menu',()=>placeMenu());
 }else if(tab==='kp'){
  const n3=parseInt(kp,10),ok=!!all[n3-1];
  rr(36,90,500,86,16,'rgba(255,255,255,.08)');tx(kp||'Type a channel number',56,133,kp?44:24,kp?acc:'#97a0c0');
  tx(ok?all[n3-1].name.slice(0,30):(kp?'No channel '+n3:''),36,196,22,'#97a0c0','left','400');
  ['1','2','3','4','5','6','7','8','9','Clear','0','Go'].forEach((k,i)=>B('k'+k,36+(i%3)*170,220+(i/3|0)*78,160,70,k,()=>{if(k==='Clear')kp='';else if(k==='Go'){if(ok)T.play(n3-1);kp=''}else kp=(kp+k).slice(0,4)},k==='Go'&&ok));
  B('kv',580,90,200,80,'Prev ch',()=>T.step(-1));B('kn',790,90,210,80,'Next ch',()=>T.step(1));
  B('kl',580,190,200,80,'Last channel',()=>{if(prevCh>=0)T.play(prevCh)});B('kp',790,190,210,80,v.paused?'Play':'Pause',()=>T.togglePlay());
 }else{
  Object.keys(OPT).forEach((k,i)=>{
   const o=OPT[k],y=90+i*56,val=(o.o.find(x=>x[0]===String(S()[k]))||['',''])[1];
   rr(36,y,964,50,14,'rgba(255,255,255,.06)');tx(o.l,56,y+25,24,'#fff','left');
   B('l'+k,560,y,70,50,'<',()=>cyc(k,-1));tx(val,765,y+25,24,acc,'center');B('r'+k,900,y,70,50,'>',()=>cyc(k,1));
  });
 }
 tx(tab!=='set'?'Now: '+(all[cur]?all[cur].name.slice(0,34):'nothing playing'):'A/X shows or hides menu. Stick scrolls.',36,656,22,'#97a0c0','left','400');
 B('exit',760,624,240,64,'Exit VR',()=>session&&session.end());
 mtex.needsUpdate=true;lastDraw=performance.now();dirty=false;
}
let RC,TM;
function hit(c){
 if(!RC){RC=new THREE.Raycaster();TM=new THREE.Matrix4()}
 TM.identity().extractRotation(c.matrixWorld);RC.ray.origin.setFromMatrixPosition(c.matrixWorld);RC.ray.direction.set(0,0,-1).applyMatrix4(TM);
 const h=RC.intersectObject(menu)[0];return h?{d:h.distance,x:h.uv.x*VW,y:(1-h.uv.y)*VH}:null;
}
function at(p){if(p)for(const r of regions)if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)return r;return null}
function click(c){if(!menuOn){T.togglePlay();return}const p=hit(c),r=at(p);if(r){r.fn(p);dirty=true}}
function placeMenu(){
 const x=R.xr.getCamera(cam),p=new THREE.Vector3(),q=new THREE.Quaternion();x.matrixWorld.decompose(p,q,new THREE.Vector3());
 const f=new THREE.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.lengthSq()<1e-4)f.set(0,0,-1);f.normalize();
 menu.position.set(p.x+f.x*1.5,p.y>.5?Math.max(p.y-.45,.6):1.15,p.z+f.z*1.5);
 menu.rotation.set(-.25,Math.atan2(-f.x,-f.z),0,'YXZ');
 const l=list(),i=l.indexOf(T.cur());if(i>=0)scroll=Math.max(0,i-3);dirty=true;
}

function frame(){
 const v=T.v;if(v.videoWidth&&v.videoHeight)aspect=v.videoWidth/v.videoHeight;
 const s=[S().vrEnv,S().vrSize,S().vrDist,S().vrCurve,S().vrHeight,S().vrLight,S().vrBright,aspect.toFixed(2)].join();
 if(s!==cs){cs=s;buildEnv();buildScreen()}
 menu.visible=menuOn;menu.scale.setScalar(n('vrMenu'));
 if(place>0&&--place===0)placeMenu();
 const now=performance.now();let nh='';const cc=T.cur();if(cc!==lastSeen){prevCh=lastSeen;lastSeen=cc}if(spin)spin.rotation.y+=.0006;
 for(const c of rays){const p=menuOn?hit(c):null;c.userData.line.scale.z=p?p.d:3;if(p&&!nh){const r=at(p);if(r)nh=r.id}}
 if(nh!==hov){hov=nh;dirty=true}
 if(session)for(const i of session.inputSources){
  const g=i.gamepad;if(!g)continue;
  const k=i.handedness,b=g.buttons,a=!!((b[4]&&b[4].pressed)||(b[5]&&b[5].pressed));
  if(a&&!prevA[k]){menuOn=!menuOn;if(menuOn)placeMenu();dirty=true}prevA[k]=a;
  const ay=g.axes[3]||0;
  if(Math.abs(ay)>.7&&now>lock){const d=ay>0?1:-1;if(menuOn){scroll+=d;dirty=true}else T.step(d);lock=now+(menuOn?130:450)}
 }
 if(menuOn&&(dirty||now-lastDraw>600))draw();
 R.render(scene,cam);
}
})();
