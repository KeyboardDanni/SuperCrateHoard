import { Gameloop } from "./gameloop";
import { Picture, PictureData } from "./graphics";
import { stringListToString } from "./util";

class EventInfo {
    handlers: Array<(arg: any) => void> = [];
}

interface PushedEvent {
    name: string;
    data: any;
}

export class Scene {
    private tickLogic: Array<TickLogic> = [];
    private drawLogic: Array<DrawLogic> = [];
    private tickLoaderLogic: Array<TickLogic> = [];
    private drawLoaderLogic: Array<DrawLogic> = [];
    private events: { [id: string]: EventInfo } = {};
    private queuedEvents: PushedEvent[] = [];
    waitForResources = true;

    /// Override to provide custom logic to check if all resources are loaded.
    isLoaded() {
        if (this.waitForResources) {
            if (PictureData.itemsLoading() <= 0 && PictureData.itemErrors().length > 0) {
                throw new Error(stringListToString(PictureData.itemErrors()));
            }

            return Picture.allLoaded();
        }
        return true;
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

    addLoaderLogic(logic: TickLogic & DrawLogic) {
        this.tickLoaderLogic.push(logic);
        this.drawLoaderLogic.push(logic);
    }

    addEventHandler(eventName: string, handler: (arg: any) => void) {
        if (!this.events[eventName]) {
            this.events[eventName] = new EventInfo();
        }

        const eventInfo = this.events[eventName];

        eventInfo.handlers.push(handler);
    }

    pushEvent(eventName: string, arg: any = null) {
        this.queuedEvents.push({ name: eventName, data: arg });
    }

    private processEvents() {
        for (const event of this.queuedEvents) {
            const eventInfo = this.events[event.name];

            if (eventInfo) {
                for (const handler of eventInfo.handlers) {
                    handler(event.data);
                }
            }
        }

        this.queuedEvents = [];
    }

    tick(gameloop: Gameloop) {
        const logicList = this.isLoaded() ? this.tickLogic : this.tickLoaderLogic;

        for (const logic of logicList) {
            this.processEvents();
            logic.tick(gameloop, this);
        }

        this.processEvents();
    }

    draw(gameloop: Gameloop, lerpTime: number) {
        const logicList = this.isLoaded() ? this.drawLogic : this.drawLoaderLogic;

        for (const logic of logicList) {
            logic.draw(gameloop, this, lerpTime);
        }
    }
}

export interface TickLogic {
    tick(gameloop: Gameloop, scene: Scene): void;
}

export interface DrawLogic {
    draw(gameloop: Gameloop, scene: Scene, lerpTime: number): void;
}
