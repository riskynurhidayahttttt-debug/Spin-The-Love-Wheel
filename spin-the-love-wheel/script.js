const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const spinAgain = document.getElementById('spinAgain');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const optionList = document.getElementById('optionList');
const newOption = document.getElementById('newOption');
const addOptionBtn = document.getElementById('addOption');
const resetOptionsBtn = document.getElementById('resetOptions');
const soundToggle = document.getElementById('soundToggle');

const defaults = ['A warm hug', 'Movie night', 'Your favorite snack', 'A sweet kiss', 'Choose our date', 'A love note'];
const colors = ['#e7a52f', '#f3cf58', '#b86b2b', '#e8bd78', '#8e9a4b', '#d98a35', '#f0d98c', '#a95b2b'];
let options = [...defaults];
let rotation = 0;
let spinning = false;
let soundOn = true;
let audioContext = null;

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const slice = (Math.PI * 2) / options.length;
  ctx.clearRect(0, 0, size, size);
  options.forEach((option, index) => {
    const start = rotation + index * slice - Math.PI / 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff0e5';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fffaf5';
    ctx.shadowColor = '#4b294b66';
    ctx.shadowBlur = 3;
    const fontSize = options.length > 8 ? 20 : 23;
    ctx.font = `700 ${fontSize}px "DM Sans", sans-serif`;
    const maxWidth = radius * .66;
    let label = option;
    while (ctx.measureText(label).width > maxWidth && label.length > 5) label = label.slice(0, -2) + '…';
    ctx.fillText(label, radius - 34, 0);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff4e7';
  ctx.lineWidth = 8;
  ctx.stroke();
}

function renderOptions() {
  optionList.innerHTML = '';
  options.forEach((option, index) => {
    const row = document.createElement('div');
    row.className = 'option-row';
    const dot = document.createElement('span');
    dot.className = 'option-dot';
    dot.style.background = colors[index % colors.length];
    const name = document.createElement('span');
    name.className = 'option-name';
    name.textContent = option;
    const remove = document.createElement('button');
    remove.className = 'remove-option';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${option}`);
    remove.addEventListener('click', () => {
      if (options.length <= 2) return;
      options.splice(index, 1);
      refresh();
    });
    row.append(dot, name, remove);
    optionList.append(row);
  });
}

function refresh() {
  drawWheel();
  renderOptions();
  resultCard.classList.remove('show');
}

function addOption() {
  const value = newOption.value.trim();
  if (!value || options.length >= 10) return;
  options.push(value);
  newOption.value = '';
  refresh();
}
addOptionBtn.addEventListener('click', addOption);
newOption.addEventListener('keydown', event => {
  if (event.key === 'Enter') addOption();
});
resetOptionsBtn.addEventListener('click', () => {
  options = [...defaults];
  refresh();
});

function playTick() {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(650, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(280, audioContext.currentTime + .045);
    gain.gain.setValueAtTime(.055, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .05);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + .05);
  } catch (error) { /* sound is optional */ }
}

function spin() {
  if (spinning || options.length < 2) return;
  spinning = true;
  spinBtn.disabled = true;
  resultCard.classList.remove('show');
  const slice = Math.PI * 2 / options.length;
  const winner = Math.floor(Math.random() * options.length);
  // Pointer is at top (-90deg); rotate the selected slice center to that point.
  const current = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const targetMod = (Math.PI * 2 - (winner + .5) * slice) % (Math.PI * 2);
  const delta = (targetMod - current + Math.PI * 2) % (Math.PI * 2);
  const startRotation = rotation;
  const totalRotation =  Math.PI * 2 * (5 + Math.floor(Math.random() * 3)) + delta;
  const duration = 4700;
  const start = performance.now();
  let lastTickSegment = -1;
  function animate(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + totalRotation * eased;
    drawWheel();
    const segment = Math.floor((rotation - startRotation) / (slice * .65));
    if (segment !== lastTickSegment) { playTick(); lastTickSegment = segment; }
    if (progress < 1) requestAnimationFrame(animate);
    else {
      rotation = startRotation + totalRotation;
      drawWheel();
      spinning = false;
      spinBtn.disabled = false;
      resultText.textContent = options[winner];
      resultCard.classList.add('show');
      resultCard.scrollIntoView({behavior:'smooth', block:'nearest'});
      playWin();
    }
  }
  requestAnimationFrame(animate);
}

function playWin() {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, audioContext.currentTime + index * .09);
      gain.gain.linearRampToValueAtTime(.06, audioContext.currentTime + index * .09 + .02);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + index * .09 + .25);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * .09);
      oscillator.stop(audioContext.currentTime + index * .09 + .26);
    });
  } catch (error) { /* sound is optional */ }
}

spinBtn.addEventListener('click', spin);
spinAgain.addEventListener('click', spin);
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? '♫ Sound on' : '♫ Sound off';
  soundToggle.setAttribute('aria-pressed', String(soundOn));
});

drawWheel();
renderOptions();
