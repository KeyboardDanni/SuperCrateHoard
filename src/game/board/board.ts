import { Picture, PictureSlice, Renderer } from "../../engine/graphics";
import { Level } from "../global/level";

export class BoardToken {
    x: number = 0;
    y: number = 0;
    picture: Picture | null = null;
    slice: PictureSlice = new PictureSlice(0, 0, 0, 0);

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

export class TileSlices {
    wall: PictureSlice[] = [];
    floor: PictureSlice[] = [];
    dropzone: PictureSlice[] = [];
}

export class Board {
    x: number = 0;
    y: number = 0;
    readonly width: number;
    readonly height: number;
    readonly tileWidth: number;
    readonly tileHeight: number;
    private tiles: BoardTileType[];
    private displayTiles: (PictureSlice | null)[];
    private picture: Picture;
    private slices: TileSlices;
    private dirty = true;
    tokens: BoardToken[] = [];

    constructor(width: number, height: number, picture: Picture, slices: TileSlices) {
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

    static fromLevel(
        level: Level,
        picture: Picture,
        slices: TileSlices,
        tokenCallback: (tokenType: BoardTokenType, tileType: BoardTileType) => BoardToken
    ) {
        const tiles = level.tiles;
        let width = 0;
        const height = tiles.length;

        for (const row of tiles) {
            width = Math.max(width, row.length);
        }

        const board = new Board(width, height, picture, slices);

        for (let y = 0; y < height; ++y) {
            const row = tiles[y];

            for (let x = 0; x < width; ++x) {
                const letter = row[x];
                let tile = BoardTileType.None;

                // Tiles
                switch (letter) {
                    case undefined:
                    case " ":
                    case "@":
                    case "$":
                        tile = BoardTileType.Floor;
                        break;
                    case "#":
                        tile = BoardTileType.Wall;
                        break;
                    case ".":
                    case "+":
                    case "*":
                        tile = BoardTileType.Dropzone;
                        break;
                }

                board.setTile(x, y, tile);

                let token = null;

                // Tokens
                switch (letter) {
                    case "@":
                    case "+":
                        token = tokenCallback(BoardTokenType.Player, tile);
                        break;
                    case "$":
                    case "*":
                        token = tokenCallback(BoardTokenType.Crate, tile);
                        break;
                }

                if (token) {
                    token.x = x;
                    token.y = y;
                    board.tokens.push(token);
                }
            }
        }

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

    posToIndex(x: number, y: number) {
        return x + y * this.width;
    }

    tile(x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return BoardTileType.None;
        }

        return this.tiles[this.posToIndex(x, y)];
    }

    setTile(x: number, y: number, tile: BoardTileType) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
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
            const x = token.x * this.tileWidth + this.x;
            const y = token.y * this.tileHeight + this.y;

            token.draw(renderer, x, y);
        }
    }
}
