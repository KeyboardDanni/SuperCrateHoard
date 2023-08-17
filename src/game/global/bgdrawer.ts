import { Picture, PictureSlice } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { lerp } from "../../engine/util";

const NUM_CRATE_ROWS = 32;
const OFFSET_DARK_SQUARE = 32;
const OFFSET_CRATE_SQUARE = 64;
const SLICE_BG_CHECKER: PictureSlice = {
    x: 0,
    y: 96,
    w: 32,
    h: 32,
};

export class BgDrawer implements TickLogic, DrawLogic {
    private image;
    private crates: boolean[] = [];
    private scroll = 0;
    scrollSpeed: number;

    constructor(scrollSpeed: number) {
        this.scrollSpeed = scrollSpeed;
        this.image = new Picture("res/GameAtlas.png");

        for (let i = 0; i < NUM_CRATE_ROWS ** 2; ++i) {
            this.crates.push(Math.random() < 0.3);
        }
    }

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.scroll += this.scrollSpeed;
    }

    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number) {
        const renderer = gameloop.renderer();

        const slice: PictureSlice = { ...SLICE_BG_CHECKER };
        const [width, height] = [
            renderer.canvas().width,
            renderer.canvas().height,
        ];
        const gridWidth = Math.ceil(width / slice.w) + 1;
        const gridHeight = Math.ceil(height / slice.h) + 1;
        const scroll = lerp(
            this.scroll - this.scrollSpeed,
            this.scroll,
            lerpTime
        );
        const scrollTile = Math.floor(scroll / slice.w) % NUM_CRATE_ROWS;
        const scrollSubtile = scroll % slice.h;

        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                // Checker pattern
                slice.x = (x + y) % 2 ? OFFSET_DARK_SQUARE : 0;

                // Get whether this background checker square is a crate
                const [crateX, crateY] = [
                    (x + scrollTile) % NUM_CRATE_ROWS,
                    (y + scrollTile) % NUM_CRATE_ROWS,
                ];
                if (this.crates[crateX + crateY * NUM_CRATE_ROWS]) {
                    slice.x += OFFSET_CRATE_SQUARE;
                }

                renderer.drawSprite(
                    this.image,
                    slice,
                    x * slice.w - scrollSubtile,
                    y * slice.h - scrollSubtile
                );
            }
        }
    }
}
