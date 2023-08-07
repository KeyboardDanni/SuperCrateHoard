import { lerp } from "./util";

const TICKRATE = 1000.0 / 60.0;

export class Gameloop {
    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D | null;
    lastTick = performance.now();
    tickQueue = 0.0;
    tickCount = 0;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById("game_surface");

        if (!this.canvas || !this.canvas.getContext) {
            throw new Error("Missing canvas");
        }

        this.context = this.canvas.getContext("2d");

        if (!this.context) {
            throw new Error("Could not create canvas context");
        }
    }

    run() {
        this.lastTick = performance.now();
        this.tickQueue = 0.0;

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    private timerUpdate() {
        this.updateTicks();
        this.draw();

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    private updateTicks() {
        const now = performance.now();
        
        this.tickQueue += (now - this.lastTick);
        this.lastTick = now;

        while (this.tickQueue >= TICKRATE) {
            this.tick();
            this.tickQueue -= TICKRATE;
        }
    }

    private tick() {
        this.tickCount += 1;
    }

    private draw() {
        if (!this.canvas || !this.context) {
            throw new Error("Missing canvas");
        }

        const lerpRate = this.tickQueue / TICKRATE;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const x = 64 + (this.tickCount % 60) * 4;
        const xPrev = 64 + ((this.tickCount - 1) % 60) * 4;

        this.context.fillStyle = "rgb(128, 128, 128)";
        this.context.fillRect(lerp(xPrev, x, lerpRate), 64, 256, 256);
    }
}