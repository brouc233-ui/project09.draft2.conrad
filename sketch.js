const MYUNGJO_FONT = 'Nanum Myeongjo';
const TITLE_BAR_H = 34;
const PIXEL = 3;

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];
const DARK_BLUE = [16, 56, 185];
const MID_BLUE = [48, 128, 242];
const LIGHT_BLUE = [140, 208, 255];
const BLUE_TONES = [DARK_BLUE, MID_BLUE, LIGHT_BLUE];

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const PIANO_SCALE = [
  { note: 'C5', freq: 523.25 }, { note: 'D5', freq: 587.33 }, { note: 'E5', freq: 659.25 },
  { note: 'G5', freq: 783.99 }, { note: 'A5', freq: 880.00 }, { note: 'B5', freq: 987.77 },
  { note: 'C6', freq: 1046.50 }, { note: 'D6', freq: 1174.66 }, { note: 'E6', freq: 1318.51 },
  { note: 'G6', freq: 1567.98 },
  { note: 'C4', freq: 261.63 }, { note: 'D4', freq: 293.66 }, { note: 'E4', freq: 329.63 },
  { note: 'F4', freq: 349.23 }, { note: 'G4', freq: 392.00 }, { note: 'A4', freq: 440.00 },
  { note: 'B4', freq: 493.88 }, { note: 'C5', freq: 523.25 }, { note: 'D5', freq: 587.33 },
  { note: 'C3', freq: 130.81 }, { note: 'D3', freq: 146.83 }, { note: 'E3', freq: 164.81 },
  { note: 'G3', freq: 196.00 }, { note: 'A3', freq: 220.00 }, { note: 'B3', freq: 246.94 },
  { note: 'C4', freq: 261.63 }
];

let keys = [];
let stars = [];
let bgDots = [];
let shootingStars = [];
let voices = {};
let heldCodes = new Set();
let clickedKey = null;

let skyFiligree;
let deckFiligree;
let audioStarted = false;
let filter;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseSpeed = 0;
let mouseActiveTimer = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  textFont(MYUNGJO_FONT);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  buildKeyboard();
  seedSkyDots();
  buildFiligreeLayers();

  prevMouseX = width / 2;
  prevMouseY = height * 0.3;
}

function snap(val, step = PIXEL) {
  return Math.round(val / step) * step;
}

function buildFiligreeLayers() {
  const skyH = Math.max(180, Math.floor(height * 0.61 - TITLE_BAR_H));
  skyFiligree = createGraphics(width, skyH);
  skyFiligree.noStroke();

  for (const dir of [-1, 1]) {
    const spineX = width * 0.5 + dir * min(width * 0.15, 160);
    for (let t = 0; t <= 1; t += 0.008) {
      const y = t * skyH;
      const wave = sin(t * TWO_PI * 1.4) * 28 * dir;
      stampFiligreeDot(skyFiligree, spineX + wave, y, 3);
      if (sin(t * PI * 6) > 0.35) {
        stampFiligreeDot(skyFiligree, spineX + wave + dir * 7, y + 3, 2.5);
      }
      if (Math.abs((t * 4) % 1 - 0.5) < 0.02) {
        for (let a = 0; a < PI * 2.1; a += 0.25) {
          const rad = 24 * (1 - a / (PI * 2.4));
          stampFiligreeDot(skyFiligree, spineX + wave + dir * (18 + cos(a) * rad), y + sin(a) * rad, 2.5);
        }
      }
    }

    for (const cy of [skyH * 0.16, skyH * 0.84]) {
      const cx = dir === -1 ? min(width * 0.11, 115) : width - min(width * 0.11, 115);
      for (let a = 0; a < PI * 2.4; a += 0.14) {
        const rad = 52 * (1 - a / (PI * 2.8));
        stampFiligreeDot(skyFiligree, cx + dir * cos(a) * rad, cy + sin(a) * rad * 0.85, 3);
        stampFiligreeDot(skyFiligree, cx + dir * cos(a + 0.3) * (rad * 0.72), cy + sin(a + 0.3) * (rad * 0.6), 2.5);
      }
    }

    const sideX = dir === -1 ? min(width * 0.22, 220) : width - min(width * 0.22, 220);
    for (let t = 0; t <= 1; t += 0.01) {
      const y = skyH * 0.1 + t * skyH * 0.8;
      const x = sideX + sin(t * PI * 2.2) * 42 * dir;
      stampFiligreeDot(skyFiligree, x, y, 3);
      if (Math.abs((t * 3) % 1 - 0.35) < 0.025) {
        for (let a = 0; a < PI * 2.2; a += 0.24) {
          const r = 28 * (1 - a / (PI * 2.5));
          stampFiligreeDot(skyFiligree, x - dir * cos(a) * r, y + sin(a) * r, 2.5);
        }
      }
    }
  }

  const deckH = Math.max(160, Math.floor(height * 0.39));
  deckFiligree = createGraphics(width, deckH);
  deckFiligree.noStroke();

  for (const dir of [-1, 1]) {
    const edgeX = dir === -1 ? 26 : width - 26;
    for (let t = 0; t <= 1; t += 0.015) {
      const y = deckH * 0.12 + t * deckH * 0.76;
      const x = edgeX - dir * sin(t * PI * 2) * 16;
      deckFiligree.fill(WHITE[0], WHITE[1], WHITE[2], 180);
      deckFiligree.rect(snap(x), snap(y), 2.5, 2.5);
      if (Math.abs((t * 2) % 1 - 0.5) < 0.03) {
        for (let a = 0; a < PI * 2; a += 0.28) {
          const r = 18 * (1 - a / (PI * 2.3));
          deckFiligree.rect(snap(x - dir * cos(a) * r), snap(y + sin(a) * r), 2, 2);
        }
      }
    }

    const wingX = width * 0.5 + dir * min(width * 0.22, 235);
    const wingY = deckH * 0.84;
    for (let t = 0; t <= 1; t += 0.025) {
      const wx = wingX + dir * t * min(width * 0.14, 130);
      const wy = wingY + sin(t * TWO_PI) * 10;
      deckFiligree.fill(WHITE[0], WHITE[1], WHITE[2], 190);
      deckFiligree.rect(snap(wx), snap(wy), 2.5, 2.5);
    }
  }
}

function stampFiligreeDot(g, x, y, size) {
  const gx = snap(x, 4);
  const gy = snap(y, 4);
  g.fill(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2], 220);
  g.rect(gx + 3, gy + 3, size, size);
  g.fill(WHITE[0], WHITE[1], WHITE[2], 235);
  g.rect(gx, gy, size, size);
}

function makeKeyFlourish(variant, w, h) {
  const pts = [];
  const rx = w * 0.34;
  const ry = h * 0.32;

  function add(x, y) {
    pts.push({ x: snap(x, 2), y: snap(y, 2) });
  }

  if (variant === 0) {
    for (let a = -0.3; a < PI * 1.45; a += 0.26) {
      const r = min(rx, ry) * 0.72 * (1 - a / (PI * 2.1));
      add(-rx * 0.52 + cos(a) * r, -ry * 0.1 + sin(a) * r);
      add(rx * 0.52 - cos(a) * r, ry * 0.1 - sin(a) * r);
    }
  } else if (variant === 1) {
    for (let t = 0; t <= 1; t += 0.05) {
      const seg = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      const dir = t < 0.5 ? 1 : -1;
      const a = dir * seg * PI * 1.75;
      const r = min(rx, ry) * 0.55 * (1 - seg * 0.6);
      const cx = t < 0.5 ? -rx * 0.38 : rx * 0.38;
      add(cx + cos(a) * r, sin(a) * r * 0.85);
    }
  } else if (variant === 2) {
    for (let t = 0; t <= 1; t += 0.055) {
      add(lerp(-rx * 0.85, rx * 0.85, t), -cos(t * PI * 2) * ry * 0.42);
    }
    for (let a = 0; a < PI * 1.8; a += 0.32) {
      const r = min(rx, ry) * 0.38 * (1 - a / (PI * 2.2));
      add(-rx * 0.55 + cos(a) * r, ry * 0.35 + sin(a) * r);
      add(rx * 0.55 - cos(a) * r, ry * 0.35 + sin(a) * r);
    }
  } else {
    for (let t = 0; t <= 1; t += 0.045) {
      const a = t * PI * 2.2;
      const r = min(rx, ry) * 0.72 * t;
      add(cos(a) * r * 1.15, sin(a) * r * 0.85);
      add(cos(a + PI) * r * 1.15, sin(a + PI) * r * 0.85);
    }
  }
  return pts;
}

function seedSkyDots() {
  bgDots = [];
  for (let i = 0; i < 50; i++) {
    bgDots.push({
      x: snap(random(width)),
      y: snap(random(TITLE_BAR_H + 14, height * 0.58)),
      r: random() > 0.5 ? 3 : 6,
      tone: random(BLUE_TONES)
    });
  }
}

function buildKeyboard() {
  keys = [];
  const kbTop = height * 0.64;
  const kbHeight = height * 0.33;
  const rowH = kbHeight / 4.2;
  const keyW = min((width * 0.86) / 10, 74);
  const keyH = min(rowH * 0.84, 58);
  const gapX = keyW * 0.14;
  const gapY = rowH * 0.16;
  const stagger = [0, keyW * 0.28, keyW * 0.72];

  let idx = 0;
  for (let r = 0; r < QWERTY_ROWS.length; r++) {
    const row = QWERTY_ROWS[r];
    const totalW = row.length * keyW + (row.length - 1) * gapX;
    const startX = (width - totalW) / 2 + keyW / 2 + stagger[r] * 0.25;
    const y = kbTop + r * (keyH + gapY) + keyH / 2;

    for (let c = 0; c < row.length; c++) {
      const letter = row[c];
      const piano = PIANO_SCALE[idx % PIANO_SCALE.length];

      keys.push({
        letter: letter,
        code: letter.charCodeAt(0),
        row: r,
        col: c,
        x: startX + c * (keyW + gapX),
        y: y,
        w: keyW,
        h: keyH,
        accent: BLUE_TONES[(idx + r) % 3],
        note: piano.note,
        freq: piano.freq,
        lastStar: null,
        flourish: makeKeyFlourish((idx + r) % 4, keyW, keyH)
      });
      idx++;
    }
  }

  const spaceY = kbTop + 3 * (keyH + gapY) + keyH * 0.45;
  const spaceW = keyW * 5.6;
  const spaceH = keyH * 0.7;
  keys.push({
    letter: ' ',
    code: 32,
    row: 3,
    col: 0,
    x: width / 2,
    y: spaceY,
    w: spaceW,
    h: spaceH,
    accent: MID_BLUE,
    note: 'CLEAR',
    freq: 0,
    lastStar: null,
    flourish: makeKeyFlourish(2, spaceW * 0.65, spaceH)
  });
}

function initAudio() {
  if (audioStarted) return;
  userStartAudio();
  filter = new p5.LowPass();
  filter.freq(2400);
  filter.res(1.2);
  audioStarted = true;
}

function playNote(k) {
  if (!audioStarted || k.freq === 0) return;
  stopNote(k.code);

  const mainOsc = new p5.Oscillator('triangle');
  const octaveOsc = new p5.Oscillator('sine');
  mainOsc.freq(k.freq);
  octaveOsc.freq(k.freq * 2);

  mainOsc.disconnect();
  octaveOsc.disconnect();
  mainOsc.connect(filter);
  octaveOsc.connect(filter);

  mainOsc.start();
  octaveOsc.start();

  const vol = constrain(0.22 + mouseSpeed * 0.004, 0.2, 0.34);
  mainOsc.amp(0);
  octaveOsc.amp(0);
  mainOsc.amp(vol, 0.015);
  octaveOsc.amp(vol * 0.28, 0.012);
  octaveOsc.amp(0, 0.4, 0.02);
  mainOsc.amp(vol * 0.45, 0.85, 0.03);

  voices[k.code] = { mainOsc, octaveOsc };
}

function stopNote(code) {
  const v = voices[code];
  if (!v) return;
  v.mainOsc.amp(0, 0.4);
  v.octaveOsc.amp(0, 0.25);
  setTimeout(() => {
    v.mainOsc.stop();
    v.octaveOsc.stop();
  }, 450);
  delete voices[code];
}

function spawnStar(k) {
  const topY = TITLE_BAR_H + 46;
  const bottomY = height * 0.56;
  let tx = map(k.col, 0, 9, width * 0.12, width * 0.88);
  let ty = map(k.row, 0, 2, topY + 14, bottomY - 36);

  if (mouseActiveTimer > 0 && mouseY > TITLE_BAR_H && mouseY < bottomY) {
    tx = lerp(tx, mouseX, 0.72);
    ty = lerp(ty, mouseY, 0.72);
  }

  const star = {
    x: snap(constrain(tx + random(-34, 34), 34, width - 34)),
    y: snap(constrain(ty + random(-24, 24), topY, bottomY)),
    r: random(8, 12) + constrain(mouseSpeed * 0.14, 0, 7),
    accent: k.accent,
    code: k.code,
    phase: random(TWO_PI),
    ring: 1
  };

  stars.push(star);
  k.lastStar = star;
  if (stars.length > 90) stars.shift();
}

function pressKeyObj(k) {
  initAudio();
  if (k.letter === ' ') {
    stars = [];
    shootingStars = [];
    seedSkyDots();
    console.log('key: SPACE (clear sky)');
    return;
  }
  playNote(k);
  spawnStar(k);
  console.log('key:', k.letter, 'note:', k.note);
}

function keyPressed() {
  const k = keys.find((item) => item.code === keyCode);
  if (k) {
    if (!heldCodes.has(k.code)) {
      heldCodes.add(k.code);
      pressKeyObj(k);
    }
    return false;
  }
}

function keyReleased() {
  const k = keys.find((item) => item.code === keyCode);
  if (k) {
    heldCodes.delete(k.code);
    stopNote(k.code);
    return false;
  }
}

function mouseMoved() {
  mouseActiveTimer = 140;
}

function mousePressed() {
  initAudio();
  for (const k of keys) {
    if (
      mouseX >= k.x - k.w / 2 &&
      mouseX <= k.x + k.w / 2 &&
      mouseY >= k.y - k.h / 2 &&
      mouseY <= k.y + k.h / 2
    ) {
      clickedKey = k;
      heldCodes.add(k.code);
      pressKeyObj(k);
      return;
    }
  }

  if (mouseY > TITLE_BAR_H && mouseY < height * 0.6) {
    shootingStars.push({
      x: snap(mouseX),
      y: snap(mouseY),
      vx: random(5, 9) * (mouseX > width / 2 ? -1 : 1),
      vy: random(1.5, 4),
      life: 1
    });
    console.log('sky click:', Math.round(mouseX), Math.round(mouseY));
  }
}

function mouseReleased() {
  if (clickedKey) {
    heldCodes.delete(clickedKey.code);
    stopNote(clickedKey.code);
    clickedKey = null;
  }
}

function drawThreeToneStar(cx, cy, radius, accentTone, phase = 0, held = false, step = PIXEL) {
  noStroke();
  const r = held ? radius * 1.25 : radius;
  const scx = snap(cx, step);
  const scy = snap(cy, step);

  const ox = snap(cos(frameCount * 0.03 + phase) * (r * 0.16), step);
  const oy = snap(sin(frameCount * 0.03 + phase) * (r * 0.16), step);

  const r1 = r * 1.55;
  const r2 = r * 1.05;
  const r3 = r * 0.68;
  const rCore = r * 0.36;
  const bound = Math.ceil((r1 + Math.abs(ox) + step) / step) * step;

  for (let dy = -bound; dy <= bound; dy += step) {
    for (let dx = -bound; dx <= bound; dx += step) {
      const px = scx + dx;
      const py = scy + dy;
      if (dist(px, py, scx - ox, scy - oy) <= r1) {
        fill(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2], 115);
        rect(px, py, step, step);
      }
    }
  }

  const b2 = Math.ceil((r2 + step) / step) * step;
  for (let dy = -b2; dy <= b2; dy += step) {
    for (let dx = -b2; dx <= b2; dx += step) {
      const px = scx + ox + dx;
      const py = scy + oy + dy;
      if (dist(px, py, scx + ox, scy + oy) <= r2) {
        fill(MID_BLUE[0], MID_BLUE[1], MID_BLUE[2], 145);
        rect(px, py, step, step);
      }
    }
  }

  const b3 = Math.ceil((r3 + step) / step) * step;
  for (let dy = -b3; dy <= b3; dy += step) {
    for (let dx = -b3; dx <= b3; dx += step) {
      if (Math.hypot(dx, dy) <= r3) {
        fill(accentTone[0], accentTone[1], accentTone[2], 185);
        rect(scx + dx, scy + dy, step, step);
      }
    }
  }

  const bCore = Math.ceil((rCore + step) / step) * step;
  for (let dy = -bCore; dy <= bCore; dy += step) {
    for (let dx = -bCore; dx <= bCore; dx += step) {
      if (Math.hypot(dx, dy) <= rCore) {
        fill(WHITE[0], WHITE[1], WHITE[2], 255);
        rect(scx + dx, scy + dy, step, step);
      }
    }
  }
}

function drawPixelLine(x1, y1, x2, y2) {
  const steps = Math.max(1, Math.floor(dist(x1, y1, x2, y2) / PIXEL));
  noStroke();
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = snap(lerp(x1, x2, t));
    const py = snap(lerp(y1, y2, t));
    fill(MID_BLUE[0], MID_BLUE[1], MID_BLUE[2], 130);
    rect(px, py, PIXEL * 2.5, PIXEL * 2.5);
    fill(WHITE[0], WHITE[1], WHITE[2], 255);
    rect(px, py, PIXEL, PIXEL);
  }
}

function draw() {
  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  prevMouseX = mouseX;
  prevMouseY = mouseY;
  if (mouseActiveTimer > 0) mouseActiveTimer--;

  if (audioStarted && filter) {
    filter.freq(map(mouseX, 0, width, 900, 4200, true));
  }

  background(BLACK);

  if (skyFiligree) {
    image(skyFiligree, 0, TITLE_BAR_H, width, height * 0.61 - TITLE_BAR_H);
  }

  noStroke();
  for (const d of bgDots) {
    fill(d.tone[0], d.tone[1], d.tone[2], 160);
    rect(d.x + PIXEL, d.y + PIXEL, d.r, d.r);
    fill(WHITE);
    rect(d.x, d.y, d.r, d.r);
  }

  const activeKeys = [];
  for (const k of keys) {
    const down = keyIsDown(k.code) || clickedKey === k;
    if (down) {
      activeKeys.push(k);
      if (k.lastStar && k.lastStar.r < 20) {
        k.lastStar.r += 0.2;
      }
    }
  }

  if (activeKeys.length >= 2) {
    const heldStars = activeKeys.map((k) => k.lastStar).filter((s) => s !== null);
    for (let i = 0; i < heldStars.length - 1; i++) {
      drawPixelLine(heldStars[i].x, heldStars[i].y, heldStars[i + 1].x, heldStars[i + 1].y);
    }
  }

  for (const s of stars) {
    const isHeld = heldCodes.has(s.code);
    if (s.ring > 0.05) {
      const ringR = s.r * (1.5 + (1 - s.ring) * 2.2);
      fill(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2], s.ring * 190);
      for (let a = 0; a < TWO_PI; a += 0.22) {
        rect(snap(s.x + cos(a) * ringR), snap(s.y + sin(a) * ringR), PIXEL, PIXEL);
      }
      s.ring *= 0.9;
    }
    drawThreeToneStar(s.x, s.y, s.r, s.accent, s.phase, isHeld, PIXEL);
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    ss.x += ss.vx;
    ss.y += ss.vy;
    ss.life -= 0.024;
    if (ss.life <= 0) {
      shootingStars.splice(i, 1);
      continue;
    }
    for (let t = 0; t <= 1; t += 0.1) {
      const tx = snap(ss.x - ss.vx * 6 * t);
      const ty = snap(ss.y - ss.vy * 6 * t);
      fill(MID_BLUE[0], MID_BLUE[1], MID_BLUE[2], ss.life * (1 - t) * 180);
      rect(tx + PIXEL, ty + PIXEL, PIXEL * 1.5, PIXEL * 1.5);
      fill(WHITE[0], WHITE[1], WHITE[2], ss.life * (1 - t) * 240);
      rect(tx, ty, PIXEL, PIXEL);
    }
    drawThreeToneStar(ss.x, ss.y, 5.5 * ss.life, LIGHT_BLUE, 0, false, PIXEL);
  }

  if (mouseY > TITLE_BAR_H && mouseY < height * 0.6) {
    drawThreeToneStar(mouseX, mouseY, 4.5 + constrain(mouseSpeed * 0.05, 0, 3.5), LIGHT_BLUE, 0, false, PIXEL);
  }

  drawKeyboard();
  drawInstructions();
  drawTitleBar();
}

function drawKeyboard() {
  const deckTop = height * 0.61;
  const deckH = height - deckTop;

  noStroke();
  fill(BLACK);
  rect(width / 2, deckTop + deckH / 2, width, deckH);

  stroke(WHITE);
  strokeWeight(1);
  line(0, deckTop, width, deckTop);

  if (deckFiligree) {
    image(deckFiligree, 0, deckTop, width, deckH);
  }

  const activeKeys = keys.filter((k) => heldCodes.has(k.code));
  if (activeKeys.length >= 2) {
    for (let i = 0; i < activeKeys.length - 1; i++) {
      drawPixelLine(activeKeys[i].x, activeKeys[i].y, activeKeys[i + 1].x, activeKeys[i + 1].y);
    }
  }

  for (const k of keys) {
    const pressed = keyIsDown(k.code) || clickedKey === k;
    const ky = pressed ? k.y + 2 : k.y;

    fill(pressed ? color(DARK_BLUE) : color(BLACK));
    stroke(WHITE);
    strokeWeight(1);
    rect(k.x, ky, k.w, k.h, 2);

    noStroke();
    fill(WHITE[0], WHITE[1], WHITE[2], pressed ? 160 : 55);
    for (const pt of k.flourish) {
      rect(k.x + pt.x, ky + pt.y, 2, 2);
    }

    if (k.letter === ' ') {
      fill(WHITE);
      textFont(MYUNGJO_FONT);
      textSize(11);
      text('SPACEBAR  —  CLEAR NIGHT SKY', k.x, ky);
    } else {
      drawThreeToneStar(k.x, ky - 2, min(k.w, k.h) * 0.11, k.accent, k.col * 0.5, pressed, 2);

      noStroke();
      textFont(MYUNGJO_FONT);
      textSize(12);
      fill(WHITE);
      text(k.letter, k.x - k.w / 2 + 10, ky - k.h / 2 + 10);

      textSize(9);
      fill(pressed ? color(WHITE) : color(LIGHT_BLUE));
      text(k.note, k.x, ky + k.h / 2 - 8);
    }
  }
}

function drawInstructions() {
  noStroke();
  textFont(MYUNGJO_FONT);
  textSize(12);
  textAlign(LEFT, TOP);

  fill(DARK_BLUE);
  text('TYPE OR CLICK QWERTY KEYS: play piano notes & add 3-tone blue stars', 21, TITLE_BAR_H + 13);
  fill(WHITE);
  text('TYPE OR CLICK QWERTY KEYS: play piano notes & add 3-tone blue stars', 20, TITLE_BAR_H + 12);

  fill(LIGHT_BLUE);
  text('HOLD KEY: expand star  ·  2+ KEYS AT ONCE: constellation line  ·  SPACE: clear sky', 20, TITLE_BAR_H + 29);
  textAlign(CENTER, CENTER);
}

function drawTitleBar() {
  noStroke();
  fill(BLACK);
  rect(width / 2, TITLE_BAR_H / 2, width, TITLE_BAR_H);

  stroke(WHITE);
  strokeWeight(1);
  line(0, TITLE_BAR_H, width, TITLE_BAR_H);

  noStroke();
  fill(WHITE);
  for (const dir of [-1, 1]) {
    const startX = dir === -1 ? 18 : width - 18;
    for (let i = 0; i < 5; i++) {
      rect(startX - dir * i * 6, TITLE_BAR_H / 2 + (i % 2 === 0 ? -3 : 3), 2.5, 2.5);
    }
  }

  fill(WHITE);
  textFont(MYUNGJO_FONT);
  textSize(13);
  textAlign(CENTER, CENTER);
  text('Conrad Brousseau / Core 1: Interactions / Project 09', width / 2, TITLE_BAR_H / 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildKeyboard();
  seedSkyDots();
  buildFiligreeLayers();
}