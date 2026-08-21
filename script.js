// ================= CUSTOMIZE YOUR BIRTHDAY WEBSITE =================
// Everything you'll want to change lives in this block.
// Replace file paths by dropping your own files into the matching
// assets/ folder with the SAME filename, or change the filename here.

const CUSTOM = {

  // ---- his name & nicknames (edit these — used throughout the site) ----
  hisName: "Sumukh",                 // shown small on the "distance" scene
  nicknameMain: "Sumukhiiii",        // used in the terminal welcome + final scene
  nicknameAlt: "Sumukhiyaaa 👻❤️",   // used sparingly, e.g. little-things list
  nickname: "Sumukhiiii",            // kept for backwards-compat with existing code below

  // ---- SCENE 02 — childhood ----
  childhoodPhoto: "assets/photos/childhood.jpg",
  childhoodCaption: "you were already out there, being exactly this kind of wonderful.",

  // ---- SCENE 03 — current photos ----
  // Add as many as you like. "src" is the file path, "caption" is your note.
  photos: [
    { src: "assets/photos/him-01.jpg", caption: "this smile. every time." },
    { src: "assets/photos/him-02.jpg", caption: "you have no idea how often I look at this one." },
    { src: "assets/photos/him-03.jpg", caption: "little things, big feelings." },
  ],

  // ---- SCENE 04 — his artwork ----
  drawing: "assets/art/his-drawing-01.jpg",
  artMessage: "I could watch you make things forever.",

  // ---- SCENE 05 — distance ----
  distanceMessage: "Yes, we're far apart. But somehow, you're still close.",

  // ---- SCENE 06 — our drawing (the emotional centerpiece) ----
  ourDrawing: "assets/art/our-drawing.jpg",
  oursMessage: "A little version of us that distance can't keep apart.",

  // ---- SCENE 07 — little things (interactive constellation) ----
  // Add / remove / edit as many as you like — the stars are generated from this list.
  littleThings: [
    "the way you say goodnight, every single time.",
    "you send me pictures of things you know I'd like.",
    "your laugh when you're trying not to laugh.",
    "how you remember tiny things I mentioned once.",
    "the voice notes I replay more than I'll admit.",
    "you always ask if I've eaten.",
    "the way you talk about the things you love.",
    "you make ordinary days feel like something.",
  ],

  // ---- SCENE 09 — the letter ----
  // Write your real letter here. Line breaks are kept exactly as typed.
  letterText: `Happy birthday.

I don't think I could ever fit everything I feel about you
onto one page — but I wanted to try anyway.

[ Replace this whole block with your real letter. ]

— me`,

  // ---- FINAL SCENE ----
  finalHeadline: "Happy Birthday, Sumukhiiii.",
  finalHiddenMessage: "Every star up there, and I still think you're the best thing I've ever found.",

  // ---- MUSIC ----
  // Drop your song into assets/music/ and name it "song.mp3", or change
  // the src on the <audio id="bg-audio"> tag in index.html to match your filename.


  // ---- TERMINAL OPENING (the little "birthday_system.py" intro) ----
  // This runs before the film starts. Nothing here is a real check —
  // whatever he types, the sequence continues the same way.
  // Timing is in milliseconds. Keep it slow; that's the point.
  terminal: {
    // how fast each character types out
    charSpeed: 34,
    // pause AFTER a line finishes, before the next one starts
    linePause: 850,
    // extra pause before the whole terminal fades into the starfield
    finalPause: 1600,

    // the sequence shown after he presses enter on his name.
    // "" (empty string) renders as a quiet "..." beat.
    sequence: [
      "Checking...",
      "...",
      "...",
      "Searching...",
      "...",
      "Found you.",
      "",
      "Loading...",
      "...",
      "...",
      "Almost there.",
    ],

    // the very last line — {nickname} is replaced automatically
    welcomeLine: "Welcome, {nickname}.",
  },
};

// ================= END CUSTOMIZE SECTION =================


(function(){
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- apply CUSTOM content into the DOM ---------------- */
  function applyContent(){
    document.querySelectorAll('[data-editable="childhood-caption"]').forEach(el => el.textContent = CUSTOM.childhoodCaption);
    document.querySelectorAll('[data-editable="art-message"]').forEach(el => el.textContent = CUSTOM.artMessage);
    document.querySelectorAll('[data-editable="distance-message"]').forEach(el => el.textContent = CUSTOM.distanceMessage);
    document.querySelectorAll('[data-editable="his-name-short"]').forEach(el => el.textContent = CUSTOM.hisName);
    document.querySelectorAll('[data-editable="ours-message"]').forEach(el => el.textContent = CUSTOM.oursMessage);
    document.querySelectorAll('[data-editable="letter-body"]').forEach(el => el.textContent = CUSTOM.letterText);
    document.querySelectorAll('[data-editable="final-name"]').forEach(el => el.textContent = CUSTOM.finalHeadline);
    document.querySelectorAll('[data-editable="hidden-message"]').forEach(el => el.textContent = CUSTOM.finalHiddenMessage);

    const childhoodImg = document.querySelector(".scene-childhood .film-photo img");
    if(childhoodImg) childhoodImg.src = CUSTOM.childhoodPhoto;

    const artImg = document.querySelector(".orbit-planet");
    if(artImg) artImg.src = CUSTOM.drawing;

    const ourImg = document.querySelector(".scene-ours .film-photo img");
    if(ourImg) ourImg.src = CUSTOM.ourDrawing;
  }

  /* ---------------- drift gallery (scene 03) ---------------- */
  function buildGallery(){
    const gallery = document.getElementById("drift-gallery");
    if(!gallery) return;
    CUSTOM.photos.forEach(p => {
      const fig = document.createElement("figure");
      fig.className = "drift-card";
      const img = document.createElement("img");
      img.src = p.src; img.loading = "lazy"; img.alt = "";
      const cap = document.createElement("figcaption");
      cap.textContent = p.caption;
      fig.appendChild(img); fig.appendChild(cap);
      gallery.appendChild(fig);
    });
  }

  /* ---------------- constellation of little things (scene 07) ---------------- */
  function buildConstellation(){
    const field = document.getElementById("constellation-field");
    if(!field) return;
    const card = document.getElementById("star-message-card");
    const text = document.getElementById("star-message-text");
    const closeBtn = document.getElementById("close-star-card");

    // deterministic-ish scattered positions
    const positions = [
      [10,20],[28,55],[46,15],[63,60],[80,25],[15,78],[55,85],[90,70],
      [35,35],[70,40],[5,50],[95,45]
    ];

    CUSTOM.littleThings.forEach((msg, i) => {
      const pos = positions[i % positions.length];
      const btn = document.createElement("button");
      btn.className = "const-star";
      btn.style.left = pos[0] + "%";
      btn.style.top = pos[1] + "%";
      btn.setAttribute("aria-label", "Reveal a little thing");
      btn.addEventListener("click", () => {
        text.textContent = msg;
        card.hidden = false;
      });
      field.appendChild(btn);
    });

    if(closeBtn){
      closeBtn.addEventListener("click", () => { card.hidden = true; });
    }
  }

  /* ---------------- scroll reveal ---------------- */
  function setupReveal(){
    const revealEls = document.querySelectorAll(".reveal");
    if(prefersReducedMotion || !("IntersectionObserver" in window)){
      revealEls.forEach(el => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
        }
      });
    }, { threshold: 0.35 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------------- shooting star trigger (scene 01) ---------------- */
  function setupShootingStar(){
    const scene = document.querySelector(".scene-universe");
    const star = document.querySelector(".shooting-star");
    if(!scene || !star || prefersReducedMotion) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          star.classList.add("fire");
        } else {
          star.classList.remove("fire");
        }
      });
    }, { threshold: 0.5 });
    io.observe(scene);
  }

  /* ---------------- star canvases (lightweight, per-scene) ---------------- */
  function createStarCanvas(canvas, opts){
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let stars = [];
    let raf = null;
    const density = (opts && opts.density) || 0.00025;

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const count = Math.min(140, Math.floor(rect.width * rect.height * density));
      stars = Array.from({length: count}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.005
      }));
    }

    function draw(){
      ctx.clearRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = "#efe7d6";
      stars.forEach(s => {
        s.tw += s.speed;
        const alpha = 0.35 + Math.abs(Math.sin(s.tw)) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if(!prefersReducedMotion){
        raf = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();
    window.addEventListener("resize", debounce(resize, 200));
  }

  function debounce(fn, wait){
    let t;
    return function(...args){
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this,args), wait);
    };
  }

  function setupAllCanvases(){
    document.querySelectorAll(".star-canvas").forEach(c => {
      createStarCanvas(c, { density: 0.00022 });
    });
  }

  /* ---------------- final scene: gathering stars ---------------- */
  function setupFinalCanvas(){
    const canvas = document.getElementById("final-canvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let started = false;

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width; canvas.height = rect.height;
    }
    resize();
    window.addEventListener("resize", debounce(resize, 200));

    function makeParticles(){
      const cx = canvas.width/2, cy = canvas.height/2;
      const n = 70;
      return Array.from({length:n}, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.max(canvas.width, canvas.height) * 0.6;
        // target forms a loose heart-ish cluster near center
        const t = Math.random() * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
        const scale = Math.min(canvas.width, canvas.height) / 60;
        return {
          x: cx + Math.cos(angle)*dist,
          y: cy + Math.sin(angle)*dist,
          tx: cx + hx*scale,
          ty: cy + hy*scale,
          r: Math.random()*1.3 + 0.4
        };
      });
    }

    let particles = [];
    function animate(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#efe7d6";
      let allArrived = true;
      particles.forEach(p => {
        p.x += (p.tx - p.x) * 0.02;
        p.y += (p.ty - p.y) * 0.02;
        if(Math.abs(p.tx-p.x) > 1 || Math.abs(p.ty-p.y) > 1) allArrived = false;
        ctx.beginPath();
        ctx.globalAlpha = 0.85;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if(!allArrived && !prefersReducedMotion){
        requestAnimationFrame(animate);
      }
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting && !started){
          started = true;
          particles = makeParticles();
          if(prefersReducedMotion){
            particles.forEach(p => { p.x = p.tx; p.y = p.ty; });
            ctx.fillStyle = "#efe7d6";
            particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
          } else {
            animate();
          }
        }
      });
    }, { threshold: 0.4 });
    io.observe(document.querySelector(".scene-final"));
  }

  /* ---------------- music player ---------------- */
  function setupMusicPlayer(){
    const audio = document.getElementById("bg-audio");
    const toggleBtn = document.getElementById("toggle-play");
    const icon = document.getElementById("play-pause-icon");
    const progress = document.getElementById("progress-bar");
    const volumeBtn = document.getElementById("volume-toggle");
    const volumeBar = document.getElementById("volume-bar");
    const player = document.getElementById("music-player");
    if(!audio) return;

    audio.volume = 0.7;

    function play(){
      audio.play().catch(() => { /* file may be missing — fail silently */ });
      icon.textContent = "❚❚";
      player.classList.remove("paused");
    }
    function pause(){
      audio.pause();
      icon.textContent = "▶";
      player.classList.add("paused");
    }

    toggleBtn && toggleBtn.addEventListener("click", () => {
      if(audio.paused) play(); else pause();
    });

    audio.addEventListener("timeupdate", () => {
      if(audio.duration){
        progress.value = (audio.currentTime / audio.duration) * 100;
      }
    });
    progress && progress.addEventListener("input", () => {
      if(audio.duration){
        audio.currentTime = (progress.value/100) * audio.duration;
      }
    });

    let lastVolume = 0.7;
    volumeBtn && volumeBtn.addEventListener("click", () => {
      if(audio.volume > 0){
        lastVolume = audio.volume;
        audio.volume = 0;
        volumeBar.value = 0;
        volumeBtn.textContent = "🔇";
      } else {
        audio.volume = lastVolume;
        volumeBar.value = lastVolume * 100;
        volumeBtn.textContent = "🔊";
      }
    });
    volumeBar && volumeBar.addEventListener("input", () => {
      audio.volume = volumeBar.value / 100;
      volumeBtn.textContent = audio.volume === 0 ? "🔇" : "🔊";
    });

    return { play, pause };
  }

  /* ---------------- terminal gate (Python-inspired opening) ---------------- */
  function setupTerminal(){
    const gate = document.getElementById("terminal-gate");
    const body = document.getElementById("terminal-body");
    const inputRow = document.getElementById("term-input-row");
    const input = document.getElementById("term-name-input");
    if(!gate || !body || !input || !inputRow) return;

    // star-canvas-terminal is sized by the generic setupAllCanvases() pass,
    // since this section is visible from the very start of the page.
    input.focus({ preventScroll: true });

    function wait(ms){
      return new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? Math.min(ms, 150) : ms));
    }

    function addLine(text, opts){
      const p = document.createElement("p");
      p.className = "term-line" + (opts && opts.dim ? " dim" : "");
      body.appendChild(p);
      return p;
    }

    async function typeInto(el, text){
      if(prefersReducedMotion || !text){
        el.textContent = text;
        return;
      }
      for(let i = 0; i < text.length; i++){
        el.textContent += text[i];
        await wait(CUSTOM.terminal.charSpeed);
      }
    }

    async function runSequence(typedName){
      const cfg = CUSTOM.terminal;

      // echo what he typed, then remove the live input row
      const echo = addLine("> " + (typedName || ""));
      inputRow.remove();

      await wait(cfg.linePause * 0.6);

      for(const line of cfg.sequence){
        const el = addLine(line === "" ? "..." : line, { dim: line === "" || line === "..." });
        await typeInto(el, line === "" ? "..." : line);
        await wait(cfg.linePause);
      }

      const nickname = CUSTOM.nicknameMain || CUSTOM.nickname || "you";
      const welcomeEl = addLine("");
      welcomeEl.classList.remove("dim");
      const welcomeText = cfg.welcomeLine.replace("{nickname}", nickname);
      await typeInto(welcomeEl, welcomeText);

      await wait(cfg.finalPause);

      gate.classList.add("fading-out");
      await wait(1450);
      gate.hidden = true;

      const opening = document.getElementById("opening");
      opening.hidden = false;
      opening.style.opacity = "0";
      requestAnimationFrame(() => {
        opening.style.transition = "opacity 1.2s ease";
        opening.style.opacity = "1";
      });
      setupAllCanvases(); // opening canvas now has real dimensions
    }

    function submit(){
      const name = input.value.trim();
      input.disabled = true;
      runSequence(name);
    }

    let submitted = false;
    inputRow.addEventListener("submit", (e) => {
      e.preventDefault();
      if(submitted) return; // guard against double taps / double-fires
      submitted = true;
      submit();
    });
  }

  /* ---------------- opening: play the film ---------------- */
  function setupOpening(musicControls){
    // Note: the opening canvas is (re)initialized once it becomes visible —
    // see setupAllCanvases() called at the end of the terminal sequence —
    // since a hidden element has no real width/height to size a canvas to.
    const playButton = document.getElementById("play-button");
    const opening = document.getElementById("opening");
    const film = document.getElementById("film");

    playButton.addEventListener("click", () => {
      if(musicControls) musicControls.play();
      opening.style.transition = "opacity 0.9s ease";
      opening.style.opacity = "0";
      setTimeout(() => {
        opening.hidden = true;
        film.hidden = false;
        setupReveal(); // re-scan now that film content exists in layout flow
        window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      }, 850);
    }, { once: true });
  }

  /* ---------------- one more thing (final scene) ---------------- */
  function setupOneMoreThing(){
    const btn = document.getElementById("one-more-thing");
    const msg = document.getElementById("hidden-message");
    if(!btn) return;
    btn.addEventListener("click", () => {
      msg.hidden = false;
      btn.style.display = "none";
    }, { once: true });
  }

  /* ---------------- init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyContent();
    buildGallery();
    buildConstellation();
    setupOneMoreThing();
    setupShootingStar();

    const musicControls = setupMusicPlayer();
    setupTerminal();
    setupOpening(musicControls);
    setupFinalCanvas();

    // canvases inside #film are set up once it becomes visible,
    // but since they're already in the DOM (just hidden), sizing them now
    // is fine — getBoundingClientRect will just reflect 0 until unhidden.
    // We re-run sizing on the first paint after "hidden" is removed too.
    setupAllCanvases();
    setupReveal();

    // safety net: if #film becomes visible later, re-measure canvases
    const filmEl = document.getElementById("film");
    const mo = new MutationObserver(() => setupAllCanvases());
    mo.observe(filmEl, { attributes:true, attributeFilter:["hidden"] });
  });

})();
