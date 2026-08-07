(() => {
  'use strict';

  const GAME_ROUNDS = 10;
  const CHOICE_COUNT = 50;
  const MAX_WRONG = 3;
  const CANVAS_W = 420;
  const CANVAS_H = 630;
  const EXTENSIONS = ['jpg','jpeg','png','webp'];

  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d', {alpha:false});
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = CANVAS_W;
  sourceCanvas.height = CANVAS_H;
  const sourceCtx = sourceCanvas.getContext('2d', {alpha:false});

  const $ = id => document.getElementById(id);
  const els = {
    startBtn:$('startBtn'), nextRoundBtn:$('nextRoundBtn'), nextLineBtn:$('nextLineBtn'),
    passBtn:$('passBtn'), themeBtn:$('themeBtn'), fullscreenBtn:$('fullscreenBtn'),
    introPanel:$('introPanel'), resultPanel:$('resultPanel'), resultKicker:$('resultKicker'),
    resultTitle:$('resultTitle'), resultDetail:$('resultDetail'), movieButtons:$('movieButtons'),
    movieSearch:$('movieSearch'), message:$('message'), roundStat:$('roundStat'),
    linesStat:$('linesStat'), wrongStat:$('wrongStat'), scoreStat:$('scoreStat'),
    libraryInfo:$('libraryInfo'), finalDialog:$('finalDialog'), finalHeading:$('finalHeading'),
    finalScore:$('finalScore'), finalReference:$('finalReference'), finalCorrect:$('finalCorrect'),
    finalWrong:$('finalWrong'), finalPasses:$('finalPasses'), newGameBtn:$('newGameBtn')
  };

  let allMovies = [];
  let sequelFiltered = [];
  let choicePool = [];
  let roundAnswers = [];
  let currentMovie = null;
  let currentRound = 0;
  let linesRevealed = 0;
  let wrongThisRound = 0;
  let totalScore = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalPasses = 0;
  let playing = false;
  let usedHorizontal = new Set();
  let usedVertical = new Set();
  let wrongGuesses = new Set();

  const FRANCHISE_RULES = [
    [/^mission impossible\b/,'mission impossible'],
    [/^(the )?fast (and|&) (the )?furious\b|^fast five\b|^furious 7\b/,'fast furious'],
    [/^harry potter\b/,'harry potter'],
    [/^star wars\b/,'star wars'],
    [/^the lord of the rings\b/,'lord rings'],
    [/^the hobbit\b/,'hobbit'],
    [/^pirates of the caribbean\b/,'pirates caribbean'],
    [/^jurassic (park|world)\b/,'jurassic'],
    [/^toy story\b/,'toy story'],
    [/^shrek\b/,'shrek'],
    [/^ice age\b/,'ice age'],
    [/^transformers\b/,'transformers'],
    [/^john wick\b/,'john wick'],
    [/^the hunger games\b/,'hunger games'],
    [/^the twilight saga\b|^twilight\b/,'twilight'],
    [/^the matrix\b|^matrix\b/,'matrix'],
    [/^alien\b|^aliens\b/,'alien'],
    [/^predator\b/,'predator'],
    [/^terminator\b|^the terminator\b/,'terminator'],
    [/^rocky\b|^creed\b/,'rocky'],
    [/^rambo\b/,'rambo'],
    [/^indiana jones\b/,'indiana jones'],
    [/^back to the future\b/,'back future'],
    [/^ghostbusters\b/,'ghostbusters'],
    [/^batman\b|^the dark knight\b/,'batman'],
    [/^spider man\b|^spiderman\b/,'spider man'],
    [/^superman\b/,'superman'],
    [/^the avengers\b|^avengers\b/,'avengers'],
    [/^guardians of the galaxy\b/,'guardians galaxy'],
    [/^deadpool\b/,'deadpool'],
    [/^thor\b/,'thor'],
    [/^iron man\b/,'iron man'],
    [/^captain america\b/,'captain america'],
    [/^black panther\b/,'black panther'],
    [/^doctor strange\b/,'doctor strange'],
    [/^ant man\b/,'ant man'],
    [/^avatar\b/,'avatar'],
    [/^dune\b/,'dune'],
    [/^top gun\b/,'top gun'],
    [/^scream\b/,'scream'],
    [/^halloween\b/,'halloween'],
    [/^a nightmare on elm street\b/,'elm street'],
    [/^friday the 13th\b/,'friday 13'],
    [/^final destination\b/,'final destination'],
    [/^saw\b/,'saw'],
    [/^the conjuring\b/,'conjuring'],
    [/^insidious\b/,'insidious'],
    [/^paranormal activity\b/,'paranormal activity'],
    [/^the bourne\b|^bourne\b/,'bourne'],
    [/^oceans?\b/,'oceans'],
    [/^men in black\b/,'men black'],
    [/^bad boys\b/,'bad boys'],
    [/^beverly hills cop\b/,'beverly hills cop'],
    [/^die hard\b/,'die hard'],
    [/^lethal weapon\b/,'lethal weapon'],
    [/^home alone\b/,'home alone'],
    [/^jumanji\b/,'jumanji'],
    [/^night at the museum\b/,'night museum'],
    [/^despicable me\b|^minions\b/,'despicable me'],
    [/^kung fu panda\b/,'kung fu panda'],
    [/^how to train your dragon\b/,'dragon'],
    [/^cars\b/,'cars'],
    [/^frozen\b/,'frozen'],
    [/^the incredibles\b|^incredibles\b/,'incredibles'],
    [/^madagascar\b/,'madagascar'],
    [/^hotel transylvania\b/,'hotel transylvania'],
    [/^pitch perfect\b/,'pitch perfect'],
    [/^the hangover\b/,'hangover'],
    [/^rush hour\b/,'rush hour'],
    [/^austin powers\b/,'austin powers'],
    [/^meet the parents\b|^meet the fockers\b|^little fockers\b/,'fockers'],
    [/^zoolander\b/,'zoolander'],
    [/^legally blonde\b/,'legally blonde'],
    [/^bridget jones\b/,'bridget jones'],
    [/^magic mike\b/,'magic mike'],
    [/^ted\b/,'ted'],
    [/^paddington\b/,'paddington'],
    [/^a quiet place\b/,'quiet place'],
    [/^the exorcist\b|^exorcist\b/,'exorcist'],
    [/^the omen\b|^omen\b/,'omen'],
    [/^the godfather\b/,'godfather'],
    [/^blade runner\b/,'blade runner'],
    [/^tron\b/,'tron'],
    [/^planet of the apes\b|^rise of the planet of the apes\b|^dawn of the planet of the apes\b|^war for the planet of the apes\b/,'planet apes'],
    [/^godzilla\b/,'godzilla'],
    [/^star trek\b/,'star trek'],
    [/^x men\b|^xmen\b/,'x men'],
    [/^fantastic four\b/,'fantastic four'],
    [/^blade\b/,'blade'],
    [/^hellboy\b/,'hellboy'],
    [/^teenage mutant ninja turtles\b/,'tmnt'],
    [/^james bond\b|^007\b/,'bond']
  ];

  function normaliseTitle(title) {
    return String(title || '')
      .toLowerCase()
      .replace(/&/g,' and ')
      .replace(/[’']/g,'')
      .replace(/[^a-z0-9:]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function franchiseKey(movie) {
    const t = normaliseTitle(movie.title);

    for (const [rule,key] of FRANCHISE_RULES) {
      if (rule.test(t)) return `f:${key}`;
    }

    // Titles with a shared colon prefix are usually explicit series entries.
    if (t.includes(':')) {
      const prefix = t.split(':')[0].trim();
      if (prefix.split(' ').length >= 2) return `c:${prefix}`;
    }

    // Strip obvious sequel numbering and Part/Chapter markers.
    const stripped = t
      .replace(/\b(part|chapter|volume|vol|episode)\s+(one|two|three|four|five|six|seven|eight|nine|ten|[ivx]+|\d+)\b.*$/,'')
      .replace(/\s+\b([ivx]{2,}|\d{1,2})\b$/,'')
      .trim();

    if (stripped !== t && stripped.length >= 4) return `n:${stripped}`;

    return `u:${t}:${movie.year || ''}`;
  }

  function removeSequels(movies) {
    const sorted = [...movies].sort((a,b) =>
      (Number(a.year)||9999) - (Number(b.year)||9999) ||
      String(a.title).localeCompare(String(b.title))
    );
    const seen = new Set();
    const kept = [];

    for (const movie of sorted) {
      const key = franchiseKey(movie);
      if (seen.has(key)) continue;
      seen.add(key);
      kept.push(movie);
    }
    return kept;
  }

  function shuffled(items) {
    const a = [...items];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function paintBlack() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
  }

  function scoreForLines(lines) {
    if (lines <= 1) return 1000;
    if (lines === 2) return 500;
    if (lines === 3) return 100;
    if (lines === 4) return 50;
    return Math.max(1,54-lines);
  }

  function updateStats() {
    const shownRound = currentRound === 0 ? 0 : Math.min(currentRound,GAME_ROUNDS);
    els.roundStat.textContent = `${shownRound} / ${GAME_ROUNDS}`;
    els.linesStat.textContent = String(linesRevealed);
    els.wrongStat.textContent = `${wrongThisRound} / ${MAX_WRONG}`;
    els.scoreStat.textContent = String(totalScore);
  }

  function setMessage(text) { els.message.textContent = text; }

  function posterCandidates(movie) {
    if (movie.file) return [`posters/${movie.file}`];
    const slug = movie.slug || normaliseTitle(movie.title).replace(/\s+/g,'-');
    return EXTENSIONS.map(ext=>`posters/${slug}.${ext}`);
  }

  function tryImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({img,src});
      img.onerror = () => resolve(null);
      img.src = src;
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
    sourceCtx.fillStyle='#000';
    sourceCtx.fillRect(0,0,CANVAS_W,CANVAS_H);
    const scale=Math.max(CANVAS_W/img.naturalWidth,CANVAS_H/img.naturalHeight);
    const w=img.naturalWidth*scale, h=img.naturalHeight*scale;
    sourceCtx.drawImage(img,(CANVAS_W-w)/2,(CANVAS_H-h)/2,w,h);
  }

  function chooseUnique(set,max) {
    if (set.size >= max) return null;
    let n;
    do n=Math.floor(Math.random()*max); while(set.has(n));
    set.add(n);
    return n;
  }

  function revealLine() {
    if (!playing) return;
    let horizontal=Math.random()<.5;
    if (usedHorizontal.size>=CANVAS_H) horizontal=false;
    if (usedVertical.size>=CANVAS_W) horizontal=true;

    if (horizontal) {
      const y=chooseUnique(usedHorizontal,CANVAS_H);
      if (y!==null) ctx.drawImage(sourceCanvas,0,y,CANVAS_W,1,0,y,CANVAS_W,1);
    } else {
      const x=chooseUnique(usedVertical,CANVAS_W);
      if (x!==null) ctx.drawImage(sourceCanvas,x,0,1,CANVAS_H,x,0,1,CANVAS_H);
    }
    linesRevealed++;
    updateStats();
    setMessage(`${linesRevealed} ${linesRevealed===1?'line':'lines'} revealed · ${scoreForLines(linesRevealed)} points if you get it now.`);
  }

  function setButtonsEnabled(enabled) {
    els.movieButtons.querySelectorAll('.movie-btn').forEach(btn=>btn.disabled=!enabled);
  }

  function renderMovieButtons() {
    const q=els.movieSearch.value.trim().toLowerCase();
    els.movieButtons.innerHTML='';

    choicePool.forEach((movie,index)=>{
      if (q && !`${movie.title} ${movie.year||''}`.toLowerCase().includes(q)) return;
      const btn=document.createElement('button');
      btn.className='movie-btn';
      btn.dataset.slug=movie.slug || normaliseTitle(movie.title);
      btn.dataset.color=String(index%8);
      btn.disabled=!playing;
      btn.innerHTML=`<span>${movie.title}</span><span class="year">${movie.year||''}</span>`;
      if (wrongGuesses.has(movie.title)) btn.classList.add('wrong');
      btn.addEventListener('click',()=>handleGuess(movie,btn));
      els.movieButtons.appendChild(btn);
    });
  }

  function showFullPoster() { ctx.drawImage(sourceCanvas,0,0); }

  function markCorrectButton() {
    [...els.movieButtons.querySelectorAll('.movie-btn')].forEach(btn=>{
      const movie=choicePool.find(m=>(m.slug||normaliseTitle(m.title))===btn.dataset.slug);
      if (movie && movie.title===currentMovie.title) btn.classList.add('correct');
    });
  }

  function endRound(kind) {
    if (!currentMovie) return;
    playing=false;
    showFullPoster();
    setButtonsEnabled(false);
    els.nextLineBtn.disabled=true;
    els.passBtn.disabled=true;
    markCorrectButton();

    if (kind==='correct') {
      const earned=scoreForLines(linesRevealed);
      totalScore+=earned;
      totalCorrect++;
      els.resultKicker.textContent='CORRECT';
      els.resultDetail.textContent=`${currentMovie.year||''} · ${linesRevealed} ${linesRevealed===1?'line':'lines'} · +${earned} points`;
      setMessage(`Correct — ${currentMovie.title}.`);
    } else if (kind==='out') {
      els.resultKicker.textContent='THREE WRONG — OUT';
      els.resultDetail.textContent=`${currentMovie.year||''} · the answer was ${currentMovie.title}`;
      setMessage(`Round over. The poster was ${currentMovie.title}.`);
    } else {
      totalPasses++;
      totalScore-=5;
      els.resultKicker.textContent='PASSED · −5';
      els.resultDetail.textContent=`${currentMovie.year||''} · the answer was ${currentMovie.title}`;
      setMessage(`Passed — ${currentMovie.title}.`);
    }

    els.resultTitle.textContent=currentMovie.title;
    updateStats();

    const finalRound=currentRound>=GAME_ROUNDS;
    els.nextRoundBtn.textContent=finalRound?'SEE RESULTS':'NEXT ROUND';
    els.resultPanel.classList.remove('hidden');
  }

  function handleGuess(movie,btn) {
    if (!playing || !currentMovie) return;

    if (movie.title===currentMovie.title) {
      endRound('correct');
      return;
    }

    wrongThisRound++;
    totalWrong++;
    totalScore-=3;
    wrongGuesses.add(movie.title);
    btn.classList.add('wrong');
    btn.disabled=true;
    updateStats();

    if (wrongThisRound>=MAX_WRONG) {
      endRound('out');
      return;
    }

    revealLine();
    setMessage(`Wrong — −3 points. ${MAX_WRONG-wrongThisRound} ${MAX_WRONG-wrongThisRound===1?'guess':'guesses'} left.`);
  }

  function ratingFor(score,correct) {
    if (score>=8500 || (correct===10 && score>=7000)) {
      return {
        heading:'Cinema Oracle',
        line:'You read movie posters like Neo reads the Matrix.'
      };
    }
    if (score>=6000 || correct>=9) {
      return {
        heading:'Poster Master',
        line:'Marty McFly could drop you in any decade and you would still know what was playing.'
      };
    }
    if (score>=3500 || correct>=7) {
      return {
        heading:'Serious Film Brain',
        line:'Indiana Jones would call that choosing wisely.'
      };
    }
    if (score>=1500 || correct>=5) {
      return {
        heading:'Multiplex Survivor',
        line:'Ripley-level instincts: you survived, although a few posters nearly got you.'
      };
    }
    if (score>=400 || correct>=3) {
      return {
        heading:'Cult Favourite',
        line:'Rocky took a few hits as well. You are still standing.'
      };
    }
    return {
      heading:'Needs A Sequel',
      line:'The Dude abides. Your poster knowledge could use another screening.'
    };
  }

  function showFinalResults() {
    const rating=ratingFor(totalScore,totalCorrect);
    els.finalHeading.textContent=rating.heading;
    els.finalScore.textContent=String(totalScore);
    els.finalReference.textContent=rating.line;
    els.finalCorrect.textContent=`${totalCorrect} / ${GAME_ROUNDS}`;
    els.finalWrong.textContent=String(totalWrong);
    els.finalPasses.textContent=String(totalPasses);
    els.finalDialog.showModal();
  }

  async function startRound() {
    els.resultPanel.classList.add('hidden');
    wrongThisRound=0;
    wrongGuesses=new Set();
    linesRevealed=0;
    usedHorizontal=new Set();
    usedVertical=new Set();
    els.movieSearch.value='';
    playing=false;
    paintBlack();
    setButtonsEnabled(false);

    currentRound++;
    currentMovie=roundAnswers[currentRound-1];
    updateStats();
    renderMovieButtons();
    setMessage('Loading poster…');

    let resolved=await resolvePoster(currentMovie);

    // If a poster is unexpectedly missing, swap in another unused choice.
    if (!resolved) {
      const alreadyUsed=new Set(roundAnswers.slice(0,currentRound).map(m=>m.title));
      for (const candidate of choicePool) {
        if (alreadyUsed.has(candidate.title)) continue;
        const test=await resolvePoster(candidate);
        if (test) {
          currentMovie=candidate;
          roundAnswers[currentRound-1]=candidate;
          resolved=test;
          break;
        }
      }
    }

    if (!resolved) {
      setMessage('This poster file could not be loaded.');
      return;
    }

    drawSourceImage(resolved.img);
    paintBlack();
    playing=true;
    els.nextLineBtn.disabled=false;
    els.passBtn.disabled=false;
    renderMovieButtons();
    revealLine();
  }

  function startNewGame() {
    totalScore=0;
    totalCorrect=0;
    totalWrong=0;
    totalPasses=0;
    currentRound=0;
    wrongThisRound=0;
    linesRevealed=0;
    currentMovie=null;
    playing=false;

    const shuffledLibrary=shuffled(sequelFiltered);
    choicePool=shuffledLibrary.slice(0,Math.min(CHOICE_COUNT,shuffledLibrary.length));
    roundAnswers=shuffled(choicePool).slice(0,Math.min(GAME_ROUNDS,choicePool.length));

    els.libraryInfo.textContent=`50 from ${sequelFiltered.length} sequel-free films`;
    els.introPanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    if (els.finalDialog.open) els.finalDialog.close();
    updateStats();
    renderMovieButtons();
    startRound();
  }

  function toggleTheme() {
    const html=document.documentElement;
    const next=html.dataset.theme==='dark'?'light':'dark';
    html.dataset.theme=next;
    localStorage.setItem('posterline-theme',next);
    els.themeBtn.textContent=next==='dark'?'LIGHT MODE':'DARK MODE';
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  }

  async function init() {
    paintBlack();

    const savedTheme=localStorage.getItem('posterline-theme');
    if (savedTheme==='light' || savedTheme==='dark') document.documentElement.dataset.theme=savedTheme;
    els.themeBtn.textContent=document.documentElement.dataset.theme==='dark'?'LIGHT MODE':'DARK MODE';

    try {
      const response=await fetch('movies.json',{cache:'no-store'});
      if (!response.ok) throw new Error(`movies.json returned ${response.status}`);
      allMovies=await response.json();
      sequelFiltered=removeSequels(allMovies);

      const removed=allMovies.length-sequelFiltered.length;
      els.libraryInfo.textContent=`${sequelFiltered.length} films · ${removed} sequels removed`;

      if (sequelFiltered.length<10) throw new Error('Not enough films remain after sequel filtering.');

      choicePool=shuffled(sequelFiltered).slice(0,Math.min(CHOICE_COUNT,sequelFiltered.length));
      renderMovieButtons();
      updateStats();
      setMessage('Press Start Game to begin.');
    } catch (err) {
      console.error(err);
      setMessage('Could not load movies.json. Run Posterline through GitHub Pages or another web server.');
      els.startBtn.disabled=true;
    }
  }

  els.startBtn.addEventListener('click',startNewGame);
  els.newGameBtn.addEventListener('click',startNewGame);
  els.nextLineBtn.addEventListener('click',revealLine);
  els.passBtn.addEventListener('click',()=>{ if(playing) endRound('pass'); });
  els.movieSearch.addEventListener('input',renderMovieButtons);
  els.themeBtn.addEventListener('click',toggleTheme);
  els.fullscreenBtn.addEventListener('click',toggleFullscreen);

  els.nextRoundBtn.addEventListener('click',()=>{
    if (currentRound>=GAME_ROUNDS) {
      els.resultPanel.classList.add('hidden');
      showFinalResults();
    } else {
      startRound();
    }
  });

  document.addEventListener('fullscreenchange',()=>{
    els.fullscreenBtn.textContent=document.fullscreenElement?'EXIT FULL SCREEN':'FULL SCREEN';
  });

  document.addEventListener('keydown',event=>{
    if (event.code==='Space' && playing && !event.target.matches('input,button')) {
      event.preventDefault();
      revealLine();
    }
    if (event.key==='/' && !event.target.matches('input')) {
      event.preventDefault();
      els.movieSearch.focus();
    }
  });

  init();
})();
