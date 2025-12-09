const THREE_URL = 'https://esm.sh/three@0.161.0';
const ORBIT_URL = 'https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls?deps=three@0.161.0';
const GLTF_URL = 'https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader?deps=three@0.161.0';

async function loadDeps() {
  const [THREE, controlsMod, loaderMod] = await Promise.all([
    import(THREE_URL),
    import(ORBIT_URL),
    import(GLTF_URL)
  ]);
  return { THREE, OrbitControls: controlsMod.OrbitControls, GLTFLoader: loaderMod.GLTFLoader };
}

async function initViewer(container, depsPromise) {
  const modelUrl = container.dataset.model;
  if (!modelUrl) return;

  try {
    const { THREE, OrbitControls, GLTFLoader } = await depsPromise;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f8fb);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(2.5, 1.6, 3.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 5);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.load(modelUrl, gltf => {
      scene.add(gltf.scene);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      camera.position.copy(center).add(new THREE.Vector3(size * 0.6, size * 0.4, size * 0.8));
      controls.update();
    }, undefined, () => {
      container.innerHTML = '<p style="padding:1rem;color:#c00;">Не удалось загрузить 3D модель.</p>';
    });

    const onResize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  } catch (e) {
    console.error('3D viewer error', e);
    container.innerHTML = '<p style="padding:1rem;color:#c00;">Ошибка инициализации 3D.</p>';
  }
}

const viewerEls = document.querySelectorAll('[data-model]');
if (viewerEls.length) {
  const depsPromise = loadDeps();
  viewerEls.forEach(el => initViewer(el, depsPromise));
}
