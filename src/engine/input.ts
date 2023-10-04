class Action {
    bindings: string[] = [];
    timeHeld: number = 0;
    sameFrameOrdering: number = 0;
}

export class Input {
    private heldKeys: { [id: string]: number } = {};
    private actions: { [id: string]: Action } = {};
    private newKeysThisFrame = 1;
    private repeatDelay = 20;
    private repeatRate = 4;

    constructor() {
        document.addEventListener("keydown", (event) => this.keyDownHandler(event));
        document.addEventListener("keyup", (event) => this.keyUpHandler(event));
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private keyDownHandler(event: KeyboardEvent) {
        // Fullscreen combo should not send Enter keypress
        if (event.altKey && event.code == "Enter") {
            return;
        }

        this.heldKeys[event.code] = this.newKeysThisFrame;
        this.newKeysThisFrame++;

        event.preventDefault();
    }

    private keyUpHandler(event: KeyboardEvent) {
        this.heldKeys[event.code] = 0;

        event.preventDefault();
    }

    newFrame() {
        actionLoop: for (const action of Object.values(this.actions)) {
            for (const binding of action.bindings) {
                const heldOrder = this.heldKeys[binding];

                if (heldOrder > 0) {
                    if (action.timeHeld === 0) {
                        action.sameFrameOrdering = heldOrder;
                    }

                    action.timeHeld++;
                    continue actionLoop;
                }
            }

            action.timeHeld = 0;
        }

        this.newKeysThisFrame = 1;
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

    newestHeld(names: string[]) {
        let best = null;
        let bestHeld = Number.MAX_SAFE_INTEGER;
        let bestOrder = Number.MIN_SAFE_INTEGER;

        for (const name of names) {
            const action = this.actions[name];

            if (!action) {
                continue;
            }

            const held = action.timeHeld;
            const order = action.sameFrameOrdering;

            if ((held > 0 && held < bestHeld) || (held === bestHeld && order > bestOrder)) {
                best = name;
                bestHeld = held;
                bestOrder = order;
            }
        }

        return best;
    }

    setDefaultRepeatRate(delay: number, rate: number) {
        for (const action of Object.values(this.actions)) {
            if (action.timeHeld >= this.repeatDelay) {
                // Adjust time held to reset the repeat cycle
                action.timeHeld -= (action.timeHeld - this.repeatDelay) % rate;
                // Adjust time held to match the new start delay
                action.timeHeld = Math.max(1, action.timeHeld + (delay - this.repeatDelay));
            }
        }

        this.repeatDelay = delay;
        this.repeatRate = rate;
    }

    autoRepeat(name: string, startDelay: number = -1, repeatRate: number = -1) {
        const time = this.timeHeld(name);

        if (startDelay === -1) startDelay = this.repeatDelay;
        if (repeatRate === -1) repeatRate = this.repeatRate;

        return time === 1 || (time >= startDelay && (time - startDelay) % repeatRate === 0);
    }

    autoRepeatNewest(names: string[], startDelay: number = -1, repeatRate: number = -1) {
        const newestHeld = this.newestHeld(names);

        if (!newestHeld) {
            return null;
        }

        const active = this.autoRepeat(newestHeld, startDelay, repeatRate);

        return active ? newestHeld : null;
    }
}
