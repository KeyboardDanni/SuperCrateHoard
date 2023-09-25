import { BoardToken, Direction, directionToOffset, oppositeDirection } from "../board/token";
import { Board } from "../board/board";
import { Crate } from "./crate";

export enum Orientation {
    Forward,
    Backward,
}

export class Player extends BoardToken {
    private theme;
    private walkFrame = 0;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.playerDown[0];
    }

    winAnimation() {
        this.slice = this.theme.playerWin;
    }

    walkAnimation(direction: Direction) {
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

    private doWalk(newX: number, newY: number, orientation: Orientation) {
        this.board.moveToken(this, newX, newY);
        this.setPosition(newX, newY);

        if (orientation === Orientation.Forward) {
            this.walkFrame = (this.walkFrame + 1) % 4;
        } else {
            this.walkFrame = (this.walkFrame + 3) % 4;
        }
    }

    tryWalk(direction: Direction, orientation: Orientation = Orientation.Forward) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;
        let result = false;

        if (this.isFree(newX, newY)) {
            this.doWalk(newX, newY, orientation);
            result = true;
        }

        this.walkAnimation(
            orientation === Orientation.Forward ? direction : oppositeDirection(direction)
        );
        return result;
    }

    tryPush(direction: Direction) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;
        let result = false;

        const tokens = this.board.tokensForTile(newX, newY);

        for (const token of tokens) {
            if (token instanceof Crate) {
                if (token.tryPush(direction)) {
                    this.doWalk(newX, newY, Orientation.Forward);
                    result = true;
                }
                break;
            }
        }

        this.walkAnimation(direction);
        return result;
    }

    tryPull(direction: Direction) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const crateX = pos.x - offset.x;
        const crateY = pos.y - offset.y;
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;
        let result = false;

        const tokens = this.board.tokensForTile(crateX, crateY);

        if (this.isFree(newX, newY)) {
            for (const token of tokens) {
                if (token instanceof Crate) {
                    if (token.tryPull(this, direction)) {
                        this.doWalk(newX, newY, Orientation.Backward);
                        result = true;
                    }
                    break;
                }
            }
        }

        this.walkAnimation(oppositeDirection(direction));
        return result;
    }
}
