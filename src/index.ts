import { GameSingleton } from "./game/singleton";
import { Gameloop } from "./engine/gameloop";
import { makeMenuScene } from "./game/menu/menuscene";

window.onload = function init() {
    const gameloop = new Gameloop("game_surface", new GameSingleton());
    const input = gameloop.input();

    input.addAction("left", ["ArrowLeft", "KeyA"]);
    input.addAction("right", ["ArrowRight", "KeyD"]);
    input.addAction("up", ["ArrowUp", "KeyW"]);
    input.addAction("down", ["ArrowDown", "KeyS"]);

    gameloop.setScene(makeMenuScene);

    gameloop.run();
};
