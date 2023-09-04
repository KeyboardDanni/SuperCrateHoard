import { Gameloop } from "./gameloop";
import { Picture, PictureData } from "./graphics";
import { stringListToString } from "./util";

export class Scene {
    private tickLogic: Array<TickLogic> = [];
    private drawLogic: Array<DrawLogic> = [];
    private tickLoaderLogic: Array<TickLogic> = [];
    private drawLoaderLogic: Array<DrawLogic> = [];
    waitForResources = true;

    /// Override to provide custom logic to check if all resources are loaded.
    isLoaded() {
        if (this.waitForResources) {
            if (
                PictureData.itemsLoading() <= 0 &&
                PictureData.itemErrors().length > 0
            ) {
                throw new Error(stringListToString(PictureData.itemErrors()));
            }

            return Picture.allLoaded();
        }
        return true;
    }

    tick(gameloop: Gameloop) {
        const logicList = this.isLoaded()
            ? this.tickLogic
            : this.tickLoaderLogic;

        for (const logic of logicList) {
            logic.tick(gameloop, this);
        }
    }

    draw(gameloop: Gameloop, lerpTime: number) {
        const logicList = this.isLoaded()
            ? this.drawLogic
            : this.drawLoaderLogic;

        for (const logic of logicList) {
            logic.draw(gameloop, this, lerpTime);
        }
    }

    addLogic(logic: TickLogic & DrawLogic) {
        this.tickLogic.push(logic);
        this.drawLogic.push(logic);
    }

    addTickLogic(logic: TickLogic) {
        this.tickLogic.push(logic);
    }

    addDrawLogic(logic: DrawLogic) {
        this.drawLogic.push(logic);
    }

    addTickLoaderLogic(logic: TickLogic) {
        this.tickLoaderLogic.push(logic);
    }

    addDrawLoaderLogic(logic: DrawLogic) {
        this.drawLoaderLogic.push(logic);
    }
}

export interface TickLogic {
    tick(gameloop: Gameloop, scene: Scene): void;
}

export interface DrawLogic {
    draw(gameloop: Gameloop, scene: Scene, lerpTime: number): void;
}
