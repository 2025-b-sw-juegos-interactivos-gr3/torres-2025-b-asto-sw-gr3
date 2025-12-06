import { Game } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('renderCanvas');
    game.start();
});
