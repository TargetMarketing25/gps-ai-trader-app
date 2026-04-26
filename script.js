const screens = {
  welcome: document.getElementById("welcomeScreen"),
  chat: document.getElementById("chatScreen"),
  loading: document.getElementById("loadingScreen"),
  result: document.getElementById("resultScreen")
};

const chatContainer = document.getElementById("chatContainer");
const optionsContainer = document.getElementById("optionsContainer");
const resultCard = document.getElementById("resultCard");

const startBtn = document.getElementById("startBtn");
const newSignalBtn = document.getElementById("newSignalBtn");

const questions = [
  {
    key: "risk",
    text: "ما مستوى المخاطرة المناسب لك؟",
    options: ["منخفضة", "متوسطة", "عالية"]
  },
  {
    key: "style",
    text: "ما أسلوب التداول المفضل؟",
    options: ["Scalping", "Intraday", "Swing", "Long Term"]
  },
  {
    key: "market",
    text: "عايز تتداول على إيه؟",
    options: ["Metals", "Forex", "Crypto", "Stocks", "Indices"]
  },
  {
    key: "asset",
    text: "اختار الأصل:",
    dynamicOptions: (answers) => {
      const lookup = {
        Metals: ["XAUUSD", "XAGUSD"],
        Forex: ["EURUSD", "GBPUSD", "USDJPY", "GBPJPY"],
        Crypto: ["BTCUSD", "ETHUSD", "SOLUSD"],
        Stocks: ["AAPL", "TSLA", "NVDA", "META"],
        Indices: ["NASDAQ", "S&P 500", "Dow Jones"]
      };
      return lookup[answers.market] || [];
    }
  },
  {
    key: "capital",
    text: "رأس المال كام؟",
    options: ["$100", "$500", "$1000", "$5000", "Custom amount"]
  }
];

let questionIndex = 0;
let answers = {};

function setActiveScreen(target) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[target].classList.add("active");
}

function addBubble(text, type = "ai") {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearOptions() {
  optionsContainer.innerHTML = "";
}

function renderOptions(options, onClick) {
  clearOptions();

  options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => onClick(option));
    optionsContainer.appendChild(btn);
  });
}

function askCurrentQuestion() {
  if (questionIndex >= questions.length) {
    renderGenerateSignalButton();
    return;
  }

  const current = questions[questionIndex];
  addBubble(current.text, "ai");

  const opts = current.dynamicOptions ? current.dynamicOptions(answers) : current.options;

  renderOptions(opts, (option) => {
    if (current.key === "capital" && option === "Custom amount") {
      const amount = prompt("اكتب رأس المال بالدولار");
      if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
        alert("من فضلك أدخل رقم صحيح.");
        return;
      }
      answers[current.key] = `$${Number(amount)}`;
      addBubble(answers[current.key], "user");
    } else {
      answers[current.key] = option;
      addBubble(option, "user");
    }

    questionIndex += 1;
    askCurrentQuestion();
  });
}

function renderGenerateSignalButton() {
  clearOptions();
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = "توليد الإشارة";
  btn.addEventListener("click", showLoadingAndGenerate);
  optionsContainer.appendChild(btn);
}

function formatPrice(asset, value) {
  if (["EURUSD", "GBPUSD"].includes(asset)) return value.toFixed(4);
  if (["USDJPY", "GBPJPY"].includes(asset)) return value.toFixed(2);
  if (["NASDAQ", "S&P 500", "Dow Jones", "BTCUSD", "ETHUSD", "SOLUSD"].includes(asset)) {
    return value.toFixed(2);
  }
  if (["AAPL", "TSLA", "NVDA", "META"].includes(asset)) return value.toFixed(2);
  return value.toFixed(2);
}

function getAssetRange(asset) {
  const ranges = {
    XAUUSD: [2300, 3600],
    XAGUSD: [24, 55],
    EURUSD: [1.05, 1.15],
    GBPUSD: [1.2, 1.35],
    USDJPY: [130, 170],
    GBPJPY: [150, 220],
    BTCUSD: [50000, 120000],
    ETHUSD: [2500, 8000],
    SOLUSD: [80, 420],
    AAPL: [140, 280],
    TSLA: [150, 450],
    NVDA: [300, 1400],
    META: [220, 700],
    NASDAQ: [14000, 23000],
    "S&P 500": [4200, 6800],
    "Dow Jones": [32000, 50000]
  };

  return ranges[asset] || [100, 500];
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSignal() {
  const asset = answers.asset;
  const [min, max] = getAssetRange(asset);
  const seed =
    answers.risk.length + answers.style.length + answers.market.length + answers.asset.length + answers.capital.length;

  const entry = min + (max - min) * seededRandom(seed);
  const direction = seededRandom(seed + 8) > 0.5 ? "BUY" : "SELL";
  const riskMap = { منخفضة: 1, متوسطة: 2, عالية: 3 };
  const riskPercent = riskMap[answers.risk] || 1;

  const slDistance = entry * (riskPercent / 100) * 0.8;
  const rrStep = entry * (riskPercent / 100) * 0.9;

  const stopLoss = direction === "BUY" ? entry - slDistance : entry + slDistance;
  const tp1 = direction === "BUY" ? entry + rrStep : entry - rrStep;
  const tp2 = direction === "BUY" ? entry + rrStep * 1.8 : entry - rrStep * 1.8;
  const tp3 = direction === "BUY" ? entry + rrStep * 2.6 : entry - rrStep * 2.6;

  const capNum = Number(String(answers.capital).replace(/[^\d.]/g, "")) || 100;
  const riskAmount = capNum * (riskPercent / 100);
  const lotSize = Math.max(0.01, Math.min(3, riskAmount / 100)).toFixed(2);
  const confidence = Math.round(66 + seededRandom(seed + 17) * 27);

  const reason = `الإشارة مبنية على أسلوب ${answers.style} مع مخاطرة ${answers.risk} وقراءة زخم ${answers.market}. إدارة رأس المال تم ضبطها على ${riskPercent}% من رأس المال.`;

  return {
    asset,
    direction,
    entry: formatPrice(asset, entry),
    stopLoss: formatPrice(asset, stopLoss),
    tp1: formatPrice(asset, tp1),
    tp2: formatPrice(asset, tp2),
    tp3: formatPrice(asset, tp3),
    riskLevel: `${answers.risk} (${riskPercent}%)`,
    lotSize,
    confidence: `${confidence}%`,
    style: answers.style,
    reason
  };
}

function renderSignal(signal) {
  resultCard.innerHTML = `
    <h2>Professional Signal Card</h2>
    <div class="grid">
      <div class="metric"><small>Asset</small><strong>${signal.asset}</strong></div>
      <div class="metric"><small>Direction</small><strong>${signal.direction}</strong></div>
      <div class="metric"><small>Entry Price</small><strong>${signal.entry}</strong></div>
      <div class="metric"><small>Stop Loss</small><strong>${signal.stopLoss}</strong></div>
      <div class="metric"><small>TP1</small><strong>${signal.tp1}</strong></div>
      <div class="metric"><small>TP2</small><strong>${signal.tp2}</strong></div>
      <div class="metric"><small>TP3</small><strong>${signal.tp3}</strong></div>
      <div class="metric"><small>Risk Level</small><strong>${signal.riskLevel}</strong></div>
      <div class="metric"><small>Suggested lot size</small><strong>${signal.lotSize}</strong></div>
      <div class="metric"><small>Confidence score</small><strong>${signal.confidence}</strong></div>
      <div class="metric"><small>Trading style</small><strong>${signal.style}</strong></div>
    </div>
    <div class="analysis"><strong>Short analysis:</strong><br/>${signal.reason}</div>
  `;
}

function showLoadingAndGenerate() {
  setActiveScreen("loading");

  setTimeout(() => {
    const signal = generateSignal();
    renderSignal(signal);
    setActiveScreen("result");
  }, 3000);
}

function resetFlow() {
  questionIndex = 0;
  answers = {};
  chatContainer.innerHTML = "";
  clearOptions();
  setActiveScreen("chat");
  askCurrentQuestion();
}

startBtn.addEventListener("click", resetFlow);
newSignalBtn.addEventListener("click", resetFlow);
