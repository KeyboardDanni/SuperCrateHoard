import { fetchAndReadJson } from "../../engine/util";
import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { BMFont } from "../../engine/text";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { LevelCollection } from "../global/level";
import { GameSingleton } from "../singleton";
import * as fontDescriptor from "../../res/Pixel12x10.json";
import { plainToClass } from "class-transformer";

enum LoadState {
    None,
    Loading,
    Loaded,
    Broken,
}

class LevelsList {
    levelFiles: string[] = [];
}

export class LevelFetchLogic implements TickLogic, DrawLogic {
    private loadState = LoadState.None;
    private error: Error | null = null;
    private font: BMFont;

    constructor() {
        this.font = new BMFont(fontDescriptor);
    }

    private async fetchLevels(gameloop: Gameloop<GameSingleton>) {
        const levels = (await fetchAndReadJson("./res/levels.json")) as LevelsList;

        const promises: Promise<LevelCollection>[] = [];

        for (const path of levels.levelFiles) {
            const promise = fetchAndReadJson(path).then((levelsAny) => {
                const collection = plainToClass(LevelCollection, levelsAny);

                return Promise.resolve(collection);
            });

            promises.push(promise);
        }

        const allPromises = Promise.all(promises)
            .then((loadedLevels) => {
                gameloop.singleton.levels = loadedLevels as LevelCollection[];
                this.loadState = LoadState.Loaded;
            })
            .catch((error) => {
                this.loadState = LoadState.Broken;
                throw error;
            });

        await allPromises;
    }

    isLoaded() {
        return this.loadState === LoadState.Loaded;
    }

    tick(gameloop: Gameloop<GameSingleton>, _scene: Scene) {
        if (Picture.allLoaded() && this.loadState === LoadState.None) {
            if (gameloop.singleton.levels.length > 0) {
                this.loadState = LoadState.Loaded;
            } else {
                this.loadState = LoadState.Loading;
                this.fetchLevels(gameloop).catch((error) => {
                    this.error = new Error(
                        "Failed to read level list: " + error.message ?? String(error)
                    );
                });
            }
        }

        if (this.error) {
            throw this.error;
        }
    }

    draw(gameloop: Gameloop, _scene: Scene, _lerpTime: number) {
        const renderer = gameloop.renderer();

        this.font.drawText(renderer, "Grabbing levels...", 64, 576);
    }
}
