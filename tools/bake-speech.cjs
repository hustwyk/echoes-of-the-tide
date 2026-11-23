const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
// Regenerate the compact facial animation data from the game's original recordings.
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const ff=process.env.FFMPEG||'ffmpeg';
const sources={arrival:'arrival-media',plate:'plate-media',fender:'fender-media',cistern:'cistern-media',fog:'fog-signal-media',glass:'glass-media',gallery:'gallery-media',haul:'haul-media',pass:'final-pass-media',quay:'cablequay-audio',range:'range-media',relay:'relay-media',shift:'shift-media',soundings:'soundings-media',swing:'swing-media',tin:'tin-voices',transit:'transit-media',warp:'warp-media',archive:'archive-tapes'};
const out={};let count=0;
for(const [id,asset] of Object.entries(sources)){
 const box={window:{}};
 vm.runInNewContext(fs.readFileSync('dist/assets/'+asset+'.js','utf8'),box);
 const clips=Object.values(box.window)[0];
 let meta;
 if(id==='archive')meta={coda:clips.coda};
 else{
  const file=id==='range'?'range-voice':id==='tin'?'tin-lines':id+'-speech';
  const src=fs.readFileSync('dist/'+file+'.js','utf8'),name=src.match(/const (\w+)\s*=/)[1];
  meta=vm.runInNewContext(src+';'+name);
 }
 out[id]={};
 for(const [key,info] of Object.entries(meta)){
  const lines=info.lines||info.captions||[[0,info.line||info.speaker||'']];
  if(!clips[key]||!lines.some(([,line])=>/^(林澈|沈遥)([：　]|$)/.test(line)))continue;
  const audio=id==='archive'?clips[key].audio:clips[key];
  const bytes=cp.execFileSync(ff,['-v','error','-i','pipe:0','-ac','1','-ar','8000','-f','s16le','pipe:1'],{input:Buffer.from(audio,'base64')});
  const levels=[],shapes=[];
  for(let offset=0;offset<bytes.length;offset+=800){
   let e=0,low=0,bright=0,prev=0,lp=0;
   const end=Math.min(offset+800,bytes.length);
   for(let j=offset;j<end;j+=2){
    const x=bytes.readInt16LE(j)/32768;lp+=.56*(x-lp);
    e+=x*x;low+=lp*lp;bright+=(x-prev)*(x-prev);prev=x;
   }
   levels.push(Math.sqrt(e/((end-offset)/2)));shapes.push(Math.min(1,Math.max(0,(.87-Math.sqrt(bright/(low+.000001)))*1.33)));
  }
  const ref=levels.slice().sort((a,b)=>a-b)[Math.floor(levels.length*.90)]||1;
  const data=Buffer.from(levels.map((v,i)=>{const a=Math.min(1,Math.max(0,(v/ref-.045)/.955));return (Math.round(15*Math.pow(a,.76))<<4)|Math.round(15*shapes[i])}));
  out[id][key]=data.toString('base64');count++;
 }
}
fs.writeFileSync('dist/assets/speech-shapes.js','// 20 Hz, mono. High nibble: speech energy. Low nibble: rounded-lip blend estimated from spectral brightness.\nconst TideSpeechShapes='+JSON.stringify(out)+';\n');
console.log('Voiced clips:',count,'source bytes:',fs.statSync('dist/assets/speech-shapes.js').size);
