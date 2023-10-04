import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { BMFont } from "../../engine/text";
import { centered } from "../../engine/util";
import { GameSingleton } from "../../game/singleton";
import { PlayScene } from "../play/playscene";
import { Focusable, FocusableScene } from "./focus";
import { OPTIONS_MAIN } from "./optionsmenus";

import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as fontDescriptor from "../../res/Pixel12x10.json";
import { Preferences } from "./savedata";

const titleSlices = titleAtlasJson;

const FOCUS_PRIORITY_OPTIONS_MENU = 100;

export const enum TextAlignment {
    Left,
    Center,
}

export interface Menu {
    width: number;
    height: number;
    buttons: ButtonItem[];
    labels: LabelItem[];
}

export type TextLabelFunc = (logic: OptionsLogic, gameloop: Gameloop<GameSingleton>) => string;

export interface LabelItem {
    x: number;
    y: number;
    text: TextLabelFunc;
    alignment: TextAlignment;
    maxWidth: number;
    maxLines: number;
}

export type OnActivateFunc = (logic: OptionsLogic, gameloop: Gameloop<GameSingleton>) => void;
export type OnAdjustFunc = (
    offset: number,
    logic: OptionsLogic,
    gameloop: Gameloop<GameSingleton>
) => void;

export interface ButtonItem extends LabelItem {
    onActivate: OnActivateFunc;
    onAdjust: OnAdjustFunc;
}

interface MenuHistoryEntry {
    menu: Menu;
    index: number;
}

export class OptionsLogic extends Focusable implements TickLogic, DrawLogic {
    private picture = new Picture("res/TitleAtlas.png");
    private font: BMFont;
    private isOpen = false;
    private cursorIndex = 0;
    private currentMenu = OPTIONS_MAIN;
    private menuStack: MenuHistoryEntry[] = [];

    constructor(gameloop: Gameloop<GameSingleton>, scene: FocusableScene) {
        super(scene);

        this.font = new BMFont(fontDescriptor);

        this.preferencesChanged(gameloop, gameloop.singleton.preferences);

        scene.addEventHandler("openMenu", () => {
            this.open();
        });
        scene.addEventHandler("preferencesChanged", (preferences) =>
            this.preferencesChanged(gameloop, preferences as Preferences)
        );
    }

    private preferencesChanged(gameloop: Gameloop, preferences: Preferences) {
        const input = gameloop.input();

        input.setDefaultRepeatRate(preferences.repeatDelay, preferences.repeatRate);
    }

    open() {
        this.isOpen = true;
        this.currentMenu = OPTIONS_MAIN;
        this.menuStack = [];
        this.cursorIndex = 0;
    }

    close() {
        this.isOpen = false;
    }

    back() {
        const history = this.menuStack.pop();

        if (history !== undefined) {
            this.currentMenu = history.menu;
            this.cursorIndex = history.index;
        } else {
            this.close();
        }
    }

    enterMenu(menu: Menu) {
        this.menuStack.push({
            menu: this.currentMenu,
            index: this.cursorIndex,
        });
        this.currentMenu = menu;
        this.cursorIndex = 0;
    }

    isIngame() {
        return this.getScene() instanceof PlayScene;
    }

    focusTick(gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        const input = gameloop.input();

        if (gameloop.input().justPressed("menu")) {
            this.back();
            return;
        }

        const action = input.autoRepeatNewest(["left", "right", "up", "down"]);
        const item = this.currentMenu.buttons[this.cursorIndex];

        switch (action) {
            case "up":
                this.cursorIndex--;
                break;
            case "down":
                this.cursorIndex++;
                break;
            case "left":
                if (item) {
                    item.onAdjust(-1, this, gameloop);
                }
                break;
            case "right":
                if (item) {
                    item.onAdjust(1, this, gameloop);
                }
                break;
        }

        this.cursorIndex =
            (this.cursorIndex + this.currentMenu.buttons.length) % this.currentMenu.buttons.length;

        if (input.justPressed("accept")) {
            if (item) {
                item.onActivate(this, gameloop);
            }
        }
    }

    tick(_gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        if (!this.isOpen) {
            return;
        }

        this.keepActive(FOCUS_PRIORITY_OPTIONS_MENU);
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, _lerpTime: number): void {
        if (!this.isOpen) {
            return;
        }

        const renderer = gameloop.renderer();
        const [width, height] = [renderer.canvas().width, renderer.canvas().height];
        const menuWidth = this.currentMenu.width;
        const menuHeight = this.currentMenu.height;
        const startX = centered(menuWidth, width);
        const startY = centered(menuHeight, height);

        renderer.drawRect(startX, startY, menuWidth, menuHeight, "rgb(22, 26, 55, 0.85)");
        renderer.drawRectOutline(
            startX - 0.5,
            startY - 0.5,
            menuWidth + 1,
            menuHeight + 1,
            "rgb(224, 224, 224, 0.7)"
        );

        const drawText = (item: LabelItem, selected: boolean) => {
            let x = startX + item.x;
            const maxWidth = item.maxWidth > 0 ? item.maxWidth : menuWidth - item.x;
            const text = item.text(this, gameloop);

            if (item.alignment === TextAlignment.Center) {
                const textWidth = this.font.measureText(text);

                x += centered(textWidth, menuWidth);
            }

            this.font.drawText(renderer, text, x, startY + item.y, maxWidth, item.maxLines);

            if (selected) {
                renderer.drawSprite(
                    this.picture,
                    titleSlices.arrowRight,
                    x - 24,
                    startY + item.y - 4
                );
            }
        };

        for (const item of this.currentMenu.labels) {
            drawText(item, false);
        }

        for (let i = 0; i < this.currentMenu.buttons.length; ++i) {
            const item = this.currentMenu.buttons[i];
            drawText(item, this.cursorIndex === i);
        }
    }
}
