import { BgDrawer } from "../global/bgdrawer";
import { Scene } from "../../engine/scene";
import { MenuLogic } from "./menulogic";
import { LevelFetchLogic } from "./levelfetchlogic";

class MenuScene extends Scene {
    levelFetchLogic: LevelFetchLogic;

    constructor(levelFetchLogic: LevelFetchLogic) {
        super();

        this.levelFetchLogic = levelFetchLogic;
    }

    override isLoaded(): boolean {
        return super.isLoaded() && this.levelFetchLogic.isLoaded();
    }
}

export function makeMenuScene() {
    const bgDrawer = new BgDrawer(0.25);
    const levelFetchLogic = new LevelFetchLogic();
    const menuLogic = new MenuLogic();

    const scene = new MenuScene(levelFetchLogic);

    scene.addDrawLoaderLogic(bgDrawer);
    scene.addLoaderLogic(levelFetchLogic);
    scene.addLogic(bgDrawer);
    scene.addLogic(menuLogic);

    return scene;
}
