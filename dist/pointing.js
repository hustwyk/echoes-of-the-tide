// Both people point through their own rendered camera. A bearing is stored on
// the surface they selected, in that object's (or instance's) coordinates.
const TidePointing=(()=>{
  const T=THREE,names=['林澈','沈遥'],clamp=T.MathUtils.clamp;
  function create(world,cameras,g,onMark){
    const views=Array.from(document.querySelectorAll('#split .viewport'));
    const ray=new T.Raycaster(),point=new T.Vector3(),relative=new T.Vector3(),screen=new T.Vector3(),direction=new T.Vector3();
    const cursor=[],pins=[],aim=[],marks=[null,null],obscured=[[false,false],[false,false]],lastTest=[[-1,-1],[-1,-1]];
    for(const [i,view] of views.entries()){
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
      marks[i]={anchor,expires:t+7.5,gesture:t+1.45};h.missUntil=-1;
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
    function cancel(){for(const a of aim){a.held=false;a.missUntil=-1;a.preview=null;}for(const c of cursor)c.hidden=true;}
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
        node.hidden=false;relative.copy(point).applyMatrix4(cam.matrixWorldInverse);screen.copy(point).project(cam);
        const behind=relative.z>=-.04;
        const edge=behind||Math.abs(screen.x)>.88||screen.y>.83||screen.y<-.72;
        let x=screen.x,y=screen.y;
        if(edge){
          if(behind){x=relative.x/(cam.aspect||1);y=relative.y;if(Math.abs(x)+Math.abs(y)<.1)y=-1;}
          const s=Math.min(.84/Math.max(.00001,Math.abs(x)),(y>0?.80:.69)/Math.max(.00001,Math.abs(y)));
          x*=s;y*=s;
        }
        const off=edge&&(behind?'身后':y<-.55?'下方':y>.67?'上方':x>0?'向右':'向左');
        if(!edge&&(lastTest[i][j]<0||t-lastTest[i][j]>.24)){
          direction.subVectors(point,cam.position);const length=direction.length();
          obscured[i][j]=length>.4&&!!world.hit(cam.position,direction.multiplyScalar(1/length),length-.18,cam.near);
          lastTest[i][j]=t;
        }
        node.classList.toggle('label-inward-left',x<-.58);node.classList.toggle('label-inward-right',x>.58);
        node.classList.toggle('masked',!edge&&obscured[i][j]);node.classList.toggle('at-edge',!!edge);
        node.style.setProperty('--bearing',Math.atan2(x*cam.aspect,y)+'rad');
        node.style.left=(x+1)*50+'%';node.style.top=(1-y)*50+'%';
        const distance=Math.hypot(point.x-player.x,point.y-player.y-.9,point.z-player.z);
        const label=(i===j?'我':names[j])+(m.anchor.kind==='wave'?'指的浪面 · ':'指的位置 · ')+(off?off+' ':'')+Math.round(distance)+' m';
        const caption=node.lastElementChild;if(caption.textContent!==label)caption.textContent=label;
      }
    }
    const gestures=[new T.Vector3(),new T.Vector3()];
    function pointAt(i,t){
      const a=aim[i],m=marks[i],where=a.held?a.preview:m&&m.gesture>=t?m.anchor:null;
      return where&&locate(where,gestures[i])?gestures[i]:null;
    }
    clear();return {input,place,draw,pointAt,clear,cancel,dispose:clear};
  }
  return {create};
})();
