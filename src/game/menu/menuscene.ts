import { BgDrawer } from "../global/bgdrawer";
import { Input } from "../../engine/input";
import { MenuLogic } from "./menulogic";
import { LevelFetchLogic } from "./levelfetchlogic";
import { FocusableScene } from "../global/focus";
import { OptionsLogic } from "../global/optionslogic";

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

export function makeMenuScene(input: Input) {
    const bgDrawer = new BgDrawer(0.25);
    const levelFetchLogic = new LevelFetchLogic();

    const scene = new MenuScene(input, levelFetchLogic);

    const menuLogic = new MenuLogic(scene);
    const optionsLogic = new OptionsLogic(scene);

    scene.addDrawLoaderLogic(bgDrawer);
    scene.addLoaderLogic(levelFetchLogic);
    scene.addLogic(bgDrawer);
    scene.addLogic(menuLogic);
    scene.addLogic(optionsLogic);

    return scene;
}
