import { plainToClass } from "class-transformer";

const SAVE_DATA_VERSION = 1;
const LOCAL_STORAGE_NAME = "SuperCrateHoard_SaveData";

export class SaveData {
    version: number;
    finishedLevels: { [id: string]: number[] } = {};

    constructor() {
        this.version = SAVE_DATA_VERSION;
    }

    static fromLocalStorage(): SaveData {
        const json = window.localStorage.getItem(LOCAL_STORAGE_NAME);

        if (!json) {
            return new SaveData();
        }

        const parsed = JSON.parse(json);
        const data = plainToClass(SaveData, parsed);

        return data;
    }

    toLocalStorage() {
        window.localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(this));
    }

    getFinishedLevels(saveId: string) {
        if (this.finishedLevels[saveId] === undefined) {
            this.finishedLevels[saveId] = [];
        }

        return this.finishedLevels[saveId];
    }

    markLevelFinished(saveId: string, index: number) {
        if (this.finishedLevels[saveId] === undefined) {
            return;
        }

        const finished = this.finishedLevels[saveId];

        for (let i = 0; i < index; ++i) {
            if (!finished[i]) {
                finished[i] = 0;
            }
        }

        finished[index] = 1;
    }
}
