import { Gameloop } from "~engine/gameloop";
import { BgDrawer } from "../global/bgdrawer";
import { FocusableScene } from "../global/focus";
import { OptionsLogic } from "../global/optionslogic";
import { PlayLogic } from "./playlogic";
import { GameSingleton } from "~game/singleton";

export function makePlayScene(gameloop: Gameloop<GameSingleton>) {
    const bgDrawer = new BgDrawer(0.125);

    const scene = new FocusableScene(gameloop.input());

    const playLogic = new PlayLogic(gameloop, scene);
    const optionsLogic = new OptionsLogic(scene);

    scene.addDrawLoaderLogic(bgDrawer);
    scene.addLogic(bgDrawer);
    scene.addLogic(playLogic);
    scene.addLogic(optionsLogic);

    return scene;
}
