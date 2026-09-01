const levelUpCurrencies = {
  KGS: { suffix: "сом", decimals: 0 },
  RUB: { suffix: "₽", decimals: 0 },
  BYN: { suffix: "BYN", decimals: 2 },
};
const currencyForLanguage = { ru: "RUB", ky: "KGS", be: "BYN" };
const currencyApi = "https://api.gamemaster.cc/rates/cbr";
let cbrRates = { RUB: 1 };
let cbrDate = null;

const currencySelects = [...document.querySelectorAll("[data-currency-select]")];
const currencyNote = document.querySelector("[data-currency-note]");
const priceElements = [...document.querySelectorAll(".game-card")].map((card) => {
  const price = card.querySelector("p:not(.game-label)");
  const amount = Number(card.dataset.price || price?.textContent.match(/\d+/)?.[0]);
  return { price, amount };
}).filter(({ price, amount }) => price && Number.isFinite(amount));

function priceText(amount, currency) {
  const { suffix, decimals } = levelUpCurrencies[currency];
  const rublesPerUnit = cbrRates[currency];
  const value = currency === "RUB" ? amount : amount / rublesPerUnit;
  const formatted = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return amount > 0 ? `${formatted} ${suffix}` : "Недоступно";
}

function noteText(language, currency) {
  const date = cbrDate ? ` на ${cbrDate}` : "";
  const messages = {
    ru: `Цены пересчитаны по официальному курсу ЦБ РФ${date}. Итоговая оплата проходит в RUB.`,
    ky: `Баалар Россия Банкынын расмий курсу боюнча${date} эсептелди. Төлөмдүн акыркы суммасы RUB менен жүргүзүлөт.`,
    be: `Цэны пералічаныя па афіцыйным курсе Банка Расіі${date}. Канчатковая аплата праводзіцца ў RUB.`,
  };
  return messages[language] || messages.ru;
}

function renderCurrency(currency) {
  const selected = levelUpCurrencies[currency] ? currency : "RUB";
  const activeCurrency = cbrRates[selected] ? selected : "RUB";
  priceElements.forEach(({ price, amount }) => { price.textContent = priceText(amount, activeCurrency); });
  currencySelects.forEach((select) => { select.value = activeCurrency; });
  const language = document.documentElement.lang || "ru";
  if (currencyNote) currencyNote.textContent = noteText(language, activeCurrency);
  window.dispatchEvent(new CustomEvent("levelup-currency-change", { detail: activeCurrency }));
  try { localStorage.setItem("levelup-currency-v3", activeCurrency); } catch { /* The selector still works without browser storage. */ }
}

async function loadOfficialRates() {
  const response = await fetch(currencyApi, { cache: "no-store" });
  if (!response.ok) throw new Error("Official exchange rates are unavailable");
  const payload = await response.json();
  if (!payload?.ok || !payload.rates?.KGS || !payload.rates?.BYN) throw new Error("Official exchange rates are incomplete");
  cbrRates = payload.rates;
  cbrDate = payload.date;
}

const initialLanguage = document.documentElement.lang || "ru";
renderCurrency(currencyForLanguage[initialLanguage] || "RUB");
loadOfficialRates().then(() => renderCurrency(currencyForLanguage[document.documentElement.lang] || "RUB")).catch(() => {
  renderCurrency("RUB");
  if (currencyNote) currencyNote.textContent = "Курс ЦБ РФ временно недоступен. Цены отображены в RUB.";
});

currencySelects.forEach((select) => select.addEventListener("change", () => renderCurrency(select.value)));
window.addEventListener("levelup-language-change", () => renderCurrency(currencyForLanguage[document.documentElement.lang] || "RUB"));
