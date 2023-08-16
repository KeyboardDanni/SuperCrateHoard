class Action {
    bindings: string[] = [];
    timeHeld: number = 0;
}

export class Input {
    private heldKeys: { [id: string]: boolean } = {};
    private actions: { [id: string]: Action } = {};

    constructor() {
        document.addEventListener("keydown", (event) =>
            this.keyDownHandler(event)
        );
        document.addEventListener("keyup", (event) => this.keyUpHandler(event));
    }

    private keyDownHandler(event: KeyboardEvent) {
        this.heldKeys[event.code] = true;
    }

    private keyUpHandler(event: KeyboardEvent) {
        this.heldKeys[event.code] = false;
    }

    newFrame() {
        actionLoop: for (const action of Object.values(this.actions)) {
            for (const binding of action.bindings) {
                if (this.heldKeys[binding] === true) {
                    action.timeHeld++;
                    continue actionLoop;
                }
            }

            action.timeHeld = 0;
        }
    }

    addAction(name: string, bindings: string[] = []) {
        if (this.actions[name]) {
            throw new Error(`Action "${name}" already exists`);
        }

        this.actions[name] = new Action();
        this.bindAction(name, bindings);
    }

    bindAction(name: string, bindings: string[]) {
        const action = this.actions[name];

        if (!action) {
            throw new Error(`Action "${name}" doesn't exist`);
        }

        for (const binding of bindings) {
            if (!(binding in action.bindings)) {
                action.bindings.push(binding);
            }
        }
    }

    clearActionBindings(name: string) {
        const action = this.actions[name];

        if (!action) {
            throw new Error(`Action "${name}" doesn't exist`);
        }

        action.bindings = [];
    }

    timeHeld(name: string) {
        const action = this.actions[name];

        if (!action) return 0;

        return action.timeHeld;
    }

    held(name: string) {
        return this.timeHeld(name) > 0;
    }

    justPressed(name: string) {
        return this.timeHeld(name) === 1;
    }

    autoRepeat(name: string, startDelay: number, repeatDelay: number) {
        const time = this.timeHeld(name);

        return (
            time === 1 ||
            (time >= startDelay && (time - startDelay) % repeatDelay === 0)
        );
    }
}
