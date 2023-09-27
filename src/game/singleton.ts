import { LevelCollection } from "./global/level";
import { Preferences, SaveData } from "./global/savedata";

export class GameSingleton {
    saveData: SaveData = SaveData.fromLocalStorage();
    preferences: Preferences = Preferences.fromLocalStorage();
    levels: LevelCollection[] = [];
    currentCollection: number = 0;
    currentLevel: number = 0;
    bgScroll: number = 0;

    getFinishedLevels() {
        const collection = this.levels[this.currentCollection];

        if (!collection) {
            return [];
        }

        return this.saveData.getFinishedLevels(collection.saveId);
    }

    markLevelFinished() {
        const collection = this.levels[this.currentCollection];

        if (!collection) {
            return;
        }

        this.saveData.markLevelFinished(collection.saveId, this.currentLevel);
    }
}
