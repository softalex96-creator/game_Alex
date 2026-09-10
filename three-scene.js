// Keep the visualizer self-contained so the public site does not execute a
// third-party module from a CDN. The bundled copy is already used by the
// standalone 3D viewer and is covered by the site's same-origin policy.
const THREE_URL = "./scrubber-3d/vendor/three.module.js";
const initThreeScenes = async () => {
  const THREE = await import(THREE_URL);

const stage = document.querySelector(".three-stage");
const card = document.querySelector(".hero-card");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (stage && card && !reducedMotion) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const group = new THREE.Group();
  group.position.set(1.15, 0, 0);
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.02, 0.24, 120, 14),
    new THREE.MeshStandardMaterial({ color: 0x8c65ff, emissive: 0x35106f, emissiveIntensity: 1.2, metalness: 0.72, roughness: 0.18 })
  );
  core.rotation.set(.45, -.5, .15);
  group.add(core);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.026, 10, 90),
    new THREE.MeshBasicMaterial({ color: 0xffb16c, transparent: true, opacity: .78 })
  );
  halo.rotation.set(1.2, .45, .2);
  group.add(halo);

  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 110;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const radius = 1.7 + Math.random() * 1.45;
    const angle = Math.random() * Math.PI * 2;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = (Math.random() - .5) * 3.5;
    positions[index * 3 + 2] = Math.sin(angle) * radius;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xc7b5ff, size: .028, transparent: true, opacity: .86 }));
  group.add(particles);

  scene.add(new THREE.AmbientLight(0x7a5de8, 1.7));
  const keyLight = new THREE.PointLight(0xd8c9ff, 22, 14);
  keyLight.position.set(-2, 3, 4);
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xff9f58, 16, 10);
  warmLight.position.set(3, -1, 3);
  scene.add(warmLight);

  const pointer = new THREE.Vector2();
  card.addEventListener("pointermove", (event) => {
    const bounds = card.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - .5) * .7;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - .5) * .45;
  });
  card.addEventListener("pointerleave", () => pointer.set(0, 0));

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const clock = new THREE.Clock();
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    core.rotation.y = elapsed * .42 + pointer.x;
    core.rotation.x = .45 + Math.sin(elapsed * .7) * .14 + pointer.y;
    halo.rotation.z = elapsed * .28;
    particles.rotation.y = -elapsed * .1;
    group.position.y = Math.sin(elapsed * .9) * .12;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(animate);
}

const howStage = document.querySelector(".how-three-stage");

if (howStage && !reducedMotion) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  howStage.appendChild(renderer.domElement);
  howStage.dataset.enhanced = "true";

  const group = new THREE.Group();
  scene.add(group);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.54, 2),
    new THREE.MeshStandardMaterial({ color: 0xcff9ff, emissive: 0x2e9dff, emissiveIntensity: 2.4, metalness: .72, roughness: .12 }),
  );
  const coreAura = new THREE.Mesh(
    new THREE.SphereGeometry(.86, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x7654ff, transparent: true, opacity: .13 }),
  );
  group.add(coreAura, core);
  const nodes = new THREE.Group();
  [[-1.22, .38, 0x79e7ff], [1.18, .36, 0xc898ff], [.1, -1.07, 0xffa4d6]].forEach(([x, y, color], index) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(index === 2 ? .14 : .17, 20, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.65, metalness: .55, roughness: .18 }));
    node.position.set(x, y, .1);
    nodes.add(node);
  });
  group.add(nodes);
  const rings = new THREE.Group();
  [1.1, 1.46, 1.78].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, index === 1 ? .025 : .016, 8, 96), new THREE.MeshBasicMaterial({ color: [0x54eaff, 0xc07bff, 0xff8fd3][index], transparent: true, opacity: index === 1 ? .76 : .54 }));
    ring.rotation.set([1.42, .76, 2.06][index], [.1, .42, -.24][index], [.2, .54, -.32][index]);
    rings.add(ring);
  });
  group.add(rings);
  const signalLines = new THREE.Group();
  [[-1.22, .38], [1.18, .36], [.1, -1.07]].forEach(([x, y]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, .08)]);
    signalLines.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x9aeaff, transparent: true, opacity: .48 })));
  });
  group.add(signalLines);
  const dataParticles = new THREE.BufferGeometry();
  const dataParticleCount = 96;
  const dataPositions = new Float32Array(dataParticleCount * 3);
  for (let index = 0; index < dataParticleCount; index += 1) {
    const radius = 1.25 + Math.random() * .75;
    const angle = Math.random() * Math.PI * 2;
    dataPositions[index * 3] = Math.cos(angle) * radius;
    dataPositions[index * 3 + 1] = Math.sin(angle) * radius;
    dataPositions[index * 3 + 2] = (Math.random() - .5) * .8;
  }
  dataParticles.setAttribute("position", new THREE.BufferAttribute(dataPositions, 3));
  const particleField = new THREE.Points(dataParticles, new THREE.PointsMaterial({ color: 0x9ceaff, size: .035, transparent: true, opacity: .82 }));
  group.add(particleField);
  scene.add(new THREE.AmbientLight(0x8b6bf3, 2.15));
  const light = new THREE.PointLight(0x9deaff, 24, 9);
  light.position.set(-2, 2, 3);
  scene.add(light);
  const warmLight = new THREE.PointLight(0xff62c8, 14, 7);
  warmLight.position.set(1, -1, 2);
  scene.add(warmLight);

  const resize = () => {
    const { width, height } = howStage.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  new ResizeObserver(resize).observe(howStage);
  resize();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const elapsed = clock.getElapsedTime();
    group.rotation.y = elapsed * .52;
    group.rotation.x = Math.sin(elapsed * .75) * .16;
    group.position.y = Math.sin(elapsed * .9) * .11;
    core.rotation.y = elapsed * .86;
    core.rotation.x = elapsed * .36;
    coreAura.scale.setScalar(1 + Math.sin(elapsed * 2.4) * .12);
    nodes.rotation.z = elapsed * -.42;
    signalLines.rotation.z = elapsed * -.42;
    rings.rotation.z = -elapsed * .38;
    particleField.rotation.z = elapsed * .17;
    renderer.render(scene, camera);
  });
}

};

const threeStages = [...document.querySelectorAll(".three-stage, .how-three-stage")];
if (threeStages.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let initialized = false;
  const loadThree = () => {
    if (initialized) return;
    initialized = true;
    initThreeScenes().catch(() => {});
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadThree();
    }, { rootMargin: "240px" });
    threeStages.forEach((element) => observer.observe(element));
  } else {
    loadThree();
  }
}
