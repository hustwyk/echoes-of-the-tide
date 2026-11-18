// The two players see different halves of the torn seal. Their printed profiles
// are cut from the same dimensions used by the registration test.
const TideGlassRoom=(()=>{
  const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),TAU=2*Math.PI;
  function create(scene,g){
    const o=TideGlass.origin,root=new T.Group(),owned=new Set(),own=a=>(owned.add(a),a);
    root.position.set(o.x,o.y,o.z);scene.add(root);
    const env=TideGlassEnv.create(root),gear=TideGlassGear.create(root);
    const box=own(new T.BoxGeometry(1,1,1)),rod=own(new T.CylinderGeometry(1,1,1,18)),hex=own(new T.CylinderGeometry(1,1,1,6));
    const mat=(c,rough,metal)=>own(new T.MeshStandardMaterial({color:c,roughness:rough,metalness:metal}));
    const steel=TideSteel.material(0,own,true),brass=mat(0xa58b61,.48,.72),iron=mat(0x48514b,.61,.68),rubber=mat(0x2b302c,.81,.07),
      lip=mat(0xb7ad92,.55,.47),oak=mat(0x755943,.69,.13),paper=mat(0xd3c5a6,.92,.03),edge=mat(0x8e8170,.87,.09),green=mat(0x446054,.62,.40);
    const groups=new Map(),dummy=new T.Object3D(),up=V(0,1,0),unit=new T.Quaternion();
    function part(par,geo,m,x,y,z,w,h,d,rot=unit){
      if(!groups.has(par))groups.set(par,new Map());const group=groups.get(par),key=geo.uuid+m.uuid;
      if(!group.has(key))group.set(key,{geo,m,at:[]});
      dummy.position.set(x,y,z);dummy.quaternion.copy(rot);dummy.scale.set(w,h,d);dummy.updateMatrix();group.get(key).at.push(dummy.matrix.clone());
    }
    const block=(par,m,x,y,z,w,h,d)=>part(par,box,m,x,y,z,w,h,d);
    function bar(par,m,a,b,r){
      const dir=V(b[0]-a[0],b[1]-a[1],b[2]-a[2]),len=dir.length();part(par,rod,m,(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5,r,len,r,new T.Quaternion().setFromUnitVectors(up,dir.normalize()));
    }
    function grid(parent,x,y,z){const v=new T.Group();v.position.set(x,y,z);parent.add(v);return v;}
    const seedRand=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    function texture(w,h,paint){
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      paint(canvas.getContext('2d'),w,h);
      const t=own(new T.CanvasTexture(canvas));t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
    }
    function plane(par,x,y,z,w,h,map,opt={}){
      const m=own(new T.MeshStandardMaterial({map,roughness:.84,metalness:.05,side:T.DoubleSide,...opt}));
      const obj=new T.Mesh(own(new T.PlaneGeometry(w,h)),m);obj.position.set(x,y,z);par.add(obj);return obj;
    }
    function patina(c,w,h,bg,seed){
      const random=seedRand(seed);c.fillStyle=bg;c.fillRect(0,0,w,h);
      for(let j=0;j<w*h/22;j++){const x=random()*w,y=random()*h;c.fillStyle=j%3?'rgba(70,53,31,.060)':'rgba(255,248,222,.25)';
        c.fillRect(x,y,random()*4+.5,random()*1.2+.4);}
      const stain=c.createLinearGradient(0,0,w,h);stain.addColorStop(0,'rgba(65,59,42,.23)');stain.addColorStop(.23,'transparent');stain.addColorStop(.84,'transparent');stain.addColorStop(1,'rgba(72,55,35,.24)');c.fillStyle=stain;c.fillRect(0,0,w,h);
    }
    function badge(a,b){
      return texture(648,124,(c,w,h)=>{patina(c,w,h,'#c7c3a8',194);c.strokeStyle='#7a8068';c.lineWidth=3;c.strokeRect(7,7,w-14,h-14);
        c.fillStyle='#303b34';c.font='bold 40px serif';c.fillText(a,25,57);c.font='23px monospace';c.fillText(b,25,95);});
    }
    TideGlass.racks.forEach((rack,i)=>{
      const par=grid(root,rack.x,0,rack.z),hx=rack.hx,depth=rack.hz,total=Math.floor(2*hx/.72);
      for(const x of [-hx+.065,0,hx-.065]){
        for(const z of [-depth+.065,depth-.065]){
          block(par,steel,x,.73,z,.057,1.33,.057);block(par,brass,x,.1,z,.084,.13,.082);
          part(par,rod,rubber,x,.045,z,.074,.07,.074);part(par,hex,iron,x,.124,z,.055,.034,.055);
        }
      }
      for(const y of [.25,.64,1.03,1.39]){
        for(const z of [-depth+.027,depth-.027])block(par,steel,0,y,z,2*hx,.055,.052);
        for(let j=0;j<=total*4;j++)block(par,iron,-hx+.04+j*(2*hx-.08)/(total*4),y+.012,0,.022,.021,depth*2);
        if(y<1.1){
          for(let j=0;j<total;j++){
            if((j+Math.floor(y*10)+i)%4===0)continue;
            const x=-hx+.47+j*(2*hx-.52)/total;
            block(par,edge,x,y+.062,0,.65,.065,depth*1.51);
            block(par,paper,x+.019,y+.099,.012,.630,.015,depth*1.46);
            block(par,oak,x-.14,y+.112,0,.03,.008,depth*1.52);
          }
        }
      }
      const sign=plane(par,i?-hx+.38:hx-.4,1.23,.276,.64,.134,badge(i?'转向 · 左端':'转向 · 右端',i?'02   LEFT END':'01   RIGHT END'));sign.receiveShadow=true;
    });
    // Recessed bronze waymarks survive the wash that has stripped the painted arrows.
    for(const [ax,az,bx,bz] of [[.08,3.52,2.22,3.52],[2.22,3.52,2.22,-.06],[2.22,-.06,-.10,-.06],[-.10,-.06,-.10,-3.03]]){
      const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),qx=dx/len,qz=dz/len;
      for(let d=.10;d<len-.04;d+=.32){
        const x=ax+qx*d,z=az+qz*d;bar(root,brass,[x,.025,z],[x+qx*.165,.025,z+qz*.165],.011);
      }
      const x=(ax+bx)/2,z=(az+bz)/2;
      for(const s of [-1,1])bar(root,lip,[x+qx*.14,.028,z+qz*.14],[x-qx*.06+s*qz*.11,.028,z-qz*.06-s*qx*.11],.019);
    }
    for(const x of [-.71,.71]){block(root,brass,x,.025,-3.25,.046,.045,1.30);block(root,rubber,x,.10,-3.81,.12,.16,.13);}
    const slides=grid(root,0,.96,-4.64);
    for(const x of [-.43,.43]){
      bar(slides,brass,[x,0,0],[x,-.10,1.09],.023);
      for(let j=0;j<7;j++){const z=j*.16;bar(slides,iron,[x-.041,-.096*z,z],[x+.041,-.096*z,z],.024);}
    }
    function profile(side,n){
      const raw=TideGlass.cards[side][n],random=seedRand(71),p=[];
      for(let j=0;j<=150;j++){const u=j/150,y=37+u*355;let x=side?89:486;
        for(let k=0;k<3;k++)x+=Math.max(0,1-Math.abs(u-(.26+k*.26))/.070)*raw[k]*55;
        x+=3.2*Math.sin(35*u)+1.8*Math.sin(117*u)+random()*2.2;p.push([x,y]);}return p;
    }
    function slip(side,n){
      return texture(624,434,(c,w,h)=>{
        patina(c,w,h,'#45504a',18+side);const e=profile(side,n),far=side?w-20:20;c.save();c.beginPath();c.moveTo(far,37);for(const [x,y] of e)c.lineTo(x,y);c.lineTo(far,392);c.closePath();c.clip();
        patina(c,w,h,n%2?'#d5cbb1':'#dbcfb0',412+side*13+n);
        c.save();c.beginPath();c.rect(side?170:35,60,365,277);c.clip();
        c.strokeStyle='#9d9f8d';c.lineWidth=1;
        for(let y=154;y<374;y+=35){c.beginPath();c.moveTo(20,y);c.lineTo(595,y);c.stroke();}
        c.fillStyle='#3e4942';c.font='bold 33px serif';c.fillText(TideGlass.copies[side][n],side?201:49,100);
        c.font='17px monospace';c.fillText(side?'SURVEY / ENCLOSURE':'PLANT / INSPECTION',side?204:51,132);
        c.font='21px serif';c.fillText(side?'所附页　 复核留样':'检视项　 回转组件',side?210:53,209);c.fillText(side?'测绘栏　 附页签证':'运行栏　 原签留存',side?210:53,280);
        c.restore();
        const x=side?92:489,y=212;c.strokeStyle='#99442f';c.lineWidth=7;
        c.beginPath();c.arc(x,y,98,0,TAU);c.stroke();c.lineWidth=2;c.beginPath();c.arc(x,y,87,0,TAU);c.stroke();
        c.fillStyle='#98432f';c.textAlign='center';c.font='bold 33px serif';c.fillText('北 岬 站',x,y-18);c.font='26px serif';c.fillText('核  验',x,y+23);
        c.restore();c.strokeStyle='#b29d72';c.lineWidth=1;c.beginPath();for(const [x,y] of e)c.lineTo(x,y);c.stroke();
        c.fillStyle='#d7d3ba';c.font='16px monospace';c.textAlign='left';c.fillText('C3 / '+(side?'B':'A')+'-0'+(n+1),18,419);
      });
    }
    const displays=[0,1].map(i=>{
      const side=i?1:-1,par=grid(root,side*5.51,1.39,-.05);par.rotation.y=-side*Math.PI/2;
      block(par,oak,0,0,-.046,1.34,1.17,.12);
      block(par,green,0,0,.035,1.26,1.10,.062);
      for(const x of [-.60,.60]){
        block(par,brass,x,0,.086,.032,1.02,.041);
        for(const y of [-.47,.47])block(par,iron,x,y,.105,.022,.026,.025);
      }
      plane(par,0,.431,.081,.91,.134,badge(i?'航测附件　存根':'机修验收　存根',i?'ENCLOSURES   /   B':'RECEIPTS   /   A'));
      const maps=[0,1,2].map(n=>slip(i,n));
      const strip=texture(1872,434,c=>maps.forEach((m,n)=>c.drawImage(m.image,n*624,0)));
      strip.repeat.x=1/3;
      const card=plane(par,0,-.036,.088,1.08,.75,strip);
      const handle=grid(par,0,-.478,.12);block(par,iron,0,-.468,.09,.91,.04,.073);block(handle,brass,0,0,0,.12,.070,.084);
      return {par,card,handle,strip};
    });
    const doc=grid(root,0,1.20,-4.65);doc.rotation.x=-.24;
    const panel=grid(doc,0,0,.165);block(panel,oak,0,0,0,1.93,1.20,.035);
    plane(panel,0,0,.024,1.88,1.14,texture(1152,660,(c,w,h)=>{
      patina(c,w,h,'#d3c8a9',251);c.fillStyle='#536359';c.font='bold 51px serif';c.fillText('北岬　原始航测手稿',45,89);
      c.font='24px monospace';c.fillText('C3 / ORIGINAL     36°14′ N',47,140);
      for(let j=0;j<11;j++){c.strokeStyle=j===8?'#988467':'#a9a592';c.beginPath();c.moveTo(29,168+j*43);c.lineTo(w-29,168+j*43);c.stroke();}
      c.save();c.translate(94,588);c.rotate(-.018);c.font='26px serif';c.fillStyle='#666656';c.fillText('装订处对齐　　引灯只验回转',0,0);c.restore();
      c.setLineDash([9,6]);c.strokeStyle='#945e42';c.beginPath();c.moveTo(45,194);c.lineTo(w-34,198);c.stroke();
    }));
    function impression(b,i){
      const alpha=texture(720,152,(c,w,h)=>{
        c.textAlign='center';c.font='italic bold 94px serif';c.fillStyle='white';c.fillText(b.word,w/2,115,w-24);
      });
      const data=alpha.image.getContext('2d').getImageData(0,0,720,152).data;
      const normal=texture(720,152,(c,w,h)=>{
        const image=c.createImageData(w,h),result=image.data;
        const depth=(x,y)=>data[(y*w+x)*4+3]/255;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=(y*w+x)*4;
          const dx=depth(Math.min(x+2,w-1),y)-depth(Math.max(x-2,0),y);
          const dy=depth(x,Math.min(y+2,h-1))-depth(x,Math.max(y-2,0));
          const d=Math.hypot(dx*1.9,dy*1.9,1);
          result[n]=128+Math.round(126*dx*1.9/d);result[n+1]=128-Math.round(126*dy*1.9/d);result[n+2]=128+Math.floor(127/d);result[n+3]=255;
        }
        c.putImageData(image,0,0);
      });normal.colorSpace=T.NoColorSpace;
      const glyph=texture(720,152,(c,w,h)=>{
        const dst=c.createImageData(w,h),random=seedRand(314+i);
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          const n=(y*w+x)*4,a=data[n+3],near=data[(Math.max(0,y-2)*w+Math.max(0,x-2))*4+3],rim=Math.max(0,near-a);
          const v=48+Math.round(random()*65+20*Math.sin(.17*y+.011*x));
          dst.data[n]=rim?236:v+8;dst.data[n+1]=rim?223:v+7;dst.data[n+2]=rim?184:v;dst.data[n+3]=Math.min(255,a*.83+rim*.79);
        }c.putImageData(dst,0,0);
      });
      return plane(panel,i?.18:-.54,i?-.18:.055,.043,i?.70:.57,.16,glyph,{transparent:true,depthWrite:false,normalMap:normal,normalScale:new T.Vector2(1.15,1.15),roughness:.76,metalness:.09});
    }
    const strips=TideGlass.bands.map(impression);
    const shutter=grid(panel,0,0,.060);
    block(shutter,green,0,0,0,1.88,1.12,.040);
    const lipNode=grid(panel,0,0,.10);block(lipNode,brass,0,0,0,.026,1.10,.035);block(lipNode,iron,0,-.33,.045,.085,.20,.065);
    const lampNode=grid(panel,0,0,.20);block(lampNode,steel,0,0,0,.125,.119,.213);block(lampNode,lip,0,0,-.109,.11,.088,.012);
    const spot=new T.SpotLight(0xffde9c,2.5,2,.47,.65,2);lampNode.add(spot);const lit=grid(panel,0,0,.047);spot.target=lit;
    plane(panel,0,-.497,.118,1.81,.076,texture(1200,56,(c,w,h)=>{
      patina(c,w,h,'#b3ab8b',264);c.fillStyle='#3e473f';c.font='15px monospace';for(let j=0;j<=60;j++){const x=14+j*19.4;c.fillRect(x,0,j%5===0?2:1,j%5===0?24:12);if(j%5===0)c.fillText(String(j*2),x+3,42);}
    }));
    for(const x of [-.91,.91]){block(panel,iron,x,-.488,.105,.032,.11,.057);part(panel,hex,brass,x,-.492,.141,.018,.016,.018);}
    part(lampNode,rod,brass,0,.058,0,.046,.042,.046);bar(lampNode,iron,[0,.08,-.066],[0,.08,.13],.016);
    const reports=[0,1].map(i=>{
      const group=grid(doc,i?.53:-.53,0,.22);block(group,oak,0,0,0,.88,.97,.051);
      const maps=TideGlass.words[i].map((word,k)=>texture(554,600,(c,w,h)=>{
        patina(c,w,h,'#ded2b2',842+i);c.strokeStyle='#879284';c.lineWidth=4;c.strokeRect(18,25,w-36,h-52);c.fillStyle='#494e42';c.font='bold 37px serif';c.fillText(i?'航测附件 / 结论':'灯机验收 / 结论',36,94);
        c.font='21px monospace';c.fillText('NORTH CAPE   '+(i?'HYDROGRAPHY':'MACHINERY'),38,136);
        c.lineWidth=1;for(let y=174;y<540;y+=47){c.beginPath();c.moveTo(34,y);c.lineTo(w-34,y);c.stroke();}
        c.font='25px serif';c.fillText(i?'对照拓印　北线待测':'对照原章　只验灯机',37,216);c.fillText(i?'　　　　　须以当潮复测':'　　　　　未附试航记录',37,263);
        c.strokeStyle='#98654c';c.strokeRect(32,333,w-64,92);c.font='bold 39px serif';c.fillStyle='#624732';c.fillText(word,46,391,w-92);
        c.font='22px monospace';c.fillText('0'+(k+1)+' / 03',40,519);
      }));
      const sheet=plane(group,0,0,.033,.82,.91,maps[0]);const latch=grid(group,0,-.43,.067);block(latch,brass,0,0,0,.14,.054,.068);
      return {group,maps,sheet,latch,which:0};
    });
    const radio=grid(root,2.79,1.035,-5.05);
    block(radio,green,0,.18,0,.49,.35,.277);block(radio,iron,0,.18,.145,.47,.32,.017);
    for(let j=0;j<10;j++)block(radio,lip,-.104,.097+j*.019,.158,.171,.007,.012);
    for(const x of [.064,.171]){bar(radio,brass,[x,.094,.144],[x,.094,.189],.037);block(radio,iron,x,.119,.189,.008,.018,.006);}
    plane(radio,.099,.243,.158,.209,.069,badge('北岬　岸台','C / 3'));
    const mic=grid(radio,-.20,.399,.02);block(mic,rubber,0,0,0,.14,.17,.065);
    for(let j=0;j<5;j++)block(mic,iron,0,-.03+j*.018,.037,.096,.006,.006);
    for(let j=0;j<58;j++){
      const tip=k=>{const u=k/58;return [-.22-.106*Math.sin(u*Math.PI)+.016*Math.cos(u*TAU*8),.34-.29*u+.013*Math.sin(u*TAU*8),.035+.10*u];};
      bar(radio,rubber,tip(j),tip(j+1),.0045);
    }
    const rx=own(new T.MeshStandardMaterial({color:0x699481,emissive:0x347559,emissiveIntensity:.48}));
    const tell=new T.Mesh(own(new T.SphereGeometry(.015,12,8)),rx);tell.position.set(.19,.305,.163);radio.add(tell);
    for(const [parent,items] of groups)for(const {geo,m,at} of items.values()){
      const mesh=own(new T.InstancedMesh(geo,m,at.length));at.forEach((mx,i)=>mesh.setMatrixAt(i,mx));mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
    }
    const v=[new T.Vector3(),new T.Vector3()];
    function update(g){
      const r=g.glass,c=r.cart;
      slides.visible=!r.docked&&r.leg===2;env.update(g.time);gear.update({...r,lift:r.transfer,support:r.lift,cart:[c.x,c.z,c.a],roll:c.roll,time:g.time,stage:g.stage});
      for(let i=0;i<2;i++){
        const d=displays[i];d.strip.offset.x=r.slide[i]/3;
        d.handle.position.x=(r.slide[i]-1)*.38;d.handle.rotation.x=r.clipped[i]?.65:0;
        const q=reports[i],j=Math.round(r.entry[i]);q.group.visible=r.phase==='record';
        if(j!==q.which){q.sheet.material.map=q.maps[j];q.which=j;}q.latch.position.x=(r.entry[i]-1)*.29;q.latch.rotation.z=r.signed[i]?-.40:0;
      }
      panel.visible=r.phase==='margin';if(!panel.visible)return;
      shutter.scale.x=Math.max(.004,1-r.mask);shutter.position.x=r.mask*.94;
      lipNode.position.x=-.94+1.88*r.mask;
      lampNode.position.set(-.99+1.59*r.beam,.21+r.rake*.51,.19+r.rake*.34);lit.position.set(-.91+1.44*r.beam,-.04,.044);
      strips.forEach((m,i)=>{m.material.opacity=r.rubs[i]?.91:.045+.94*TideGlass.light(r,i);});
    }
    function hands(g,i){
      if(!g.engaged[i])return null;
      const r=g.glass;if(r.phase==='cart'||r.phase==='cabinet'||r.phase==='unload')return gear.hands(r.phase==='unload'?'cart':r.phase,i);
      if(r.phase==='desk')return null;
      const obj=r.phase==='proof'?displays[i].handle:r.phase==='margin'?(i?lampNode:lipNode):reports[i].latch;
      obj.updateWorldMatrix(true,false);return v.map((p,j)=>p.set(j?.051:-.047,-.01,.035).applyMatrix4(obj.matrixWorld));
    }
    function shot(g,i){
      const r=g.glass,p=g.players[i],view=(e,a,fov,handsOnly=false)=>({eye:e.map((n,j)=>n+[o.x,o.y,o.z][j]),at:a.map((n,j)=>n+[o.x,o.y,o.z][j]),fov,handsOnly});
      if(r.phase==='unload'&&g.engaged[i])return i?view([1.72,2.34,-2.09],[.03,1.06,-3.97],48):view([-1.82,1.69,-2.10],[-.12,1.12,-3.97],52);
      if(r.phase==='cart'&&g.engaged[i]){
        const c=r.cart,s=i?1:-1;return view([c.x+s*1.96,3.65,Math.min(6.60,c.z+3.24)],[c.x+s*.14, .62,c.z-.7],57);
      }
      if(!g.engaged[i])return null;
      if(r.phase==='cabinet')return i?(r.receiving?view([1.13,2.10,3.14],[0,.97,4.21],48,true):view([1.70,1.62,3.92],[.87,1.01,4.99],46,true)):view([-1.12,1.30,4.55],[-.83,1.01,5.16],46,true);
      if(r.phase==='proof'){
        const d=displays[i].par,s=i?1:-1;
        return view([d.position.x-s*1.24,1.50,d.position.z+.04],[d.position.x,1.37,d.position.z],51,true);
      }
      if(r.phase==='margin')return view([i?.55:-.53,1.92,-3.42],[i?.16:-.26,1.15,-4.44],54,true);
      if(r.phase==='record')return view([i?.78:-.78,1.57,-3.42],[i?.52:-.52,1.21,-4.41],48,true);
      return null;
    }
    function filmShot(side,t){
      const f=TideGlass.film(t);
      rx.emissive.setHex(f.voice==='undecided'?0xeb7047:0x4caa82);rx.emissiveIntensity=f.voice?1.02:.33;
      if(!side&&f.voice==='undecided'||side&&f.voice==='offer')return {
        eye:[o.x+3.19,o.y+1.57,o.z-4.37],at:[o.x+2.76,o.y+1.28,o.z-5.03],fov:47};
      if(!side&&f.voice==='offer')return {eye:[o.x+.39,o.y+2.14,o.z-2.19],at:[o.x+1.74,o.y+1.26,o.z-5.16],fov:52};
      return null;
    }
    function cameraArm(p,end){
      // Shorten the boom along its ray so the camera stays inside the glazing.
      let k=1;const x=p.x-o.x,z=p.z-o.z,dx=end.x-p.x,dz=end.z-p.z;
      if(dx>0)k=Math.min(k,(5.68-x)/dx);else if(dx<0)k=Math.min(k,(-5.68-x)/dx);
      if(dz>0)k=Math.min(k,(6.69-z)/dz);else if(dz<0)k=Math.min(k,(-6.47-z)/dz);
      k=Math.max(.12,k);end.set(p.x+dx*k,Math.min(o.y+3.63,p.y+1.5+(end.y-p.y-1.5)*k),p.z+dz*k);
    }
    return {update,hands,shot,cameraArm,filmShot,dispose(){env.dispose();gear.dispose();root.removeFromParent();owned.forEach(q=>q.dispose());}};
  }
  return {create};
})();
