// Load only the art and instruments used at the chosen destination. Classic scripts
// share one global realm, so fetch them together and evaluate dependencies in order.
const TideScenes=(()=>{
  const common=[
    'vendor/three.min assets/deck-textures assets/slab-maps concrete',
    'floating warp-speech warping passage assets/breakwater-audio landfall-message quay-speech cablequay fender-speech fender-coping berth-board fenders plate-speech arrival-speech stern-line bow-cast arrival landfall rigging drawbridge fieldwork buoy-motion light-register lookout',
    'glass-speech cistern-speech cistern chartroom paper gallery-speech shift-speech starter transit-speech transit signal',
    'tin-lines archive relay-speech relay soundings-speech survey-plot soundings',
    'fog-speech range-voice range-watch pass-speech stern-watch bay-passage lastpass ferry-trail haul-speech fog-recovery fogsignal swing-speech swing cooperation',
    'assets/crew-faces assets/cloth-maps crew mantle-pose actors ferry-hull pierdeck equipment',
    'surf buoy-body buoy-lantern buoy-foam ocean-grid wind-sea ferry-wash seascape fieldprops receipt cinematics dockside lens',
    'assets/bridge-steel steel pocket-bench bridgework',
    'bearings pointing sightlines contactsurf harborreflection footlight static-piers harbor',
  ].flatMap(row=>row.split(' '));
  const chapters=[
    'pilotboat pocket-radio helm-plate plate-pose stern-pose stern-water stern-gear bow-eye bow-wash arrival-rig shore-scans coping landing-board fenderyard floodgear floodquay floodroom',
    'cableenv warpfloat cablegear cableyard',
    'transit-rig transit-glass transit-optics starter-pose starter-bench clutch-bench rain-apron register-desk signalhouse',
    'cisternenv cisterngear cisternroom',
    'taperoom tapedesk archivestudio summer-room screw-table child-duo regatta-speech regatta-boats',
    'glassenv glassgear glassroom',
    'swinggear swingyard',
    'relay-trolley relayenv relaygear trolley-fittings relaystation',
    'soundingsenv chart-rule soundingsgear stern-compass broken-pile surveypier',
    'lanternroom gallery-gear gallery-belay gallery-yard gallery-wall gallery-slip',
    'foghouseenv foghousegear fog-haul haul-pose foghouse',
    'broken-pile entrance-marks bridge-windows reef-finder range-images range-console pilot-stand afterdeck watch-hands',
  ].map(s=>s.split(' '));
  const pool='vendor/three.min assets/slab-maps assets/crew-faces assets/cloth-maps crew child-duo bearings harborreflection harbor regatta regatta-speech regatta-boats regatta-view regatta-audio regatta-ui regatta-pool'.split(' ');
  const finished=new Set(),pending=new Map(),preloads=new Map();
  function preload(name){
    if(finished.has(name)||preloads.has(name))return;
    const link=document.createElement('link');link.rel='preload';link.as='script';link.href=name+'.js';
    preloads.set(name,link);link.onerror=()=>{link.remove();preloads.delete(name);};
    document.head.append(link);
  }
  function execute(name){
    if(finished.has(name))return;
    if(!pending.has(name)){
      const task=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src=name+'.js';
        script.onload=()=>{finished.add(name);resolve();};
        script.onerror=()=>reject(new Error('无法读取 '+name+'.js'));
        document.head.append(script);
      }).finally(()=>{pending.delete(name);preloads.get(name)?.remove();preloads.delete(name);});
      pending.set(name,task);
    }
    return pending.get(name);
  }
  const sceneFiles=id=>id==='pool'?pool:[...common,...chapters[id]];
  const ready=id=>sceneFiles(id).every(name=>finished.has(name));
  async function load(id,progress){
    const names=sceneFiles(id);names.forEach(preload);
    let done=0;
    for(const n of names){
      if(!finished.has(n))await execute(n);
      progress?.(++done,names.length);
    }
  }
  return {ready,load};
})();
