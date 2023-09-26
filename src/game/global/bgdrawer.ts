import { Picture } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { lerp } from "../../engine/util";
import * as gameAtlasJson from "../../res/GameAtlas32.json";
import { GameSingleton } from "~game/singleton";

const slices = gameAtlasJson;

const NUM_CRATE_ROWS = 32;
const BG_CRATE_DENSITY = 0.3;
const OFFSET_DARK_SQUARE = 1;
const OFFSET_CRATE_SQUARE = 2;

export class BgDrawer implements TickLogic, DrawLogic {
    private image;
    private canvas: OffscreenCanvas | null = null;
    scrollSpeed: number;

    constructor(scrollSpeed: number) {
        this.scrollSpeed = scrollSpeed;
        this.image = new Picture("res/GameAtlas32.png");
    }

    createCanvas() {
        if (this.canvas || !Picture.allLoaded()) {
            return;
        }

        const crates: boolean[] = [];
        const tileWidth = slices.bg[0].w;
        const tileHeight = slices.bg[0].h;

        for (let i = 0; i < NUM_CRATE_ROWS ** 2; ++i) {
            crates.push(Math.random() < BG_CRATE_DENSITY);
        }

        const canvas = new OffscreenCanvas(NUM_CRATE_ROWS * tileWidth, NUM_CRATE_ROWS * tileHeight);
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Offscreen canvas context failed");
        }

        const gridWidth = Math.ceil(canvas.width / tileWidth) + 1;
        const gridHeight = Math.ceil(canvas.height / tileHeight) + 1;

        for (let y = 0; y < gridHeight; ++y) {
            for (let x = 0; x < gridWidth; ++x) {
                // Checker pattern
                let offset = (x + y) % 2 ? OFFSET_DARK_SQUARE : 0;

                // Get whether this background checker square is a crate
                const [crateX, crateY] = [x % NUM_CRATE_ROWS, y % NUM_CRATE_ROWS];
                if (crates[crateX + crateY * NUM_CRATE_ROWS]) {
                    offset += OFFSET_CRATE_SQUARE;
                }

                const slice = slices.bg[offset];

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

    tick(gameloop: Gameloop<GameSingleton>, _scene: Scene) {
        const singleton = gameloop.singleton;

        singleton.bgScroll += this.scrollSpeed;
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, lerpTime: number) {
        this.createCanvas();

        if (!this.canvas) return;

        const singleton = gameloop.singleton;
        const renderer = gameloop.renderer();
        const [width, height] = [renderer.canvas().width, renderer.canvas().height];
        const gridWidth = Math.ceil(width / this.canvas.width) + 1;
        const gridHeight = Math.ceil(height / this.canvas.height) + 1;
        const context = renderer.context();
        const scroll = lerp(singleton.bgScroll - this.scrollSpeed, singleton.bgScroll, lerpTime);
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
