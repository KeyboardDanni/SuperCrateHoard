import { BgDrawer } from "../global/bgdrawer";
import { Scene } from "../../engine/scene";
import { Picture } from "../../engine/graphics";

export function makeMenuScene() {
    const scene = new Scene();
    const bgDrawer = new BgDrawer(0.25);

    scene.addTickLogic(bgDrawer);
    scene.addDrawLogic(bgDrawer);

    Picture.waitForLoad();

    return scene;
}
