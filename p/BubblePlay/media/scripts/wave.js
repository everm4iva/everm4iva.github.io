const titleBlock = document.querySelector('.titleBlock');

const svgFilter = `
<svg style="position: absolute; width: 0; height: 0;">
  <defs>
    <filter id="wave-distortion">
      <feTurbulence
        id="turbulence" 
        type="fractalNoise" 
        baseFrequency="0.02 0.06" 
        numOctaves="3"
        result="noise"
      />
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="noise" 
        scale="8"
      />
    </filter>
  </defs>
</svg>
`;

document.body.insertAdjacentHTML('beforeend', svgFilter);
titleBlock.style.filter = 'url(#wave-distortion)';
gsap.to('#turbulence', {
  attr: {
    baseFrequency: '1.80 1.60'
  },
  duration: 300,
  yoyo: true,
  repeat: -1,
  ease: "sine"
});
