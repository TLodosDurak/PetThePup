function loadDogModel(scene, breed = 'dog') {
    console.log(`Loading dog model for breed: ${breed}`);
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        const modelPath = `/static/models/${breed}.glb`;
        
        loader.load(modelPath,
            (gltf) => {
                const dogGroup = gltf.scene;
                dogGroup.scale.set(0.5, 0.5, 0.5);
                dogGroup.position.set(0, 0, 0);
                
                // Function to recursively set the name property for all meshes in the dog model
                function setModelName(object, name) {
                    object.name = name;
                    object.children.forEach(child => setModelName(child, name));
                }
                
                // Call this function before adding the dog group to the scene
                setModelName(dogGroup, 'dog');
                
                // Add the dog group to the scene
                scene.add(dogGroup);
                
                console.log('Dog model details:', {
                    breed: breed,
                    position: dogGroup.position,
                    scale: dogGroup.scale,
                    boundingBox: new THREE.Box3().setFromObject(dogGroup)
                });
                
                resolve(dogGroup);
            },
            undefined,
            (error) => {
                console.error(`An error occurred while loading the ${breed} model:`, error);
                console.log(`Error details:`, error.message);
                if (breed !== 'dog') {
                    console.log(`Falling back to default 'dog' model`);
                    loadDogModel(scene, 'dog').then(resolve).catch(reject);
                } else {
                    reject(error);
                }
            }
        );
    });
}
