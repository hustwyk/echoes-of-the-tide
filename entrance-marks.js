// The two fixed entrance piles. Sections are in world metres relative to the
// chart datum, with a dated white survey band centred at elevation -1.80 m.
const TideEntranceMarks=(()=>{
  'use strict';
  const TAU=2*Math.PI,t0=-.84,t1=-2.19,w0=-2.08,w1=-4.39;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function makePaint(T,sides){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const arm=document.createElement('canvas');arm.width=arm.height=512;
    const c=canvas.getContext('2d'),p=arm.getContext('2d'),img=c.createImageData(512,512),pack=p.createImageData(512,512);
    let seed=9051979;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const h=(x,y)=>{
      let i=Math.imul(x,73856093)^Math.imul(y,19349663);i=Math.imul(i^(i>>>16),1103515245);return (i>>>0)/4294967295;
    };
    function noise(x,y){
      const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);
      return (h(ix,iy)*(1-u)+h(ix+1,iy)*u)*(1-v)+(h(ix,iy+1)*(1-u)+h(ix+1,iy+1)*u)*v;
    }
    function grain(x,y){const a=TAU*x/256;return .5+.5*Math.cos(43*a+.73*Math.sin(3*a+y*.012)+1.65*Math.sin(7*a+.46*Math.cos(y*.029)));}
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
      const u=x%256,slot=x>>8,a=TAU*u/256,r=rand(),cloud=noise(x/32,y/32),small=noise(x/5.8,y/4.4),v=(y+.5)/204;
      let cr,cg,cb,rough,metal,relief;
      if(y<204){
        const elevation=t0+(t1-t0)*v,white=Math.abs(elevation+1.8)<.15;
        const bottom=elevation< -1.966,underRim=elevation> -1.265&&elevation< -1.243;
        const base=white?[216,214,188]:bottom?[84,81,60]:underRim?[140,105,51]:[210,161,67];
        const running=noise(x/4.5,(y+18)/39),peel=small*.6+cloud*.22+r*.18;
        const edge=Math.max(0,1-Math.abs(Math.abs(elevation+1.80)-.15)/.044);
        const chip=peel>(.832-(edge*.087))||r>.996;
        const run=Math.max(0,running-.50)*Math.min(1,y/65);
        const shade=(cloud-.5)*18+(small-.5)*12+(r-.5)*8;
        cr=base[0]+shade-run*32;cg=base[1]+shade-run*51;cb=base[2]+shade-run*49;
        rough=151+30*cloud;metal=23;relief=128+(r-.5)*13;
        if(chip){cr=82+small*48;cg=65+small*36;cb=47+small*25;rough=203;metal=74;relief=113;}
      }else if(y<418){
        const hh=w0+(w1-w0)*(y-204)/214,g=grain(u+.5+slot*19,y),warp=g**6;
        const damp=clamp((-2.73+.047*Math.sin(a*3+slot)-hh)/.42,0,1);
        const fade=clamp((hh+3.03)/.76,0,1),gray=cloud*16+small*12+g*19+fade*13+(r-.5)*14;
        cr=62+gray-25*damp;cg=49+gray-14*damp;cb=37+gray-13*damp;
        const tide=Math.abs(hh+3.22-.078*Math.sin(4*a+slot)-.026*Math.sin(11*a));
        if(tide<.125&&noise(x/2.9,y/2.1)+r*.36> .83){
          cr=113+23*r;cg=110+18*r;cb=81+19*r;
        }
        cr-=18*warp;cg-=17*warp;cb-=15*warp;rough=186+29*(1-damp)+r*9;metal=7;relief=130-35*warp+9*r;
      }else{
        const ch=cloud*23+small*28+r*16,wet=clamp((y-418)/64,0,1);
        cr=65+ch-12*wet;cg=68+ch-10*wet;cb=61+ch-14*wet;
        rough=169+28*small;metal=9;relief=99+82*small+18*r;
      }
      const off=4*(y*512+x);
      img.data[off]=cr;img.data[off+1]=cg;img.data[off+2]=cb;img.data[off+3]=255;
      pack.data[off]=relief;pack.data[off+1]=rough;pack.data[off+2]=metal;pack.data[off+3]=255;
    }
    c.putImageData(img,0,0);p.putImageData(pack,0,0);
    for(let slot=0;slot<2;slot++){
      const x0=256*slot,px=y=>(t0-y)/(t0-t1)*204,inkCenter=px(-1.80),dir=sides[slot]<0?'左':'右';
      c.save();c.beginPath();c.rect(x0,0,256,204);c.clip();c.textAlign='center';c.textBaseline='middle';c.font='bold 29px "Songti SC","Noto Serif CJK SC",serif';
      // Four stamps: the port and starboard crossing can be read from offshore
      // or on departure regardless of the ferry's final heading and surge.
      c.fillStyle='#475044';
      for(let j=0;j<4;j++)c.fillText(dir,x0+(j+.5)*64,inkCenter+1,24);
      for(let j=0;j<300;j++){
        const xx=x0+rand()*256,yy=inkCenter+(rand()-.5)*31;
        c.strokeStyle=rand()<.5?'rgba(217,211,184,.51)':'rgba(162,161,138,.44)';
        c.lineWidth=.35+rand()*.53;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+rand()*3.3,yy+rand()*1.1);c.stroke();
      }
      c.restore();
    }
    function tex(im,srgb){const v=new T.CanvasTexture(im);if(srgb)v.colorSpace=T.SRGBColorSpace;v.anisotropy=4;return v;}
    return [tex(canvas,true),tex(arm,false)];
  }
  function create(scene,marks){
    const T=THREE,group=new T.Group(),geos=[],pmark=marks.slice(0,2);
    const maps=makePaint(T,pmark.map(m=>m.side)),mat=new T.MeshStandardMaterial({
      map:maps[0],roughnessMap:maps[1],metalnessMap:maps[1],bumpMap:maps[1],bumpScale:.010,
      metalness:1,roughness:1,vertexColors:true
    });
    group.name='内港 · 两座界桩';let disposed=false;
    const middle={x:(pmark[0].x+pmark[1].x)/2,z:(pmark[0].z+pmark[1].z)/2};
    for(let slot=0;slot<pmark.length;slot++){
      const m=pmark[slot],side=m.side,positions=[],normals=[],uv=[],colors=[],indices=[],color=new T.Color();
      const axis=Math.atan2(middle.x-m.x,middle.z-m.z)-TAU/8;
      const rnd=slot===0?.47:1.23;
      function vertex(x,y,z,nx,ny,nz,u,v,tint){
        const n=Math.hypot(nx,ny,nz)||1;
        positions.push(x,y,z);normals.push(nx/n,ny/n,nz/n);uv.push(u,v);
        color.set(tint);colors.push(color.r,color.g,color.b);
      }
      function tex(kind,u,y){
        let py;
        if(kind==='wood')py=204.5+clamp((w0-y)/(w0-w1),0,1)*212;
        else if(kind==='stone')py=419+clamp((-3.75-y)/2.4,0,1)*90;
        else py=1+clamp((t0-y)/(t0-t1),0,1)*201;
        return [(slot*256+1+254*u)/512,1-py/512];
      }
      function coast(kind,a,y){
        if(kind==='wood')return 1+.016*Math.sin(3*a+rnd)+.010*Math.sin(7*a+.45*y+rnd)+.007*Math.sin(16*a+rnd);
        if(kind==='stone')return 1+.051*Math.cos(4*a+rnd)+.042*Math.sin(7*a-rnd)+.022*Math.cos(3*a);
        return 1;
      }
      // Ordered sections form the true silhouette, including the underside of
      // each overhang. Separate corners keep the rain-edge and collars sharp.
      function loft(rows,n,kind,tint=0xffffff){
        for(let k=0;k<rows.length-1;k++){
          const [lo,rl]=rows[k],[hi,rh]=rows[k+1],dr=rh-rl,dy=hi-lo,idx=positions.length/3;
          for(let j=0;j<=n;j++){
            const a=j*TAU/n+axis,s=Math.sin(a),c=Math.cos(a),u=j/n;
            for(const [y,r] of [[lo,rl],[hi,rh]]){
              const rr=r*coast(kind,a,y),[tx,ty]=tex(kind,u,y);
              vertex(s*rr,y,c*rr,s*dy,-dr,c*dy,tx,ty,tint);
            }
          }
          for(let j=0;j<n;j++){const i=idx+2*j;indices.push(i,i+2,i+1,i+2,i+3,i+1);}
        }
      }
      loft([[-7.34,.69],[-5.25,.705],[-4.08,.68],[-3.88,.653],[-3.79,.598],[-3.75,.398],[-3.755,.286]],14,'stone');
      loft([[-6.85,.315],[-4.12,.329],[-3.38,.320],[-2.90,.308],[-2.51,.311],[-2.10,.335],[-1.92,.337]],36,'wood');
      // Lower salt-black clamp on the timber has two forged edges, not another
      // white mark. Its asymmetric height distinguishes a replaced clamp.
      const y=side<0?-2.49:-2.65;
      loft([[y-.072,.315],[y-.068,.34],[y-.060,.347],[y+.052,.347],[y+.059,.34],[y+.061,.317]],32,'wood',0x858b7f);
      loft([[-2.165,.329],[-2.145,.366],[-2.108,.376],[-2.04,.377],[-2.01,.391],[-1.985,.40],
        [-1.971,.395],[-1.646,.395],[-1.622,.383],[-1.578,.378],[-1.26,.370],[-1.235,.388],[-1.05,.377]],48,'cast');
      loft([[-1.266,.37],[-1.26,.409],[-1.225,.427],[-1.173,.428],[-1.162,.413],
        [-1.127,.409],[-.99,.33],[-.895,.207],[-.855,.091],[-.84,.039],[-.84,0]],48,'cast');
      // Socket bolts are made from the same combined mesh as their pile. The
      // low polygon hex head catches light independently of the paint relief.
      function head(a,cy,r){
        const s=Math.sin(a),c=Math.cos(a),at=positions.length/3,sz=.022;
        for(const [d,k] of [[0,1.18],[.008,1.14],[.016,1],[.028,.86],[.028,0]]){
          for(let j=0;j<=6;j++){
            const b=j*TAU/6,st=sz*k*Math.cos(b),yy=cy+sz*k*Math.sin(b);
            const [u,v]=tex('cast',clamp((.5+(a-axis)/TAU)%1,.01,.99),-2.08);
            vertex((r+d)*s+st*c,yy,(r+d)*c-st*s,s,.13,c,u,v,0xb2ab82);
          }
        }
        for(let row=0;row<4;row++)for(let j=0;j<6;j++){
          const i=at+row*7+j;indices.push(i,i+1,i+7,i+7,i+1,i+8);
        }
      }
      for(let j=0;j<6;j++)head(axis+j*TAU/6+.16,-2.077,.375);
      const geo=new T.BufferGeometry(),att=(v,n)=>new T.Float32BufferAttribute(v,n);
      geo.setAttribute('position',att(positions,3));geo.setAttribute('normal',att(normals,3));geo.setAttribute('uv',att(uv,2));geo.setAttribute('color',att(colors,3));geo.setIndex(indices);geo.computeBoundingSphere();
      const mesh=new T.Mesh(geo,mat);mesh.name=side<0?'左湾界 · 白环木桩':'右湾界 · 白环木桩';mesh.position.set(m.x,0,m.z);mesh.castShadow=mesh.receiveShadow=true;
      group.add(mesh);geos.push(geo);
    }
    scene.add(group);
    return {dispose(){
      if(disposed)return;disposed=true;group.removeFromParent();
      for(const geo of geos)geo.dispose();mat.dispose();for(const m of maps)m.dispose();
    }};
  }
  return {create};
})();
