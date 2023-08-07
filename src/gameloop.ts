import { lerp } from "./util";

const TICKRATE = 1000.0 / 60.0;
const MAX_PROCESS_TIME = TICKRATE * 2;
const MIN_LAGLESS_FRAMES_FOR_LERP = 10;

export class Gameloop {
    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D | null;
    lastTick = performance.now();
    tickQueue = 0;
    tickCount = 0;
    framesSinceLastLag = 0;
    doDraw = false;
    doLerp = false;

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
        this.tickQueue = 0;

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    private timerUpdate() {
        this.updateTicks();
        this.draw();

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    private updateTicks() {
        const updateStart = performance.now();
        
        this.tickQueue += (updateStart - this.lastTick);
        this.lastTick = updateStart;

        // Perform game logic catchup as necessary
        while (this.tickQueue >= TICKRATE) {
            this.tick();
            
            this.framesSinceLastLag++;
            this.doDraw = true;
            this.tickQueue -= TICKRATE;

            const tickEnd = performance.now();

            // Bail out if too much time is spent on processing to avoid getting stuck
            if (tickEnd - updateStart > MAX_PROCESS_TIME) {
                this.tickQueue = 0;
                this.lastTick = tickEnd;
                this.doLerp = false;
                this.framesSinceLastLag = 0;
                break;
            }
        }

        if (this.framesSinceLastLag >= MIN_LAGLESS_FRAMES_FOR_LERP) {
            this.doLerp = true;
        }
    }

    private tick() {
        this.tickCount += 1;
    }

    private draw() {
        if (!this.doDraw) {
            return;
        }

        if (!this.canvas || !this.context) {
            throw new Error("Missing canvas");
        }

        let lerpRate;

        if (this.doLerp) {
            lerpRate = this.tickQueue / TICKRATE;
        }
        else {
            lerpRate = 1;
            this.doDraw = false; // Don't draw next frame until a new logic frame comes in
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const x = 64 + (this.tickCount % 60) * 4;
        const xPrev = 64 + ((this.tickCount - 1) % 60) * 4;

        this.context.fillStyle = "rgb(128, 128, 128)";
        this.context.fillRect(lerp(xPrev, x, lerpRate), 64, 256, 256);

        console.info("Draw");
    }
}