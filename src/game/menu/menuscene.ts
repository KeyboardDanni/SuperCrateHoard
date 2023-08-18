import { BgDrawer } from "../global/bgdrawer";
import { Scene } from "../../engine/scene";
import { Picture } from "../../engine/graphics";
import { MenuLogic } from "./menulogic";

export function makeMenuScene() {
    const scene = new Scene();
    const bgDrawer = new BgDrawer(0.25);
    const menuLogic = new MenuLogic();

    scene.addLogic(bgDrawer);
    scene.addLogic(menuLogic);

    Picture.waitForLoad();

    return scene;
}
