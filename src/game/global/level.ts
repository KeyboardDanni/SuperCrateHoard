import { Type } from "class-transformer";
import { Position } from "../../engine/util";

export class Level {
    name: string | null = null;
    author: string | null = null;
    description: string | null = null;
    tiles: string[] = [];
    @Type(() => Tutorial)
    tutorial?: Tutorial;

    measureDimensions(): Position {
        let width = 0;
        const height = this.tiles.length;

        for (const row of this.tiles) {
            width = Math.max(width, row.length);
        }

        return { x: width, y: height };
    }
}

export class LevelCollection {
    name: string = "Unnamed Collection";
    author: string = "";
    description: string = "";
    saveId: string = "";
    @Type(() => Level)
    levels: Level[] = [];
}

export class Tutorial {
    @Type(() => Dialogue)
    dialogues: Dialogue[] = [];
}

export class Dialogue {
    text: string = "";
    @Type(() => Arrow)
    arrows?: Arrow[];
}

export class Arrow {
    x = 0;
    y = 0;
}
