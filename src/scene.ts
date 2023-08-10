import { Gameloop } from "./gameloop";

export class Scene {
    private tickLogic: Array<TickLogic> = []
    private drawLogic: Array<DrawLogic> = []

    tick(gameloop: Gameloop) {
        for (const logic of this.tickLogic) {
            logic.tick(gameloop, this);
        }
    }

    draw (gameloop: Gameloop, lerpTime: number) {
        for (const logic of this.drawLogic) {
            logic.draw(gameloop, this, lerpTime);
        }
    }

    addTickLogic(logic: TickLogic) {
        this.tickLogic.push(logic);
    }

    addDrawLogic(logic: DrawLogic) {
        this.drawLogic.push(logic);
    }
}

export interface TickLogic {
    tick: (gameloop: Gameloop, scene: Scene) => void
}

export interface DrawLogic {
    draw: (gameloop: Gameloop, scene: Scene, lerpTime: number) => void
}
