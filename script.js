/* ═══════════════════════════════════════════════════
   LETTER GIFT — script.js
═══════════════════════════════════════════════════ */

/* ── State ── */
let step = 'idle'; // idle → seal_clicked → letter_visible → letter_pulled → typing → done → finale

/* ── Elements ── */
const introScreen   = document.getElementById('intro');
const letterScreen  = document.getElementById('letter-screen');
const finaleScreen  = document.getElementById('finale');
const envFlap       = document.getElementById('env-flap');
const waxSeal       = document.getElementById('wax-seal');
const letterPeek    = document.getElementById('letter-peek');
const pullHint      = document.getElementById('pull-hint');
const letterSheet   = document.getElementById('letter-sheet');
const typedText     = document.getElementById('typed-text');
const cursorEl      = document.getElementById('cursor');
const letterFooter  = document.getElementById('letter-footer');
const returnBtn     = document.getElementById('return-btn');
const roseContainer = document.getElementById('rose-container');
const loveMessage   = document.getElementById('love-message');
const sparkleRing   = document.getElementById('sparkle-ring');
const petalParts    = document.getElementById('petal-particles');
const bgMusic       = document.getElementById('bg-music');
const soundBtn      = document.getElementById('sound-btn');

/* ── Letter text ── */
const LETTER = `Ich bin nicht besonders gut darin, schöne Worte zu finden, aber ich möchte, dass du weißt, wie wichtig du mir bist.

Du unterstützt mich immer, selbst wenn ich Fehler mache, und wendest dich nicht von mir ab.

Das bedeutet mir wirklich sehr viel, auch wenn ich es nicht immer zeigen kann.

Bitte vergiss nicht, wie dankbar ich dir dafür bin.`;

/* ════════════════════════════════════════
   PARTICLE CANVAS — starfield background
════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.4 + 0.05,
      phase: Math.random() * Math.PI * 2
    });
  }

  let t = 0;
  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.008;
    stars.forEach(s => {
      const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,208,240,${a})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();
})();

/* ════════════════════════════════════════
   SOUND SYSTEM
════════════════════════════════════════ */
// Tiny Web Audio tones for interactions
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;

function getAudioCtx() {
  if (!actx) actx = new AudioCtx();
  return actx;
}

function playTone(freq, type = 'sine', duration = 0.18, gain = 0.12) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function playSealClick() {
  playTone(320, 'sine', 0.12, 0.08);
  setTimeout(() => playTone(440, 'sine', 0.15, 0.06), 80);
  setTimeout(() => playTone(560, 'triangle', 0.2, 0.04), 160);
}

function playEnvelopeOpen() {
  // Paper/crinkle: quick noise burst via multiple tones
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      playTone(200 + Math.random() * 400, 'sawtooth', 0.06, 0.03);
    }, i * 35);
  }
}

function playLetterRustle() {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      playTone(300 + Math.random() * 500, 'sawtooth', 0.05, 0.025);
    }, i * 25);
  }
}

function playTypeKey() {
  playTone(600 + Math.random() * 200, 'square', 0.04, 0.015);
}

function playChime() {
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.5, 0.07), i * 180);
  });
}

function playFinaleSound() {
  const melody = [261, 330, 392, 523, 659, 784, 1047];
  melody.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.7, 0.09), i * 120);
  });
}

/* ── Music toggle ── */
let musicOn = false;

soundBtn.addEventListener('click', () => {
  getAudioCtx(); // unlock
  if (!musicOn) {
    bgMusic.play().catch(() => {});
    musicOn = true;
    soundBtn.classList.remove('muted');
    soundBtn.textContent = '♪';
  } else {
    bgMusic.pause();
    musicOn = false;
    soundBtn.classList.add('muted');
    soundBtn.textContent = '♩';
  }
});

/* ════════════════════════════════════════
   STEP 1 — SEAL CLICK → OPEN ENVELOPE
════════════════════════════════════════ */
waxSeal.addEventListener('click', openEnvelope);
// Also allow clicking envelope body to trigger
document.getElementById('envelope').addEventListener('click', function(e) {
  if (step === 'idle') openEnvelope();
  if (step === 'letter_visible') pullLetter();
});

function openEnvelope() {
  if (step !== 'idle') return;
  step = 'seal_clicked';

  // Unlock audio ctx on first interaction
  getAudioCtx();
  playSealClick();

  // Seal disappears
  waxSeal.classList.add('hidden');

  // Slight delay then open flap
  setTimeout(() => {
    playEnvelopeOpen();
    envFlap.classList.add('open');

    // Show letter peeking
    setTimeout(() => {
      letterPeek.classList.add('visible');
      pullHint.classList.add('visible');
      step = 'letter_visible';
    }, 700);
  }, 300);
}

/* ════════════════════════════════════════
   STEP 2 — PULL LETTER OUT
════════════════════════════════════════ */
letterPeek.addEventListener('click', pullLetter);
pullHint.addEventListener('click', pullLetter);

function pullLetter() {
  if (step !== 'letter_visible') return;
  step = 'letter_pulled';

  playLetterRustle();

  letterPeek.classList.add('pull');
  pullHint.classList.remove('visible');

  // Transition to letter screen
  setTimeout(() => {
    introScreen.classList.remove('active');
    setTimeout(() => {
      letterScreen.classList.add('active');
      setTimeout(() => {
        letterSheet.classList.add('revealed');
        setTimeout(startTyping, 500);
      }, 100);
    }, 400);
  }, 600);
}

/* ════════════════════════════════════════
   STEP 3 — TYPEWRITER EFFECT
════════════════════════════════════════ */
function startTyping() {
  step = 'typing';
  let i = 0;
  const text = LETTER;
  const baseDelay = 38;

  function typeNext() {
    if (i < text.length) {
      const char = text[i];
      typedText.textContent += char;
      i++;

      // Play key sound occasionally (not every char to avoid spam)
      if (char !== ' ' && char !== '\n' && Math.random() > 0.3) {
        playTypeKey();
      }

      // Variable delay: slower after punctuation, faster for spaces
      let delay = baseDelay;
      if (char === '.' || char === ',' || char === '!') delay = 220;
      else if (char === '\n') delay = 350;
      else if (char === ' ') delay = 20;
      else delay = baseDelay + Math.random() * 25;

      setTimeout(typeNext, delay);
    } else {
      // Typing done
      cursorEl.classList.add('hidden');
      playChime();

      setTimeout(() => {
        letterFooter.style.opacity = '1';
        letterFooter.style.transition = 'opacity 1s ease';
        step = 'done';
      }, 600);
    }
  }

  typeNext();
}

/* ════════════════════════════════════════
   STEP 4 — RETURN LETTER → FINALE
════════════════════════════════════════ */
returnBtn.addEventListener('click', () => {
  if (step !== 'done') return;
  step = 'finale';

  // Animate letter sheet away
  letterSheet.style.transition = 'transform 0.7s ease, opacity 0.7s ease';
  letterSheet.style.transform = 'translateY(80px) scale(0.85)';
  letterSheet.style.opacity = '0';

  setTimeout(() => {
    letterScreen.classList.remove('active');
    setTimeout(() => {
      finaleScreen.classList.add('active');
      setTimeout(bloomRose, 200);
    }, 300);
  }, 500);

  playLetterRustle();
});

/* ════════════════════════════════════════
   STEP 5 — BLUE ROSE BLOOM + FINALE
════════════════════════════════════════ */
function bloomRose() {
  playFinaleSound();
  createPetalParticles();
  createSparkles();

  roseContainer.classList.add('bloom');

  // Show love message after rose blooms
  setTimeout(() => {
    loveMessage.classList.add('show');
    createFloatingHearts();
  }, 2800);
}

function createPetalParticles() {
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const angle = (i / 18) * 360;
    const radius = 60 + Math.random() * 40;
    const dx = Math.cos(angle * Math.PI / 180) * radius;
    const dur = 2.5 + Math.random() * 2;
    const delay = Math.random() * 3;
    p.style.cssText = `
      left: ${50 + Math.cos(angle * Math.PI/180) * 20}%;
      top: ${55 + Math.sin(angle * Math.PI/180) * 15}%;
      --dx: ${dx}px;
      --dur: ${dur}s;
      --delay: ${delay}s;
      transform: rotate(${angle}deg);
    `;
    petalParts.appendChild(p);
  }
}

function createSparkles() {
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    const angle = Math.random() * 360;
    const r = 80 + Math.random() * 140;
    const x = 50 + Math.cos(angle * Math.PI/180) * (r / window.innerWidth) * 100;
    const y = 50 + Math.sin(angle * Math.PI/180) * (r / window.innerHeight) * 100;
    const dur = 1.2 + Math.random() * 2;
    const delay = Math.random() * 4;
    s.style.cssText = `
      left: ${x}%;
      top: ${y}%;
      --dur2: ${dur}s;
      --delay2: ${delay}s;
    `;
    sparkleRing.appendChild(s);
  }
}

function createFloatingHearts() {
  const container = document.querySelector('.finale-content');
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const heart = document.createElement('div');
      heart.textContent = '💙';
      heart.style.cssText = `
        position: absolute;
        font-size: ${14 + Math.random() * 18}px;
        left: ${10 + Math.random() * 80}%;
        bottom: -30px;
        opacity: 0;
        pointer-events: none;
        animation: starFloat ${2 + Math.random() * 2}s ease forwards;
        z-index: 5;
      `;
      finaleScreen.appendChild(heart);
      setTimeout(() => heart.remove(), 5000);
    }, i * 300);
  }
}

/* ════════════════════════════════════════
   PRELOAD / INIT
════════════════════════════════════════ */
window.addEventListener('load', () => {
  // Inject starFloat keyframe (for hearts)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes starFloat {
      0%   { opacity: 0; transform: translateY(0) scale(0); }
      20%  { opacity: 1; transform: translateY(-40px) scale(1); }
      80%  { opacity: 0.7; transform: translateY(-100px) scale(0.9); }
      100% { opacity: 0; transform: translateY(-180px) scale(0.5); }
    }
  `;
  document.head.appendChild(style);
});
