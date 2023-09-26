import { Input } from "../../engine/input";
import { Gameloop } from "../../engine/gameloop";
import { Scene } from "../../engine/scene";

export class FocusableScene extends Scene {
    private input;
    private highestPriority = Number.MIN_SAFE_INTEGER;
    private focused: Focusable | null = null;
    private newFocused: Focusable | null = null;

    constructor(input: Input) {
        super();

        this.input = input;
    }

    override tick(gameloop: Gameloop): void {
        if (this.focused && this.isLoaded()) {
            this.focused.focusTick(gameloop, this);
        }

        super.tick(gameloop);

        this.focused = this.newFocused;
        this.newFocused = null;
        this.highestPriority = Number.MIN_SAFE_INTEGER;
    }

    requestFocus(item: Focusable, priority: number) {
        if (this.highestPriority <= priority) {
            this.highestPriority = priority;
            this.newFocused = item;
        }
    }

    focusedItem() {
        return this.focused;
    }

    focusedInput(item: Focusable) {
        if (item === this.focused) {
            return this.input;
        }

        return null;
    }
}

export abstract class Focusable {
    private scene: FocusableScene;

    constructor(scene: FocusableScene) {
        this.scene = scene;
    }

    abstract focusTick(gameloop: Gameloop, scene: Scene): void;

    keepActive(priority: number) {
        this.scene.requestFocus(this, priority);
    }

    focused() {
        return this.scene.focusedItem() === this;
    }

    focusedInput() {
        return this.scene.focusedInput(this);
    }

    getScene() {
        return this.scene;
    }
}
