import { LevelTheme } from "../global/theme";
import { Picture, PictureSlice, Renderer } from "../../engine/graphics";
import { Level } from "../global/level";

class FloodFillWalker {
    x = 0;
    y = 0;
}

export interface TokenToSpawn {
    x: number;
    y: number;
    tokenType: BoardTokenType;
}

export class BoardToken {
    private x: number = 0;
    private y: number = 0;
    picture: Picture | null = null;
    slice: PictureSlice = new PictureSlice(0, 0, 0, 0);
    readonly board: Board;

    constructor(x: number, y: number, board: Board) {
        this.x = x;
        this.y = y;
        this.board = board;
    }

    getPosition() {
        return [this.x, this.y];
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(renderer: Renderer, targetX: number, targetY: number) {
        if (this.picture) {
            renderer.drawSprite(this.picture, this.slice, targetX, targetY);
        }
    }
}

export enum BoardTileType {
    None,
    Floor,
    Wall,
    Dropzone,
}

export enum BoardTokenType {
    Player,
    Crate,
}

export class Board {
    x: number = 0;
    y: number = 0;
    readonly width: number;
    readonly height: number;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly picture: Picture;
    readonly slices: LevelTheme;
    private tiles: BoardTileType[];
    private displayTiles: (PictureSlice | null)[];
    private dirty = true;
    private tokens: BoardToken[] = [];

    constructor(width: number, height: number, picture: Picture, slices: LevelTheme) {
        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height);
        this.tiles.fill(BoardTileType.None);
        this.displayTiles = new Array(width * height);
        this.displayTiles.fill(null);
        this.picture = picture;
        this.slices = slices;
        this.tileWidth = slices.wall[0].w;
        this.tileHeight = slices.wall[0].h;
    }

    private floodFillFloor(initialWalkers: FloodFillWalker[]) {
        let walkers = initialWalkers;
        const covered = Array<boolean>(this.width * this.height).fill(false);

        while (walkers.length > 0) {
            const nextWalkers = [];

            // Do a horizontal sweep with each walker
            for (const walker of walkers) {
                const y = walker.y;
                let x = walker.x;

                if (!this.posInRange(x, y)) continue;
                if (this.tile(x, y) === BoardTileType.Wall) continue;
                if (covered[x + y * this.width] === true) continue;

                while (x > 0 && this.tile(x - 1, y) !== BoardTileType.Wall) {
                    x--;
                }
                while (x < this.width && this.tile(x, y) !== BoardTileType.Wall) {
                    if (this.tile(x, y) === BoardTileType.None) {
                        this.setTile(x, y, BoardTileType.Floor);
                    }

                    covered[x + y * this.width] = true;

                    // Next walkers extend above/below
                    if (y > 0) {
                        nextWalkers.push({ x: x, y: y - 1 });
                    }
                    if (y < this.height - 1) {
                        nextWalkers.push({ x: x, y: y + 1 });
                    }

                    x++;
                }
            }

            walkers = nextWalkers;
        }
    }

    static fromLevel(
        level: Level,
        picture: Picture,
        slices: LevelTheme,
        tokenCallback: (board: Board, tokensToSpawn: TokenToSpawn[]) => void
    ) {
        const tiles = level.tiles;
        const size = level.measureDimensions();

        const board = new Board(size.x, size.y, picture, slices);
        const floodFillWalkers = [];
        const tokensToSpawn: TokenToSpawn[] = [];

        for (let y = 0; y < size.y; ++y) {
            const row = tiles[y];

            for (let x = 0; x < size.x; ++x) {
                const letter = row[x];
                let tile = BoardTileType.None;

                // Tiles
                switch (letter) {
                    case undefined:
                    case " ":
                    case "@":
                    case "$":
                        tile = BoardTileType.None;
                        break;
                    case "#":
                        tile = BoardTileType.Wall;
                        break;
                    case ".":
                    case "+":
                    case "*":
                        tile = BoardTileType.Dropzone;
                        break;
                    default:
                        throw new Error(`Unrecognized tile character: ${letter}`);
                }

                board.setTile(x, y, tile);

                // Tokens
                switch (letter) {
                    case "@":
                    case "+":
                        tokensToSpawn.push({ x: x, y: y, tokenType: BoardTokenType.Player });
                        break;
                    case "$":
                    case "*":
                        tokensToSpawn.push({ x: x, y: y, tokenType: BoardTokenType.Crate });
                        break;
                }
            }
        }

        for (const token of tokensToSpawn) {
            floodFillWalkers.push({ x: token.x, y: token.y });
        }

        tokenCallback(board, tokensToSpawn);

        board.floodFillFloor(floodFillWalkers);

        return board;
    }

    private neighborBits(x: number, y: number) {
        let bits = 0;

        if (this.tile(x, y - 1) === BoardTileType.Wall) bits += 1;
        if (this.tile(x + 1, y) === BoardTileType.Wall) bits += 2;
        if (this.tile(x, y + 1) === BoardTileType.Wall) bits += 4;
        if (this.tile(x - 1, y) === BoardTileType.Wall) bits += 8;

        return bits;
    }

    private updateDisplayTiles() {
        this.dirty = false;
        let i = 0;

        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const tile = this.tile(x, y);

                switch (tile) {
                    case BoardTileType.None:
                        this.displayTiles[i] = null;
                        break;
                    case BoardTileType.Floor:
                        this.displayTiles[i] = this.slices.floor[0];
                        break;
                    case BoardTileType.Dropzone:
                        this.displayTiles[i] = this.slices.dropzone[0];
                        break;
                    case BoardTileType.Wall: {
                        const index = this.neighborBits(x, y);
                        this.displayTiles[i] = this.slices.wall[index];
                        break;
                    }
                }

                ++i;
            }
        }
    }

    addToken(token: BoardToken) {
        if (token.board !== this) {
            throw new Error("Token does not belong to board");
        }

        this.tokens.push(token);
    }

    getTokens(): readonly BoardToken[] {
        return this.tokens;
    }

    posToIndex(x: number, y: number) {
        return x + y * this.width;
    }

    posInRange(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }

        return true;
    }

    tile(x: number, y: number) {
        if (!this.posInRange(x, y)) {
            return BoardTileType.None;
        }

        return this.tiles[this.posToIndex(x, y)];
    }

    setTile(x: number, y: number, tile: BoardTileType) {
        if (!this.posInRange(x, y)) {
            throw new Error("Tile coordinates out of range");
        }

        this.tiles[this.posToIndex(x, y)] = tile;
        this.dirty = true;
    }

    draw(renderer: Renderer) {
        if (this.dirty) {
            this.updateDisplayTiles();
        }

        let i = 0;

        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const slice = this.displayTiles[i];

                if (slice) {
                    renderer.drawSprite(
                        this.picture,
                        slice,
                        this.x + x * this.tileWidth,
                        this.y + y * this.tileHeight
                    );
                }

                ++i;
            }
        }

        for (const token of this.tokens) {
            const [tokenX, tokenY] = token.getPosition();
            const x = tokenX * this.tileWidth + this.x;
            const y = tokenY * this.tileHeight + this.y;

            token.draw(renderer, x, y);
        }
    }
}
