import * as BABYLON from 'babylonjs';
import { createEnvironment } from './environment.js';
import { Player } from './player.js';
import { Mechanics } from './mechanics.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;
        this.player = null;
        this.mechanics = null;
    }

    async start() {
        this.scene = await this.createScene();

        this.engine.runRenderLoop(() => {
            if (this.scene) {
                this.scene.render();
            }
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    async createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.collisionsEnabled = true;

        // Desert Fog
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogDensity = 0.02; // Adjust density as needed
        scene.fogColor = new BABYLON.Color3(0.9, 0.8, 0.6); // Match ground color

        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // Environment - await loading of GLB models
        const environment = await createEnvironment(scene);

        // Player
        this.player = new Player(scene);
        await this.player.load(); // Wait for model to load

        // Camera (ArcRotateCamera for Mouse Control)
        // Alpha: rotation around Y (horizontal), Beta: rotation around X (vertical), Radius: distance
        const camera = new BABYLON.ArcRotateCamera("ArcRotateCam", Math.PI, Math.PI / 3, 15, this.player.mesh.position, scene);
        camera.lockedTarget = this.player.mesh; // Lock to player
        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 30;
        camera.attachControl(this.canvas, true); // Enable mouse control

        // Pass camera to player for relative movement
        this.player.setCamera(camera);

        // Mechanics
        this.mechanics = new Mechanics(scene, this.player.mesh, environment.artifacts, environment.dropZone);

        return scene;
    }
}
