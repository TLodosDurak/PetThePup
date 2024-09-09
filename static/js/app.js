document.addEventListener('DOMContentLoaded', () => {
    const sceneContainer = document.getElementById('scene-container');
    const progressBar = document.getElementById('progress-bar');
    const fullText = document.getElementById('full-text');
    const progressContainer = document.getElementById('progress-container');
    let dogModel;
    let progress = 0;
    let isMouseOverDog = false;
    let isMouseMoving = false;
    let lastMousePosition = { x: 0, y: 0 };

    // Initialize the 3D scene
    const { scene, camera, renderer, controls, raycaster, mouse } = initScene(sceneContainer);

    // Load the dog model
    loadDogModel(scene).then((model) => {
        dogModel = model;
    });

    // Set up animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);

        if (dogModel) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(dogModel, true);
            isMouseOverDog = intersects.length > 0;
            petDog();
        }

        updateProgressBar();
        resetMouseMoving();
    }
    animate();

    // Mouse move event listener
    sceneContainer.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / sceneContainer.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / sceneContainer.clientHeight) * 2 + 1;

        if (Math.abs(event.clientX - lastMousePosition.x) > 5 || Math.abs(event.clientY - lastMousePosition.y) > 5) {
            isMouseMoving = true;
            lastMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    });

    function petDog() {
        if (dogModel && isMouseOverDog) {
            dogModel.rotation.y = Math.sin(Date.now() * 0.005) * 0.1;
            if (isMouseMoving) {
                progress = Math.min(progress + 0.5, 100);
            }
        }
    }

    function updateProgressBar() {
        progressBar.style.height = `${progress}%`;
        
        // Implement progress decay
        if (!isMouseOverDog) {
            progress = Math.max(progress - 0.1, 0);
        }

        // Show/hide "Full" text and trigger sparkles
        if (progress === 100) {
            fullText.style.display = 'block';
            createSparkles();
        } else {
            fullText.style.display = 'none';
            removeSparkles();
        }
    }

    function resetMouseMoving() {
        isMouseMoving = false;
    }

    function createSparkles() {
        if (progressContainer.querySelectorAll('.sparkle').length === 0) {
            for (let i = 0; i < 10; i++) {
                const sparkle = document.createElement('div');
                sparkle.classList.add('sparkle');
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.top = `${Math.random() * 100}%`;
                sparkle.style.animationDelay = `${Math.random() * 1}s`;
                progressContainer.appendChild(sparkle);
            }
        }
    }

    function removeSparkles() {
        progressContainer.querySelectorAll('.sparkle').forEach(sparkle => sparkle.remove());
    }
});

function initScene(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // Set up camera position
    camera.position.set(0, 2, 5);

    // Add OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Set up raycaster for mouse intersection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    return { scene, camera, renderer, controls, raycaster, mouse };
}
