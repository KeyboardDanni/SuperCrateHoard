import { Picture, PictureSlice } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { lerp } from "../../engine/util";

const NUM_CRATE_ROWS = 32;
const BG_CRATE_DENSITY = 0.3;
const OFFSET_DARK_SQUARE = 32;
const OFFSET_CRATE_SQUARE = 64;
const SLICE_BG: PictureSlice = {
    x: 0,
    y: 96,
    w: 32,
    h: 32,
};

export class BgDrawer implements TickLogic, DrawLogic {
    private image;
    private canvas: OffscreenCanvas | null = null;
    private scroll = 0;
    scrollSpeed: number;

    constructor(scrollSpeed: number) {
        this.scrollSpeed = scrollSpeed;
        this.image = new Picture("res/GameAtlas.png");
    }

    createCanvas() {
        if (this.canvas) {
            return;
        }

        const crates: boolean[] = [];

        for (let i = 0; i < NUM_CRATE_ROWS ** 2; ++i) {
            crates.push(Math.random() < BG_CRATE_DENSITY);
        }

        const slice: PictureSlice = { ...SLICE_BG };
        const canvas = new OffscreenCanvas(
            NUM_CRATE_ROWS * slice.w,
            NUM_CRATE_ROWS * slice.h
        );
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Offscreen canvas context failed");
        }

        const gridWidth = Math.ceil(canvas.width / slice.w) + 1;
        const gridHeight = Math.ceil(canvas.height / slice.h) + 1;

        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                // Checker pattern
                slice.x = (x + y) % 2 ? OFFSET_DARK_SQUARE : 0;

                // Get whether this background checker square is a crate
                const [crateX, crateY] = [
                    x % NUM_CRATE_ROWS,
                    y % NUM_CRATE_ROWS,
                ];
                if (crates[crateX + crateY * NUM_CRATE_ROWS]) {
                    slice.x += OFFSET_CRATE_SQUARE;
                }

                context.drawImage(
                    this.image.sharedData().image(),
                    slice.x,
                    slice.y,
                    slice.w,
                    slice.h,
                    x * slice.w,
                    y * slice.h,
                    slice.w,
                    slice.h
                );
            }
        }

        this.canvas = canvas;
    }

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.scroll += this.scrollSpeed;
    }

    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number) {
        this.createCanvas();

        if (!this.canvas) return;

        const renderer = gameloop.renderer();
        const [width, height] = [
            renderer.canvas().width,
            renderer.canvas().height,
        ];
        const gridWidth = Math.ceil(width / this.canvas.width) + 1;
        const gridHeight = Math.ceil(height / this.canvas.height) + 1;
        const context = renderer.context();
        const scroll = lerp(
            this.scroll - this.scrollSpeed,
            this.scroll,
            lerpTime
        );
        const scrollWrapped = scroll % this.canvas.height;

        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                context.drawImage(
                    this.canvas,
                    Math.floor(x * this.canvas.width - scrollWrapped),
                    Math.floor(y * this.canvas.height - scrollWrapped)
                );
            }
        }
    }
}
