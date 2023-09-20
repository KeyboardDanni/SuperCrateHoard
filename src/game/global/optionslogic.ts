import { Gameloop } from "../../engine/gameloop";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { Focusable, FocusableScene } from "./focus";

const FOCUS_PRIORITY_OPTIONS_MENU = 100;

export class OptionsLogic extends Focusable implements TickLogic, DrawLogic {
    private isOpen = false;

    constructor(scene: FocusableScene) {
        super(scene);

        scene.addEventHandler("openMenu", () => {
            this.open();
        });
    }

    open() {
        this.isOpen = true;
    }

    focusTick(gameloop: Gameloop, _scene: Scene): void {
        if (gameloop.input().justPressed("menu")) {
            this.isOpen = false;
            return;
        }
    }

    tick(_gameloop: Gameloop<unknown>, _scene: Scene): void {
        if (!this.isOpen) {
            return;
        }

        this.keepActive(FOCUS_PRIORITY_OPTIONS_MENU);
    }

    draw(gameloop: Gameloop<unknown>, _scene: Scene, _lerpTime: number): void {
        if (!this.isOpen) {
            return;
        }

        const renderer = gameloop.renderer();
        const [width, height] = [renderer.canvas().width, renderer.canvas().height];

        renderer.drawRect(128, 128, width - 256, height - 256, "rgb(0, 0, 0, 0.7)");
        renderer.drawRectOutline(
            127.5,
            127.5,
            width - 256,
            height - 256,
            "rgb(224, 224, 224, 0.7)"
        );
    }
}
