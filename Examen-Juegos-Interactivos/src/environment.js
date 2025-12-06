import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

// Helper to load meshes using Promise (replacing ImportMeshAsync)
function loadMesh(path, filename, scene) {
    return new Promise((resolve, reject) => {
        BABYLON.SceneLoader.ImportMesh("", path, filename, scene,
            (meshes) => resolve(meshes),
            null,
            (scene, message) => reject(message)
        );
    });
}

export async function createEnvironment(scene) {
    console.log("🚀🚀🚀 CREATING ENVIRONMENT - NEW CODE VERSION 🚀🚀🚀");
    console.log("🎮 Player will spawn at position (0, 0, 0)");
    console.log("⚠️ Obstacles will be at LEAST 50 units away from player spawn");

    // Ground base (for collisions) - Always present so player doesn't fall
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6); // Sand color
    ground.material = groundMat;
    ground.checkCollisions = true;

    // Skybox
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.7, 1); // Light blue sky
    skybox.material = skyboxMaterial;

    // Track ALL obstacle positions to prevent overlap
    const obstaclePositions = [];

    // 1. Wooden Fortress
    try {
        const fortressMeshes = await loadMesh("/assets/models/", "Wooden Fortress.glb", scene);

        // CRITICAL: Hide the original template meshes
        const fortressRoot = fortressMeshes[0];
        fortressMeshes.forEach(mesh => {
            mesh.setEnabled(false);
            mesh.isVisible = false;
        });
        // Move original far away just in case
        if (fortressRoot) fortressRoot.position = new BABYLON.Vector3(0, -1000, 0);

        console.log("🔒 Hidden original Wooden Fortress template meshes");

        let fortressesCreated = 0;

        for (let i = 0; i < 5; i++) {
            // Generate position FIRST
            let validPosition = false;
            let posX, posZ;
            let attempts = 0;

            while (!validPosition && attempts < 200) {
                posX = Math.random() * 160 - 80;
                posZ = Math.random() * 160 - 80;

                const distToDropZone = Math.sqrt(Math.pow(posX - (-10), 2) + Math.pow(posZ - (-10), 2));
                const distToPlayerSpawn = Math.sqrt(Math.pow(posX - 0, 2) + Math.pow(posZ - 0, 2));

                // Check distance against ALL other obstacles
                let tooCloseToOther = false;
                for (const pos of obstaclePositions) {
                    const dist = Math.sqrt(Math.pow(posX - pos.x, 2) + Math.pow(posZ - pos.z, 2));
                    // Fortresses are big (scale 5), so we need large spacing (50 units)
                    if (dist < 50) {
                        tooCloseToOther = true;
                        break;
                    }
                }

                if (distToDropZone >= 25 && distToPlayerSpawn >= 50 && !tooCloseToOther) {
                    validPosition = true;
                    console.log(`✅ Fortress ${i}: Position (${posX.toFixed(1)}, ${posZ.toFixed(1)})`);
                }
                attempts++;
            }

            if (validPosition && fortressRoot) {
                // Use instantiateHierarchy
                const newRoot = fortressRoot.instantiateHierarchy(null, { doNotInstantiate: true }, (source, clone) => {
                    clone.name = "fortress" + i + "_" + source.name;
                    clone.isVisible = true;
                    clone.setEnabled(true);
                    // Disable mesh collision, use box instead
                    clone.checkCollisions = false;
                });

                newRoot.position.x = posX;
                newRoot.position.z = posZ;
                newRoot.position.y = 0;
                newRoot.scaling = new BABYLON.Vector3(5, 5, 5);

                // Create COLLISION BOX for Fortress
                const fortressBox = BABYLON.MeshBuilder.CreateBox("fortressBox" + i, {
                    width: 15,
                    height: 20,
                    depth: 15
                }, scene);
                fortressBox.position = new BABYLON.Vector3(posX, 10, posZ);
                fortressBox.isVisible = false;
                fortressBox.checkCollisions = true;

                obstaclePositions.push({ x: posX, z: posZ, type: 'fortress' });
                fortressesCreated++;
            }
        }

        console.log(`🏰 Loaded Wooden Fortress - Created ${fortressesCreated}/5 fortresses`);
    } catch (e) {
        console.error("Error loading Wooden Fortress.glb", e);
    }

    // 2. Rock Large
    try {
        const rockLargeMeshes = await loadMesh("/assets/models/", "Rock Large.glb", scene);

        // CRITICAL: Hide the original template meshes
        const rockRoot = rockLargeMeshes[0];
        rockLargeMeshes.forEach(mesh => {
            mesh.setEnabled(false);
            mesh.isVisible = false;
        });
        if (rockRoot) rockRoot.position = new BABYLON.Vector3(0, -1000, 0);

        console.log("🔒 Hidden original Rock Large template meshes");

        let rocksCreated = 0;
        for (let i = 0; i < 30; i++) {
            // Generate position FIRST
            let validPosition = false;
            let posX, posZ;
            let attempts = 0;

            while (!validPosition && attempts < 200) {
                posX = Math.random() * 180 - 90;
                posZ = Math.random() * 180 - 90;

                const distToDropZone = Math.sqrt(Math.pow(posX - (-10), 2) + Math.pow(posZ - (-10), 2));
                const distToPlayerSpawn = Math.sqrt(Math.pow(posX - 0, 2) + Math.pow(posZ - 0, 2));

                // Check distance against ALL other obstacles
                let tooCloseToOther = false;
                for (const pos of obstaclePositions) {
                    const dist = Math.sqrt(Math.pow(posX - pos.x, 2) + Math.pow(posZ - pos.z, 2));
                    // If it's a fortress, need more space (30). If rock, less space (10)
                    const minDistance = pos.type === 'fortress' ? 30 : 10;

                    if (dist < minDistance) {
                        tooCloseToOther = true;
                        break;
                    }
                }

                if (distToDropZone >= 20 && distToPlayerSpawn >= 50 && !tooCloseToOther) {
                    validPosition = true;
                }
                attempts++;
            }

            if (validPosition && rockRoot) {
                // Use instantiateHierarchy
                const newRoot = rockRoot.instantiateHierarchy(null, { doNotInstantiate: true }, (source, clone) => {
                    clone.name = "rockLarge" + i + "_" + source.name;
                    clone.isVisible = true;
                    clone.setEnabled(true);
                    // Disable mesh collision, use box instead
                    clone.checkCollisions = false;
                });

                newRoot.position.x = posX;
                newRoot.position.z = posZ;
                newRoot.position.y = 0;
                newRoot.rotation.y = Math.random() * Math.PI * 2;

                const scale = 1 + Math.random() * 1;
                newRoot.scaling = new BABYLON.Vector3(scale, scale, scale);

                // Create COLLISION BOX for Rock
                const rockBox = BABYLON.MeshBuilder.CreateBox("rockBox" + i, {
                    width: 4 * scale,
                    height: 4 * scale,
                    depth: 4 * scale
                }, scene);
                rockBox.position = new BABYLON.Vector3(posX, 2 * scale, posZ);
                rockBox.isVisible = false;
                rockBox.checkCollisions = true;

                obstaclePositions.push({ x: posX, z: posZ, type: 'rock' });
                rocksCreated++;
            }
        }

        console.log(`🪨 Loaded Rock Large - Created ${rocksCreated}/30 rocks`);
    } catch (e) {
        console.error("Error loading Rock Large.glb", e);
    }

    // 3. Rover
    try {
        const roverMeshes = await loadMesh("/assets/models/", "Rover.glb", scene);
        const rover = roverMeshes[0];
        if (rover) {
            rover.position = new BABYLON.Vector3(-10, 0, -10);
            rover.scaling = new BABYLON.Vector3(2, 2, 2);

            // Create an invisible collision box around the rover to prevent clipping
            const roverCollisionBox = BABYLON.MeshBuilder.CreateBox("roverCollision", {
                width: 6,   // Wider than the rover
                height: 4,  // Taller than the rover
                depth: 8    // Longer than the rover
            }, scene);
            roverCollisionBox.position = new BABYLON.Vector3(-10, 2, -10);
            roverCollisionBox.isVisible = false;
            roverCollisionBox.checkCollisions = true;

            // Disable collision on the visual meshes (collision box handles it)
            roverMeshes.forEach(m => m.checkCollisions = false);

            console.log("🚗 Rover loaded with collision box");
        }
    } catch (e) {
        console.error("Error loading Rover.glb", e);
    }

    // Drop Zone
    const dropZone = BABYLON.MeshBuilder.CreateGround("dropZone", { width: 8, height: 8 }, scene);
    dropZone.position = new BABYLON.Vector3(-10, 0.05, -10);
    const dropZoneMat = new BABYLON.StandardMaterial("dropZoneMat", scene);
    dropZoneMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
    dropZoneMat.alpha = 0.3;
    dropZone.material = dropZoneMat;

    // Artifacts
    const artifacts = [];
    // Removed Desert skull.glb as requested, prioritized Large Bone and Skull
    const fossilModels = [
        "Large Bone.glb",
        "Skull.glb",
        "Large Bone.glb",
        "Skull.glb",
        "Large Bone.glb"
    ];

    // Shuffle obstacle positions to pick random ones for hiding artifacts
    const shuffledObstacles = obstaclePositions.sort(() => 0.5 - Math.random());

    // Load all artifacts in parallel
    await Promise.all(fossilModels.map(async (modelFile, i) => {
        try {
            const meshes = await loadMesh("/assets/models/", modelFile, scene);

            if (meshes.length > 0) {
                console.log(`Loaded ${modelFile} with ${meshes.length} meshes`);

                // Use the root mesh (usually meshes[0] or __root__) for positioning the whole object
                const root = meshes[0];
                root.name = "artifact" + i;

                // HIDE ARTIFACT BEHIND OBSTACLE
                // Pick an obstacle to hide behind (cycling through shuffled list)
                const obstacle = shuffledObstacles[i % shuffledObstacles.length];

                let x, z;
                if (obstacle) {
                    // Place it "behind" or near the obstacle
                    // Add an offset based on obstacle type
                    const offsetDist = obstacle.type === 'fortress' ? 12 : 5;
                    const angle = Math.random() * Math.PI * 2;

                    x = obstacle.x + Math.cos(angle) * offsetDist;
                    z = obstacle.z + Math.sin(angle) * offsetDist;

                    console.log(`🕵️ Hiding artifact ${i} near ${obstacle.type} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
                } else {
                    // Fallback to random if no obstacles (shouldn't happen)
                    x = Math.random() * 160 - 80;
                    z = Math.random() * 160 - 80;
                }

                // Lower position to be reachable (y=0.5)
                root.position = new BABYLON.Vector3(x, 0.5, z);

                // Reset rotation to ensure it's upright, then rotate random Y
                root.rotation = new BABYLON.Vector3(0, 0, 0);
                root.rotation.y = Math.random() * Math.PI * 2;

                // Scale based on model type
                let scale = 1.5;
                if (modelFile.includes("Large Bone")) {
                    scale = 0.5 + Math.random() * 0.3; // Smaller: 0.5 to 0.8
                } else if (modelFile.includes("Skull")) {
                    scale = 4.0 + Math.random() * 1.0; // Larger: 4.0 to 5.0 (Requested increase)
                } else {
                    scale = 1.5 + Math.random() * 1; // Default
                }

                root.scaling = new BABYLON.Vector3(scale, scale, scale);

                // Configure all meshes in the hierarchy
                meshes.forEach(m => {
                    m.checkCollisions = false; // Disable collision so we can pick it up
                    m.isPickable = true;
                    // Ensure it's visible
                    m.isVisible = true;
                    m.setEnabled(true);
                });

                artifacts.push(root);
            } else {
                console.error(`No meshes found in ${modelFile}`);
            }
        } catch (e) {
            console.error(`Error loading ${modelFile}`, e);
        }
    }));

    return {
        dropZone,
        artifacts
    };
}
