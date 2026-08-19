// Только официальные цифровые товары, дополнения и валюты. Доступность зависит
// от региона, платформы и действующих договоров с правообладателями.
const levelUpOptions = {
  "gta-vi": [],
  "world-of-warcraft": ["60 дней игрового времени", "WoW Token — 30 дней игрового времени", "Набор дополнения The War Within"],
  "counter-strike": ["Prime Status Upgrade для Counter-Strike 2", "Предметы Steam Community Market", "Ключ к кейсу через Steam"],
  cs2: ["Armory Pass", "Prime Status Upgrade", "Предметы Steam Community Market", "Ключ к кейсу через Steam"],
  "mobile-legends": ["Алмазы", "Weekly Diamond Pass", "Twilight Pass", "Официальный набор в игре"],
  pubg: ["G-COIN", "Набор G-COIN", "PUBG Plus", "Battle Pass"],
  quake: ["Quake Enhanced Edition"],
  "street-fighter": ["Fighter Coins", "Year 3 Character Pass", "Year 3 Ultimate Pass", "Отдельный DLC-персонаж"],
  "apex-legends": ["1 000 Apex Coins", "2 150 Apex Coins", "4 350 Apex Coins", "Premium Battle Pass"],
  "ea-sports-fc": ["FC Points", "Ultimate Team Points Pack", "Season Pass", "Evolution Slot"],
  battlefield: ["Battlefield Coins", "Battle Pass", "Официальный набор косметики", "Battlefield Pro"],
  "the-sims-4": ["Expansion Pack", "Game Pack", "Stuff Pack", "Kit / Maker Pack"],
  "need-for-speed": ["Need for Speed Unbound — Ultimate Collection", "Vol. 9 Premium Speed Pass", "Catch-Up Pack", "Набор автомобилей и косметики"],
  "ea-sports-f1": ["EA SPORTS F1 — базовое издание", "EA SPORTS F1 — расширенное издание", "Официальный сезонный контент"],
  "plants-vs-zombies-2": ["Премиум-растение", "Набор семян", "Самоцветы", "Официальное спецпредложение"],
  "star-wars-goh": ["Crystals", "Data Cards", "Resources Bundle", "Официальный набор Web Store"],
  "real-racing-3": [],
  "madden-nfl-mobile": ["200 Madden Cash", "1 050 Madden Cash", "2 200 Madden Cash", "Madden Cash Calendar"],
  "tekken-8": ["Season 2 Character & Stage Pass", "Season 3 Pass", "Отдельный DLC-персонаж", "TEKKEN Fight Pass"],
  "elden-ring": ["Shadow of the Erdtree DLC", "Shadow of the Erdtree Edition", "Digital Artbook & Soundtrack"],
  "dragon-ball-sparking-zero": ["Season Pass (DLC 1–3)", "DAIMA Character Pack 1", "DAIMA Character Pack 2", "Ultimate Upgrade Pack"],
  "dragon-ball-xenoverse-2": ["Future Saga Pack Set", "Dragon Ball DAIMA Pack", "HERO OF JUSTICE Pack Set", "Отдельная глава Future Saga"],
  "digimon-story": ["Season Pass", "Additional Digimon & Episode Pack 1", "Additional Digimon & Episode Pack 2", "Additional Digimon & Episode Pack 3"],
  "little-nightmares-iii": ["The Backstage DLC", "Secrets of The Spiral — Expansion Pass", "Residents Costumes Pack", "Digital Deluxe Edition"],
  "code-vein-ii": ["Mask of Idris Expansion DLC", "Deluxe Upgrade Pack", "Custom Outfit Pack", "Ultimate Edition"],
  "tales-of-arise": ["Beyond the Dawn Expansion", "Beyond the Dawn Edition", "Classic Characters Costume & BGM Pack", "Premium Travel Pack"],
  "ace-combat-7": ["Season Pass", "Дополнительная миссия", "Дополнительный самолёт", "Digital Deluxe Edition"],
  "naruto-to-boruto": ["Season Pass 9", "DLC-персонаж Kimimaro", "Отдельный DLC-персонаж", "Digital Deluxe Edition"],
  "one-piece-pirate-warriors-4": ["Character Pass 3", "Special Selection Pack", "Additional Episodes Pack", "Digital Ultimate Edition"],
  "pac-man": ["PAC-MAN WORLD 2 Re-PAC", "Sonic Collaboration Set", "Jukebox DLC", "Chrome Noir Chogokin DLC"]
};

// Ориентиры в RUB: уровни официальных витрин и открытых ценовых пакетов.
// Перед реальной продажей должны быть заменены ценами из кабинета поставщика.
const levelUpPricing = {
  "gta-vi": [0, []], "world-of-warcraft": [1599, [1599, 1799, 3499]],
  "counter-strike": [199, [1499, 199, 199]], cs2: [199, [1599, 1499, 199, 199]],
  "mobile-legends": [99, [99, 399, 699, 149]], pubg: [149, [149, 499, 799, 499]],
  quake: [399, [399]], "street-fighter": [299, [699, 1499, 2499, 499]],
  "apex-legends": [99, [99, 199, 399, 999]], "ea-sports-fc": [99, [99, 299, 499, 149]],
  battlefield: [199, [199, 999, 399, 1499]], "the-sims-4": [299, [1599, 999, 499, 299]],
  "need-for-speed": [399, [2999, 699, 499, 799]], "ea-sports-f1": [499, [3499, 4999, 499]],
  "plants-vs-zombies-2": [99, [199, 299, 99, 149]], "star-wars-goh": [199, [199, 299, 399, 499]],
  "real-racing-3": [0, []], "madden-nfl-mobile": [199, [199, 999, 1999, 499]],
  "tekken-8": [499, [1999, 2499, 599, 499]], "elden-ring": [599, [2399, 4499, 599]],
  "dragon-ball-sparking-zero": [699, [2499, 699, 699, 999]], "dragon-ball-xenoverse-2": [699, [2499, 899, 1499, 699]],
  "digimon-story": [699, [1999, 699, 699, 699]], "little-nightmares-iii": [499, [499, 999, 299, 1799]],
  "code-vein-ii": [799, [1499, 2499, 399, 4999]], "tales-of-arise": [499, [1999, 2799, 499, 699]],
  "ace-combat-7": [299, [1499, 499, 499, 2499]], "naruto-to-boruto": [249, [1999, 399, 399, 1499]],
  "one-piece-pirate-warriors-4": [399, [1499, 699, 999, 2999]], "pac-man": [299, [1999, 699, 299, 199]]
};

window.levelUpProducts = [
  ["gta-vi", "GTA VI", "PC-радар и статус анонса", "catalog", "PC · ожидаем", "Rockstar Games", "Официальный анонс", 0, "PC-версия и отдельный GTA VI Online пока официально не анонсированы. Сохраняем интерес и следим за подтверждёнными новостями Rockstar.", "Самая ожидаемая"],
  ["world-of-warcraft", "World of Warcraft", "Золото и подписка", "catalog", "PC", "Blizzard", "KG · скоро РФ", 250, "Подбор золота и подписки для World of Warcraft. Финальные параметры подтверждает поддержка."],
  ["counter-strike", "Counter-Strike", "Скины и баланс", "catalog", "PC", "Valve", "KG · скоро РФ", 150, "Подбор игровых товаров и баланса для Counter-Strike."],
  ["cs2", "CS2", "Предметы и баланс", "catalog", "PC", "Valve", "KG · скоро РФ", 150, "Предметы и баланс для CS2. Доступность подтверждается до оформления.", "Хит продаж"],
  ["mobile-legends", "Mobile Legends", "Алмазы", "currency", "Mobile", "Moonton", "KG · скоро РФ", 80, "Игровая валюта и наборы для Mobile Legends.", "Хит продаж"],
  ["pubg", "PUBG", "UC и предметы", "currency", "PC", "KRAFTON", "KG · скоро РФ", 120, "UC и игровые предметы для PUBG." , "Хит продаж"],
  ["quake", "Quake", "Игровой баланс", "catalog", "PC", "Bethesda", "KG · скоро РФ", 100, "Подбор игрового баланса и товаров для Quake."],
  ["street-fighter", "Street Fighter", "Игровые товары", "catalog", "PC", "Capcom", "KG · скоро РФ", 150, "Игровые товары для Street Fighter — подбор через заявку."],
  ["apex-legends", "Apex Legends", "Монеты и наборы", "currency", "PC", "EA", "EA · KG", 120, "Монеты и наборы для Apex Legends."],
  ["ea-sports-fc", "EA SPORTS FC", "Points и Ultimate Team", "currency", "PC", "EA", "EA · KG", 150, "Points и наборы Ultimate Team для EA SPORTS FC.", "Хит продаж"],
  ["battlefield", "Battlefield", "Баланс и наборы", "currency", "PC", "EA", "EA · KG", 180, "Баланс и наборы для Battlefield."],
  ["the-sims-4", "The Sims 4", "Дополнения", "dlc", "PC", "EA", "EA · KG", 200, "Дополнения и контент для The Sims 4."],
  ["need-for-speed", "Need for Speed", "Контент и баланс", "currency", "PC", "EA", "EA · KG", 130, "Контент и игровой баланс для Need for Speed."],
  ["ea-sports-f1", "EA SPORTS F1", "Контент сезона", "dlc", "PC", "EA", "EA · KG", 190, "Сезонный контент для EA SPORTS F1."],
  ["plants-vs-zombies-2", "Plants vs. Zombies 2", "Самоцветы и растения", "currency", "Mobile", "EA", "EA · KG", 70, "Самоцветы и растения для Plants vs. Zombies 2."],
  ["star-wars-goh", "Star Wars: Galaxy of Heroes", "Кристаллы", "currency", "Mobile", "EA", "EA · KG", 100, "Кристаллы для Star Wars: Galaxy of Heroes."],
  ["real-racing-3", "Real Racing 3", "Золото и валюта", "currency", "Mobile", "EA", "EA · KG", 70, "Золото и игровая валюта для Real Racing 3."],
  ["madden-nfl-mobile", "Madden NFL Mobile", "Points и паки", "currency", "Mobile", "EA", "EA · KG", 100, "Points и паки для Madden NFL Mobile."],
  ["tekken-8", "TEKKEN 8", "Контент и персонажи", "dlc", "PC", "Bandai Namco", "Bandai · KG", 220, "Контент и персонажи для TEKKEN 8."],
  ["elden-ring", "ELDEN RING", "Дополнения", "dlc", "PC", "Bandai Namco", "Bandai · KG", 250, "Дополнения для ELDEN RING."],
  ["dragon-ball-sparking-zero", "DRAGON BALL: Sparking! ZERO", "Персонажи и DLC", "dlc", "PC", "Bandai Namco", "Bandai · KG", 200, "Персонажи и DLC для DRAGON BALL: Sparking! ZERO."],
  ["dragon-ball-xenoverse-2", "DRAGON BALL XENOVERSE 2", "TP Medals и DLC", "dlc", "PC", "Bandai Namco", "Bandai · KG", 150, "TP Medals и DLC для DRAGON BALL XENOVERSE 2."],
  ["digimon-story", "Digimon Story", "Дополнения", "dlc", "PC", "Bandai Namco", "Bandai · KG", 180, "Дополнения для Digimon Story.", "Новинка"],
  ["little-nightmares-iii", "Little Nightmares III", "Игровой контент", "catalog", "PC", "Bandai Namco", "Bandai · KG", 170, "Игровой контент для Little Nightmares III.", "Новинка"],
  ["code-vein-ii", "CODE VEIN II", "Контент и DLC", "dlc", "PC", "Bandai Namco", "Bandai · KG", 210, "Контент и DLC для CODE VEIN II.", "Новинка"],
  ["tales-of-arise", "Tales of Arise", "Дополнения", "dlc", "PC", "Bandai Namco", "Bandai · KG", 180, "Дополнения для Tales of Arise."],
  ["ace-combat-7", "ACE COMBAT 7", "Самолёты и DLC", "dlc", "PC", "Bandai Namco", "Bandai · KG", 160, "Самолёты и DLC для ACE COMBAT 7."],
  ["naruto-to-boruto", "NARUTO TO BORUTO", "Shinobi Striker", "catalog", "PC", "Bandai Namco", "Bandai · KG", 130, "Игровой контент для NARUTO TO BORUTO."],
  ["one-piece-pirate-warriors-4", "ONE PIECE Pirate Warriors 4", "Персонажи и DLC", "dlc", "PC", "Bandai Namco", "Bandai · KG", 190, "Персонажи и DLC для ONE PIECE Pirate Warriors 4."],
  ["pac-man", "PAC-MAN", "Аркадный контент", "catalog", "PC", "Bandai Namco", "Bandai · KG", 90, "Аркадный контент для PAC-MAN."]
].map(([id, title, offer, category, platform, publisher, region, price, description, badge]) => {
  const [rubPrice, optionPrices] = levelUpPricing[id] || [price, []];
  return { id, title, offer, category, platform, publisher, region, price: rubPrice, description, badge: badge || "", options: (levelUpOptions[id] || []).map((name, index) => ({ name, price: optionPrices[index] || rubPrice })) };
});
