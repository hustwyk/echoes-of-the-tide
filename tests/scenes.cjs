// Exercise the classic script loader without WebGL or an HTTP server.
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const dist=path.join(__dirname,'../dist');
function sceneLoader(unavailable){
  const executed=[];
  const document={
    createElement:tag=>({tag,remove(){}}),
    head:{append(item){
      if(item.tag!=='script')return;
      queueMicrotask(()=>{
        if(unavailable.has(item.src)){item.onerror();return;}
        assert.ok(fs.existsSync(path.join(dist,item.src)),item.src);
        executed.push(item.src);item.onload();
      });
    }}
  };
  const api=vm.runInNewContext(fs.readFileSync(path.join(dist,'scenes.js'),'utf8')+'\nTideScenes',{document});
  return {api,executed};
}
test('failed chapter script can be retried, shared files execute once across concurrent entries',async()=>{
  const missing=new Set(['pilotboat.js']),{api,executed}=sceneLoader(missing);
  await assert.rejects(api.load(0),/pilotboat/);
  assert.equal(api.ready(0),false);assert.ok(!executed.includes('arrival-rig.js'));
  missing.clear();
  await Promise.all([api.load(0),api.load(1),api.load('pool')]);
  assert.ok(api.ready(0)&&api.ready(1)&&api.ready('pool'));
  assert.equal(executed.length,new Set(executed).size);
  assert.ok(executed.indexOf('vendor/three.min.js')<executed.indexOf('harbor.js'));
  assert.ok(executed.indexOf('pilotboat.js')<executed.indexOf('arrival-rig.js'));
  assert.ok(!executed.includes('range-console.js'));
});
test('the menu can interpret an existing checkpoint before any 3D scene is requested',()=>{
  const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  const shell=Array.from(html.matchAll(/<script defer src="([^"]+)"/g),m=>m[1]);
  const menu=shell.indexOf('game.js');
  for(const name of ['missions.js','gallery.js','tin-memory.js'])assert.ok(shell.includes(name)&&shell.indexOf(name)<menu);
  assert.ok(!shell.includes('vendor/three.min.js')&&!shell.includes('assets/crew-faces.js'));
});
