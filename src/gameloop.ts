import { Renderer } from "./graphics";
import { Scene } from "./scene";

const TICKRATE = 1000.0 / 60.0;
const MAX_PROCESS_TIME = TICKRATE * 2;
const MIN_LAGLESS_FRAMES_FOR_LERP = 4;

const VSYNC_SAMPLE_SIZE = 60;
const VSYNC_SAMPLE_MAX_TIMING = 20.1;
const VSYNC_SAMPLE_TOLERANCE = 6;

class VsyncMeasurer {
    private timestamp = 0;
    private goodSamples = 0;
    private timings: number[] = [];
    private lastGoodAverage = TICKRATE;

    updateTimings() {
        const now = performance.now();

        if (this.timestamp <= 0) {
            this.timestamp = now;
            return;
        }

        const timing = now - this.timestamp;
        this.timestamp = now;

        // Try to avoid sampling if the Vsync clearly took too long
        if (timing > VSYNC_SAMPLE_MAX_TIMING) {
            return;
        }

        if (this.timings.length >= VSYNC_SAMPLE_SIZE) {
            this.timings.shift();
        }

        // If this sample is different from the last sample or current raw average,
        //  either the refresh rate changed or Vsync readings are unreliable.
        //  Mark samples as bad until we collect enough good data again.
        //  Even with this system, the detection method isn't 100% reliable
        //  and may wrongly mark the data as good if there is consistent slowdown
        //  throwing off the Vsync timings.
        if (this.timings.length > 0) {
            if (Math.abs(this.timings[this.timings.length - 1] - timing) > VSYNC_SAMPLE_TOLERANCE ||
                Math.abs(this.averageRateRaw() - timing) > VSYNC_SAMPLE_TOLERANCE) {
                this.goodSamples = 0;
            } else {
                this.goodSamples += 1;
            }
        }

        this.timings.push(timing);
    }

    averageRateRaw() {
        let sum = 0;

        for (const timing of this.timings) {
            sum += timing;
        }

        return sum / this.timings.length;
    }

    averageRate() {
        if (this.hasEnoughSamples()) {
            this.lastGoodAverage = this.averageRateRaw();
        }

        return this.lastGoodAverage;
    }

    shouldLerp() {
        const rate = this.averageRate();

        return Math.abs(rate - TICKRATE) > 1;
    }

    hasEnoughSamples() {
        return this.goodSamples > VSYNC_SAMPLE_SIZE;
    }

    reset() {
        this.timestamp = 0;
        this.goodSamples = 0;
        this.timings = [];
    }
}

export class Gameloop {
    private gameRenderer: Renderer = new Renderer();
    private currentScene: Scene = new Scene();
    private pendingSceneFunc: (() => Scene) | null = null;
    private vsyncRate = new VsyncMeasurer();
    private lastTick = performance.now();
    private tickQueue = 0;
    private framesSinceTickLag = 0;
    private doDraw = false;
    private doLerp = false;
    private running = false;

    run() {
        if (this.running) {
            throw new Error("run() already called");
        }

        this.running = true;
        this.lastTick = performance.now();
        this.tickQueue = 0;

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    scene() {
        return this.currentScene;
    }

    setScene(func: () => Scene) {
        this.pendingSceneFunc = func;
    }

    renderer() {
        return this.gameRenderer;
    }

    private timerUpdate() {
        this.vsyncRate.updateTimings();

        if (this.pendingSceneFunc !== null) {
            this.currentScene = this.pendingSceneFunc();
            this.pendingSceneFunc = null;
        }

        this.updateTicks();
        this.updateDraw();

        requestAnimationFrame(this.timerUpdate.bind(this));
    }

    private updateTicks() {
        const updateStart = performance.now();

        this.tickQueue += updateStart - this.lastTick;
        this.lastTick = updateStart;

        // Perform game logic catchup as necessary
        while (this.tickQueue >= TICKRATE) {
            this.currentScene.tick(this);

            this.framesSinceTickLag++;
            this.doDraw = true;
            this.tickQueue -= TICKRATE;

            const tickEnd = performance.now();

            // Bail out if too much time is spent on processing to avoid getting stuck
            if (tickEnd - updateStart > MAX_PROCESS_TIME) {
                this.tickQueue = 0;
                this.lastTick = tickEnd;
                this.framesSinceTickLag = 0;
                break;
            }
        }

        this.doLerp =
            this.vsyncRate.shouldLerp() &&
            this.framesSinceTickLag >= MIN_LAGLESS_FRAMES_FOR_LERP;
    }

    private updateDraw() {
        if (!this.doDraw) {
            return;
        }

        let lerpTime;

        if (this.doLerp) {
            lerpTime = this.tickQueue / TICKRATE;
        } else {
            lerpTime = 1;
            this.doDraw = false; // Don't draw next frame until a new logic frame comes in
        }

        this.gameRenderer.drawBackgroundColor(0, 0, 0);

        this.currentScene.draw(this, lerpTime);
    }
}
