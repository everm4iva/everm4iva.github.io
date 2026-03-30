function frag(){
    const canvas=document.getElementById('glcanvas');
    const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const geometry=new THREE.PlaneGeometry(2,2);

    const frag=`
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_c1;
    uniform vec3 u_c2;
    uniform vec3 u_c3;
    float hash(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);} 
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
    float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.;a*=0.5;}return v;}
    void main(){
      vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec2 st=uv-0.5;st.x*=u_resolution.x/u_resolution.y;float t=u_time*0.5;
      float n=fbm(st*3.+vec2(t*0.15,t*0.1));
      float warp=fbm(st*6.+n*2.+vec2(sin(t*0.7),cos(t*0.4))*0.5);
      vec2 displaced=st+normalize(st)*warp*0.12;
      float rShift=0.006*(noise(displaced*40.+vec2(t*3.))-0.5);
      float gShift=0.003*(noise(displaced*30.+vec2(t*2.1))-0.5);
      float bShift=-0.005*(noise(displaced*20.+vec2(t*4.2))-0.5);
      vec2 ru=uv+vec2(rShift,0),gu=uv+vec2(gShift,0),bu=uv+vec2(bShift,0);
      float rn=fbm((ru-0.5)*6.+vec2(t*0.2));
      float gn=fbm((gu-0.5)*6.+vec2(t*0.2+10.));
      float bn=fbm((bu-0.5)*6.+vec2(t*0.2+20.));
      vec3 col=rn*u_c1+gn*u_c3+bn*u_c2;
      float scan=sin((gl_FragCoord.y+u_time*180.)*0.8)*0.04;col+=scan*0.6;
      float speck=step(0.9996,fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453));col+=speck;
      float v=smoothstep(0.8,0.15,length(st));col*=mix(0.7,1.0,v);
      col=floor(col*12.)/12.;
      col=pow(col,vec3(0.95));
      gl_FragColor=vec4(col,1.0);
    }`;
    const vert=`precision highp float;attribute vec3 position;void main(){gl_Position=vec4(position,1.0);}`;
    const material=new THREE.RawShaderMaterial({
      uniforms:{u_time:{value:0},u_resolution:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)},
        u_c1:{value:new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan'))},
        u_c2:{value:new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--folly-red'))},
        u_c3:{value:new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--smooth-purple'))}},
      vertexShader:vert,fragmentShader:frag
    });
    scene.add(new THREE.Mesh(geometry,material));

    function resize(){renderer.setSize(window.innerWidth,window.innerHeight);material.uniforms.u_resolution.value.set(window.innerWidth,window.innerHeight);}window.addEventListener('resize',resize);resize();

    function render(now){material.uniforms.u_time.value=now*0.001;renderer.render(scene,camera);requestAnimationFrame(render);}requestAnimationFrame(render);

    const title=document.getElementById('title');
    setInterval(()=>{
      const blur=1+Math.sin(Date.now()*0.001)*0.6;
      const hue=Math.sin(Date.now()*0.0005)*10;
      const scale=1+Math.sin(Date.now()*0.0008)*0.01;
      title.style.filter=`blur(${blur.toFixed(2)}px) hue-rotate(${hue.toFixed(2)}deg)`;
      title.style.transform=`translate(-50%,-50%) scale(${scale.toFixed(3)})`;
    },50);
}

frag();