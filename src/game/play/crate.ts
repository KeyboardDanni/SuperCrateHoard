import { Board, BoardTileType, BoardToken } from "../board/board";

export class Crate extends BoardToken {
    private theme;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        const tile = board.tile(x, y);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];
    }
}
