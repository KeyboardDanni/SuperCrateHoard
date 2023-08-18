import { Picture } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { centered } from "../../engine/util";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import * as titleAtlasJson from "../../res/TitleAtlas.json";

const slices = titleAtlasJson;

export class MenuLogic implements TickLogic, DrawLogic {
    private picture = new Picture("res/TitleAtlas.png");
    private ticks = 0;

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.ticks++;
    }
    draw(gameloop: Gameloop, _scene: Scene, _lerpTime: number) {
        const renderer = gameloop.renderer();
        const width = renderer.canvas().width;

        renderer.drawSprite(
            this.picture,
            slices.title,
            centered(slices.title.w, width),
            32
        );
    }
}
