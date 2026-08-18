(() => {
  const canvas = document.querySelector(".pixel-runner__canvas");
  const scoreElement = document.querySelector("[data-runner-score]");
  const jumpButton = document.querySelector(".pixel-runner__jump");
  if (!canvas || !scoreElement || !jumpButton) return;

  const context = canvas.getContext("2d");
  const state = { active: false, score: 0, last: 0, playerY: 0, velocityY: 0, obstacleX: 0, nextObstacle: 0, dust: 0 };
  const gravity = 980;
  const jumpPower = 380;
  let width = 0;
  let height = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.obstacleX = Math.max(state.obstacleX, width + 36);
  }

  function jump() {
    const ground = height - 35;
    if (state.playerY >= ground - 2) state.velocityY = -jumpPower;
  }

  function pixelRect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawBackground(time) {
    context.clearRect(0, 0, width, height);
    const horizon = height - 35;
    context.fillStyle = "rgba(101, 231, 255, .14)";
    for (let i = 0; i < 16; i += 1) {
      const x = (i * 89 - (time * 0.03) % 89) - 20;
      pixelRect(x, 44 + (i % 4) * 11, 2, 2, "rgba(174, 239, 255, .8)");
      pixelRect(x + 17, 73 + (i % 3) * 17, 1, 1, "rgba(218, 176, 255, .82)");
    }
    context.fillStyle = "rgba(58, 122, 188, .32)";
    for (let i = 0; i < 13; i += 1) {
      const buildingX = i * 92 - (time * 0.018) % 92;
      const buildingHeight = 23 + (i % 4) * 13;
      pixelRect(buildingX, horizon - buildingHeight, 44, buildingHeight, "rgba(36, 81, 145, .38)");
      for (let light = 0; light < 3; light += 1) pixelRect(buildingX + 8 + light * 10, horizon - buildingHeight + 9, 3, 2, "rgba(130, 244, 255, .55)");
    }
    pixelRect(0, horizon, width, 2, "#8cefff");
    pixelRect(0, horizon + 3, width, 5, "#1d4770");
    for (let x = -12; x < width + 20; x += 34) {
      pixelRect(x - (time * .11) % 34, horizon + 10, 18, 2, "rgba(167, 120, 255, .82)");
    }
  }

  function drawHero(x, y, airborne) {
    const bob = airborne ? 0 : Math.sin(state.score * .22) * 1.5;
    const top = y + bob;
    pixelRect(x + 8, top, 14, 7, "#f3d5b2");
    pixelRect(x + 5, top + 5, 20, 10, "#9d6cff");
    pixelRect(x + 8, top + 14, 14, 16, "#5de1ff");
    pixelRect(x + 4, top + 17, 5, 11, "#9f74ff");
    pixelRect(x + 21, top + 16, 8, 5, "#f7b45f");
    pixelRect(x + 10, top + 30, 5, 9, "#c7b7ff");
    pixelRect(x + 18, top + 30, 5, 9, "#c7b7ff");
    pixelRect(x + 7, top + 39, 9, 3, "#1a173a");
    pixelRect(x + 18, top + 39, 9, 3, "#1a173a");
    pixelRect(x + 11, top + 8, 2, 2, "#15152c");
    pixelRect(x + 18, top + 8, 2, 2, "#15152c");
  }

  function drawObstacle(x, ground) {
    pixelRect(x, ground - 24, 8, 24, "#ff779e");
    pixelRect(x + 8, ground - 15, 8, 15, "#ff779e");
    pixelRect(x + 4, ground - 30, 4, 8, "#ffb4c9");
    pixelRect(x - 5, ground - 18, 5, 5, "#d55788");
    pixelRect(x + 16, ground - 11, 6, 5, "#d55788");
  }

  function render(time) {
    if (!state.active) return;
    if (!state.last) state.last = time;
    const delta = Math.min((time - state.last) / 1000, .035);
    state.last = time;
    const ground = height - 35;
    const playerX = Math.max(42, width * .17);
    state.velocityY += gravity * delta;
    state.playerY = Math.min(ground, state.playerY + state.velocityY * delta);
    if (state.playerY === ground) state.velocityY = 0;

    state.obstacleX -= (135 + Math.min(state.score * .7, 115)) * delta;
    if (state.obstacleX < -26) {
      state.obstacleX = width + 35 + Math.random() * 120;
      state.nextObstacle = 0;
    }
    if (!state.nextObstacle && state.obstacleX - playerX < 88 && state.playerY >= ground - 2) {
      state.nextObstacle = 1;
      jump();
    }
    state.score += delta * 18;
    scoreElement.textContent = `${String(Math.floor(state.score)).padStart(4, "0")} XP`;
    drawBackground(time);
    drawObstacle(state.obstacleX, ground);
    drawHero(playerX, state.playerY - 42, state.playerY < ground - 1);
    requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(([entry]) => {
    state.active = entry.isIntersecting;
    if (state.active) {
      state.last = 0;
      requestAnimationFrame(render);
    }
  }, { threshold: .18 });

  resize();
  state.playerY = height - 35;
  state.obstacleX = width + 80;
  observer.observe(canvas);
  window.addEventListener("resize", resize);
  jumpButton.addEventListener("click", jump);
  canvas.addEventListener("click", jump);
  document.addEventListener("keydown", event => {
    if ((event.code === "Space" || event.code === "ArrowUp") && document.activeElement === canvas) {
      event.preventDefault();
      jump();
    }
  });
})();
