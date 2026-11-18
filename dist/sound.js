class HarborSound {
  constructor(){this.enabled=false;this.ctx=null;this.scene=null;}
  async enable(on){
    if(!on)this.stopScene();
    this.enabled=on;
    if(on && !this.ctx){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio){this.enabled=false;return;}
      this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=.68;
      this.master.connect(this.ctx.destination);this.scene=TideAudioScene.create(this.ctx,this.master);this.tape=TideTapeAudio.create(this.ctx,this.master);
    }
    if(on&&this.ctx)await this.ctx.resume().catch(()=>{});
    if(this.master)this.master.gain.setTargetAtTime(this.enabled?.68:0,this.ctx.currentTime,.045);
  }
  stopScene(){this.tape?.stop();this.scene?.stop();}
  cue(kind,side){if(this.enabled)this.scene?.cue(kind,side);}
  tone(f,d=.15,wave='sine',volume=.17){
    if(!this.enabled||!this.ctx)return;
    const t=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=wave;osc.frequency.value=f;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.014);
    gain.gain.exponentialRampToValueAtTime(.001,t+d+.025);osc.connect(gain).connect(this.master);osc.start(t);osc.stop(t+d+.035);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  radio(){this.cue('radio',1);}
}
