(() => {
  'use strict';

  const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  const CANVAS_W = 420;
  const CANVAS_H = 630;

  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = CANVAS_W;
  sourceCanvas.height = CANVAS_H;
  const sourceCtx = sourceCanvas.getContext('2d', { alpha: false });

  const els = {
    startBtn: document.getElementById('startBtn'),
    nextPosterBtn: document.getElementById('nextPosterBtn'),
    nextLineBtn: document.getElementById('nextLineBtn'),
    passBtn: document.getElementById('passBtn'),
    libraryBtn: document.getElementById('libraryBtn'),
    closeLibraryBtn: document.getElementById('closeLibraryBtn'),
    scanBtn: document.getElementById('scanBtn'),
    libraryDialog: document.getElementById('libraryDialog'),
    libraryList: document.getElementById('libraryList'),
    scanSummary: document.getElementById('scanSummary'),
    movieButtons: document.getElementById('movieButtons'),
    movieSearch: document.getElementById('movieSearch'),
    introPanel: document.getElementById('introPanel'),
    resultPanel: document.getElementById('resultPanel'),
    resultKicker: document.getElementById('resultKicker'),
    resultTitle: document.getElementById('resultTitle'),
    resultDetail: document.getElementById('resultDetail'),
    message: document.getElementById('message'),
    roundStat: document.getElementById('roundStat'),
    linesStat: document.getElementById('linesStat'),
    scoreStat: document.getElementById('scoreStat'),
  };

  let movies = [];
  let currentMovie = null;
  let currentPosterPath = null;
  let currentImg = null;
  let playing = false;
  let round = 0;
  let totalScore = 0;
  let linesRevealed = 0;
  let usedHorizontal = new Set();
  let usedVertical = new Set();
  let playedSlugs = new Set();
  let wrongGuesses = new Set();

  function paintBlack() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  function scoreForLines(lines) {
    return Math.max(5, 105 - lines * 5);
  }

  function updateStats() {
    els.roundStat.textContent = String(round);
    els.linesStat.textContent = String(linesRevealed);
    els.scoreStat.textContent = String(totalScore);
  }

  function setMessage(text) {
    els.message.textContent = text;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function shuffled(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function posterCandidates(movie) {
    return EXTENSIONS.map(ext => `posters/${movie.slug}.${ext}`);
  }

  function tryImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ img, src });
      img.onerror = () => resolve(null);
      img.src = `${src}?v=${Date.now()}`;
    });
  }

  async function resolvePoster(movie) {
    for (const src of posterCandidates(movie)) {
      const result = await tryImage(src);
      if (result) return result;
    }
    return null;
  }

  function drawSourceImage(img) {
    sourceCtx.fillStyle = '#000';
    sourceCtx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Fill the full poster frame. Poster art is normally close to 2:3, and
    // a small centre crop produces a much better line-reveal game than letterboxing.
    const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = (CANVAS_W - drawW) / 2;
    const y = (CANVAS_H - drawH) / 2;
    sourceCtx.drawImage(img, x, y, drawW, drawH);
  }

  function chooseUniqueCoordinate(set, max) {
    if (set.size >= max) return null;
    let n;
    do n = randomInt(max);
    while (set.has(n));
    set.add(n);
    return n;
  }

  function revealLine() {
    if (!playing || !currentMovie) return;

    let horizontal = Math.random() < 0.5;
    if (usedHorizontal.size >= CANVAS_H) horizontal = false;
    if (usedVertical.size >= CANVAS_W) horizontal = true;

    if (horizontal) {
      const y = chooseUniqueCoordinate(usedHorizontal, CANVAS_H);
      if (y !== null) ctx.drawImage(sourceCanvas, 0, y, CANVAS_W, 1, 0, y, CANVAS_W, 1);
    } else {
      const x = chooseUniqueCoordinate(usedVertical, CANVAS_W);
      if (x !== null) ctx.drawImage(sourceCanvas, x, 0, 1, CANVAS_H, x, 0, 1, CANVAS_H);
    }

    linesRevealed += 1;
    updateStats();
    setMessage(`${linesRevealed} ${linesRevealed === 1 ? 'line' : 'lines'} revealed · ${scoreForLines(linesRevealed)} points available`);
  }

  function showFullPoster() {
    ctx.drawImage(sourceCanvas, 0, 0);
  }

  function setButtonsEnabled(enabled) {
    els.movieButtons.querySelectorAll('.movie-btn').forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  function resetButtonStates() {
    els.movieButtons.querySelectorAll('.movie-btn').forEach(btn => {
      btn.classList.remove('wrong', 'correct');
    });
  }

  async function startRound() {
    playing = false;
    els.nextLineBtn.disabled = true;
    els.passBtn.disabled = true;
    setButtonsEnabled(false);
    resetButtonStates();
    wrongGuesses.clear();

    els.introPanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    paintBlack();
    setMessage('Looking for an available poster…');

    let candidates = movies.filter(m => !playedSlugs.has(m.slug));
    if (!candidates.length) {
      playedSlugs.clear();
      candidates = [...movies];
    }
    candidates = shuffled(candidates);

    let resolved = null;
    let selected = null;

    for (const movie of candidates) {
      const result = await resolvePoster(movie);
      if (result) {
        selected = movie;
        resolved = result;
        break;
      }
    }

    if (!resolved || !selected) {
      currentMovie = null;
      currentImg = null;
      currentPosterPath = null;
      setMessage('No poster images were found. Open Poster Library to see the filenames Posterline expects.');
      els.introPanel.classList.remove('hidden');
      return;
    }

    currentMovie = selected;
    currentImg = resolved.img;
    currentPosterPath = resolved.src;
    playedSlugs.add(selected.slug);

    drawSourceImage(currentImg);
    paintBlack();

    linesRevealed = 0;
    usedHorizontal = new Set();
    usedVertical = new Set();

    round += 1;
    playing = true;
    els.nextLineBtn.disabled = false;
    els.passBtn.disabled = false;
    setButtonsEnabled(true);
    updateStats();

    revealLine();
  }

  function endRound(correct) {
    if (!currentMovie) return;

    playing = false;
    showFullPoster();
    els.nextLineBtn.disabled = true;
    els.passBtn.disabled = true;
    setButtonsEnabled(false);

    const correctBtn = els.movieButtons.querySelector(`[data-slug="${CSS.escape(currentMovie.slug)}"]`);
    if (correctBtn) correctBtn.classList.add('correct');

    els.resultKicker.textContent = correct ? 'CORRECT' : 'PASSED';
    els.resultTitle.textContent = currentMovie.title;

    if (correct) {
      const earned = scoreForLines(linesRevealed);
      totalScore += earned;
      els.resultDetail.textContent =
        `${currentMovie.year} · ${linesRevealed} ${linesRevealed === 1 ? 'line' : 'lines'} · +${earned} points`;
      setMessage(`Correct — ${currentMovie.title}.`);
    } else {
      els.resultDetail.textContent =
        `${currentMovie.year} · revealed after ${linesRevealed} ${linesRevealed === 1 ? 'line' : 'lines'}`;
      setMessage(`The poster was ${currentMovie.title}.`);
    }

    updateStats();
    els.resultPanel.classList.remove('hidden');
  }

  function handleGuess(movie, btn) {
    if (!playing || !currentMovie) return;

    if (movie.slug === currentMovie.slug) {
      endRound(true);
      return;
    }

    btn.classList.add('wrong');
    wrongGuesses.add(movie.slug);
    revealLine();
    setMessage(`Not ${movie.title}. Another line has been revealed.`);
  }

  function renderMovieButtons(filter = '') {
    const q = filter.trim().toLowerCase();
    els.movieButtons.innerHTML = '';

    movies.forEach(movie => {
      if (q && !`${movie.title} ${movie.year}`.toLowerCase().includes(q)) return;

      const btn = document.createElement('button');
      btn.className = 'movie-btn';
      btn.dataset.slug = movie.slug;
      btn.disabled = !playing;
      btn.innerHTML = `<span>${movie.title}</span><span class="year">${movie.year}</span>`;
      if (wrongGuesses.has(movie.slug)) btn.classList.add('wrong');
      if (!playing && currentMovie?.slug === movie.slug && !els.resultPanel.classList.contains('hidden')) {
        btn.classList.add('correct');
      }
      btn.addEventListener('click', () => handleGuess(movie, btn));
      els.movieButtons.appendChild(btn);
    });
  }

  async function scanLibrary() {
    els.scanBtn.disabled = true;
    els.scanSummary.textContent = 'Scanning…';
    els.libraryList.innerHTML = '';

    let found = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      const result = await resolvePoster(movie);
      const row = document.createElement('div');
      row.className = `library-row ${result ? 'found' : 'missing'}`;

      if (result) found += 1;

      row.innerHTML = `
        <span class="status">${result ? '✓' : '×'}</span>
        <span>${movie.title} <span style="color:#777680">(${movie.year})</span></span>
        <span class="filename">${result ? result.src.replace(/\?v=.*$/, '') : `posters/${movie.slug}.jpg`}</span>
      `;
      els.libraryList.appendChild(row);
      els.scanSummary.textContent = `${found} of ${i + 1} found…`;
    }

    els.scanSummary.textContent = `${found} of ${movies.length} posters found.`;
    els.scanBtn.disabled = false;
  }

  async function init() {
    paintBlack();

    try {
      const response = await fetch('movies.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`movies.json returned ${response.status}`);
      movies = await response.json();
      renderMovieButtons();
    } catch (err) {
      console.error(err);
      setMessage('Could not load movies.json. Posterline needs to be served over HTTP, such as GitHub Pages or a local web server.');
      els.startBtn.disabled = true;
    }
  }

  els.startBtn.addEventListener('click', startRound);
  els.nextPosterBtn.addEventListener('click', startRound);
  els.nextLineBtn.addEventListener('click', revealLine);
  els.passBtn.addEventListener('click', () => endRound(false));
  els.movieSearch.addEventListener('input', () => renderMovieButtons(els.movieSearch.value));

  els.libraryBtn.addEventListener('click', () => {
    els.libraryDialog.showModal();
  });
  els.closeLibraryBtn.addEventListener('click', () => els.libraryDialog.close());
  els.scanBtn.addEventListener('click', scanLibrary);

  els.libraryDialog.addEventListener('click', event => {
    const rect = els.libraryDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) els.libraryDialog.close();
  });

  document.addEventListener('keydown', event => {
    if (event.code === 'Space' && playing && !event.target.matches('input, button')) {
      event.preventDefault();
      revealLine();
    }
  });

  init();
})();
