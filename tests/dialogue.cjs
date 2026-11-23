const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const box=vm.createContext({atob});
for(const file of ['assets/speech-shapes','dialogue-pose','fender-speech','quay-speech','glass-speech']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',file+'.js'),'utf8'),box);
}
const {pose,fenders,quay,glass}=vm.runInContext('({pose:TideDialoguePose,fenders:TideFenderSpeech,quay:TideQuaySpeech,glass:TideGlassSpeech})',box);
test('recorded speakers take turns, with pauses and remote voices outside the physical cast',()=>{
  assert.equal(pose.read('fender','shore',fenders,0),null);
  assert.equal(pose.read('fender','shore',fenders,.5).speaker,1);
  assert.equal(pose.read('fender','shore',fenders,2.2).speaker,0);
  assert.equal(pose.read('quay','ship',quay,2),null);
  assert.equal(pose.read('glass','admit',glass,glass.admit.duration),null);
  const levels=Array.from({length:40},(_,i)=>pose.read('glass','admit',glass,.15+i/20)?.jaw||0);
  assert.ok(Math.max(...levels)>.65&&Math.min(...levels)<.14);
});
