import { Board, BoardToken } from "../board/board";

export class Player extends BoardToken {
    private theme;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.playerDown[0];
    }
}
