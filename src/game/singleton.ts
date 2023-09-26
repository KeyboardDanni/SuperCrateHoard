import { LevelCollection } from "./global/level";

export class GameSingleton {
    levels: LevelCollection[] = [];
    currentCollection: number = 0;
    currentLevel: number = 0;
    bgScroll: number = 0;
}
