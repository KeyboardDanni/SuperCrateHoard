import { LevelCollection } from "./global/level";
import { Preferences, SaveData } from "./global/savedata";

export class LevelStrings {
    readonly collection: string;
    readonly name: string;
    readonly author: string;

    constructor(collection: string, name: string, author: string) {
        this.collection = collection;
        this.name = name;
        this.author = author;
    }
}

class CachedLevelStrings {
    strings: LevelStrings = new LevelStrings("", "", "");
    collectionIndex = -1;
    levelIndex = -1;
}

export class GameSingleton {
    saveData: SaveData = SaveData.fromLocalStorage();
    preferences: Preferences = Preferences.fromLocalStorage();
    levels: LevelCollection[] = [];
    currentCollection: number = 0;
    currentLevel: number = 0;
    bgScroll: number = 0;
    private cachedStrings: CachedLevelStrings = new CachedLevelStrings();

    getLevelStrings(): LevelStrings {
        const cached = this.cachedStrings;

        if (
            this.currentCollection === cached.collectionIndex &&
            this.currentLevel === cached.levelIndex
        ) {
            return cached.strings;
        }

        const collection = this.levels[this.currentCollection];

        if (!collection) {
            return cached.strings;
        }

        const level = collection.levels[this.currentLevel];

        if (!level) {
            return cached.strings;
        }

        const collectionName = collection.name;
        let name = `Level ${this.currentLevel + 1}`;

        if (level.name && level.name.length > 0) {
            name += `: ${level.name}`;
        }

        let author = "Anonymous";

        if (level.author && level.author.length > 0) {
            author = level.author;
        } else if (collection.author.length > 0) {
            author = collection.author;
        }

        const newStrings = new LevelStrings(collectionName, name, author);
        cached.strings = newStrings;
        cached.collectionIndex = this.currentCollection;
        cached.levelIndex = this.currentLevel;

        return newStrings;
    }

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
