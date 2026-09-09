let turnstilePromise;

window.ensureTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstilePromise) return turnstilePromise;

  turnstilePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load"));
    script.onerror = () => reject(new Error("Turnstile did not load"));
    document.head.append(script);
  });

  return turnstilePromise;
};
