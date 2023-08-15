import { Picture, PictureSlice } from "./engine/graphics";
import { Gameloop } from "./engine/gameloop";
import { DrawLogic, Scene, TickLogic } from "./engine/scene";
import { lerp } from "./engine/util";
import { BMFont } from "./engine/text";
import * as fontDescriptor from "./res/Pixel12x10.json";
import * as outlineFontDescriptor from "./res/Pixel12x10_Outline.json";

const TEST_SLICE: PictureSlice = {
    x: 0,
    y: 160,
    w: 32,
    h: 32,
};

class TestLogic implements TickLogic, DrawLogic {
    private tickCount = 0;
    private picture;
    private font: BMFont;
    private outlineFont: BMFont;

    constructor() {
        this.font = new BMFont(fontDescriptor);
        this.outlineFont = new BMFont(outlineFontDescriptor);
        this.picture = new Picture("res/GameAtlas.png");
        Picture.waitForLoad();
    }

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.tickCount += 1;
    }
    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number) {
        const renderer = gameloop.renderer();

        renderer.context().imageSmoothingEnabled = false;

        const x = 64 + (this.tickCount % 60) * 4;
        const xPrev = 64 + ((this.tickCount - 1) % 60) * 4;

        renderer.drawSprite(
            this.picture,
            TEST_SLICE,
            lerp(xPrev, x, lerpTime),
            64
        );

        const font = this.tickCount % 120 >= 60 ? this.outlineFont : this.font;

        font.drawText(
            renderer,
            "Hello, world! This is some wrapped text!\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
            256,
            256,
            512
        );
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
