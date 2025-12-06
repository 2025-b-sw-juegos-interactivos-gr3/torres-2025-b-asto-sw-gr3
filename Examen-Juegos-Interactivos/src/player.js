import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null; // This will be the collision mesh
        this.visualMesh = null; // This will be the Adventurer model
        this.speed = 0.2;
        this.inputMap = {};
        this.camera = null;

        this.setupInput();
        // registerBeforeRender will be called after load
    }

    async load() {
        return new Promise((resolve, reject) => {
            // Create a simple invisible collision mesh (cylinder)
            this.mesh = BABYLON.MeshBuilder.CreateCylinder("playerCollision", {
                height: 2,
                diameter: 1.5
            }, this.scene);
            this.mesh.position.y = 1; // Half of height to keep bottom at ground
            this.mesh.isVisible = false; // Invisible collision mesh

            // Collision settings for the collision mesh
            this.mesh.checkCollisions = true;
            this.mesh.ellipsoid = new BABYLON.Vector3(0.75, 1, 0.75); // Larger ellipsoid

            // Load the visual Adventurer model
            BABYLON.SceneLoader.ImportMesh("", "/assets/models/", "Adventurer.glb", this.scene,
                (meshes, particleSystems, skeletons, animationGroups) => {
                    // Stop any default animation (like death)
                    if (animationGroups && animationGroups.length > 0) {
                        animationGroups.forEach(group => group.stop());
                    }

                    // The GLB usually has a root node (__root__) or the first mesh is the container
                    const root = meshes[0];
                    this.visualMesh = root;

                    // Make the visual mesh a child of the collision mesh
                    this.visualMesh.parent = this.mesh;

                    // Position relative to collision mesh
                    this.visualMesh.position = new BABYLON.Vector3(0, -1, 0); // Offset to align with ground

                    // Scale
                    this.visualMesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);

                    // Rotation - GLBs often face -Z or +Z
                    this.visualMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);

                    // Disable collisions on visual mesh (collision mesh handles it)
                    meshes.forEach(m => {
                        m.checkCollisions = false;
                    });

                    // Register movement logic only after mesh is loaded
                    this.registerBeforeRender();

                    resolve(this.mesh);
                },
                null,
                (scene, message) => reject(message)
            );
        });
    }

    setupInput() {
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = true;
        }));
        this.scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        }));
    }

    setCamera(camera) {
        this.camera = camera;
    }

    registerBeforeRender() {
        this.scene.onBeforeRenderObservable.add(() => {
            const moveVector = new BABYLON.Vector3(0, 0, 0);

            if (this.inputMap["w"]) {
                moveVector.z += 1;
            }
            if (this.inputMap["s"]) {
                moveVector.z -= 1;
            }
            if (this.inputMap["a"]) {
                moveVector.x -= 1;
            }
            if (this.inputMap["d"]) {
                moveVector.x += 1;
            }

            // If we have a camera, rotate the movement vector to match camera view
            if (this.camera && moveVector.length() > 0) {
                // Get camera's forward direction projected on XZ plane
                const forward = this.camera.getForwardRay().direction;
                forward.y = 0;
                forward.normalize();

                // Get camera's right direction
                const right = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), forward);

                const finalMove = forward.scale(moveVector.z).add(right.scale(moveVector.x));
                finalMove.normalize().scaleInPlace(this.speed);

                // Apply gravity
                finalMove.y = -0.1;

                // Rotate VISUAL mesh to face movement direction (not collision mesh)
                if (this.visualMesh) {
                    const angle = Math.atan2(finalMove.x, finalMove.z);
                    this.visualMesh.rotation.y = angle;
                }

                // Move the collision mesh (visual mesh follows as child)
                this.mesh.moveWithCollisions(finalMove);
            } else if (moveVector.length() > 0) {
                // Fallback if no camera set (shouldn't happen)
                moveVector.normalize().scaleInPlace(this.speed);
                moveVector.y = -0.1;
                this.mesh.moveWithCollisions(moveVector);
            }
        });
    }
}
