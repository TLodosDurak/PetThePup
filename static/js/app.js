document.addEventListener('DOMContentLoaded', () => {
    const sceneContainer = document.getElementById('scene-container');
    const progressBar = document.getElementById('progress-bar');
    const fullText = document.getElementById('full-text');
    const progressContainer = document.getElementById('progress-container');
    const breedSelect = document.getElementById('breed-select');
    const colorPicker = document.getElementById('color-picker');
    const sizeSlider = document.getElementById('size-slider');
    let dogModel;
    let progress = 100;
    let isMouseOverDog = false;
    let isMouseMoving = false;
    let lastMousePosition = { x: 0, y: 0 };

    

    // Initialize the 3D scene
    const { scene, camera, renderer, controls, raycaster, mouse } = initScene(sceneContainer);

    function checkModelExists(breed) {
        return fetch(`/static/models/${breed}.glb`, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }

    const canvas = renderer.domElement;

    // Prevent default behavior on touch gestures and scroll
    canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    canvas.addEventListener('gesturechange', (e) => e.preventDefault());
    canvas.addEventListener('gestureend', (e) => e.preventDefault());

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent multi-finger gestures like zoom
      }
    }, { passive: false });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault(); // Prevent scroll/zoom on wheel
    }, { passive: false });

    // Prevent default touch behaviors
    document.addEventListener('touchstart', preventDefaultTouchBehavior, { passive: false });
    document.addEventListener('touchmove', preventDefaultTouchBehavior, { passive: false });
    document.addEventListener('touchend', preventDefaultTouchBehavior, { passive: false });

    function preventDefaultTouchBehavior(event) {
        if (event.touches.length > 1 || event.type === 'wheel' || event.type.startsWith('gesture')) {
            event.preventDefault();
        }
    }
    
    function loadModel(breed) {
        showLoadingIndicator();
        checkModelExists(breed).then(exists => {
            if (exists) {
                if (dogModel) {
                    scene.remove(dogModel);
                }
                loadDogModel(scene, breed).then((model) => {
                    dogModel = model;
                    console.log(`Dog model loaded: ${breed}`);
                    adjustCameraPosition();
                    applyRandomColor(dogModel);
                    adjustModelSize(parseFloat(sizeSlider.value));
                    hideLoadingIndicator();
                }).catch((error) => {
                    console.error(`Failed to load ${breed} model:`, error);
                    showErrorMessage(`Failed to load ${breed} model. ${error.message}`);
                    if (breed !== 'dog') {
                        loadModel('dog');
                    }
                    hideLoadingIndicator();
                });
            } else {
                console.error(`Model file for ${breed} does not exist.`);
                showErrorMessage(`Model for ${breed} is not available. Using default.`);
                if (breed !== 'dog') {
                    loadModel('dog');
                }
                hideLoadingIndicator();
            }
        });
    }

    function applyRandomColor(model) {
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        applyColor(model, color);
    }

    function applyColor(model, color) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.color = color;
            }
        });
    }

    function adjustModelSize(size) {
        if (dogModel) {
            dogModel.scale.set(size, size, size);
            adjustCameraPosition();
        }
    }

    // Load the initial dog model
    const initialBreed = breedSelect.value;
    loadModel(initialBreed);

    // Handle breed selection
    breedSelect.addEventListener('change', (event) => {
        const selectedBreed = event.target.value;
        console.log(`Breed selected: ${selectedBreed}`);
        loadModel(selectedBreed);
    });

    // Handle color picker change
    colorPicker.addEventListener('change', (event) => {
        const color = new THREE.Color(event.target.value);
        applyColor(dogModel, color);
    });

    // Handle size slider change
    sizeSlider.addEventListener('input', (event) => {
        const size = parseFloat(event.target.value);
        adjustModelSize(size);
    });

    function showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.textContent = message;
        errorElement.style.position = 'absolute';
        errorElement.style.top = '10px';
        errorElement.style.left = '10px';
        errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '10px';
        errorElement.style.borderRadius = '5px';
        errorElement.style.zIndex = '1000';
        sceneContainer.appendChild(errorElement);
        
        // Remove the error message when clicking on it
        errorElement.addEventListener('click', () => errorElement.remove());
    }

    function showLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.textContent = 'Loading...';
        loadingElement.id = 'loading-indicator';
        loadingElement.style.position = 'absolute';
        loadingElement.style.top = '50%';
        loadingElement.style.left = '50%';
        loadingElement.style.transform = 'translate(-50%, -50%)';
        loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingElement.style.color = 'white';
        loadingElement.style.padding = '10px';
        loadingElement.style.borderRadius = '5px';
        loadingElement.style.zIndex = '1000';
        sceneContainer.appendChild(loadingElement);
    }

    function hideLoadingIndicator() {
        const loadingElement = document.getElementById('loading-indicator');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    function adjustCameraPosition() {
        if (dogModel) {
            const boundingBox = new THREE.Box3().setFromObject(dogModel);
            const center = boundingBox.getCenter(new THREE.Vector3());
            const size = boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; // Zoom out a bit
            
            // Position camera at the side of the dog
            camera.position.set(center.x + cameraZ, center.y + size.y / 2, center.z);
            camera.lookAt(center);
            controls.target.copy(center);
            
            // Rotate the camera slightly to get a better side view
            camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
        }
    }

    // Set up animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);

        if (dogModel) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            isMouseOverDog = intersects.some(intersect => intersect.object.name === 'dog');
            petDog();
        }

        updateProgressBar();
        isMouseMoving = false; // Reset the mouse moving flag
    }
    animate();

    // Mouse move event listener
    sceneContainer.addEventListener('mousemove', (event) => {
        const rect = sceneContainer.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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
        adjustCameraPosition();
    });

    function petDog() {
        if (dogModel && isMouseOverDog) {
            dogModel.rotation.y = Math.sin(Date.now() * 0.005) * 0.1;
        }
    }

    function updateProgressBar() {
        if (isMouseOverDog && isMouseMoving) {
            progress = Math.min(progress + 0.5, 115); // Increase progress when petting and moving, up to 115%
        } else {
            progress = Math.max(progress - 0.05, 0); // Decrease progress when not petting
        }

        // Set the height of the progress bar
        const displayProgress = Math.min(progress, 100); // Cap the visual progress at 100%
        progressBar.style.height = `${displayProgress}%`;

        if (progress >= 100) {
            fullText.style.display = 'block';
            createSparkles();
        } else {
            fullText.style.display = 'none';
            removeSparkles();
        }

        // Log progress for debugging
        console.log('Progress:', progress, 'Display Progress:', displayProgress, 'Full text visible:', fullText.style.display);
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

    // Add event listener for the 'Esc' key to exit the simulation
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            console.log('Exiting simulation');
            // Add any necessary cleanup or exit actions here
        }
    });
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
    camera.position.set(0, 1.5, 3.5);

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
