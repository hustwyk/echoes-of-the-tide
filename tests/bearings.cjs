// Run with node tests/bearings.cjs. The mark is picked and re-located by the game's mesh raycaster.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('../dist/vendor/three.min.js');
function node(){
  const tags=new Set();
  return {hidden:false,textContent:'',style:{setProperty(){}},classList:{toggle(k,v){if(v)tags.add(k);else tags.delete(k);},contains:k=>tags.has(k)}};
}
function pane(){
  const pins=[0,1].map(()=>Object.assign(node(),{lastElementChild:node()})),cursor=Object.assign(node(),{querySelector:()=>node()});
  return {pins,querySelector:()=>cursor,querySelectorAll:()=>pins};
}
const panes=[pane(),pane()],context=vm.createContext({THREE:T,document:{querySelectorAll:()=>panes}});
function get(name,symbol){return vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name+'.js'),'utf8')+'\n'+symbol,context);}
const bearings=get('bearings','TideBearings'),sight=get('sightlines','TideSightlines'),point=get('pointing','TidePointing');
const cam=()=>new T.PerspectiveCamera(55,1.35,.1,90),cameras=[cam(),cam()],p=v=>new T.Vector3(...v);
cameras[0].position.set(0,0,6);cameras[1].position.set(4,0,6);
for(const c of cameras)c.updateMatrixWorld();
const lim={side:.8,up:.66,down:.52};
for(const [v,dir] of [[[0,0,2],''],[[-8,0,12],'左后方'],[[8,0,12],'右后方'],[[0,0,12],'身后'],[[0,7,4],'上方'],[[7,0,4],'向右']]){
  const out=bearings.project(p(v),cameras[0],lim,{});
  assert.equal(out.direction,dir,JSON.stringify(v));assert.ok(Math.abs(out.x)<=lim.side+1e-7&&out.y<=lim.up+1e-7&&out.y>=-lim.down-1e-7);
}
const scene=new T.Scene(),material=new T.MeshBasicMaterial(),mesh=new T.Mesh(new T.BoxGeometry(1,1,1),material);
const wall=new T.Mesh(new T.BoxGeometry(1.6,2,.2),material);wall.position.set(2,0,3);scene.add(mesh,wall);scene.updateMatrixWorld();
const world=sight.create(scene,[]);world.update();
const events=[],tool=point.create(world,cameras,{},(i,kind)=>events.push([i,kind]));
assert.ok(tool.place(0,0,0,0));tool.request(1,true,false,false);
const normal=new T.Quaternion().setFromAxisAngle(p([0,1,0]),-1.25);
let time=0;
function tick(frames,free=true){
  for(let j=0;j<frames;j++){
    time+=1/60;cameras[1].quaternion.copy(normal);
    world.update();tool.follow(1,free,time,1/60);
    cameras.forEach(c=>c.updateMatrixWorld());cameras.forEach((_,i)=>tool.draw(i,time,{x:i*4,y:0,z:6}));
  }
}
tick(100);
assert.match(panes[1].pins[0].lastElementChild.textContent,/视线被挡/);
assert.equal(events.length,1);assert.ok(panes[1].pins[0].classList.contains('masked'));
// A physical change opens the sightline. A nearby moving point remains the same mark.
wall.visible=false;mesh.position.x=.62;mesh.updateMatrixWorld();tick(65);
assert.deepEqual(events[1],[1,'seen']);assert.match(panes[0].pins[0].lastElementChild.textContent,/沈遥已看见/);
assert.ok(cameras[1].getWorldDirection(new T.Vector3()).angleTo(p([.62,0,.5]).sub(cameras[1].position))<.005);
tick(20);assert.equal(events.length,2);
tool.request(1,false,false,false);tick(85);assert.ok(cameras[1].quaternion.angleTo(normal)<.001);
tool.request(1,true,false,true);tick(24,false);assert.ok(cameras[1].quaternion.angleTo(normal)<.001);
tool.request(1,true,true,true);tick(8);assert.ok(cameras[1].quaternion.angleTo(normal)<.001);
tick(457);assert.ok(panes.every(p=>p.pins.every(el=>el.hidden)));
tool.dispose();world.dispose();mesh.geometry.dispose();wall.geometry.dispose();material.dispose();
console.log('Independent view, moving mark, true occlusion, acknowledgement, release, locked camera and expiry passed.');
