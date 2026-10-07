/**
 * 3D Solar System & Flying Spaceship Background for Hesbonautica Pilot
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

  // Basic Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 85);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Ambient lighting (soft so shaded areas look deep)
  const ambientLight = new THREE.AmbientLight(0x505878, 0.5);
  scene.add(ambientLight);

  // Directional backlight for space atmosphere
  const dirLight = new THREE.DirectionalLight(0x8ab4ff, 0.6);
  dirLight.position.set(30, 40, 50);
  scene.add(dirLight);

  // Circular glowing star texture
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(200,225,255,0.85)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  // Background stars (3 groups for async twinkling)
  const starsGroup = new THREE.Group();
  const starTexture = createCircleTexture();
  const starMaterials = [];

  for (let i = 0; i < 3; i++) {
    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for (let j = 0; j < 140; j++) {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 350;
      const z = -40 - Math.random() * 250;
      starVertices.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMat = new THREE.PointsMaterial({
      color: i === 0 ? 0xffffff : (i === 1 ? 0xa5b4fc : 0xfef08a),
      size: Math.random() * 2.5 + 1.8,
      map: starTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    starMaterials.push(starMat);

    const stars = new THREE.Points(starGeo, starMat);
    starsGroup.add(stars);
  }
  scene.add(starsGroup);

  // ----------------------------------------------------
  // Solar System Group - positioned at top-left corner
  // ----------------------------------------------------
  const solarSystemGroup = new THREE.Group();
  
  // Point light from the sun
  const sunLight = new THREE.PointLight(0xffedd5, 2.2, 350);
  solarSystemGroup.add(sunLight);

  // Sun (warm glowing sphere, reduced scale to not overwhelm)
  const sunGeometry = new THREE.SphereGeometry(6.5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd54f,
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  solarSystemGroup.add(sun);

  // Sun Halo (gentle atmospheric glow)
  const haloGeometry = new THREE.SphereGeometry(8.5, 32, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffb74d,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  const sunHalo = new THREE.Mesh(haloGeometry, haloMaterial);
  solarSystemGroup.add(sunHalo);

  // Planets
  const planets = [];
  function createPlanet(size, color, distance, speed, hasRing = false) {
    // Orbit line
    const orbitCurve = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(80);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    orbitGeometry.rotateX(-Math.PI / 2);

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.18 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    solarSystemGroup.add(orbitLine);

    // Planet body
    const geometry = new THREE.SphereGeometry(size, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
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
        opacity: 0.35
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      planet.add(ring);
    }

    solarSystemGroup.add(planetObj);
    planet.position.x = distance;

    planets.push({ mesh: planet, obj: planetObj, distance: distance, speed: speed });
  }

  createPlanet(1.2, 0x94a3b8, 14, 0.016);  // Mercury-like
  createPlanet(1.8, 0xfb923c, 21, 0.012);  // Venus/Mars-like
  createPlanet(2.1, 0x38bdf8, 30, 0.009);  // Earth-like
  createPlanet(2.6, 0xfacc15, 42, 0.006, true); // Saturn with ring

  // Position at upper-left corner and tilted sideways
  function updateSolarSystemPosition() {
    const aspect = window.innerWidth / window.innerHeight;
    // Calculate top-left coordinate in 3D camera space at z = -20
    const vFOV = (camera.fov * Math.PI) / 180;
    const dist = camera.position.z - (-20);
    const height = 2 * Math.tan(vFOV / 2) * dist;
    const width = height * aspect;

    // Place Sun in upper-left corner
    const posX = -width * 0.38;
    const posY = height * 0.34;
    solarSystemGroup.position.set(posX, posY, -20);
    solarSystemGroup.scale.set(0.72, 0.72, 0.72);
  }

  updateSolarSystemPosition();

  // Tilt sideways and towards viewer for 3D perspective
  solarSystemGroup.rotation.x = 40 * (Math.PI / 180);
  solarSystemGroup.rotation.y = -22 * (Math.PI / 180);
  solarSystemGroup.rotation.z = 12 * (Math.PI / 180);
  scene.add(solarSystemGroup);

  // ----------------------------------------------------
  // Spaceship - Distinct, visible and freely wandering
  // ----------------------------------------------------
  const spaceshipGroup = new THREE.Group();
  const spaceshipInner = new THREE.Group();
  spaceshipGroup.add(spaceshipInner);

  // Scale spaceship so it is clearly visible and cute
  spaceshipInner.scale.set(2.2, 2.2, 2.2);

  // Main rocket body (white aerodynamic capsule)
  const bodyGeometry = new THREE.SphereGeometry(2.5, 32, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1
  });
  const spaceshipBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  spaceshipBody.scale.set(1, 1, 1.7);
  spaceshipInner.add(spaceshipBody);

  // Vibrant red nose cone
  const noseGeometry = new THREE.ConeGeometry(2.5, 3.2, 32);
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4757,
    roughness: 0.3,
    metalness: 0.2
  });
  const spaceshipNose = new THREE.Mesh(noseGeometry, noseMaterial);
  spaceshipNose.position.set(0, 0, -4.0);
  spaceshipNose.rotation.x = -Math.PI / 2;
  spaceshipInner.add(spaceshipNose);

  // Cabin window
  const winBorderGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
  const winBorderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
  const winBorder = new THREE.Mesh(winBorderGeo, winBorderMat);
  winBorder.position.set(0, 2.4, -0.8);
  spaceshipInner.add(winBorder);

  const winGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.2, 32);
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x00f2fe,
    roughness: 0.1,
    metalness: 0.85,
    emissive: 0x00f2fe,
    emissiveIntensity: 0.3
  });
  const windowMesh = new THREE.Mesh(winGeo, winMat);
  windowMesh.position.set(0, 2.4, -0.8);
  spaceshipInner.add(windowMesh);

  // 3 Symmetrical aerodynamic fins
  const finShape = new THREE.Shape();
  finShape.moveTo(-1.2, 0);
  finShape.lineTo(1.8, 0);
  finShape.lineTo(2.4, 2.6);
  finShape.lineTo(-1.2, 0);

  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  };
  const wingGeometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  wingGeometry.translate(0, 0, -0.075);
  wingGeometry.rotateY(-Math.PI / 2);

  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4757,
    roughness: 0.3,
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

  // Thruster glow ring
  const thrusterGeo = new THREE.TorusGeometry(0.8, 0.2, 16, 32);
  const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
  thruster.position.set(0, 0, 3.8);
  spaceshipInner.add(thruster);

  scene.add(spaceshipGroup);

  // Exhaust particles
  const exhaustParticles = [];
  const particleGeo = new THREE.SphereGeometry(0.7, 8, 8);

  // Smooth free-flight path that sweeps across screen in front of camera
  function getPathPosition(t) {
    const aspect = window.innerWidth / window.innerHeight;
    const spanX = 38 * Math.max(1, aspect);
    const spanY = 24;

    const x = Math.sin(t * 0.35) * spanX + Math.cos(t * 0.18) * 8;
    const y = Math.cos(t * 0.28) * spanY + Math.sin(t * 0.42) * 6;
    const z = Math.sin(t * 0.22) * 20 + 8; // In front of camera (z: -12 to +28)
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

    // Spaceship position & look direction
    const currentPos = getPathPosition(time);
    const nextPos = getPathPosition(time + 0.05);

    spaceshipGroup.position.copy(currentPos);
    spaceshipGroup.lookAt(nextPos);

    // Subtle gentle rolling & pitch
    spaceshipInner.rotation.z = Math.sin(time * 3.5) * 0.18;
    spaceshipInner.rotation.x = Math.cos(time * 2.8) * 0.12;
    spaceshipInner.rotation.y = Math.PI; // Inverts model so nose points along movement direction

    // Emit exhaust smoke particles from rear
    if (Math.random() > 0.35) {
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x93c5fd : 0xffedd5,
        transparent: true,
        opacity: 0.65
      });
      const particle = new THREE.Mesh(particleGeo, pMat);

      const exhaustPos = new THREE.Vector3(0, 0, -4.5);
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
      p.life -= 0.018;
      p.scale.setScalar(1 + (1 - p.life) * 2.5);
      p.material.opacity = p.life * 0.55;

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
