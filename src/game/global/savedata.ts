import { plainToClass } from "class-transformer";
import { AnalysisActionMode, AnalysisMode } from "../../game/board/analysis";

const VERSION_SAVEDATA = 1;
const VERSION_PREFERENCES = 1;
const STORAGE_NAME_SAVEDATA = "SuperCrateHoard_SaveData";
const STORAGE_NAME_PREFERENCES = "SuperCrateHoard_Preferences";

export class SaveData {
    version: number;
    finishedLevels: { [id: string]: number[] } = {};

    constructor() {
        this.version = VERSION_SAVEDATA;
    }

    static fromLocalStorage(): SaveData {
        const json = window.localStorage.getItem(STORAGE_NAME_SAVEDATA);

        if (!json) {
            return new SaveData();
        }

        const parsed = JSON.parse(json);
        const data = plainToClass(SaveData, parsed);

        return data;
    }

    toLocalStorage() {
        window.localStorage.setItem(STORAGE_NAME_SAVEDATA, JSON.stringify(this));
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

export class Preferences {
    version: number;
    analysis: AnalysisMode;
    analysisAction: AnalysisActionMode;

    constructor() {
        this.version = VERSION_PREFERENCES;
        this.analysis = AnalysisMode.None;
        this.analysisAction = AnalysisActionMode.Show;
    }

    static fromLocalStorage(): Preferences {
        const json = window.localStorage.getItem(STORAGE_NAME_PREFERENCES);

        if (!json) {
            return new Preferences();
        }

        const parsed = JSON.parse(json);
        const data = plainToClass(Preferences, parsed);

        return data;
    }

    toLocalStorage() {
        window.localStorage.setItem(STORAGE_NAME_PREFERENCES, JSON.stringify(this));
    }
}
