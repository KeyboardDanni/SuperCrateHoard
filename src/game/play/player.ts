import { BoardToken, Direction, directionToOffset } from "../board/token";
import { Board } from "../board/board";
import { Crate } from "./crate";

export class Player extends BoardToken {
    private theme;
    private walkFrame = 0;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.playerDown[0];
    }

    private walkAnimation(direction: Direction) {
        this.walkFrame = (this.walkFrame + 1) % 4;

        switch (direction) {
            case Direction.Left:
                this.slice = this.theme.playerLeft[this.walkFrame];
                break;
            case Direction.Right:
                this.slice = this.theme.playerRight[this.walkFrame];
                break;
            case Direction.Up:
                this.slice = this.theme.playerUp[this.walkFrame];
                break;
            case Direction.Down:
                this.slice = this.theme.playerDown[this.walkFrame];
                break;
        }
    }

    private doWalk(direction: Direction, newX: number, newY: number) {
        this.board.moveToken(this, newX, newY);
        this.setPosition(newX, newY);

        this.walkAnimation(direction);
    }

    tryWalk(direction: Direction) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;

        const tokens = this.board.tokensForTile(newX, newY);
        let interactedWithToken = false;

        for (const token of tokens) {
            if (token instanceof Crate) {
                if (token.tryPush(direction)) {
                    this.doWalk(direction, newX, newY);
                }

                interactedWithToken = true;
                break;
            }
        }

        if (!interactedWithToken && this.isTileFree(newX, newY)) {
            this.doWalk(direction, newX, newY);
        }
    }
}
