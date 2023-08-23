import { Gameloop } from "./gameloop";
import { Picture } from "./graphics";

export class Scene {
    private tickLogic: Array<TickLogic> = [];
    private drawLogic: Array<DrawLogic> = [];
    private tickLoaderLogic: Array<TickLogic> = [];
    private drawLoaderLogic: Array<DrawLogic> = [];
    waitForLoad = true;

    tick(gameloop: Gameloop) {
        const logicList =
            this.waitForLoad && !Picture.allLoaded()
                ? this.tickLoaderLogic
                : this.tickLogic;

        for (const logic of logicList) {
            logic.tick(gameloop, this);
        }
    }

    draw(gameloop: Gameloop, lerpTime: number) {
        const logicList =
            this.waitForLoad && !Picture.allLoaded()
                ? this.drawLoaderLogic
                : this.drawLogic;

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
    tick: (gameloop: Gameloop, scene: Scene) => void;
}

export interface DrawLogic {
    draw: (gameloop: Gameloop, scene: Scene, lerpTime: number) => void;
}
