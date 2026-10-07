/**
 * 3D Solar System & Spaceship Background for Hesbonautica Pilot
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
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Ambient lighting (soft so dark sides of planets remain shaded)
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  // Sun point light
  const sunLight = new THREE.PointLight(0xfff5e6, 1.8, 600);

  // Circular glowing star texture
  function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  // Twinkling background stars (3 groups for async twinkle)
  const starsGroup = new THREE.Group();
  const starTexture = createCircleTexture();
  const starMaterials = [];

  for (let i = 0; i < 3; i++) {
    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for (let j = 0; j < 150; j++) {
      const x = (Math.random() - 0.5) * 600;
      const y = (Math.random() - 0.5) * 400;
      const z = -50 - Math.random() * 300;
      starVertices.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: Math.random() * 3 + 1.5,
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

  // Solar system group
  const solarSystemGroup = new THREE.Group();
  solarSystemGroup.add(sunLight);

  // Sun
  const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe082,
    emissive: 0xffca28,
    emissiveIntensity: 0.2
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  solarSystemGroup.add(sun);

  // Sun Halo
  const haloGeometry = new THREE.SphereGeometry(17.5, 32, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe082,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });
  const sunHalo = new THREE.Mesh(haloGeometry, haloMaterial);
  solarSystemGroup.add(sunHalo);

  // Planets
  const planets = [];
  function createPlanet(size, color, distance, speed) {
    const orbitCurve = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
    const orbitPoints = orbitCurve.getPoints(100);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    orbitGeometry.rotateX(-Math.PI / 2);

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    solarSystemGroup.add(orbitLine);

    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.1 });
    const planet = new THREE.Mesh(geometry, material);

    const planetObj = new THREE.Object3D();
    planetObj.add(planet);
    planetObj.rotation.y = Math.random() * Math.PI * 2;

    solarSystemGroup.add(planetObj);
    planet.position.x = distance;

    planets.push({ mesh: planet, obj: planetObj, distance: distance, speed: speed });
  }

  createPlanet(2.5, 0x90a4ae, 32, 0.015);
  createPlanet(4, 0xffcc80, 48, 0.01);
  createPlanet(4.5, 0x81d4fa, 70, 0.008);
  createPlanet(3.5, 0xef9a9a, 90, 0.005);

  // Position solar system on left side and tilt
  solarSystemGroup.position.set(-60, 0, -80);
  solarSystemGroup.rotation.x = 15 * (Math.PI / 180);
  solarSystemGroup.rotation.y = 5 * (Math.PI / 180);
  scene.add(solarSystemGroup);

  // Spaceship
  const spaceshipGroup = new THREE.Group();
  const spaceshipInner = new THREE.Group();
  spaceshipGroup.add(spaceshipInner);

  spaceshipInner.scale.set(1.5, 1.5, 1.5);

  // Body
  const bodyGeometry = new THREE.SphereGeometry(3, 32, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const spaceshipBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  spaceshipBody.scale.set(1, 1, 1.6);
  spaceshipInner.add(spaceshipBody);

  // Nose
  const noseGeometry = new THREE.ConeGeometry(3, 3.5, 32);
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.4 });
  const spaceshipNose = new THREE.Mesh(noseGeometry, noseMaterial);
  spaceshipNose.position.set(0, 0, -4.5);
  spaceshipNose.rotation.x = -Math.PI / 2;
  spaceshipInner.add(spaceshipNose);

  // Window border & glass
  const winBorderGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 32);
  const winBorderMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const winBorder = new THREE.Mesh(winBorderGeo, winBorderMat);
  winBorder.position.set(0, 2.9, -1);
  spaceshipInner.add(winBorder);

  const winGeo = new THREE.CylinderGeometry(1, 1, 0.15, 32);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x80deea, roughness: 0.1, metalness: 0.8 });
  const windowMesh = new THREE.Mesh(winGeo, winMat);
  windowMesh.position.set(0, 2.9, -1);
  spaceshipInner.add(windowMesh);

  // Fins
  const finShape = new THREE.Shape();
  finShape.moveTo(-1.5, 0);
  finShape.lineTo(2.0, 0);
  finShape.lineTo(2.8, 3.0);
  finShape.lineTo(-1.5, 0);

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

  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.4 });

  const radius = 2.1;
  const zPos = 3.2;

  const angles = [
    -Math.PI / 2,
    -Math.PI / 2 + (2 * Math.PI / 3),
    -Math.PI / 2 - (2 * Math.PI / 3)
  ];

  angles.forEach(angle => {
    const fin = new THREE.Mesh(wingGeometry, wingMaterial);
    fin.position.x = Math.cos(angle) * radius;
    fin.position.y = Math.sin(angle) * radius;
    fin.position.z = zPos;
    fin.rotation.z = angle - Math.PI / 2;
    spaceshipInner.add(fin);
  });

  scene.add(spaceshipGroup);

  // Camera setup
  camera.position.set(0, 20, 100);
  camera.lookAt(-20, 0, 0);

  let time = 0;
  const exhaustParticles = [];
  const particleGeo = new THREE.SphereGeometry(0.6, 8, 8);

  function getPathPosition(t) {
    const x = Math.sin(t * 0.3) * 120 + 20;
    const y = Math.sin(t * 0.5) * 40;
    const z = Math.cos(t * 0.25) * 80 + 30;
    return new THREE.Vector3(x, y, z);
  }

  function animate() {
    requestAnimationFrame(animate);
    time += 0.015;

    // Sun rotation & halo pulse
    sun.rotation.y += 0.005;
    sunHalo.scale.setScalar(1 + Math.sin(time * 2) * 0.03);

    // Planet orbits
    planets.forEach(p => {
      p.obj.rotation.y += p.speed;
    });

    // Background star twinkling
    if (starMaterials.length >= 3) {
      starMaterials[0].opacity = 0.4 + Math.sin(time * 2.0) * 0.4;
      starMaterials[1].opacity = 0.4 + Math.cos(time * 1.5) * 0.4;
      starMaterials[2].opacity = 0.4 + Math.sin(time * 3.0 + 1) * 0.4;
    }

    // Spaceship path & orientation
    const currentPos = getPathPosition(time);
    const nextPos = getPathPosition(time + 0.05);

    spaceshipGroup.position.copy(currentPos);
    spaceshipGroup.lookAt(nextPos);

    // Spaceship wiggle & orientation
    spaceshipInner.rotation.z = Math.sin(time * 4) * 0.15;
    spaceshipInner.rotation.x = Math.cos(time * 3) * 0.1;
    spaceshipInner.rotation.y = Math.PI;

    // Smoke particles from exhaust
    if (Math.random() > 0.4) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
      });
      const particle = new THREE.Mesh(particleGeo, pMat);

      const exhaustPos = new THREE.Vector3(0, 0, -5);
      exhaustPos.applyMatrix4(spaceshipInner.matrixWorld);

      particle.position.copy(exhaustPos);
      particle.position.x += (Math.random() - 0.5) * 1.5;
      particle.position.y += (Math.random() - 0.5) * 1.5;

      particle.life = 1.0;
      scene.add(particle);
      exhaustParticles.push(particle);
    }

    // Update smoke trail
    for (let i = exhaustParticles.length - 1; i >= 0; i--) {
      const p = exhaustParticles[i];
      p.life -= 0.015;
      p.scale.setScalar(1 + (1 - p.life) * 2);
      p.material.opacity = p.life * 0.4;

      if (p.life <= 0) {
        scene.remove(p);
        exhaustParticles.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}
