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
    for (const cy of [48, skyH - 48]) {
      const cx = dir === -1 ? 56 : width - 56;
      for (let a = 0; a < PI * 2.1; a += 0.18) {
        const rad = 36 * (1 - a / (PI * 2.5));
        stampFiligreeDot(skyFiligree, cx + dir * cos(a) * rad, cy + sin(a) * rad * 0.85, PIXEL);
      }
    }
  }

  const deckH = Math.max(160, Math.floor(height * 0.39));
  deckFiligree = createGraphics(width, deckH);
  deckFiligree.noStroke();

  for (const dir of [-1, 1]) {
    const wingX = width * 0.5 + dir * min(width * 0.23, 240);
    const wingY = deckH * 0.84;
    for (let t = 0; t <= 1; t += 0.04) {
      const wx = wingX + dir * t * min(width * 0.12, 110);
      const wy = wingY + sin(t * TWO_PI) * 7;
      deckFiligree.fill(WHITE[0], WHITE[1], WHITE[2], 170);
      deckFiligree.rect(snap(wx), snap(wy), 2, 2);
    }
  }
}

function stampFiligreeDot(g, x, y, size) {
  const gx = snap(x, PIXEL);
  const gy = snap(y, PIXEL);
  g.fill(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2], 210);
  g.rect(gx + PIXEL, gy + PIXEL, size, size);
  g.fill(WHITE[0], WHITE[1], WHITE[2], 230);
  g.rect(gx, gy, size, size);
}

function makeKeyFlourish(variant, w, h) {
  const pts = [];
  const rx = w * 0.36;
  const ry = h * 0.34;

  function add(x, y) {
    pts.push({ x: snap(x, 2), y: snap(y, 2) });
  }

  if (variant % 2 === 0) {
    add(-rx, -ry);
    add(-rx + 4, -ry);
    add(-rx, -ry + 4);
    add(rx, ry);
    add(rx - 4, ry);
    add(rx, ry - 4);
  } else {
    add(rx, -ry);
    add(rx - 4, -ry);
    add(rx, -ry + 4);
    add(-rx, ry);
    add(-rx + 4, ry);
    add(-rx, ry - 4);
  }
  return pts;
}

function seedSkyDots() {
  bgDots = [];
  for (let i = 0; i < 42; i++) {
    bgDots.push({
      x: snap(random(width)),
      y: snap(random(TITLE_BAR_H + 14, height * 0.58)),
      tone: random() > 0.45 ? WHITE : LIGHT_BLUE
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
        flourish: makeKeyFlourish(idx + r, keyW, keyH)
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
    note: 'clear',
    freq: 0,
    lastStar: null,
    flourish: makeKeyFlourish(0, spaceW * 0.9, spaceH)
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
  const topY = TITLE_BAR_H + 28;
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
    code: k.code
  };

  stars.push(star);
  k.lastStar = star;
  if (stars.length > 80) stars.shift();
}

function pressKeyObj(k) {
  initAudio();
  if (k.letter === ' ') {
    stars = [];
    shootingStars = [];
    seedSkyDots();
    console.log('key: space (clear sky)');
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

function drawThreeToneStar(cx, cy, radius, accentTone, held = false, step = PIXEL) {
  noStroke();
  const r = held ? radius * 1.25 : radius;
  const scx = snap(cx, step);
  const scy = snap(cy, step);

  const rOuter = r * 1.45;
  const rMid = r * 0.92;
  const rCore = r * 0.42;
  const bound = Math.ceil(rOuter / step) * step;

  for (let dy = -bound; dy <= bound; dy += step) {
    for (let dx = -bound; dx <= bound; dx += step) {
      const d = Math.hypot(dx, dy);
      if (d <= rCore) {
        fill(WHITE[0], WHITE[1], WHITE[2], 255);
        rect(scx + dx, scy + dy, step, step);
      } else if (d <= rMid) {
        fill(accentTone[0], accentTone[1], accentTone[2], 185);
        rect(scx + dx, scy + dy, step, step);
      } else if (d <= rOuter) {
        fill(DARK_BLUE[0], DARK_BLUE[1], DARK_BLUE[2], 130);
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
    rect(px, py, PIXEL * 2, PIXEL * 2);
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
    fill(d.tone[0], d.tone[1], d.tone[2], 190);
    rect(d.x, d.y, PIXEL, PIXEL);
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
    const heldStars
