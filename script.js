document.addEventListener("DOMContentLoaded", () => {
const wordList = [
  "kalem", "masa", "araba", "defter", "rakı", "ırmak", "salon", "nohut", "tava", "armut", "top", "pamuk",
  "kum", "makas", "sandalye", "elbise", "etek", "kitap", "pantolon", "nevresim", "masaüstü", "ütü",
  "üçgen", "nargile", "eşarp", "pantograf", "fil", "lamba", "ayna", "asansör", "rende", "ekmek",
  "kurabiye", "yoğurt", "televizyon", "nazarlık", "kamera", "ayakkabı", "battaniye", "ekran",
  "nefes", "sandal", "lokum", "merdiven", "nevruz", "zarf", "fare", "elbise", "eldiven", "not",
  "tren", "ney", "yatak", "kitaplık", "koltuk", "kasa", "ayna", "adet", "tükenmez", "zımba"
];

  let mainChain = "";
  let usedWords = [];
  let score = 0;
  let timeLeft = 5;
  let timer = null;
  let highScore = localStorage.getItem("highScore") || 0;
  
  const lang = navigator.language.startsWith("tr") ? "tr" : "en";

  const popupOverlay = document.getElementById("popup-overlay");
  const popupText = document.getElementById("popup-text");
  const infoButton = document.getElementById("info-button");
  const closePopup = document.getElementById("close-popup");
  const mainWordEl = document.getElementById("main-word");
  const inputEl = document.getElementById("word-input");
  const timerEl = document.getElementById("timer");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const messageEl = document.getElementById("message");
  const startButton = document.getElementById("start-button");

  const texts = {
    tr: {
      startButton: "Başlat",
      placeholder: "Kelime yaz...",
      timeUp: "⏰ Süre doldu!",
      mustStartWith: (char) => `❌ Kelime bu harfle başlamalı: \"${char}\"`,
      alreadyUsed: (word) => `❌ Bu kelime zaten kullanıldı: \"${word}\"`,
      notInTDK: (word) => `❌ \"${word}\" TDK'da bulunamadı!`,
      gameOver: "Oyun bitti!",
      scoreText: "Puan",
      highScoreText: "Rekor"
    },
    en: {
      startButton: "Start",
      placeholder: "Type a word...",
      timeUp: "⏰ Time’s up!",
      mustStartWith: (char) => `❌ Word must start with: \"${char}\"`,
      alreadyUsed: (word) => `❌ This word was already used: \"${word}\"`,
      notInTDK: (word) => `❌ \"${word}\" not found in dictionary!`,
      gameOver: "Game Over!",
      scoreText: "Score",
      highScoreText: "High Score"
    }
  };

  const instructions = {
    tr: `Sana bir kelime verilecek. 5 saniyede bu kelimenin SON harfiyle başlayan yeni bir kelime yazmalısın.\nKelimeler TDK'dan kontrol edilir. Aynı kelimeyi tekrar yazamazsın. Ne kadar hızlı ve uzun kelime yazarsan, o kadar çok puan alırsın.`,
    en: `You'll get a word. Within 5 seconds, you must enter a new word that starts with the LAST letter of the chain.\nWords are checked via dictionary. Repeated words end the game. Faster & longer words mean more points!`
  };

  highScoreEl.textContent = `${texts[lang].highScoreText}: ${highScore}`;
  startButton.textContent = texts[lang].startButton;
  inputEl.placeholder = texts[lang].placeholder;
  scoreEl.textContent = `${texts[lang].scoreText}: 0`;

  function showPopup() {
    popupText.textContent = instructions[lang];
    popupOverlay.classList.remove("hidden");
  }

  function hidePopup() {
    popupOverlay.classList.add("hidden");
  }

  infoButton.addEventListener("click", showPopup);
  closePopup.addEventListener("click", hidePopup);
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) hidePopup();
  });

  if (!localStorage.getItem("visited")) {
    showPopup();
    localStorage.setItem("visited", "true");
  }

  function capitalizeFirstLetter(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  function startGame() {
    const startWord = wordList[Math.floor(Math.random() * wordList.length)];
    mainChain = capitalizeFirstLetter(startWord);
    usedWords = [startWord];
    score = 0;
    timeLeft = 5;

    mainWordEl.textContent = mainChain;
    scoreEl.textContent = `${texts[lang].scoreText}: ${score}`;
    messageEl.textContent = "";
    inputEl.disabled = false;
    inputEl.value = "";
    inputEl.focus();
    startButton.disabled = true;

    startTimer();
  }

  function startTimer() {
    clearInterval(timer);
    timeLeft = 5;
    timerEl.textContent = `⏱ ${timeLeft}`;
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `⏱ ${timeLeft}`;
      if (timeLeft <= 0) {
        endGame(texts[lang].timeUp);
      }
    }, 1000);
  }

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const newWord = inputEl.value.trim().toLowerCase();
      checkWord(newWord);
    }
  });

  function checkWordValidity(word) {
    if (lang === "tr") {
      return fetch(`https://sozluk.gov.tr/gts?ara=${word}`)
        .then(res => res.json())
        .then(data => data.length > 0)
        .catch(() => false);
    } else {
      return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(res => res.status === 200)
        .catch(() => false);
    }
  }

  async function checkWord(newWord) {
    if (!newWord) return;

    const lastWord = usedWords[usedWords.length - 1];
    const lastChar = lastWord[lastWord.length - 1];

    if (newWord[0] !== lastChar) {
      return endGame(texts[lang].mustStartWith(lastChar));
    }

    if (usedWords.includes(newWord)) {
      return endGame(texts[lang].alreadyUsed(newWord));
    }

    const isValid = await checkWordValidity(newWord);
    if (!isValid) {
      return endGame(texts[lang].notInTDK(newWord));
    }

    usedWords.push(newWord);
    mainChain += newWord;
    mainWordEl.textContent = mainChain;
    mainWordEl.style.fontSize = `${Math.max(12, 32 - usedWords.length)}px`;

    score += timeLeft + newWord.length * 2;
    scoreEl.textContent = `${texts[lang].scoreText}: ${score}`;

    inputEl.value = "";
    inputEl.focus();
    startTimer();
  }

  function endGame(message) {
    clearInterval(timer);
    inputEl.disabled = true;
    startButton.disabled = false;
    messageEl.textContent = `${message} ${texts[lang].scoreText}: ${score}`;
    mainWordEl.textContent = texts[lang].gameOver;

    if (score > highScore) {
      localStorage.setItem("highScore", score);
      highScoreEl.textContent = `${texts[lang].highScoreText}: ${score}`;
    }
  }

  window.startGame = startGame;
});