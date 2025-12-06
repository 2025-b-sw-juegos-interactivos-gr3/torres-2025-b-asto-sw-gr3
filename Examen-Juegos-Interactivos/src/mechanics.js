import * as BABYLON from 'babylonjs';

export class Mechanics {
    constructor(scene, playerMesh, artifacts, dropZoneMesh) {
        this.scene = scene;
        this.player = playerMesh;
        this.artifacts = artifacts; // Array of artifacts
        this.dropZone = dropZoneMesh;
        this.heldArtifact = null; // Reference to the specific artifact being held

        this.setupInteraction();
    }

    setupInteraction() {
        // Create HighlightLayer for glow effect
        this.hl = new BABYLON.HighlightLayer("hl1", this.scene);

        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                if (kbInfo.event.key === " " || kbInfo.event.key.toLowerCase() === "e") {
                    this.handleInteraction();
                }
            }
        });

        // Check proximity every frame for glow effect
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.player) return;

            this.artifacts.forEach(artifact => {
                if (!artifact.isEnabled()) return; // Don't glow if already collected/disabled

                const dist = BABYLON.Vector3.Distance(this.player.absolutePosition, artifact.getAbsolutePosition());

                // Glow if within 10 units
                if (dist < 10) {
                    // Add all meshes of the artifact to highlight layer
                    artifact.getChildMeshes().forEach(mesh => {
                        if (!this.hl.hasMesh(mesh)) {
                            this.hl.addMesh(mesh, BABYLON.Color3.Yellow());
                        }
                    });
                } else {
                    // Remove from highlight layer
                    artifact.getChildMeshes().forEach(mesh => {
                        if (this.hl.hasMesh(mesh)) {
                            this.hl.removeMesh(mesh);
                        }
                    });
                }
            });
        });
    }

    handleInteraction() {
        console.log("Interaction triggered. Artifacts count:", this.artifacts.length);
        console.log("Player position:", this.player.absolutePosition);

        if (!this.heldArtifact) {
            // Try to pick up closest artifact
            let closest = null;
            let minDist = 6; // Pickup range

            for (const artifact of this.artifacts) {
                if (artifact.isEnabled() === false) continue;

                // Use absolute position for accurate distance check
                const artifactPos = artifact.getAbsolutePosition();
                const dist = BABYLON.Vector3.Distance(this.player.absolutePosition, artifactPos);

                console.log(`Checking artifact ${artifact.name}: dist=${dist.toFixed(2)}`);

                if (dist < minDist) {
                    minDist = dist;
                    closest = artifact;
                }
            }

            if (closest) {
                console.log("Picking up artifact:", closest.name);
                closest.setParent(this.player);
                // Reset position to be relative to player head (higher as requested)
                closest.position = new BABYLON.Vector3(0, 2.5, 0);

                // CRITICAL: Disable collisions on artifact when held to prevent player from getting stuck
                const disableCollisions = (mesh) => {
                    mesh.checkCollisions = false;
                    if (mesh.getChildren) {
                        mesh.getChildren().forEach(child => disableCollisions(child));
                    }
                };
                disableCollisions(closest);

                this.heldArtifact = closest;
            } else {
                console.log("No artifact close enough to pick up.");
            }
        } else {
            // Try to drop
            const distance = BABYLON.Vector3.Distance(this.player.position, this.dropZone.position);
            if (distance < 4) {
                console.log("Dropping artifact");
                this.heldArtifact.parent = null;
                this.heldArtifact.position = this.dropZone.position.clone();
                this.heldArtifact.position.y = 0.4; // On the ground

                // Stack them
                this.heldArtifact.position.x += (Math.random() - 0.5);
                this.heldArtifact.position.z += (Math.random() - 0.5);

                // Make artifact invisible when delivered (loaded into rover)
                this.heldArtifact.setEnabled(false);

                this.heldArtifact = null;

                this.checkVictory();
            }
        }
    }

    checkVictory() {
        let deliveredCount = 0;
        for (const artifact of this.artifacts) {
            // Check if artifact is disabled (delivered) OR close to drop zone
            // We disable them when delivered in handleInteraction
            if (!artifact.isEnabled()) {
                deliveredCount++;
            }
        }

        // Update UI
        const uiElement = document.getElementById("artifactCount");
        if (uiElement) {
            uiElement.innerText = `Artefactos: ${deliveredCount}/${this.artifacts.length}`;
        }

        if (deliveredCount >= this.artifacts.length) {
            document.getElementById("victoryModal").style.display = "block";
        }
    }
}
