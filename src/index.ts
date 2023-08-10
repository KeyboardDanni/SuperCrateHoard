import { Gameloop } from "./gameloop";
import { DrawLogic, Scene, TickLogic } from "./scene";
import { lerp } from "./util";

class TestLogic implements TickLogic, DrawLogic {
    private tickCount = 0;

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.tickCount += 1;
    }
    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number){
        const x = 64 + (this.tickCount % 60) * 4;
        const xPrev = 64 + ((this.tickCount - 1) % 60) * 4;

        const context = gameloop.drawContextRaw();

        if (!context) {
            return;
        }

        context.fillStyle = "rgb(128, 128, 128)";
        context.fillRect(lerp(xPrev, x, lerpTime), 64, 256, 256);
    }
}

window.onload = function init() {
    const gameloop = new Gameloop();

    gameloop.setScene(() => {
        const scene = new Scene();
        const logic = new TestLogic();

        scene.addTickLogic(logic);
        scene.addDrawLogic(logic);

        return scene;
    });

    gameloop.run();
};
