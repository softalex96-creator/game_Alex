import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

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
  camera.position.set(0, 0, 5.8);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  howStage.appendChild(renderer.domElement);
  howStage.dataset.enhanced = "true";

  const group = new THREE.Group();
  scene.add(group);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.65, 0.74, 0), new THREE.Vector3(-0.37, 1.12, 0), new THREE.Vector3(0.24, 1.12, 0),
    new THREE.Vector3(0.6, 0.72, 0), new THREE.Vector3(0.45, 0.28, 0), new THREE.Vector3(0.02, 0.05, 0),
    new THREE.Vector3(-0.05, -0.34, 0),
  ]);
  const question = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.115, 12, false),
    new THREE.MeshStandardMaterial({ color: 0xc8b7ff, emissive: 0x5f36d3, emissiveIntensity: 1.6, metalness: 0.62, roughness: 0.2 }),
  );
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 18), new THREE.MeshStandardMaterial({ color: 0xffb16c, emissive: 0x9c3d08, emissiveIntensity: 1.4, metalness: 0.45, roughness: 0.25 }));
  dot.position.y = -0.77;
  group.add(question, dot);
  const rings = new THREE.Group();
  [1.2, 1.55].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .018, 8, 72), new THREE.MeshBasicMaterial({ color: index ? 0x6ee7ff : 0xa889ff, transparent: true, opacity: .66 }));
    ring.rotation.set(index ? .9 : 1.5, .32 * index, .2);
    rings.add(ring);
  });
  group.add(rings);
  scene.add(new THREE.AmbientLight(0x8b6bf3, 1.8));
  const light = new THREE.PointLight(0xd7c5ff, 18, 9);
  light.position.set(-2, 2, 3);
  scene.add(light);
  const warmLight = new THREE.PointLight(0xffa55a, 9, 7);
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
    group.rotation.y = elapsed * .42;
    group.rotation.x = Math.sin(elapsed * .75) * .12;
    group.position.y = Math.sin(elapsed * .9) * .11;
    rings.rotation.z = -elapsed * .28;
    renderer.render(scene, camera);
  });
}
