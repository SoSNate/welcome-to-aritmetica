/**
 * 3D Solar System & Roaming Spaceship Background for Hesbonautica Pilot
 * Built with Three.js
 */
function initSolarSystem3D() {
  if (typeof THREE === 'undefined') {
    console.warn('Three.js is not loaded.');
    return;
  }

  let container = document.getElementById('canvas-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'canvas-container';
    document.body.insertBefore(container, document.body.firstChild);
  }

  // Setup Three.js Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 90);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x64748b, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x93c5fd, 0.8);
  dirLight.position.set(40, 50, 60);
  scene.add(dirLight);

  // Star texture
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(210,230,255,0.85)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  // Starfield
  const starsGroup = new THREE.Group();
  const starTexture = createCircleTexture();
  const starMaterials = [];

  for (let i = 0; i < 3; i++) {
    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for (let j = 0; j < 160; j++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 450;
      const z = -40 - Math.random() * 250;
      starVertices.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMat = new THREE.PointsMaterial({
      color: i === 0 ? 0xffffff : (i === 1 ? 0xc7d2fe : 0xfef08a),
      size: Math.random() * 2.8 + 2.0,
      map: starTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    starMaterials.push(starMat);

    const stars = new THREE.Points(starGeo, starMat);
    starsGroup.add(stars);
  }
  scene.add(starsGroup);

  // ----------------------------------------------------
  // Solar System Group: Compact, in far upper-left corner
  // ----------------------------------------------------
  const solarSystemGroup = new THREE.Group();
  
  const sunLight = new THREE.PointLight(0xffedd5, 2.2, 280);
  solarSystemGroup.add(sunLight);

  // Compact Sun
  const sunGeometry = new THREE.SphereGeometry(4.8, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd54f,
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  solarSystemGroup.add(sun);

  // Sun Halo
  const haloGeometry = new THREE.SphereGeometry(6.4, 32, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb74d,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending
  });
  const sunHalo = new THREE.Mesh(haloGeometry, haloMaterial);
  solarSystemGroup.add(sunHalo);

  // Compact Orbiting Planets (small radius to never touch center)
  const planets = [];
  function createPlanet(size, color, distance, speed, hasRing = false) {
    const orbitCurve = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(64);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    orbitGeometry.rotateX(-Math.PI / 2);

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.18 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    solarSystemGroup.add(orbitLine);

    const geometry = new THREE.SphereGeometry(size, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.2
    });
    const planet = new THREE.Mesh(geometry, material);

    const planetObj = new THREE.Object3D();
    planetObj.add(planet);
    planetObj.rotation.y = Math.random() * Math.PI * 2;

    if (hasRing) {
      const ringGeo = new THREE.RingGeometry(size * 1.4, size * 2.1, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      planet.add(ring);
    }

    solarSystemGroup.add(planetObj);
    planet.position.x = distance;

    planets.push({ mesh: planet, obj: planetObj, distance: distance, speed: speed });
  }

  createPlanet(0.9, 0x94a3b8, 9, 0.018);   // Mercury-like
  createPlanet(1.3, 0xfb923c, 15, 0.014);  // Venus-like
  createPlanet(1.5, 0x38bdf8, 22, 0.010);  // Earth-like
  createPlanet(2.0, 0xfacc15, 30, 0.007, true); // Saturn with ring

  let basePosX = -65;
  let basePosY = 42;

  function updateSolarSystemPosition() {
    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (camera.fov * Math.PI) / 180;
    const dist = camera.position.z - (-15);
    const height = 2 * Math.tan(vFOV / 2) * dist;
    const width = height * aspect;

    // Push far into top-left corner
    basePosX = -width * 0.42;
    basePosY = height * 0.40;
    solarSystemGroup.position.set(basePosX, basePosY, -15);
    solarSystemGroup.scale.set(0.55, 0.55, 0.55);
  }

  updateSolarSystemPosition();

  // Tilt sideways
  solarSystemGroup.rotation.x = 45 * (Math.PI / 180);
  solarSystemGroup.rotation.y = -35 * (Math.PI / 180);
  solarSystemGroup.rotation.z = 22 * (Math.PI / 180);
  scene.add(solarSystemGroup);

  // ----------------------------------------------------
  // Spaceship - Large, vibrant, and hovering across screen
  // ----------------------------------------------------
  const spaceshipGroup = new THREE.Group();
  const spaceshipInner = new THREE.Group();
  spaceshipGroup.add(spaceshipInner);

  // Prominent scale so it is easily seen
  spaceshipInner.scale.set(2.8, 2.8, 2.8);

  // White fuselage
  const bodyGeometry = new THREE.SphereGeometry(2.4, 32, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.1,
    emissive: 0x111827
  });
  const spaceshipBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  spaceshipBody.scale.set(1, 1, 1.75);
  spaceshipInner.add(spaceshipBody);

  // Red nose cone
  const noseGeometry = new THREE.ConeGeometry(2.4, 3.2, 32);
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    roughness: 0.25,
    metalness: 0.2
  });
  const spaceshipNose = new THREE.Mesh(noseGeometry, noseMaterial);
  spaceshipNose.position.set(0, 0, -4.0);
  spaceshipNose.rotation.x = -Math.PI / 2;
  spaceshipInner.add(spaceshipNose);

  // Window border & glowing cyan glass
  const winBorderGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
  const winBorderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
  const winBorder = new THREE.Mesh(winBorderGeo, winBorderMat);
  winBorder.position.set(0, 2.3, -0.8);
  spaceshipInner.add(winBorder);

  const winGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.2, 32);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x00f2fe,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x00f2fe,
    emissiveIntensity: 0.5
  });
  const windowMesh = new THREE.Mesh(winGeo, winMat);
  windowMesh.position.set(0, 2.3, -0.8);
  spaceshipInner.add(windowMesh);

  // Symmetrical red fins
  const finShape = new THREE.Shape();
  finShape.moveTo(-1.2, 0);
  finShape.lineTo(1.8, 0);
  finShape.lineTo(2.5, 2.6);
  finShape.lineTo(-1.2, 0);

  const extrudeSettings = {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  };
  const wingGeometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  wingGeometry.translate(0, 0, -0.08);
  wingGeometry.rotateY(-Math.PI / 2);

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    roughness: 0.25,
    metalness: 0.2
  });

  const finRadius = 1.8;
  const finZPos = 2.6;
  const finAngles = [
    -Math.PI / 2,
    -Math.PI / 2 + (2 * Math.PI / 3),
    -Math.PI / 2 - (2 * Math.PI / 3)
  ];

  finAngles.forEach(angle => {
    const fin = new THREE.Mesh(wingGeometry, wingMaterial);
    fin.position.x = Math.cos(angle) * finRadius;
    fin.position.y = Math.sin(angle) * finRadius;
    fin.position.z = finZPos;
    fin.rotation.z = angle - Math.PI / 2;
    spaceshipInner.add(fin);
  });

  // Glowing thruster flame cone
  const flameGeo = new THREE.ConeGeometry(0.8, 2.2, 16);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85
  });
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.position.set(0, 0, 4.8);
  spaceshipInner.add(flameMesh);

  scene.add(spaceshipGroup);

  // Exhaust particles
  const exhaustParticles = [];
  const particleGeo = new THREE.SphereGeometry(0.8, 8, 8);

  // Parametric flight path across visible viewport in front of camera
  function getPathPosition(t) {
    const aspect = window.innerWidth / window.innerHeight;
    const spanX = Math.min(55, 30 * Math.max(1, aspect));
    const spanY = 22;

    const x = Math.sin(t * 0.32) * spanX + Math.cos(t * 0.16) * 10;
    const y = Math.sin(t * 0.22) * spanY + Math.cos(t * 0.44) * 6;
    const z = Math.sin(t * 0.18) * 20 + 14; // in front of camera (z: -6 to +34, camera at z:90)
    return new THREE.Vector3(x, y, z);
  }

  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.014;

    // Sun spin & halo breathing pulse
    sun.rotation.y += 0.006;
    sunHalo.scale.setScalar(1 + Math.sin(time * 2.5) * 0.04);

    // Planet revolutions
    planets.forEach(p => {
      p.obj.rotation.y += p.speed;
      p.mesh.rotation.y += 0.01;
    });

    // Star twinkling
    if (starMaterials.length >= 3) {
      starMaterials[0].opacity = 0.45 + Math.sin(time * 2.2) * 0.35;
      starMaterials[1].opacity = 0.45 + Math.cos(time * 1.8) * 0.35;
      starMaterials[2].opacity = 0.45 + Math.sin(time * 3.2 + 1) * 0.35;
    }

    // Scroll parallax: Solar system scrolls UP and disappears quickly as user scrolls down!
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollOffset = scrollY * 0.22; // moves up decisively on scroll
    solarSystemGroup.position.y = basePosY + scrollOffset;

    // Spaceship position & forward look direction
    const currentPos = getPathPosition(time);
    const nextPos = getPathPosition(time + 0.05);

    spaceshipGroup.position.copy(currentPos);
    spaceshipGroup.lookAt(nextPos);

    // Dynamic thruster flame flicker
    flameMesh.scale.set(
      1 + Math.sin(time * 20) * 0.2,
      1 + Math.cos(time * 25) * 0.2,
      1 + Math.sin(time * 30) * 0.35
    );

    // Subtle gentle rolling & pitch
    spaceshipInner.rotation.z = Math.sin(time * 3.2) * 0.18;
    spaceshipInner.rotation.x = Math.cos(time * 2.5) * 0.12;
    spaceshipInner.rotation.y = Math.PI; // Inverts model so nose points along movement

    // Emit exhaust particles
    if (Math.random() > 0.30) {
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0x93c5fd : 0x67e8f9,
        transparent: true,
        opacity: 0.7
      });
      const particle = new THREE.Mesh(particleGeo, pMat);

      const exhaustPos = new THREE.Vector3(0, 0, -5.5);
      exhaustPos.applyMatrix4(spaceshipInner.matrixWorld);

      particle.position.copy(exhaustPos);
      particle.position.x += (Math.random() - 0.5) * 1.2;
      particle.position.y += (Math.random() - 0.5) * 1.2;
      particle.position.z += (Math.random() - 0.5) * 1.2;

      particle.life = 1.0;
      scene.add(particle);
      exhaustParticles.push(particle);
    }

    // Animate smoke trail
    for (let i = exhaustParticles.length - 1; i >= 0; i--) {
      const p = exhaustParticles[i];
      p.life -= 0.020;
      p.scale.setScalar(1 + (1 - p.life) * 2.2);
      p.material.opacity = p.life * 0.6;

      if (p.life <= 0) {
        scene.remove(p);
        exhaustParticles.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  // Window resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateSolarSystemPosition();
  });

  animate();
}
