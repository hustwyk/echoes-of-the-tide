// Run with node tests/sightlines.cjs. Uses the same THREE distribution as the game.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('../dist/vendor/three.min.js'),context=vm.createContext({THREE:T});
const source=fs.readFileSync(path.join(__dirname,'../dist/sightlines.js'),'utf8');
const sights=vm.runInContext(source+'\nTideSightlines',context);
const scene=new T.Scene(),solid=new T.MeshStandardMaterial(),box=new T.BoxGeometry(1,1,1);
const car=new T.Group(),deck=new T.InstancedMesh(box,solid,2);
deck.setMatrixAt(0,new T.Matrix4().makeTranslation(-2,0,0));
deck.setMatrixAt(1,new T.Matrix4().makeTranslation(2,0,0));car.add(deck);scene.add(car);
const invis=new T.Group();invis.position.set(2,0,1);invis.visible=false;invis.add(new T.Mesh(box,solid));scene.add(invis);
const pane=new T.Mesh(box,new T.MeshStandardMaterial({transparent:true,opacity:.14}));
pane.position.set(2,0,2);scene.add(pane);
const hand=new T.Mesh(box,solid);hand.position.set(2,0,3);scene.add(hand);
const post=new T.Mesh(new T.BoxGeometry(.27,5,.31),solid);post.position.set(-.14,1.50,3.2);scene.add(post);
const q=sights.create(scene,[hand]);q.update();
const origin=new T.Vector3(2,0,5),forward=new T.Vector3(0,0,-1);
const hit=q.hit(origin,forward,10);
assert.equal(hit.object,deck);assert.equal(hit.instance,1);assert.ok(Math.abs(hit.distance-4.5)<1e-7);
assert.equal(q.hit(origin,forward,4.4),null);
const marker=q.anchor(hit),point=new T.Vector3();
car.position.set(.4,.8,-1.25);deck.setMatrixAt(1,new T.Matrix4().makeTranslation(1.57,0,.2));deck.instanceMatrix.needsUpdate=true;
q.update();assert.ok(q.locate(marker,point));assert.ok(point.distanceTo(new T.Vector3(1.97,.8,-.55))<1e-6);
car.visible=false;q.update();assert.equal(q.locate(marker,point),false);assert.equal(q.hit(origin,forward,10),null);
const eye=new T.Vector3(0,3.55,5.25);q.retract(0,{x:0,y:0,z:0},eye,1,1/60,true);assert.ok(eye.z<3.18&&eye.z>2.5);
post.visible=false;q.update();
for(let i=1;i<=70;i++){eye.set(0,3.55,5.25);q.retract(0,{x:0,y:0,z:0},eye,1+i/60,1/60,false);}
assert.ok(eye.z>5.23);
q.dispose();console.log('Physical mesh and instance anchoring, visibility, material filtering, and camera clearance passed.');
