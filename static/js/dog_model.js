function loadDogModel(scene) {
    return new Promise((resolve) => {
        // Create a group to hold all parts of the dog
        const dogGroup = new THREE.Group();

        // Create the body (elongated sphere)
        const bodyGeometry = new THREE.SphereGeometry(1, 32, 16);
        bodyGeometry.scale(1.5, 1, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        dogGroup.add(body);

        // Create the head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.6, 32, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(1.2, 0.5, 0);
        dogGroup.add(head);

        // Create the legs (cylinders)
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 32);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(0.7, -1, 0.5);
        dogGroup.add(frontLeftLeg);

        const frontRightLeg = frontLeftLeg.clone();
        frontRightLeg.position.set(0.7, -1, -0.5);
        dogGroup.add(frontRightLeg);

        const backLeftLeg = frontLeftLeg.clone();
        backLeftLeg.position.set(-0.7, -1, 0.5);
        dogGroup.add(backLeftLeg);

        const backRightLeg = frontLeftLeg.clone();
        backRightLeg.position.set(-0.7, -1, -0.5);
        dogGroup.add(backRightLeg);

        // Create the tail (curved cylinder)
        const tailCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.5, 0.5, 0),
            new THREE.Vector3(-1, 0.8, 0),
        ]);
        const tailGeometry = new THREE.TubeGeometry(tailCurve, 20, 0.1, 8, false);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(-1.5, 0, 0);
        dogGroup.add(tail);

        // Add the dog group to the scene
        scene.add(dogGroup);

        // Scale and position the entire dog
        dogGroup.scale.set(0.5, 0.5, 0.5);
        dogGroup.position.set(0, 0, 0);

        resolve(dogGroup);
    });
}
