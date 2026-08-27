const levelUpCurrencies = {
  KGS: { factor: 1.08, suffix: "сом", decimals: 0 },
  RUB: { factor: 1, suffix: "₽", decimals: 0 },
  BYN: { factor: 0.037, suffix: "Br", decimals: 2 },
};

const currencyNotes = {
  ru: { KGS: "Цены пересчитаны в KGS ориентировочно. Наличие и финальная стоимость подтверждаются перед оплатой.", RUB: "Цены указаны в RUB как ориентир по открытым витринам. Наличие и финальная стоимость подтверждаются перед оплатой.", BYN: "Цены пересчитаны в BYN ориентировочно. Наличие и финальная стоимость подтверждаются перед оплатой." },
  ky: { KGS: "Баалар KGS менен. Башка валюталарга эсептөө багыт берүү үчүн гана; сайтта төлөм азырынча туташтырылган эмес.", RUB: "Баалар RUB менен багыт берүүчү эсептөөдө көрсөтүлдү. Акыркы баа төлөмгө чейин такталат.", BYN: "Баалар BYN менен багыт берүүчү эсептөөдө көрсөтүлдү. Акыркы баа төлөмгө чейин такталат." },
  be: { KGS: "Цэны ў KGS. Пераразлік у іншыя валюты носіць даведачны характар; аплата на сайце пакуль не падключана.", RUB: "Цэны паказаны ў RUB па арыентыровачным пераразліку. Канчатковы кошт пацвярджаецца перад аплатай.", BYN: "Цэны паказаны ў BYN па арыентыровачным пераразліку. Канчатковы кошт пацвярджаецца перад аплатай." },
};

const currencySelects = [...document.querySelectorAll("[data-currency-select]")];
const currencyNote = document.querySelector("[data-currency-note]");
const priceElements = [...document.querySelectorAll(".game-card")].map((card) => {
  const price = card.querySelector("p:not(.game-label)");
  const amount = Number(card.dataset.price || price?.textContent.match(/\d+/)?.[0]);
  return { price, amount };
}).filter(({ price, amount }) => price && Number.isFinite(amount));

function priceText(amount, currency) {
  const { factor, suffix, decimals } = levelUpCurrencies[currency];
  const value = amount * factor;
  const formatted = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  return amount > 0 ? `${formatted} ${suffix}` : "Недоступно";
}

function renderCurrency(currency) {
  const selected = levelUpCurrencies[currency] ? currency : "RUB";
  priceElements.forEach(({ price, amount }) => { price.textContent = priceText(amount, selected); });
  currencySelects.forEach((select) => { select.value = selected; });
  const language = document.documentElement.lang || "ru";
  if (currencyNote) currencyNote.textContent = (currencyNotes[language] || currencyNotes.ru)[selected];
  window.dispatchEvent(new CustomEvent("levelup-currency-change", { detail: selected }));
  try { localStorage.setItem("levelup-currency-v2", selected); } catch { /* The selector still works without browser storage. */ }
}

let savedCurrency = "RUB";
try { savedCurrency = localStorage.getItem("levelup-currency-v2") || "RUB"; } catch { /* RUB is the default. */ }
renderCurrency(savedCurrency);

currencySelects.forEach((select) => select.addEventListener("change", () => renderCurrency(select.value)));
window.addEventListener("levelup-language-change", () => renderCurrency(currencySelects[0]?.value || savedCurrency));
