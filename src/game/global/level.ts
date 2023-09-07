export class Level {
    name: string | null = null;
    author: string | null = null;
    description: string | null = null;
    tiles: string[] = [];
}

export class LevelCollection {
    name: string = "Unnamed Collection";
    author: string = "";
    description: string = "";
    levels: Level[] = [];
}
