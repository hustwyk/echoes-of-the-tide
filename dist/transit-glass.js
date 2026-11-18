/* The Hai Yan's bridge-wing bearing sight. Its aperture is physically empty;
 * the sea, pier lights and buoy are the normal world render through the sight. */
const TideTransitGlass=(()=>{
  const T=THREE,turn=Math.PI*2;
  function create(scene){
    const root=new T.Group();root.name='海雁号 · 舷外方位镜';root.matrixAutoUpdate=false;root.visible=false;
    let camera=null,dead=false,seed=89017;
    const own=new Set(),keep=x=>(own.add(x),x);
    const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
    const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    function texture(width,height,paint,repeat=false){
      const c=document.createElement('canvas');c.width=width;c.height=height;
      paint(c.getContext('2d'),width,height);
      const t=keep(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
      if(repeat)t.wrapS=T.RepeatWrapping;
      return t;
    }
    const wear=texture(512,128,(g,w,h)=>{
      g.fillStyle='#ddd9cb';g.fillRect(0,0,w,h);
      for(let i=0;i<2400;i++){
        const x=rand()*w,y=rand()*h;
        g.fillStyle=i%5?'rgba(61,55,39,.085)':'rgba(255,254,239,.36)';
        g.fillRect(x,y,.6+rand()*3,.35+rand()*1.1);
      }
      for(let i=0;i<130;i++){
        const x=rand()*w,y=rand()*h;
        g.strokeStyle=i%3?'rgba(87,73,55,.22)':'rgba(254,248,221,.60)';
        g.lineWidth=.35+rand()*.7;g.beginPath();g.moveTo(x,y);
        g.quadraticCurveTo(x+3,y-.75,x+4+rand()*11,y+rand()*2-.6);g.stroke();
      }
    },true);
    const card=texture(4096,128,(g,w,h)=>{
      const metal=g.createLinearGradient(0,0,0,h);
      metal.addColorStop(0,'#9a8c65');metal.addColorStop(.24,'#d4c59a');
      metal.addColorStop(.74,'#c6bb97');metal.addColorStop(1,'#8e825f');
      g.fillStyle=metal;g.fillRect(0,0,w,h);
      for(let i=0;i<13000;i++){
        g.fillStyle=i%4?'rgba(54,46,34,.065)':'rgba(255,254,222,.20)';
        g.fillRect(rand()*w,rand()*h,1+rand()*4,.5+rand()*.7);
      }
      g.textAlign='center';g.textBaseline='middle';
      for(let j=-10;j<=370;j++){
        const x=j*w/360,major=j%10===0,half=j%5===0,len=major?46:half?34:21;
        g.fillStyle='#564f3f';g.fillRect(x+1,7,major?2.7:1.65,len);
        g.fillStyle='#2f332e';g.fillRect(x-.4,6,major?2.7:1.65,len);
        if(major){g.font='bold 39px "Arial Narrow",Arial,sans-serif';g.fillText(String((j+360)%360).padStart(3,'0'),x,81);}
        else if(half){g.beginPath();g.arc(x,58,2.4,0,turn);g.fill();}
      }
    },true);
    function finish(roughness,metalness,map=wear){
      return keep(new T.MeshStandardMaterial({map,vertexColors:true,roughness,metalness,fog:false}));
    }
    const paint=finish(.48,.29),brass=finish(.43,.47),rubber=finish(.77,.025);
    const scaleMat=finish(.60,.19,card);
    const wire=keep(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false}));
    const batches=new Map(),M=new T.Matrix4(),N=new T.Matrix3(),p=v(),n=v(),col=new T.Color(),q=new T.Quaternion();
    const block=new T.BoxGeometry(),ball=new T.SphereGeometry(1,12,8),cyl=new T.CylinderGeometry(1,1,1,12);
    const yAxis=v(0,1,0),identity=new T.Quaternion();
    function add(shape,material,tint,at=[0,0,0],size=[1,1,1],rotation=identity){
      let b=batches.get(material);if(!b){b={pos:[],nor:[],uv:[],col:[],idx:[]};batches.set(material,b);}
      M.compose(v(...at),rotation,v(...size));N.getNormalMatrix(M);col.set(tint);
      const a=shape.attributes,start=b.pos.length/3;
      for(let i=0;i<a.position.count;i++){
        p.fromBufferAttribute(a.position,i).applyMatrix4(M);n.fromBufferAttribute(a.normal,i).applyMatrix3(N).normalize();
        b.pos.push(p.x,p.y,p.z);b.nor.push(n.x,n.y,n.z);b.col.push(col.r,col.g,col.b);
        b.uv.push(a.uv?.getX(i)||0,a.uv?.getY(i)||0);
      }
      if(shape.index)for(const j of shape.index.array)b.idx.push(start+j);
      else for(let i=0;i<a.position.count;i++)b.idx.push(start+i);
    }
    function surface(pos,uv,index,mat,tint){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      g.setIndex(index);g.computeVertexNormals();add(g,mat,tint);g.dispose();
    }
    // Closed turned rims. Each ring is [radius, depth, radial knurl depth].
    // Positive Z faces the observer; the hollow inner bevels recede towards sea.
    function rim(profile,mat,tint,count=112,flutes=0){
      const pos=[],uv=[],idx=[],stride=count+1;
      for(let j=0;j<profile.length;j++)for(let k=0;k<=count;k++){
        const [r,z,depth=0]=profile[j],a=turn*k/count,rr=r+depth*(.5+.5*Math.cos(a*flutes));
        pos.push(Math.cos(a)*rr,Math.sin(a)*rr,z);uv.push(k/count*3.0,j/(profile.length-1));
        if(j<profile.length-1&&k<count){const x=j*stride+k;idx.push(x,x+stride,x+stride+1,x,x+stride+1,x+1);}
      }
      surface(pos,uv,idx,mat,tint);
    }
    function box(mat,tint,x,y,z,w,h,d,angle=0){
      add(block,mat,tint,[x,y,z],[w,h,d],q.setFromAxisAngle(v(0,0,1),angle));
    }
    function rod(mat,tint,A,B,r){
      const start=v(...A),end=v(...B),dir=end.clone().sub(start),len=dir.length();
      add(cyl,mat,tint,start.lerp(end,.5).toArray(),[r,len,r],q.setFromUnitVectors(yAxis,dir.normalize()));
    }
    function screw(x,y,z,r,rotation){
      add(ball,brass,'#a49974',[x,y,z],[r,r,r*.24]);
      box(paint,'#292e2b',x,y,z+r*.231,r*1.29,r*.15,r*.038,rotation);
    }
    rim([[.999,-.18],[1.038,-.142],[1.044,-.107],[1.097,-.070],[1.107,.065],[1.065,.113],[1.033,.104],[1.016,.037],[.999,-.18]],paint,'#424c49');
    rim([[.962,-.071],[.971,-.046],[.992,-.032],[1.015,.035],[1.031,.058],[1.035,.027],[1.017,-.10],[.962,-.071]],brass,'#978453');
    rim([[.951,-.13],[.958,-.108],[.973,-.102],[.977,-.072],[.970,-.056],[.983,-.043],[1.007,.026],[1.012,.015],[.990,-.103],[.951,-.13]],rubber,'#303633');
    rim([[1.048,.036],[1.054,.055],[1.089,.062,.005],[1.106,.018,.006],[1.099,-.012],[1.051,-.014],[1.048,.036]],brass,'#807454',192,96);
    rim([[1.057,.075],[1.065,.107],[1.089,.127],[1.115,.116],[1.131,.084],[1.122,.053],[1.081,.057],[1.057,.075]],rubber,'#363a35');
    for(const deg of [18,62,119,161,206,239,302,339]){
      const a=deg*Math.PI/180,x=Math.cos(a)*1.031,y=Math.sin(a)*1.031;screw(x,y,.060,.013,a+.7);
    }
    // The compass card rotates behind a fixed index. Only the visible arc is
    // meshed. Its cylindrical perspective is preserved at both ends of the slot.
    const radius=1.36,cardSpan=.49,cardLift=.225;
    const cradle=(a,y,lift=0)=>[radius*Math.sin(a),y+cardLift,.130+radius*(Math.cos(a)-1)+lift];
    function strip(yBottom,yTop,front,mat,tint,graduated=false){
      const pos=[],uv=[],idx=[],steps=64;
      for(let k=0;k<=steps;k++){
        const a=(2*k/steps-1)*cardSpan;
        for(const [y,b] of [[yBottom,0],[yTop,1]]){
          pos.push(...cradle(a,y,front));uv.push(graduated?a/turn:k/steps,b);
        }
        if(k<steps){const j=k*2;idx.push(j,j+2,j+1,j+1,j+2,j+3);}
      }
      surface(pos,uv,idx,mat,tint);
    }
    strip(-1.102,-.832,-.010,paint,'#424943');
    strip(-1.009,-.864,0,scaleMat,'#fff9e8',true);
    strip(-1.038,-1.014,.012,brass,'#867955');
    strip(-1.062,-1.037,.008,paint,'#373e37');
    strip(-.867,-.849,.008,brass,'#998660');
    for(const s of [-1,1]){
      const x=s*radius*Math.sin(cardSpan),z=cradle(cardSpan,0)[2];
      box(paint,'#50594f',x,-.956+cardLift,z+.007,.060,.252,.038,-s*.055);
      screw(x,-.892+cardLift,z+.031,.013,s*.6);screw(x,-1.041+cardLift,z+.031,.013,s*1.4);
    }
    // Fixed lubber line on a short independent rhomboid brass sighting tongue.
    surface([-.025,-.813+cardLift,.151,.025,-.813+cardLift,.151,.011,-.852+cardLift,.158,0,-.884+cardLift,.160,-.011,-.852+cardLift,.158],
      [0,1,1,1,.8,.5,.5,0,.2,.5],[0,2,1,0,3,2,0,4,3],brass,'#d2c092');
    box(wire,'#382c24',0,-.842+cardLift,.164,.003,.051,.0015);
    // Fine mechanical reticle with a clear centre. The short ivory selvage
    // remains legible against dark water; a dark filament reads over the sky.
    function filament(a,b,width){
      const x=(a[0]+b[0])*.5,y=(a[1]+b[1])*.5,dx=b[0]-a[0],dy=b[1]-a[1];
      const angle=Math.atan2(dy,dx),length=Math.hypot(dx,dy);
      box(wire,'#d1c9b1',x-dy/length*.0025,y+dx/length*.0025,-.171,length,width*.92,.001,angle);
      box(wire,'#34332d',x,y,-.169,length,width,.001,angle);
    }
    for(const s of [-1,1]){
      filament([s*.015,0],[s*.235,0],.0039);filament([0,s*.017],[0,s*.175],.0038);
      filament([s*.11,-.010],[s*.11,.010],.0030);
      filament([-.009,s*.090],[.009,s*.090],.0029);
      filament([s*.240,0],[s*.329,0],.0062);
    }
    filament([0,-.186],[0,-.273],.0055);
    // A visible cast foot and captive spindle below the card, away from the sightline.
    for(const s of [-1,1]){
      rod(paint,'#495149',[s*.53,-1.015+cardLift,-.060],[s*.50,-.956,-.104],.043);
      rod(brass,'#807556',[s*.50,-1.032+cardLift,-.030],[s*.49,-.936,-.062],.014);
    }
    for(const [mat,b] of batches){
      const g=keep(new T.BufferGeometry());
      for(const [key,values,size] of [['position',b.pos,3],['normal',b.nor,3],['uv',b.uv,2],['color',b.col,3]])g.setAttribute(key,new T.Float32BufferAttribute(values,size));
      g.setIndex(b.idx);g.computeBoundingSphere();
      const mesh=new T.Mesh(g,mat);mesh.frustumCulled=false;
      mesh.name=mat===scaleMat?'舰桥方位刻度盘':mat===wire?'舰桥光学刻丝':'舰桥测向镜件';
      // The reflection camera is a copy of the player camera. Exclude its view
      // explicitly so the eyecup never appears in the reflected sea.
      mesh.onBeforeRender=(_e,_scene,eye)=>{g.setDrawRange(0,camera===eye?Infinity:0);};
      mesh.onAfterRender=()=>{g.setDrawRange(0,Infinity);};
      root.add(mesh);
    }
    block.dispose();ball.dispose();cyl.dispose();batches.clear();
    const shift=new T.Matrix4(),scale=new T.Matrix4(),direction=v();
    function update(g,cam,side,aspect,transit=true){
      if(dead)return;
      const on=!!(side===1&&transit&&g?.stage===1&&g.signal?.heard&&cam?.isPerspectiveCamera);
      camera=on?cam:null;root.visible=on;
      if(!on)return;
      if(!root.parent)scene.add(root);
      cam.updateWorldMatrix(true,false);scene.updateWorldMatrix(true,false);
      const d=Math.max(.40,cam.near*3.3),vertical=Math.tan(cam.getEffectiveFOV()*Math.PI/360)*d;
      const a=Number.isFinite(aspect)&&aspect>0?aspect:cam.aspect,s=vertical*Math.min(.963,Math.max(.72,a*.985));
      root.matrix.copy(scene.matrixWorld).invert().multiply(cam.matrixWorld)
        .multiply(shift.makeTranslation(0,0,-d)).multiply(scale.makeScale(s,s,s));
      root.matrixWorldNeedsUpdate=true;root.updateWorldMatrix(false,true);
      // Clockwise true course, 000 at world north (-Z); camera motion includes
      // the helmsman's sight offset and the roll of the real bridge.
      cam.getWorldDirection(direction);
      card.offset.x=((Math.atan2(direction.x,-direction.z)/turn)%1+1)%1;
    }
    function dispose(){
      if(dead)return;dead=true;camera=null;root.removeFromParent();root.clear();
      for(const x of own)x.dispose();own.clear();
    }
    return {update,dispose};
  }
  return {create};
})();
