/* ══════════════════════════════════════════════════
   OUR ORBIT  ·  script.js
   ══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   PERFORMANCE TWEAKS
   Adjust these values to tune the visual & motion.
   ───────────────────────────────────────────────── */
const CFG = {
  /* Particle count — desktop / mobile */
  PARTICLES_DESKTOP: 95,
  PARTICLES_MOBILE:  40,

  /* Bokeh circles behind the orbs */
  BOKEH_COUNT: 10,

  /* Orbital radii (px) — how wide each orb sweeps */
  ORB_A_RADIUS: 130,
  ORB_B_RADIUS: 190,

  /* Orbital speeds (radians per ms) — smaller = slower */
  ORB_A_SPEED:  0.00022,
  ORB_B_SPEED:  0.00013,

  /* Glow reach: larger = bigger aura around each orb */
  ORB_GLOW_MULT: 5.5,

  /* Distance (px) between orbs that triggers shimmer */
  SHIMMER_DIST: 210,

  /* Animation speed multiplier — 0 freezes, 1 = normal */
  ANIM_SCALE: 1.0,

  /* Typewriter character delay (ms) */
  TYPE_SPEED: 26,
};


/* ─────────────────────────────────────────────────
   DETECT REDUCED MOTION
   ───────────────────────────────────────────────── */
const NO_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ══════════════════════════════════════════════════
   1 · CANVAS BACKGROUND ANIMATION
   ══════════════════════════════════════════════════ */
(function initCanvas() {

  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, CX, CY;
  let particles = [];
  let bokeh     = [];

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    CX = W / 2;
    CY = H / 2;
    spawnParticles();
    spawnBokeh();
  }

  /* ── Particle ── */
  class Star {
    constructor(randomY = false) {
      this.init(randomY);
    }

    init(randomY = false) {
      this.x  = Math.random() * W;
      this.y  = randomY ? Math.random() * H : -4;
      this.r  = Math.random() * 1.1 + 0.2;
      this.a  = Math.random() * 0.65 + 0.1;
      this.vx = (Math.random() - 0.5) * 0.12;
      this.vy = Math.random() * 0.07 + 0.015;
      this.tp = Math.random() * Math.PI * 2; /* twinkle phase */
      this.ts = 0.001 + Math.random() * 0.003; /* twinkle speed */
    }

    update() {
      this.x  += this.vx;
      this.y  += this.vy;
      this.tp += this.ts;
      if (this.y > H + 4) this.init(false);
      if (this.x < 0)     this.x = W;
      if (this.x > W)     this.x = 0;
    }

    draw() {
      const alpha = this.a * (0.5 + 0.5 * Math.sin(this.tp));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,215,165,${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  /* ── Bokeh circle ── */
  class BokehCircle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x    = Math.random() * W;
      this.y    = Math.random() * H;
      this.r    = 25 + Math.random() * 90;
      this.a    = 0.015 + Math.random() * 0.04;
      this.vx   = (Math.random() - 0.5) * 0.04;
      this.vy   = (Math.random() - 0.5) * 0.025;
      this.gold = Math.random() > 0.45;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      /* Wrap around edges */
      if (this.x < -this.r) this.x = W + this.r;
      if (this.x > W + this.r) this.x = -this.r;
      if (this.y < -this.r) this.y = H + this.r;
      if (this.y > H + this.r) this.y = -this.r;
    }

    draw() {
      /* Soft circular glow using radial gradient — no filter needed */
      const [r, g, b] = this.gold ? [201, 169, 110] : [212, 131, 143];
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      grad.addColorStop(0, `rgba(${r},${g},${b},${this.a})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  function spawnParticles() {
    const count = W < 768 ? CFG.PARTICLES_MOBILE : CFG.PARTICLES_DESKTOP;
    particles   = Array.from({ length: count }, () => new Star(true));
  }

  function spawnBokeh() {
    bokeh = Array.from({ length: CFG.BOKEH_COUNT }, () => new BokehCircle());
  }

  /* ── Orb state ── */
  const orbA = {
    angle: 0,
    radius: CFG.ORB_A_RADIUS,
    speed:  CFG.ORB_A_SPEED,
    rgb:    [212, 131, 143], /* blush */
    size:   22,
  };
  const orbB = {
    angle:  Math.PI * 0.85,
    radius: CFG.ORB_B_RADIUS,
    speed:  -CFG.ORB_B_SPEED, /* opposite direction */
    rgb:    [201, 169, 110], /* gold */
    size:   18,
  };

  /* ── Slow orbital center drift ── */
  let driftT = 0;

  /* ── Draw background gradient ── */
  function drawBG() {
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.hypot(W, H) * 0.65);
    grad.addColorStop(0,   '#0f1535');
    grad.addColorStop(0.5, '#09102a');
    grad.addColorStop(1,   '#07091b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Draw a single glowing orb ── */
  function drawOrb(x, y, { rgb: [r, g, b], size }) {
    /* Outer radial glow */
    const reach = size * CFG.ORB_GLOW_MULT;
    const glow  = ctx.createRadialGradient(x, y, 0, x, y, reach);
    glow.addColorStop(0,    `rgba(${r},${g},${b},0.55)`);
    glow.addColorStop(0.25, `rgba(${r},${g},${b},0.22)`);
    glow.addColorStop(0.6,  `rgba(${r},${g},${b},0.07)`);
    glow.addColorStop(1,    `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(x, y, reach, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    /* Core sphere */
    const core = ctx.createRadialGradient(
      x - size * 0.28, y - size * 0.28, size * 0.05,
      x, y, size
    );
    core.addColorStop(0, `rgba(255,255,255,0.55)`);
    core.addColorStop(0.35, `rgba(${r},${g},${b},0.95)`);
    core.addColorStop(1,    `rgba(${r},${g},${b},0.8)`);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  }

  /* ── Draw shimmer between orbs when close ── */
  function drawShimmer(ax, ay, bx, by, dist) {
    if (dist > CFG.SHIMMER_DIST) return;
    const alpha = (1 - dist / CFG.SHIMMER_DIST) * 0.14;
    const line  = ctx.createLinearGradient(ax, ay, bx, by);
    line.addColorStop(0,   `rgba(212,131,143,${alpha})`);
    line.addColorStop(0.5, `rgba(255,245,235,${alpha * 1.6})`);
    line.addColorStop(1,   `rgba(201,169,110,${alpha})`);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    /* Draw a wide semi-transparent band between the orbs */
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = line;
    ctx.lineWidth   = 55;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    /* Brighter thin core line */
    ctx.lineWidth   = 6;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
    ctx.restore();
  }

  /* ── Main animation loop ── */
  let lastT = 0;

  function frame(t) {
    const dt  = Math.min(t - lastT, 60); /* cap at 60ms to skip lag spikes */
    lastT = t;
    const sdt = dt * CFG.ANIM_SCALE;

    ctx.clearRect(0, 0, W, H);
    drawBG();

    /* Drift the orbital center in a gentle figure-eight */
    driftT += sdt * 0.00007;
    const ox = CX + Math.cos(driftT * 0.9) * W * 0.055;
    const oy = CY + Math.sin(driftT * 0.5) * H * 0.04;

    /* Advance orb angles */
    orbA.angle += orbA.speed * sdt;
    orbB.angle += orbB.speed * sdt;

    const ax = ox + Math.cos(orbA.angle) * orbA.radius;
    const ay = oy + Math.sin(orbA.angle) * orbA.radius;
    const bx = ox + Math.cos(orbB.angle) * orbB.radius;
    const by = oy + Math.sin(orbB.angle) * orbB.radius;

    /* Bokeh layer (deepest) */
    bokeh.forEach(b => { b.update(); b.draw(); });

    /* Star particles */
    particles.forEach(s => { s.update(); s.draw(); });

    /* Orb shimmer (connection beam) */
    const dist = Math.hypot(bx - ax, by - ay);
    drawShimmer(ax, ay, bx, by, dist);

    /* Orbs */
    drawOrb(ax, ay, orbA);
    drawOrb(bx, by, orbB);

    requestAnimationFrame(frame);
  }

  /* ── Reduced-motion fallback: static render ── */
  function staticRender() {
    drawBG();
    spawnParticles();
    particles.forEach(s => s.draw());
    drawOrb(CX - CFG.ORB_A_RADIUS * 0.75, CY - 35, orbA);
    drawOrb(CX + CFG.ORB_B_RADIUS * 0.65, CY + 45, orbB);
  }

  resize();
  window.addEventListener('resize', () => {
    resize();
    if (NO_MOTION) staticRender(); /* re-render static version on resize */
  });

  if (NO_MOTION) {
    staticRender();
  } else {
    requestAnimationFrame(frame);
  }

})();


/* ══════════════════════════════════════════════════
   2 · LIVE COUNTER
   ══════════════════════════════════════════════════ */
(function initCounter() {

  /*
   * Anniversary counter using Philippine Standard Time (UTC+8)
   * Start date: April 4, 2025 PHT
   */
  const START = new Date('2025-04-04T00:00:00');
  const PHT_OFFSET = 8; // Philippine Standard Time is UTC+8

  const els = {
    years:  document.getElementById('c-years'),
    months: document.getElementById('c-months'),
    days:   document.getElementById('c-days'),
    hours:  document.getElementById('c-hours'),
    mins:   document.getElementById('c-mins'),
  };

  function getPHTime() {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const phtTime = new Date(utcTime + PHT_OFFSET * 3600000);
    return phtTime;
  }

  function compute() {
    const now = getPHTime();
    const start = START;

    let years  = now.getFullYear() - start.getFullYear();
    let months = now.getMonth()     - start.getMonth();
    let days   = now.getDate()      - start.getDate();
    let hours  = now.getHours()     - start.getHours();
    let mins   = now.getMinutes()   - start.getMinutes();

    if (mins   < 0) { mins   += 60; hours--; }
    if (hours  < 0) { hours  += 24; days--;  }
    if (days   < 0) {
      const prev = new Date(now.getFullYear(), now.getMonth(), 0);
      days  += prev.getDate();
      months--;
    }
    if (months < 0) { months += 12; years--; }

    return { years, months, days, hours, mins };
  }

  function render() {
    const v = compute();
    if (els.years)  els.years.textContent  = v.years;
    if (els.months) els.months.textContent = v.months;
    if (els.days)   els.days.textContent   = v.days;
    if (els.hours)  els.hours.textContent  = v.hours;
    if (els.mins)   els.mins.textContent   = String(v.mins).padStart(2, '0');
  }

  render();
  setInterval(render, 1_000); /* refresh every 1 s for live minute updates */

})();


/* ══════════════════════════════════════════════════
   3 · SCROLL REVEAL
   ══════════════════════════════════════════════════ */
(function initReveal() {

  if (NO_MOTION) return; /* already visible via CSS */

  const items = document.querySelectorAll('.sr, .sr-left, .sr-right');
  const ROOT_MARGIN = '0px 0px -70px 0px';

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseFloat(el.dataset.delay || '0') * 1000;
      setTimeout(() => el.classList.add('visible'), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: ROOT_MARGIN });

  items.forEach(el => io.observe(el));

})();


/* ══════════════════════════════════════════════════
   4 · DOT-NAV ACTIVE STATE
   ══════════════════════════════════════════════════ */
(function initDotNav() {

  const sections = document.querySelectorAll('section[id]');
  const dots     = document.querySelectorAll('.dot[data-sec]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      dots.forEach(d => d.classList.toggle('active', d.dataset.sec === id));
    });
  }, { threshold: 0.45 });

  sections.forEach(s => io.observe(s));

})();


/* ══════════════════════════════════════════════════
   5 · TYPEWRITER LETTER
   ══════════════════════════════════════════════════ */
(function initTypewriter() {

  /*
   * ✏️  REPLACE the text inside the backticks with your actual letter.
   *     Use blank lines to separate paragraphs.
   *     Tip: write it plainly, the italic font does the romance.
   */
  const LETTER = `I just want to start with the part of being thankful lovey. I just want to be thankful for you being the woman that can stand up for me when I can't na, the one who gives as well, the one who takes care of me, the one who puts me in place, the one who is always worried about me, the one who ignores social media standards because she does not need to base on that because she is happy in her own ways with what I do. Thank you lovey for being the kind of woman that I was longing for, I'm just so thankful that we have crossed paths and we are together. Thank you lovey for forgiving me for those times that I was not a good person and you let me bawi and let me prove that I can be better for you. Thank you for the times that you libre me or we just hati because my budget is tight and I cannot libre you. Thank you for all the times lovey that we had so much fun. Overall is that I'm so thankful for being the person that I can do anything with and you helped me gain experience those fun times with you. Thank you lovey for being the woman that I am going to love until the future.

As days go by ay I just fall in love with you more and more lovey at legit na talaga yun kasi lovey kung alam mo lang talaga kung gaano ako kalala and ka downbad ay mapapaisip ka talaga na I have gone so far from that. Ngayon ay I just want you and you only lovey, especially that now ay papadating na tayo sa important part of our college life which is graduation and I'm glad that we had enough experiences na like matagal na tayo tas ganto na ang tingin natin sa isa't isa tas maeexperience natin ang important part of our lives while being together and having that kind of view on our relationship.

Kahit naman may thankful and sweet message ay I still have to include my sorries when it comes to our relationship because even though in your POV ay I was a sweet and loving man ay I still have my bad days where I was a bad and hindi nakakatuwa na boyfriend. I'm sorry lovey for those days that I was not feeling myself and had different actions that may confuse you. I'm sorry din lovey for the days that I was lacking and did not make you feel like a woman. I'm sorry din lovey for the days that even though ay mali ako ay pinag lalaban ko pa din, yung mga iba't ibang days na ganun ako ay I'm sorry about that lovey and I will do better. I will become a better man for you loveyy.

Lastly, just future talks since I talked about different stuffs na. I just hope in the future lovey ay we will be better since we experienced all these things na and you would be better in controlling your emotions. I would also work on the part in how to control my pikon because that is the worst part about me. I just want us to have a more peaceful life with less worries and bawi to our parents who worked so hard to place us in this type of setting in our life. I have a plan, I'm just naguguluhan palang at I don't have the full context about life and how it goes, I just have the broad view about it but since it is life, you don't get the full context or full story until you experience it. This goes for our relationship din, we don't have full context or we don't have the full view in what will happen in the future, we just have to experience it okay baby?

To more experiences, dates, adventures, kupalanch, cuddles, sex :D, asaran, loving with you my lovey!`;

  const container = document.getElementById('letter-text');
  const cursor    = document.getElementById('letter-cursor');
  if (!container) return;

  let started = false;

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      io.disconnect();
      /* Small pause before typing starts */
      setTimeout(() => type(LETTER, container, cursor), 600);
    }
  }, { threshold: 0.35 });

  const section = document.getElementById('letter');
  if (section) io.observe(section);

  function type(text, el, cursorEl) {
    /* Split by double or single newlines into paragraphs */
    const paragraphs = text
      .split(/\n\n|\n/)
      .map(p => p.trim())
      .filter(Boolean);

    if (cursorEl) cursorEl.classList.add('active');

    let pIndex = 0;

    function nextParagraph() {
      if (pIndex >= paragraphs.length) {
        if (cursorEl) cursorEl.classList.remove('active');
        return;
      }

      const p    = document.createElement('p');
      el.appendChild(p);

      /* Add inline cursor to current paragraph */
      const inlineCursor = document.createElement('span');
      inlineCursor.className = 'tw-cursor';
      inlineCursor.setAttribute('aria-hidden', 'true');
      p.appendChild(inlineCursor);

      let charIndex = 0;
      const chars   = paragraphs[pIndex].split('');

      const interval = setInterval(() => {
        if (charIndex < chars.length) {
          p.insertBefore(document.createTextNode(chars[charIndex]), inlineCursor);
          charIndex++;
        } else {
          clearInterval(interval);
          inlineCursor.remove();
          pIndex++;
          setTimeout(nextParagraph, 320);
        }
      }, NO_MOTION ? 0 : CFG.TYPE_SPEED);
    }

    nextParagraph();
  }

})();


/* ══════════════════════════════════════════════════
   6 · AUDIO PLAYER
   ══════════════════════════════════════════════════ */
(function initPlayer() {

  const btn         = document.getElementById('play-btn');
  const rewBtn      = document.getElementById('rew-btn');
  const fwdBtn      = document.getElementById('fwd-btn');
  const seekBar     = document.getElementById('seek-bar');
  const currentEl   = document.getElementById('time-current');
  const totalEl     = document.getElementById('time-total');
  const audio       = document.getElementById('audio');
  const orb         = document.getElementById('player-orb');
  const wave        = document.getElementById('waveform');

  if (!btn || !audio || !seekBar || !currentEl || !totalEl) return;

  const STORAGE_KEY = 'our-orbit-audio-state';
  const saved       = loadState();

  /* Build decorative waveform bars */
  const BAR_N = 30;
  if (wave) {
    for (let i = 0; i < BAR_N; i++) {
      const bar = document.createElement('span');
      bar.className = 'wave-bar';
      bar.style.setProperty('--i', i);
      bar.style.setProperty('--h', (0.25 + Math.random() * 0.75).toFixed(3));
      wave.appendChild(bar);
    }
  }

  let playing = false;
  let saveTick = 0;
  let userSeeking = false;

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function setSeekProgress(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    seekBar.value = clamped;
    seekBar.style.setProperty('--seek', `${clamped}%`);
  }

  function updateTimelineUI(currentTime = 0) {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    currentEl.textContent = formatTime(currentTime);
    totalEl.textContent   = formatTime(duration);
    if (duration > 0) {
      setSeekProgress((currentTime / duration) * 100);
    } else {
      setSeekProgress(0);
    }
  }

  function setPlaying(state) {
    playing = state;
    btn.setAttribute('aria-pressed', state);
    btn.querySelector('.ico-play').hidden  = state;
    btn.querySelector('.ico-pause').hidden = !state;
    orb && orb.classList.toggle('pulsing', state);
    wave && wave.classList.toggle('active', state);
    saveState();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { playing: false, currentTime: 0 };
      const parsed = JSON.parse(raw);
      return {
        playing: Boolean(parsed.playing),
        currentTime: Number.isFinite(parsed.currentTime) ? parsed.currentTime : 0,
      };
    } catch {
      return { playing: false, currentTime: 0 };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        playing,
        currentTime: audio.currentTime || 0,
      }));
    } catch {
      /* Ignore storage errors (private mode / blocked storage). */
    }
  }

  function startPlayback() {
    return audio.play()
      .then(() => {
        setPlaying(true);
      })
      .catch(() => {
        /* Autoplay with sound may be blocked until user interaction. */
        setPlaying(false);
      });
  }

  audio.addEventListener('loadedmetadata', () => {
    if (saved.currentTime > 0 && saved.currentTime < audio.duration) {
      audio.currentTime = saved.currentTime;
    }
    updateTimelineUI(audio.currentTime || 0);
  });

  /* Attempt autoplay on load (browser may block this). */
  startPlayback();

  /* Retry once user interacts anywhere on the page. */
  const tryInteractionPlay = () => {
    if (!playing) startPlayback();
  };

  window.addEventListener('pointerdown', tryInteractionPlay, { once: true });
  window.addEventListener('keydown', tryInteractionPlay, { once: true });

  btn.addEventListener('click', () => {
    if (audio.paused) {
      startPlayback();
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  rewBtn && rewBtn.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    updateTimelineUI(audio.currentTime);
    saveState();
  });

  fwdBtn && fwdBtn.addEventListener('click', () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : Infinity;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
    updateTimelineUI(audio.currentTime);
    saveState();
  });

  seekBar.addEventListener('input', () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    userSeeking = true;
    if (duration <= 0) return;
    const nextTime = (Number(seekBar.value) / 100) * duration;
    currentEl.textContent = formatTime(nextTime);
    seekBar.style.setProperty('--seek', `${seekBar.value}%`);
  });

  seekBar.addEventListener('change', () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (duration > 0) {
      audio.currentTime = (Number(seekBar.value) / 100) * duration;
    }
    userSeeking = false;
    updateTimelineUI(audio.currentTime);
    saveState();
  });

  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => setPlaying(false));
  audio.addEventListener('timeupdate', () => {
    if (!userSeeking) updateTimelineUI(audio.currentTime);
    saveTick++;
    if (saveTick % 15 === 0) saveState();
  });

  window.addEventListener('beforeunload', saveState);

  /* Keyboard shortcut: Space or Enter to toggle (when focused) */
  btn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      btn.click();
    }
  });

})();


/* ══════════════════════════════════════════════════
   7 · REASONS — CARD STACK
   ══════════════════════════════════════════════════ */
(function initCards() {

  /*
   * ✏️  REPLACE these with your own reasons.
   *     Add or remove entries as you like.
   */
  const REASONS = [
    'The way your laugh arrives before the joke even ends — it lights up everything.',
    'How you turn the most ordinary Tuesday into something worth remembering.',
    'The sound of your voice when you\'re half-asleep, soft and completely yourself.',
    'How deeply you love the people lucky enough to be in your life.',
    'The way you hold my hand like it\'s the most natural thing in the world.',
    'Every adventure you\'ve made me brave enough to say yes to.',
    'The stillness we share when words aren\'t needed at all.',
    'Simply — you. All of you, always. Without condition or end.',
  ];

  const stage    = document.getElementById('card-stage');
  const nextBtn  = document.getElementById('next-btn');
  const nextLbl  = document.getElementById('next-label');
  const counterEl= document.getElementById('card-counter');

  if (!stage) return;

  let current = 0;
  const STACK  = 3; /* visible cards at once */

  function updateCounter() {
    if (counterEl) {
      counterEl.textContent = `${current + 1} of ${REASONS.length}`;
    }
  }

  function buildStack() {
    stage.innerHTML = '';
    const visible = Math.min(STACK, REASONS.length - current);

    for (let i = visible - 1; i >= 0; i--) {
      const idx  = current + i;
      if (idx >= REASONS.length) continue;

      const card = document.createElement('div');
      card.className = 'love-card';
      card.style.setProperty('--offset', i);
      card.setAttribute('aria-label', `Reason ${idx + 1} of ${REASONS.length}`);

      const num  = document.createElement('span');
      num.className = 'card-num';
      num.textContent = String(idx + 1).padStart(2, '0');
      num.setAttribute('aria-hidden', 'true');

      const text = document.createElement('p');
      text.className = 'card-text';
      text.textContent = REASONS[idx];

      card.append(num, text);
      stage.appendChild(card);
    }

    updateCounter();

    const done = current >= REASONS.length - 1;
    if (nextBtn) nextBtn.disabled = done;
    if (nextLbl) {
      nextLbl.textContent = done
        ? '✦  That\'s all of them'
        : 'Next Reason';
    }
  }

  buildStack();

  nextBtn && nextBtn.addEventListener('click', () => {
    if (current >= REASONS.length - 1) return;

    /* Animate the topmost card (last child = z-index top) out */
    const top = stage.querySelector('.love-card:last-child');
    if (!top) return;

    top.classList.add('exit');
    setTimeout(() => {
      current++;
      buildStack();
    }, 440);
  });

})();


/* ══════════════════════════════════════════════════
   8 · MAGNETIC BUTTON EFFECT
   ══════════════════════════════════════════════════ */
(function initMagnetic() {

  if (NO_MOTION) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r  = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width  / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      el.style.transform    = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
      el.style.transition   = 'transform 0.15s ease';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform  = '';
      el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
    });
  });

})();


/* ══════════════════════════════════════════════════
   9 · REPLAY BUTTON — SMOOTH SCROLL TO TOP
   ══════════════════════════════════════════════════ */
document.getElementById('replay-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: NO_MOTION ? 'instant' : 'smooth' });
});


/* ══════════════════════════════════════════════════
   10 · BROKEN IMAGE FALLBACK (photo placeholders)
   ══════════════════════════════════════════════════ */
document.querySelectorAll('.pol-frame img').forEach((img, i) => {
  img.addEventListener('error', () => {
    img.style.display = 'none';
    const frame = img.parentElement;
    frame.classList.add('no-photo');
    frame.setAttribute('data-n', i + 1);
  });
  /* Trigger check if src is literally the placeholder token */
  if (img.src.endsWith('/PHOTO_' + (i + 1)) || img.getAttribute('src') === 'PHOTO_' + (i + 1)) {
    img.dispatchEvent(new Event('error'));
  }
});
