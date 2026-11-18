// Both people point through their own rendered camera. A bearing is stored on
// the surface they selected, in that object's (or instance's) coordinates.
const TidePointing=(()=>{
  const T=THREE,names=['林澈','沈遥'],clamp=T.MathUtils.clamp;
  function create(world,cameras,g,onMark){
    const views=Array.from(document.querySelectorAll('#split .viewport'));
    const ray=new T.Raycaster(),point=new T.Vector3(),direction=new T.Vector3();
    const cursor=[],pins=[],aim=[],marks=[null,null],obscured=[[false,false],[false,false]],lastTest=[[-1,-1],[-1,-1]];
    const limits={side:.84,up:.80,down:.69},screen={},listening=[];
    for(const [i,view] of views.entries()){
      listening[i]={pressed:false,pad:false,available:false,interrupted:false,turning:false,
        following:false,visibleSince:null,lastMark:null,rotation:new T.Quaternion()};
      cursor[i]=view.querySelector('.point-cursor');pins[i]=Array.from(view.querySelectorAll('.partner-pin'));
      aim[i]={held:false,xy:new T.Vector2(0,-.12),missUntil:-1,preview:null,sample:-1};
    }
    function select(i,x,y){
      const cam=cameras[i];ray.setFromCamera({x,y},cam);
      const origin=ray.ray.origin,dir=ray.ray.direction,far=Math.min(cam.far,230);
      const solid=world.hit(origin,dir,far,cam.near);
      if(g.survey){
        const water=TideSoundings.pickWave(g,origin,dir,solid?.distance??far);
        if(water)return water;
      }
      return solid?world.anchor(solid):null;
    }
    const locate=(a,out)=>a.kind==='wave'?TideSoundings.wavePosition(g,a,out):world.locate(a,out);
    function place(i,x,y,t){
      const h=aim[i],anchor=select(i,x,y);
      h.xy.set(x,y);
      if(!anchor){h.missUntil=t+1.0;return false;}
      marks[i]={anchor,expires:t+7.5,gesture:t+1.45,seen:false};h.missUntil=-1;
      lastTest[0][i]=lastTest[1][i]=-1;onMark?.(i);return true;
    }
    function input(i,held,x,z,dt,t){
      const a=aim[i];
      if(held){
        if(!a.held){a.xy.set(0,-.12);a.missUntil=-1;a.sample=-1;a.preview=null;}
        const aspect=cameras[i].aspect||1;
        a.xy.x=clamp(a.xy.x+x*dt*1.06/aspect,-.953,.953);
        a.xy.y=clamp(a.xy.y-z*dt*1.06,-.92,.92);
      }else if(a.held)place(i,a.xy.x,a.xy.y,t);
      a.held=held;return held;
    }
    function request(i,pressed,interrupted,pad){
      const s=listening[i];s.pressed=pressed;s.interrupted=interrupted;s.pad=pad;
    }
    function follow(i,available,t,dt){
      const s=listening[i],cam=cameras[i],m=marks[1-i];s.available=available;
      if(s.lastMark!==m){s.visibleSince=null;s.lastMark=m;}
      s.following=!!(available&&!s.interrupted&&s.pressed&&m&&m.expires>t&&locate(m.anchor,point)&&point.distanceToSquared(cam.position)>.06);
      if(!s.following)s.visibleSince=null;
      if(!available||s.interrupted){s.turning=false;return;}
      if(!s.following&&!s.turning)return;
      if(!s.turning)s.rotation.copy(cam.quaternion);
      if(s.following)cam.lookAt(point);
      // The orbit, camera arm and walk direction remain under their normal owners.
      // Rotate in place and use the current free-camera orientation for the return.
      const angle=s.rotation.angleTo(cam.quaternion);
      if(angle<.0015)s.rotation.copy(cam.quaternion);
      else s.rotation.rotateTowards(cam.quaternion,Math.min(angle*(1-Math.exp(-dt*11)),dt*4.8));
      cam.quaternion.copy(s.rotation);s.turning=s.following||angle>=.0015;return s.following;
    }
    function blocked(cam,point){
      direction.subVectors(point,cam.position);const length=direction.length();
      return length>.4&&!!world.hit(cam.position,direction.multiplyScalar(1/length),length-.18,cam.near);
    }
    function cancel(){
      for(const a of aim){a.held=false;a.missUntil=-1;a.preview=null;}
      for(const s of listening){s.pressed=s.available=s.following=s.turning=false;s.visibleSince=null;}
      for(const c of cursor)c.hidden=true;
    }
    function clear(){cancel();marks.fill(null);for(const pair of pins)for(const pin of pair)pin.hidden=true;}
    function draw(i,t,player){
      const a=aim[i],c=cursor[i],cam=cameras[i];
      if(a.held&&(a.sample<0||t-a.sample>.13)){
        a.preview=select(i,a.xy.x,a.xy.y);a.sample=t;
      }
      c.hidden=!a.held&&a.missUntil<t;
      if(!c.hidden){
        c.style.left=(a.xy.x+1)*50+'%';c.style.top=(1-a.xy.y)*50+'%';
        c.querySelector('span').textContent=a.held?'松开指给同伴':g.survey?'请指向海面或实物':'请指向实物';
      }
      for(let j=0;j<2;j++){
        const m=marks[j],node=pins[i][j];
        if(!m||m.expires<=t||!locate(m.anchor,point)){node.hidden=true;continue;}
        node.hidden=false;
        const {x,y,edge,bearing,direction:off}=TideBearings.project(point,cam,limits,screen);
        const s=listening[i],tracking=i!==j&&s.following;
        if(!edge&&(lastTest[i][j]<0||t<lastTest[i][j]||t-lastTest[i][j]>(tracking?.095:.24))){
          obscured[i][j]=blocked(cam,point);lastTest[i][j]=t;
        }
        if(tracking&&!m.seen){
          if(edge||obscured[i][j]||Math.hypot(x*cam.aspect,y)>.17)s.visibleSince=null;
          else if(s.visibleSince===null)s.visibleSince=t;
          else if(t-s.visibleSince>=.27&&!blocked(cam,point)){
            m.seen=true;onMark?.(i,'seen');
          }
        }
        node.classList.toggle('label-inward-left',x<-.58);node.classList.toggle('label-inward-right',x>.58);
        node.classList.toggle('masked',!edge&&obscured[i][j]);node.classList.toggle('at-edge',!!edge);
        node.style.setProperty('--bearing',bearing+'rad');node.classList.toggle('seen',m.seen);
        node.style.left=(x+1)*50+'%';node.style.top=(1-y)*50+'%';
        const distance=Math.hypot(point.x-player.x,point.y-player.y-.9,point.z-player.z);
        let reply='';
        if(m.seen)reply=i===j?names[1-i]+'已看见':'已回应';
        else if(i!==j&&s.available)reply=tracking&&!edge&&obscured[i][j]?'视线被挡住了':tracking?'正在看':('按住 '+(s.pad?'RB':i?'单引号':'G')+' 看这里');
        const label=(i===j?'我':names[j])+(m.anchor.kind==='wave'?'指的浪面 · ':'指的位置 · ')+(off?off+' ':'')+Math.round(distance)+' m'+(reply?'\n'+reply:'');
        const caption=node.lastElementChild;if(caption.textContent!==label)caption.textContent=label;
      }
    }
    const gestures=[new T.Vector3(),new T.Vector3()];
    function pointAt(i,t){
      const a=aim[i],m=marks[i],where=a.held?a.preview:m&&m.gesture>=t?m.anchor:null;
      return where&&locate(where,gestures[i])?gestures[i]:null;
    }
    clear();return {input,place,draw,pointAt,request,follow,clear,cancel,dispose:clear};
  }
  return {create};
})();
