import { BgDrawer } from "../global/bgdrawer";
import { Gameloop } from "../../engine/gameloop";
import { Input } from "../../engine/input";
import { MenuLogic } from "./menulogic";
import { LevelFetchLogic } from "./levelfetchlogic";
import { FocusableScene } from "../global/focus";
import { OptionsLogic } from "../global/optionslogic";
import { GameSingleton } from "../singleton";

class MenuScene extends FocusableScene {
    levelFetchLogic: LevelFetchLogic;

    constructor(input: Input, levelFetchLogic: LevelFetchLogic) {
        super(input);

        this.levelFetchLogic = levelFetchLogic;
    }

    override isLoaded(): boolean {
        return super.isLoaded() && this.levelFetchLogic.isLoaded();
    }
}

export function makeMenuScene(gameloop: Gameloop<GameSingleton>) {
    const levelFetchLogic = new LevelFetchLogic();

    const input = gameloop.input();
    const scene = new MenuScene(input, levelFetchLogic);

    const bgDrawer = new BgDrawer(gameloop, scene, 0.25);
    const menuLogic = new MenuLogic(scene);
    const optionsLogic = new OptionsLogic(gameloop, scene);

    scene.addDrawLoaderLogic(bgDrawer);
    scene.addLoaderLogic(levelFetchLogic);
    scene.addLogic(bgDrawer);
    scene.addLogic(menuLogic);
    scene.addLogic(optionsLogic);

    return scene;
}
