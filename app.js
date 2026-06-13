/* ============= LENIS-STYLE SMOOTH SCROLL ============= */
const wrapper = document.getElementById('smooth-wrapper');
const content = document.getElementById('smooth-content');
let targetY = 0;
let currentY = 0;
let easeAmount = 0.08;
let isMobile = window.matchMedia('(max-width:768px)').matches;

function setBodyHeight(){
  if(isMobile) return;
  document.body.style.height = content.getBoundingClientRect().height + 'px';
}
function onResize(){
  isMobile = window.matchMedia('(max-width:768px)').matches;
  if(isMobile){
    document.body.style.height = '';
    content.style.transform = '';
    wrapper.style.position = 'static';
    wrapper.style.overflow = 'visible';
  }else{
    wrapper.style.position = '';
    wrapper.style.overflow = '';
    setBodyHeight();
  }
}
window.addEventListener('resize', onResize);
window.addEventListener('load', setBodyHeight);
// Also recalc when fonts/images load
const ro = new ResizeObserver(setBodyHeight);
ro.observe(content);

function smoothLoop(){
  if(!isMobile){
    targetY = window.scrollY || window.pageYOffset;
    currentY += (targetY - currentY) * easeAmount;
    content.style.transform = `translate3d(0, ${-currentY}px, 0)`;
  }
  // Scroll progress bar
  const sp = document.getElementById('scrollProgress');
  if(sp){
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
    sp.style.width = pct + '%';
  }
  requestAnimationFrame(smoothLoop);
}
requestAnimationFrame(smoothLoop);

/* Smooth-scroll-aware anchor links (with katana scene-cut on desktop) */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',(e)=>{
    const id = a.getAttribute('href').slice(1);
    if(!id) return;
    const target = document.getElementById(id);
    if(!target) return;
    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const top = (window.scrollY || window.pageYOffset) + rect.top - 20;
    if(window.playSlash && !isMobile){
      window.playSlash(()=>{
        window.scrollTo(0, top);
        currentY = top; targetY = top;
        content.style.transform = `translate3d(0, ${-top}px, 0)`;
      });
    }else{
      window.scrollTo({top, behavior:'smooth'});
    }
  });
});

/* ============= CUSTOM CURSOR ============= */
const dot   = document.getElementById('cursorDot');
const ring  = document.getElementById('cursorRing');
const trails = [
  document.getElementById('cursorTrail1'),
  document.getElementById('cursorTrail2'),
  document.getElementById('cursorTrail3')
];
let mx=window.innerWidth/2, my=window.innerHeight/2;
let rx=mx, ry=my;
const trailPos = trails.map(()=>({x:mx,y:my}));
let cursorEnabled = true;

window.addEventListener('mousemove',(e)=>{
  mx=e.clientX; my=e.clientY;
  if(!cursorEnabled) return;
  dot.style.left = mx+'px';
  dot.style.top  = my+'px';
});
function animateCursor(){
  if(cursorEnabled && !isMobile){
    rx += (mx-rx)*0.15;
    ry += (my-ry)*0.15;
    ring.style.left = rx+'px';
    ring.style.top  = ry+'px';
    let prevX = mx, prevY = my;
    trailPos.forEach((p,i)=>{
      p.x += (prevX - p.x) * (0.25 - i*0.05);
      p.y += (prevY - p.y) * (0.25 - i*0.05);
      trails[i].style.left = p.x+'px';
      trails[i].style.top  = p.y+'px';
      trails[i].style.opacity = 0.4 - i*0.1;
      trails[i].style.width  = (6 - i)+'px';
      trails[i].style.height = (6 - i)+'px';
      prevX = p.x; prevY = p.y;
    });
  }
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .panel, .arc-card, .chapter-card, .power-card, .edu-card, .lang-card, .tenet, .bounty-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>{ dot.classList.add('hover'); ring.classList.add('hover'); });
  el.addEventListener('mouseleave',()=>{ dot.classList.remove('hover'); ring.classList.remove('hover'); });
});

function setCursor(on){
  cursorEnabled = on;
  document.body.style.cursor = on ? 'none' : 'auto';
  [dot,ring,...trails].forEach(el=>{ el.style.display = on ? 'block' : 'none'; });
}

/* ============= HERO LETTER ANIMATION ============= */
document.querySelectorAll('#heroName .ch').forEach((c,i)=>{
  c.style.animationDelay = (0.4 + i*0.07)+'s';
});

/* ============= REVEAL ON SCROLL ============= */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      en.target.classList.add('in');
      const fill = en.target.querySelector('.skill-fill');
      if(fill){
        fill.style.width = fill.dataset.pct + '%';
      }
      const counter = en.target.querySelector('.stat-num');
      if(counter && !counter.dataset.done){
        counter.dataset.done = '1';
        const target = +counter.dataset.target;
        let n=0;
        const step = Math.max(1, Math.ceil(target/30));
        const t = setInterval(()=>{
          n+=step;
          if(n>=target){ n=target; clearInterval(t); }
          counter.textContent = n;
        },35);
      }
      io.unobserve(en.target);
    }
  });
},{threshold:0.15});

document.querySelectorAll('.reveal, .skill-row, .chapter, .power-card').forEach(el=>io.observe(el));

document.querySelectorAll('.chapter').forEach((el,i)=>{
  el.style.transitionDelay = (i*0.08)+'s';
});

/* Section-title shake on first appearance */
const titleObserver = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if(en.isIntersecting && !en.target.dataset.shaken){
      en.target.dataset.shaken = '1';
      en.target.classList.add('shake');
      setTimeout(()=>en.target.classList.remove('shake'), 700);
    }
  });
},{threshold:0.6});
document.querySelectorAll('.section-title').forEach(t=>titleObserver.observe(t));

/* Stagger tenets so the swipe reveal cascades */
document.querySelectorAll('.tenet').forEach((el,i)=>{
  el.style.transitionDelay = (i*0.08)+'s';
  el.style.setProperty('--swipe-delay', (i*0.08)+'s');
});

/* ============= SCROLL-DRIVEN KANJI ROTATION + FIGURE PARALLAX ============= */
const kanjiDeco = document.querySelectorAll('.kanji-deco');
const driftKanji = document.querySelectorAll('.drift-kanji');
const roninGiant = document.querySelector('.ronin-giant');
const bountyFigure = document.querySelector('.bounty-figure');

kanjiDeco.forEach(k=>k.classList.add('spin-kanji'));

function onScrollFx(){
  const y = window.scrollY || window.pageYOffset;
  // Slow-rotate kanji watermarks based on scroll depth
  kanjiDeco.forEach((k,i)=>{
    const rect = k.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if(inView){
      const local = (window.innerHeight - rect.top) * 0.05;
      k.style.transform = `rotate(${local + (i%2===0 ? 0 : -180)}deg)`;
    }
  });
  // Parallax drift kanji
  driftKanji.forEach((k,i)=>{
    const speed = (i%3+1) * 0.08;
    k.style.transform = `translateY(${(y * speed) % 200}px) rotate(${y*0.02}deg)`;
  });
  // Ronin & bounty figure parallax
  if(roninGiant){
    const r = roninGiant.getBoundingClientRect();
    if(r.top < window.innerHeight && r.bottom > 0){
      const off = (window.innerHeight/2 - r.top) * 0.15;
      roninGiant.style.transform = `translateY(calc(-50% + ${off}px))`;
    }
  }
  if(bountyFigure){
    const r = bountyFigure.getBoundingClientRect();
    if(r.top < window.innerHeight && r.bottom > 0){
      const off = (window.innerHeight - r.top) * 0.08;
      bountyFigure.style.transform = `translateY(${-off}px) rotate(${off*0.05}deg)`;
    }
  }
}
window.addEventListener('scroll', onScrollFx, {passive:true});
onScrollFx();

/* ============= TWEAKS PANEL ============= */
const tweaksPanel = document.getElementById('tweaks-panel');
const tweaksToggle = document.getElementById('tweaks-toggle');
const closeTweaks = document.getElementById('closeTweaks');
const smoothEase = document.getElementById('smoothEase');
const cursorMode = document.getElementById('cursorMode');

tweaksToggle.addEventListener('click',()=>{
  tweaksPanel.classList.add('open');
  tweaksToggle.style.display='none';
});
closeTweaks.addEventListener('click',()=>{
  tweaksPanel.classList.remove('open');
  tweaksToggle.style.display='block';
});

smoothEase.addEventListener('input',()=>{
  easeAmount = parseFloat(smoothEase.value);
});

cursorMode.addEventListener('change',()=>{
  setCursor(cursorMode.value === 'on');
});

/* ============= BOUNTY FILTER CHIPS ============= */
(function(){
  const chips = document.querySelectorAll('.bounty-chip');
  chips.forEach(chip=>{
    chip.addEventListener('click',()=>{
      chips.forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.f;
      document.querySelectorAll('.bounty-card').forEach(card=>{
        card.style.display = (f === 'all' || card.dataset.co === f) ? '' : 'none';
      });
      if(typeof setBodyHeight === 'function') setTimeout(setBodyHeight, 50);
    });
  });
})();

/* ============= SELF-CONTAINED METABALLS (canvas 2D, no deps) ============= */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heavyOK = !prefersReduced && window.innerWidth > 900;
  const host = document.getElementById('metaballs-host');
  const metaMode = document.getElementById('metaMode');
  let inst = null;

  function start(){
    if(inst || !host || !heavyOK) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W=0, H=0, alive=true, paused=false, rafId=null;
    function resize(){
      W = canvas.width = host.clientWidth || 800;
      H = canvas.height = host.clientHeight || 600;
    }
    resize();
    window.addEventListener('resize', resize);
    const balls = [];
    for(let i=0;i<12;i++){
      balls.push({
        ox: Math.random()*0.8+0.1, oy: Math.random()*0.8+0.1,
        rx: 0.05+Math.random()*0.16, ry: 0.05+Math.random()*0.16,
        s1: 0.2+Math.random()*0.5, s2: 0.2+Math.random()*0.5,
        p1: Math.random()*Math.PI*2, p2: Math.random()*Math.PI*2,
        r: 24+Math.random()*42,
        gold: Math.random() < 0.18
      });
    }
    let mx=0.5, my=0.5, inside=false;
    const sect = host.parentElement;
    function onMove(e){
      const rect = host.getBoundingClientRect();
      mx = (e.clientX-rect.left)/rect.width;
      my = (e.clientY-rect.top)/rect.height;
      inside = true;
    }
    function onLeave(){ inside=false; }
    sect.addEventListener('pointermove', onMove);
    sect.addEventListener('pointerleave', onLeave);
    let cbx=0.5, cby=0.5;
    function tick(t){
      if(!alive) return;
      rafId = requestAnimationFrame(tick);
      if(paused) return;
      const e = t*0.001;
      ctx.clearRect(0,0,W,H);
      ctx.globalCompositeOperation = 'lighter';
      balls.forEach(b=>{
        const x = (b.ox + Math.cos(e*b.s1 + b.p1)*b.rx) * W;
        const y = (b.oy + Math.sin(e*b.s2 + b.p2)*b.ry) * H;
        const g = ctx.createRadialGradient(x,y,0,x,y,b.r*2.2);
        const col = b.gold ? '244,180,49' : '200,16,46';
        g.addColorStop(0, 'rgba('+col+',.75)');
        g.addColorStop(0.5, 'rgba('+col+',.22)');
        g.addColorStop(1, 'rgba('+col+',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x,y,b.r*2.2,0,Math.PI*2);
        ctx.fill();
      });
      // cursor ball (gold)
      const tx = inside ? mx : 0.5 + Math.cos(e*0.3)*0.15;
      const ty = inside ? my : 0.5 + Math.sin(e*0.3)*0.15;
      cbx += (tx-cbx)*0.07; cby += (ty-cby)*0.07;
      const cx = cbx*W, cy = cby*H;
      const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,120);
      cg.addColorStop(0,'rgba(244,180,49,.85)');
      cg.addColorStop(0.5,'rgba(244,180,49,.25)');
      cg.addColorStop(1,'rgba(244,180,49,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx,cy,120,0,Math.PI*2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    rafId = requestAnimationFrame(tick);
    const io = new IntersectionObserver(ens=>{
      ens.forEach(en=>{ paused = !en.isIntersecting; });
    },{threshold:0.01});
    io.observe(sect);
    inst = {
      destroy(){
        alive=false;
        if(rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        sect.removeEventListener('pointermove', onMove);
        sect.removeEventListener('pointerleave', onLeave);
        io.disconnect();
        canvas.remove();
      }
    };
  }
  function stop(){ if(inst){ inst.destroy(); inst=null; } }

  if(heavyOK) start();
  if(metaMode){
    if(!heavyOK){ metaMode.value='off'; metaMode.disabled=true; }
    metaMode.addEventListener('change',()=>{ metaMode.value==='on' ? start() : stop(); });
  }
})();

/* ============= ANIME CINEMATICS ============= */
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.innerWidth > 768;
  document.body.classList.add('js-anim');

  /* ---- Intro cold-open (reusable; replays for Awakened) ---- */
  const intro = document.getElementById('intro-overlay');
  function runIntro(opts){
    opts = opts || {};
    const awaken = !!opts.awaken;
    const dur = opts.dur || 2500;
    if(!intro || reduced) return Promise.resolve();
    return new Promise(resolve=>{
      const seal = intro.querySelector('.intro-seal');
      const ep   = intro.querySelector('.intro-ep');
      const sub  = intro.querySelector('.intro-sub');
      if(awaken){
        intro.classList.add('awaken-intro');
        if(seal) seal.textContent = '覚';
        if(ep)   ep.textContent   = 'Episode 02 · 覚醒編';
        if(sub)  sub.textContent  = 'Awakened Arc — Enter the Dark World';
      }else{
        intro.classList.remove('awaken-intro');
        if(seal) seal.textContent = '魂';
        if(ep)   ep.textContent   = 'Episode 01 · 第一話';
        if(sub)  sub.textContent  = 'Vol. 01 — Origin Story';
      }
      intro.classList.remove('done');
      intro.style.display = 'flex';
      // restart the child CSS animations
      intro.querySelectorAll('.intro-slash,.intro-seal,.intro-ep,.intro-title,.intro-sub,.intro-bar,.intro-bar i,.intro-skip').forEach(el=>{
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
      });
      let dismissed = false;
      function dismiss(){
        if(dismissed) return; dismissed = true;
        intro.removeEventListener('click', dismiss);
        intro.classList.add('done');
        setTimeout(()=>{ intro.style.display = 'none'; resolve(); }, 750);
      }
      intro.addEventListener('click', dismiss);
      setTimeout(dismiss, dur);
    });
  }
  window.runIntro = runIntro;

  if(intro){
    if(reduced){ intro.remove(); }
    else{
      const seen = sessionStorage.getItem('omOriginIntroSeen');
      sessionStorage.setItem('omOriginIntroSeen','1');
      runIntro({ awaken:false, dur: seen ? 900 : 2500 });
    }
  }

  /* ---- Katana slash scene-cut ---- */
  const slashEl = document.getElementById('slash-overlay');
  let slashBusy = false;
  window.playSlash = function(midCb){
    if(reduced || !desktop || !slashEl || slashBusy){ midCb(); return; }
    slashBusy = true;
    slashEl.classList.add('cover');
    setTimeout(()=>{
      midCb();
      slashEl.classList.add('open');
      setTimeout(()=>{
        slashEl.classList.remove('cover','open');
        slashBusy = false;
      }, 420);
    }, 360);
  };

  /* ---- Ambient background: sakura petals (Normal) / glyph rain (Awakened) ---- */
  const fxCanvas = document.getElementById('petals-canvas');
  if(fxCanvas && desktop && !reduced){
    const ctx = fxCanvas.getContext('2d');
    let W=0, H=0, parts=[];
    const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ01ロボ道魂超'.split('');
    const isAwake = ()=>document.body.classList.contains('awakened');
    function resize(){
      W = fxCanvas.width = window.innerWidth;
      H = fxCanvas.height = window.innerHeight;
    }
    function rebuild(){
      parts = [];
      const n = Math.min(70, Math.floor(window.innerWidth/20));
      for(let i=0;i<n;i++){
        parts.push(isAwake() ? {
          x:Math.random()*W, y:Math.random()*H,
          v:2+Math.random()*5,
          g:GLYPHS[Math.floor(Math.random()*GLYPHS.length)],
          s:10+Math.random()*14,
          o:.3+Math.random()*.5
        } : {
          x:Math.random()*W, y:Math.random()*H,
          vx:-.4+Math.random()*.8,
          vy:.4+Math.random()*1,
          r:2.4+Math.random()*4,
          rot:Math.random()*Math.PI*2,
          vr:-.02+Math.random()*.04,
          o:.4+Math.random()*.45,
          gold:Math.random()<.22
        });
      }
    }
    window.rebuildAmbient = rebuild;
    resize(); rebuild();
    window.addEventListener('resize', ()=>{ resize(); rebuild(); });
    function tick(t){
      ctx.clearRect(0,0,W,H);
      if(isAwake()){
        ctx.textBaseline = 'alphabetic';
        parts.forEach(p=>{
          ctx.font = `${p.s}px 'Noto Sans JP', monospace`;
          ctx.fillStyle = Math.random()<.06 ? 'rgba(255,200,61,.85)' : `rgba(255,48,80,${p.o})`;
          ctx.fillText(p.g, p.x, p.y);
          p.y += p.v;
          if(Math.random()<.01) p.g = GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
          if(p.y > H){ p.y = -20; p.x = Math.random()*W; }
        });
      }else{
        parts.forEach(p=>{
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.gold ? `rgba(244,180,49,${p.o})` : `rgba(200,16,46,${p.o})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r*0.55, 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
          p.x += p.vx + Math.sin(p.y*0.002)*0.4;
          p.y += p.vy; p.rot += p.vr;
          if(p.y > H+20){ p.y = -20; p.x = Math.random()*W; }
          if(p.x < -20) p.x = W+10;
          if(p.x > W+20) p.x = -10;
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---- Hero name: cursor-proximity magnify ---- */
  const heroSec = document.getElementById('hero');
  const nameChs = Array.from(document.querySelectorAll('#heroName .ch'));
  if(heroSec && nameChs.length){
    setTimeout(()=>nameChs.forEach(c=>c.classList.add('settled')), 1900);
    if(desktop && !reduced){
      heroSec.addEventListener('mousemove',(e)=>{
        if(!nameChs[0].classList.contains('settled')) return;
        nameChs.forEach(ch=>{
          const r = ch.getBoundingClientRect();
          const d = Math.hypot(e.clientX-(r.left+r.width/2), e.clientY-(r.top+r.height/2));
          const f = Math.max(0, 1 - d/200);
          ch.style.transform = f > 0.01 ? `translateY(${-16*f}px) scale(${1+0.34*f})` : '';
        });
      });
      heroSec.addEventListener('mouseleave',()=>nameChs.forEach(ch=>{ ch.style.transform=''; }));
    }
  }

  /* ---- Ink splat on click ---- */
  if(desktop && !reduced){
    window.addEventListener('mousedown',(e)=>{
      if(e.target.closest('#tweaks-panel, #tweaks-toggle, a, button, select, input')) return;
      const s = document.createElement('div');
      s.className = 'ink-splat';
      s.style.left = e.clientX+'px';
      s.style.top = e.clientY+'px';
      s.style.borderRadius = `${40+Math.random()*25}% ${40+Math.random()*25}% ${40+Math.random()*25}% ${40+Math.random()*25}% / ${40+Math.random()*25}% ${40+Math.random()*25}% ${40+Math.random()*25}% ${40+Math.random()*25}%`;
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 600);
    });
  }

  /* ---- Brush-drawn title underlines ---- */
  const drawObserver = new IntersectionObserver((ens)=>{
    ens.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('drawn');
        drawObserver.unobserve(en.target);
      }
    });
  },{threshold:0.5});
  document.querySelectorAll('.section-title').forEach(t=>drawObserver.observe(t));

  /* ---- Manga page corner ---- */
  const pcNum = document.getElementById('pcNum');
  const pageCorner = document.getElementById('page-corner');
  if(pcNum && pageCorner){
    const labels = { hero:'COVER', origin:'CH.01', powers:'CH.02', chapters:'CH.03', arcs:'CH.04', code:'CH.05', bounty:'BOUNTY', academy:'CH.06', contact:'FIN' };
    const pcio = new IntersectionObserver((ens)=>{
      ens.forEach(en=>{
        if(en.isIntersecting){
          const label = labels[en.target.id];
          if(label && pcNum.textContent !== label){
            pcNum.textContent = label;
            pageCorner.classList.remove('flip');
            void pageCorner.offsetWidth;
            pageCorner.classList.add('flip');
          }
        }
      });
    },{rootMargin:'-45% 0px -45% 0px', threshold:0});
    Object.keys(labels).forEach(id=>{
      const el = document.getElementById(id);
      if(el) pcio.observe(el);
    });
  }

  /* ---- Limit Break easter egg (click the 魂 seal) ---- */
  const seal = document.querySelector('.origin .seal');
  if(seal){
    seal.setAttribute('title','※ Press to break your limits');
    let lbBusy = false;
    seal.addEventListener('click',()=>{
      if(lbBusy || reduced) return;
      lbBusy = true;
      document.body.classList.add('limit-break');
      setTimeout(()=>{
        document.body.classList.remove('limit-break');
        lbBusy = false;
      }, 1400);
    });
  }

  /* ---- Awakened world toggle ---- */
  const worldToggle = document.getElementById('worldToggle');
  if(worldToggle){
    function applyWorld(awake){
      document.body.classList.toggle('awakened', awake);
      worldToggle.textContent = awake ? '通常 NORMAL' : '覚醒 AWAKEN';
      if(window.rebuildAmbient) window.rebuildAmbient();
      if(window.drawRadar) window.drawRadar();
    }
    let awake = false;
    // Always start in Normal mode on every visit; the toggle still switches during the session.
    applyWorld(false);
    worldToggle.addEventListener('click',()=>{
      awake = !awake;
      // Both directions get the cinematic episode card + katana slash; theme flips while covered.
      if(window.runIntro && !reduced){
        runIntro({ awaken:awake, dur:2000 });
        applyWorld(awake);
      }else{
        applyWorld(awake);
      }
    });
  }

  /* ---- Scramble typewriter tagline ---- */
  const tagEl = document.getElementById('heroTagline');
  if(tagEl){
    const LINES = [
      'ROBOTICS & EMBODIED AI APPRENTICE',
      'ロボティクス ＋ 身体性AI',
      'SIM-TO-REAL PIPELINE BUILDER',
      'DESIGN THINKER × NSS COMMANDER',
      '限界を超えろ — PUSH PAST LIMITS'
    ];
    const NOISE = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';
    if(reduced){
      tagEl.textContent = LINES[0];
    }else{
      let li = 0, timer = null;
      function scrambleTo(text){
        let frame = 0;
        const total = Math.max(14, text.length + 6);
        clearInterval(timer);
        timer = setInterval(()=>{
          frame++;
          let out = '';
          for(let i=0;i<text.length;i++){
            const settleAt = (i/text.length)*total*0.7 + 4;
            if(frame >= settleAt) out += text[i];
            else out += text[i] === ' ' ? ' ' : NOISE[Math.floor(Math.random()*NOISE.length)];
          }
          tagEl.textContent = out;
          if(frame >= total){
            clearInterval(timer);
            setTimeout(()=>{ li = (li+1)%LINES.length; scrambleTo(LINES[li]); }, 2600);
          }
        }, 38);
      }
      scrambleTo(LINES[0]);
    }
  }

  /* ---- Holo-tilt Major Arcs cards ---- */
  if(desktop && !reduced){
    document.querySelectorAll('.arc-card').forEach(card=>{
      card.addEventListener('mousemove',(e)=>{
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left)/r.width;
        const py = (e.clientY - r.top)/r.height;
        card.style.setProperty('--mx', (px*100)+'%');
        card.style.setProperty('--my', (py*100)+'%');
        const rx = (py - 0.5) * -9;
        const ry = (px - 0.5) * 11;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
    });
  }

  /* ---- Portrait fallback (auto manga panel if image missing) ---- */
  const portrait = document.querySelector('.portrait-frame img');
  if(portrait){
    portrait.addEventListener('error',()=>{
      const c = document.createElement('canvas');
      c.width = 600; c.height = 800;
      const x = c.getContext('2d');
      x.fillStyle = '#1a1a2e'; x.fillRect(0,0,600,800);
      // speed lines
      x.strokeStyle = 'rgba(245,240,230,.08)';
      for(let i=0;i<40;i++){
        x.beginPath();
        x.moveTo(300,400);
        const a = (i/40)*Math.PI*2;
        x.lineTo(300+Math.cos(a)*700, 400+Math.sin(a)*700);
        x.lineWidth = 1+Math.random()*2;
        x.stroke();
      }
      // abstract hooded figure
      x.fillStyle = '#0a0a0a';
      x.beginPath();
      x.ellipse(300,330,120,140,0,Math.PI,0);
      x.lineTo(430,800); x.lineTo(170,800); x.closePath(); x.fill();
      x.fillStyle = '#c8102e';
      x.font = '900 120px "Noto Sans JP", sans-serif';
      x.textAlign = 'center';
      x.fillText('主', 300, 250);
      x.strokeStyle = '#c8102e'; x.lineWidth = 10;
      x.strokeRect(20,20,560,760);
      portrait.src = c.toDataURL('image/png');
    }, { once:true });
  }
})();

/* ============= STATUS SCREEN RADAR ============= */
(function(){
  const canvas = document.getElementById('radarChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STATS = [
    { label:'SIMULATION', kanji:'模', v:.92 },
    { label:'ROBOTICS', kanji:'機', v:.80 },
    { label:'CODE', kanji:'技', v:.95 },
    { label:'LEADERSHIP', kanji:'導', v:.93 },
    { label:'VISION', kanji:'視', v:.75 },
    { label:'GRIT', kanji:'魂', v:1.0 }
  ];
  let progress = reduced ? 1 : 0;
  let animating = false;

  function colors(){
    const awake = document.body.classList.contains('awakened');
    return {
      grid: awake ? 'rgba(239,231,215,.25)' : 'rgba(245,240,230,.3)',
      gridSoft: awake ? 'rgba(239,231,215,.12)' : 'rgba(245,240,230,.14)',
      fill: awake ? 'rgba(255,48,80,.30)' : 'rgba(200,16,46,.34)',
      stroke: awake ? '#ff3050' : '#c8102e',
      dot: '#f4b431',
      text: awake ? '#efe7d7' : '#f5f0e6'
    };
  }

  function draw(){
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2 + 10;
    const R = Math.min(W,H)*0.32;
    const N = STATS.length;
    const C = colors();
    ctx.clearRect(0,0,W,H);

    function pt(i, r){
      const a = -Math.PI/2 + (i/N)*Math.PI*2;
      return [cx + Math.cos(a)*r, cy + Math.sin(a)*r];
    }
    // grid rings (hand-drawn wobble)
    for(let ring=1; ring<=4; ring++){
      ctx.beginPath();
      for(let i=0;i<=N;i++){
        const wob = 1 + (Math.sin(i*7.3 + ring*2.1)*0.012);
        const [x,y] = pt(i%N, R*(ring/4)*wob);
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring===4 ? C.grid : C.gridSoft;
      ctx.lineWidth = ring===4 ? 3 : 1.5;
      ctx.stroke();
    }
    // spokes
    for(let i=0;i<N;i++){
      const [x,y] = pt(i,R);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y);
      ctx.strokeStyle = C.gridSoft; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // stat polygon
    ctx.beginPath();
    for(let i=0;i<=N;i++){
      const s = STATS[i%N];
      const [x,y] = pt(i%N, R*s.v*progress);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle = C.fill; ctx.fill();
    ctx.strokeStyle = C.stroke; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
    // dots
    for(let i=0;i<N;i++){
      const [x,y] = pt(i, R*STATS[i].v*progress);
      ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2);
      ctx.fillStyle = C.dot; ctx.fill();
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for(let i=0;i<N;i++){
      const [lx,ly] = pt(i, R*1.32);
      ctx.font = '900 44px "Noto Sans JP", sans-serif';
      ctx.fillStyle = C.stroke;
      ctx.fillText(STATS[i].kanji, lx, ly-26);
      ctx.font = '24px Anton, sans-serif';
      ctx.fillStyle = C.text;
      ctx.fillText(STATS[i].label, lx, ly+14);
      ctx.font = '20px Bungee, sans-serif';
      ctx.fillStyle = C.dot;
      ctx.fillText(Math.round(STATS[i].v*100*progress), lx, ly+42);
    }
  }
  window.drawRadar = draw;

  function animateIn(){
    if(animating || progress >= 1) { draw(); return; }
    animating = true;
    const t0 = performance.now();
    function step(t){
      progress = Math.min(1, (t-t0)/1100);
      // ease out cubic
      const p = progress;
      progress = 1 - Math.pow(1-p, 3);
      draw();
      progress = p;
      if(p < 1) requestAnimationFrame(step);
      else { progress = 1; animating = false; draw(); }
    }
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(ens=>{
    ens.forEach(en=>{
      if(en.isIntersecting){
        reduced ? draw() : animateIn();
        io.unobserve(en.target);
      }
    });
  },{threshold:0.3});
  io.observe(canvas);
  draw();
})();
