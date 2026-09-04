import crypto from "node:crypto";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function rubles(value) { return `${Number(value).toLocaleString("ru-RU")} ₽`; }
export function createDeliveryCode() { return Array.from({ length: 16 }, () => crypto.randomInt(0, 10)).join(""); }
export function formatDeliveryCode(value) { return String(value || "").replace(/(\d{4})(?=\d)/g, "$1 "); }

async function sendEmail({ to, subject, text, html, idempotencyKey }, fetchImpl = fetch) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.id) throw new Error(`Resend rejected email: ${response.status}`);
  return payload.id;
}

export function welcomeEmail(user) {
  const name = escapeHtml(user.displayName || "Игрок");
  return {
    to: user.email,
    subject: "Добро пожаловать в LevelUp",
    text: `Здравствуйте, ${user.displayName || "Игрок"}! Вы успешно зарегистрировались в LevelUp. Теперь вы можете сохранять игры, оформлять заказы и отслеживать оплаты в личном кабинете: https://gamemaster.cc/cabinet.html`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171522"><h1 style="color:#6946d9">Добро пожаловать в LevelUp</h1><p>Здравствуйте, <strong>${name}</strong>!</p><p>Вы успешно зарегистрировались. Теперь вы можете сохранять игры, оформлять заказы и отслеживать оплаты в личном кабинете.</p><p><a href="https://gamemaster.cc/cabinet.html" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#7657e8;color:#fff;text-decoration:none;font-weight:700">Открыть личный кабинет</a></p><p style="color:#716b80;font-size:13px">Если вы не входили в LevelUp, просто проигнорируйте это письмо.</p></div>`,
    idempotencyKey: `welcome-${user.uid}`,
  };
}

export function paymentEmail(order) {
  const code = formatDeliveryCode(order.deliveryCode);
  const itemsText = order.items.map((item) => `${item.title} — ${rubles(item.price)}`).join("\n");
  const itemsHtml = order.items.map((item) => `<li style="margin:6px 0">${escapeHtml(item.title)} — <strong>${escapeHtml(rubles(item.price))}</strong></li>`).join("");
  return {
    to: order.customer.email,
    subject: `Оплата заказа ${order.id} подтверждена — код внутри`,
    text: `Оплата прошла успешно.\n\nЗаказ: ${order.id}\nСумма: ${rubles(order.amount)}\n\n${itemsText}\n\nКод заказа: ${code}\n\nСохраните этот код. Пока он используется как идентификатор оплаченного заказа.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171522"><h1 style="color:#238b57">Оплата прошла успешно</h1><p>Заказ <strong>${escapeHtml(order.id)}</strong> оплачен на сумму <strong>${escapeHtml(rubles(order.amount))}</strong>.</p><ul style="padding-left:20px">${itemsHtml}</ul><div style="margin:24px 0;padding:18px;border-radius:12px;background:#f0ebff;text-align:center"><div style="color:#6c647b;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Код заказа</div><div style="margin-top:8px;font-size:25px;font-weight:800;letter-spacing:.08em;color:#4f36a5">${escapeHtml(code)}</div></div><p>Сохраните этот код. Пока он используется как идентификатор оплаченного заказа.</p><p><a href="https://gamemaster.cc/cabinet.html#transactions" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#7657e8;color:#fff;text-decoration:none;font-weight:700">Открыть транзакции</a></p></div>`,
    idempotencyKey: `payment-${order.id}`,
  };
}

export function sendWelcomeEmail(user, fetchImpl = fetch) { return sendEmail(welcomeEmail(user), fetchImpl); }
export function sendPaymentEmail(order, fetchImpl = fetch) { return sendEmail(paymentEmail(order), fetchImpl); }
