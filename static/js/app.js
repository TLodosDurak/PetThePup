document.addEventListener('DOMContentLoaded', () => {
    const sceneContainer = document.getElementById('scene-container');
    const progressBar = document.getElementById('progress-bar');
    const fullText = document.getElementById('full-text');
    const progressContainer = document.getElementById('progress-container');
    const feedButton = document.getElementById('feed-button');
    const happinessBar = document.getElementById('happiness-bar');
    let dogModel;
    let progress = 100;
    let happiness = 50; // Initial happiness level
    let isMouseOverDog = false;
    let isMouseMoving = false;
    let lastMousePosition = { x: 0, y: 0 };

    // Initialize the 3D scene
    const { scene, camera, renderer, controls, raycaster, mouse } = initScene(sceneContainer);

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
    
    function loadModel() {
        showLoadingIndicator();
        loadDogModel(scene, 'dog').then((model) => {
            dogModel = model;
            console.log('Dog model loaded');
            
            // Set initial camera position
            const centerPosition = getCenterCameraPosition(dogModel);
            camera.position.copy(centerPosition);
            
            // Make the camera look at the center of the dog model
            const boundingBox = new THREE.Box3().setFromObject(dogModel);
            const center = boundingBox.getCenter(new THREE.Vector3());
            camera.lookAt(center);
            controls.target.copy(center);
            
            setupCameraControls();
            hideLoadingIndicator();
        }).catch((error) => {
            console.error('Failed to load dog model:', error);
            showErrorMessage(`Failed to load dog model. ${error.message}`);
            hideLoadingIndicator();
        });
    }

    function getCenterCameraPosition(dogModel) {
        const boundingBox = new THREE.Box3().setFromObject(dogModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        return new THREE.Vector3(
            center.x + size.x * 3,
            center.y + size.y * 1.1,
            center.z - size.z * 0.5
        );
    }

    // Load the initial dog model
    loadModel();

    // Handle feed button click
    feedButton.addEventListener('click', () => {
        if (dogModel) {
            feedDog();
        }
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
            const dogIntersect = intersects.find(intersect => intersect.object.name === 'dog');
            isMouseOverDog = !!dogIntersect;
            if (isMouseOverDog && (isMouseMoving || isTouching)) {
                petDog(dogIntersect.point);
            }
        }

        updateProgressBar();
        updateHappinessBar();
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
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        adjustCameraPosition();
    });

    function petDog(intersectionPoint) {
        if (dogModel && isMouseOverDog && (isMouseMoving || isTouching)) {
            happiness = Math.min(happiness + 0.1, 100); // Increase happiness when petting
            createPetParticles(intersectionPoint);
        }
    }

    function createPetParticles(position) {
        const particleCount = 1; // Reduced to a single particle per touch
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Start particles at the touch point
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Random color between pink and red
            colors[i * 3] = Math.random() * 0.3 + 0.7;     // Red
            colors[i * 3 + 1] = Math.random() * 0.2;       // Green
            colors[i * 3 + 2] = Math.random() * 0.2 + 0.2; // Blue

            // Slower, random direction with small radius
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.0005 + Math.random() * 0.001;
            velocities[i * 3] = Math.cos(angle) * speed;
            velocities[i * 3 + 1] = Math.sin(angle) * speed;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.01, // Smaller particles
            vertexColors: true,
            transparent: true,
            opacity: 1,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        let frame = 0;
        const maxFrames = 120; // Animation duration

        const animateParticles = () => {
            frame++;
            const positions = particles.geometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
            }

            particles.geometry.attributes.position.needsUpdate = true;
            particles.material.opacity = 1 - (frame / maxFrames);

            if (frame < maxFrames) {
                requestAnimationFrame(animateParticles);
            } else {
                scene.remove(particles);
            }
        };

        animateParticles();
    }

    function feedDog() {
        if (dogModel) {
            happiness = Math.min(happiness + 15, 100); // Increase happiness significantly when feeding
            createFoodParticles();
        }
    }

    function createFoodParticles() {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        // Get the bounding box of the dog model
        const boundingBox = new THREE.Box3().setFromObject(dogModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        for (let i = 0; i < particleCount; i++) {
            // Start particles from the center of mass
            const x = center.x + (Math.random() - 0.5) * size.x * 0.2;
            const y = center.y;
            const z = center.z + (Math.random() - 0.5) * size.z * 0.2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            colors[i * 3] = Math.random() * 0.5 + 0.5; // Brighter colors
            colors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
            colors[i * 3 + 2] = Math.random() * 0.5 + 0.5;

            // Upward and slightly outward velocities
            velocities[i * 3] = (Math.random() - 0.5) * 0.002;
            velocities[i * 3 + 1] = Math.random() * 0.005 + 0.002; // Upward movement
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 1,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Animate particles
        let frame = 0;
        const maxFrames = 300; // Animation duration

        const animateParticles = () => {
            frame++;
            const positions = particles.geometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];

                // Add some wobble
                positions[i * 3] += Math.sin(frame * 0.1 + i) * 0.0005;
                positions[i * 3 + 2] += Math.cos(frame * 0.1 + i) * 0.0005;

                // Slow down particles over time
                velocities[i * 3] *= 0.99;
                velocities[i * 3 + 1] *= 0.99;
                velocities[i * 3 + 2] *= 0.99;
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Slower fade out
            particles.material.opacity = 1 - (frame / maxFrames);

            if (frame < maxFrames) {
                requestAnimationFrame(animateParticles);
            } else {
                scene.remove(particles);
            }
        };

        animateParticles();
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
    }

    function updateHappinessBar() {
        happiness = Math.max(happiness - 0.02, 0); // Slowly decrease happiness over time
        happinessBar.style.height = `${happiness}%`;
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

    // Add touch event listeners
    sceneContainer.addEventListener('touchstart', handleTouchStart, false);
    sceneContainer.addEventListener('touchmove', handleTouchMove, false);
    sceneContainer.addEventListener('touchend', handleTouchEnd, false);

    let isTouching = false;
    let lastTouchPosition = { x: 0, y: 0 };

    function handleTouchStart(event) {
        isTouching = true;
        const touch = event.touches[0];
        lastTouchPosition.x = touch.clientX;
        lastTouchPosition.y = touch.clientY;
        updateMousePosition(touch.clientX, touch.clientY);
    }

    function handleTouchMove(event) {
        if (!isTouching) return;
        const touch = event.touches[0];
        updateMousePosition(touch.clientX, touch.clientY);
        if (Math.abs(touch.clientX - lastTouchPosition.x) > 5 || Math.abs(touch.clientY - lastTouchPosition.y) > 5) {
            isMouseMoving = true;
            lastTouchPosition.x = touch.clientX;
            lastTouchPosition.y = touch.clientY;
        }
    }

    function handleTouchEnd() {
        isTouching = false;
        isMouseMoving = false;
    }

    function updateMousePosition(clientX, clientY) {
        const rect = sceneContainer.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    // Add a window resize event listener
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateUILayout();
    }

    function updateUILayout() {
        const isMobile = window.innerWidth < 768;
        const cameraControls = document.getElementById('camera-controls');
        const feedButton = document.getElementById('feed-button');

        if (isMobile) {
            cameraControls.style.flexDirection = 'column';
            cameraControls.style.left = '10px';
            cameraControls.style.bottom = '100px';
            feedButton.style.right = '10px';
            feedButton.style.bottom = '100px';
        } else {
            cameraControls.style.flexDirection = 'column';
            cameraControls.style.left = '10px';
            cameraControls.style.bottom = '100px';
            feedButton.style.right = '10px';
            feedButton.style.bottom = '100px';
        }
    }

    // Call updateUILayout on initial load
    updateUILayout();

    function setupCameraControls() {
        const cameraHead = document.getElementById('camera-head');
        const cameraNeck = document.getElementById('camera-neck');
        const cameraBack = document.getElementById('camera-back');
        const cameraBelly = document.getElementById('camera-belly');
        const cameraCenter = document.getElementById('camera-center');

        const boundingBox = new THREE.Box3().setFromObject(dogModel);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        // Create camera position indicators
        const headPosition = new THREE.Vector3(center.x + size.x * 1, center.y + size.y * 0.5, center.z - size.z * 0.6);
        const neckPosition = new THREE.Vector3(center.x + size.x * 1.1, center.y + size.y * 0, center.z - size.z * 0.5);
        const backPosition = new THREE.Vector3(center.x + size.x * 2, center.y + size.y * 0.5, center.z);
        const bellyPosition = new THREE.Vector3(center.x + size.x * 1.75, center.y - size.y * 0.2, center.z);
        const centerPosition = new THREE.Vector3(center.x + size.x * 3, center.y + size.y * 1.1, center.z - size.z * 0.5);

        cameraHead.addEventListener('click', () => {
            const focusPoint = new THREE.Vector3(center.x, center.y + size.y * 0.45, center.z - size.z * 0.35);
            setCameraPosition(headPosition, focusPoint);
        });

        cameraNeck.addEventListener('click', () => {
            const focusPoint = new THREE.Vector3(center.x, center.y + size.y * 0.25, center.z - size.z * 0.32);
            setCameraPosition(neckPosition, focusPoint);
        });

        cameraBack.addEventListener('click', () => {
            const focusPoint = new THREE.Vector3(center.x, center.y + size.y * 0.18, center.z);
            setCameraPosition(backPosition, focusPoint);
        });

        cameraBelly.addEventListener('click', () => {
            const focusPoint = new THREE.Vector3(center.x, center.y - size.y * 0.12, center.z - size.z * 0.02);
            setCameraPosition(bellyPosition, focusPoint);
        });

        cameraCenter.addEventListener('click', () => {
            const centerPosition = getCenterCameraPosition(dogModel);
            const boundingBox = new THREE.Box3().setFromObject(dogModel);
            const center = boundingBox.getCenter(new THREE.Vector3());
            setCameraPosition(centerPosition, center);
        });
    }

    function setCameraPosition(position, lookAt) {
        const duration = 1000; // Animation duration in milliseconds
        const startPosition = camera.position.clone();
        const startLookAt = controls.target.clone();
        const startTime = Date.now();

        function animateCamera() {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeProgress = progress * (2 - progress); // Ease out

            camera.position.lerpVectors(startPosition, position, easeProgress);
            controls.target.lerpVectors(startLookAt, lookAt, easeProgress);
            camera.lookAt(controls.target);
            controls.update();

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        }

        animateCamera();
    }
});

function initScene(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // Add OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Set max zoom out
    controls.maxDistance = 5; // Adjust this value to set the maximum zoom out distance

    // Set up raycaster for mouse intersection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    return { scene, camera, renderer, controls, raycaster, mouse };
}
