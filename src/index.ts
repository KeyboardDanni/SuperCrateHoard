import { Picture, PictureSlice } from "./graphics";
import { Gameloop } from "./gameloop";
import { DrawLogic, Scene, TickLogic } from "./scene";
import { lerp } from "./util";

const TEST_SLICE: PictureSlice = {
    x: 0,
    y: 160,
    w: 32,
    h: 32
};

class TestLogic implements TickLogic, DrawLogic {
    private tickCount = 0;
    private picture;

    constructor () {
        this.picture = new Picture("res/GameAtlas.png");
        Picture.waitForLoad();
    }

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.tickCount += 1;
    }
    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number) {
        gameloop.renderer().context().imageSmoothingEnabled = false;

        const x = 64 + (this.tickCount % 60) * 4;
        const xPrev = 64 + ((this.tickCount - 1) % 60) * 4;

        gameloop.renderer().drawSprite(this.picture, TEST_SLICE, lerp(xPrev, x, lerpTime), 64);
    }
}

window.onload = function init() {
    const gameloop = new Gameloop("game_surface");

    gameloop.setScene(() => {
        const scene = new Scene();
        const logic = new TestLogic();

        scene.addTickLogic(logic);
        scene.addDrawLogic(logic);

        return scene;
    });

    gameloop.run();
};
