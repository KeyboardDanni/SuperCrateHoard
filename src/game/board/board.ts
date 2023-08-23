import { Picture, PictureSlice, Renderer } from "../../engine/graphics";

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

    constructor(
        width: number,
        height: number,
        picture: Picture,
        slices: TileSlices
    ) {
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
