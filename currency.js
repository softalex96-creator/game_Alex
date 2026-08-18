const levelUpCurrencies = {
  KGS: { factor: 1, suffix: "сом", decimals: 0 },
  RUB: { factor: 0.9, suffix: "₽", decimals: 0 },
  BYN: { factor: 0.033, suffix: "Br", decimals: 2 },
};

const currencyNotes = {
  ru: { KGS: "Цены в KGS. Пересчёт в другие валюты отображается ориентировочно; оплата на сайте пока не подключена.", RUB: "Цены показаны в RUB по ориентировочному пересчёту. Финальная стоимость подтверждается до оплаты.", BYN: "Цены показаны в BYN по ориентировочному пересчёту. Финальная стоимость подтверждается до оплаты." },
  ky: { KGS: "Баалар KGS менен. Башка валюталарга эсептөө багыт берүү үчүн гана; сайтта төлөм азырынча туташтырылган эмес.", RUB: "Баалар RUB менен багыт берүүчү эсептөөдө көрсөтүлдү. Акыркы баа төлөмгө чейин такталат.", BYN: "Баалар BYN менен багыт берүүчү эсептөөдө көрсөтүлдү. Акыркы баа төлөмгө чейин такталат." },
  be: { KGS: "Цэны ў KGS. Пераразлік у іншыя валюты носіць даведачны характар; аплата на сайце пакуль не падключана.", RUB: "Цэны паказаны ў RUB па арыентыровачным пераразліку. Канчатковы кошт пацвярджаецца перад аплатай.", BYN: "Цэны паказаны ў BYN па арыентыровачным пераразліку. Канчатковы кошт пацвярджаецца перад аплатай." },
};

const currencySelect = document.querySelector("[data-currency-select]");
const currencyNote = document.querySelector("[data-currency-note]");
const priceElements = [...document.querySelectorAll(".game-card")].map((card) => {
  const price = card.querySelector("p:not(.game-label)");
  const amount = Number(price?.textContent.match(/\d+/)?.[0]);
  return { price, amount };
}).filter(({ price, amount }) => price && Number.isFinite(amount));

function priceText(amount, currency) {
  const { factor, suffix, decimals } = levelUpCurrencies[currency];
  const value = amount * factor;
  const formatted = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return `от ${formatted} ${suffix}`;
}

function renderCurrency(currency) {
  const selected = levelUpCurrencies[currency] ? currency : "KGS";
  priceElements.forEach(({ price, amount }) => { price.textContent = priceText(amount, selected); });
  if (currencySelect) currencySelect.value = selected;
  const language = document.documentElement.lang || "ru";
  if (currencyNote) currencyNote.textContent = (currencyNotes[language] || currencyNotes.ru)[selected];
  try { localStorage.setItem("levelup-currency", selected); } catch { /* The selector still works without browser storage. */ }
}

let savedCurrency = "KGS";
try { savedCurrency = localStorage.getItem("levelup-currency") || "KGS"; } catch { /* KGS is the default. */ }
renderCurrency(savedCurrency);

currencySelect?.addEventListener("change", () => renderCurrency(currencySelect.value));
window.addEventListener("levelup-language-change", () => renderCurrency(currencySelect?.value || savedCurrency));
