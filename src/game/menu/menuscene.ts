import { BgDrawer } from "../global/bgdrawer";
import { Scene } from "../../engine/scene";
import { MenuLogic } from "./menulogic";

export function makeMenuScene() {
    const scene = new Scene();
    const bgDrawer = new BgDrawer(0.25);
    const menuLogic = new MenuLogic();

    scene.addLogic(bgDrawer);
    scene.addLogic(menuLogic);

    return scene;
}
