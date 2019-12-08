const { ccclass, property } = cc._decorator;

import { Scenes } from "./Scenes"

import { GameLevels } from "./GameLevels"

@ccclass
export default class MapGeneration extends cc.Component {

    @property(cc.Prefab)
    land: cc.Prefab = null;

    @property(cc.Prefab)
    wall: cc.Prefab = null;

    @property(cc.Prefab)
    lead: cc.Prefab = null;

    tiles: cc.Prefab[] = [];

    onLoad() {
        this.tiles = [null, this.land, this.wall]
        GameLevels.canvas = cc.find('Canvas');
    }

    start() {
        const scene = Scenes.sceneCs;
        this.ergodicMap(scene.map)
        this.initPlayerPosition(scene.lead.position)
    }

    ergodicMap(map: number[][]) {
        GameLevels.tilesNodes = [];
        GameLevels.scene.map = map;
        const yMiddle = map.length / 2
        const xMiddle = map[0].length / 2
        this.node.setPosition(-xMiddle * GameLevels.blockSize, yMiddle * GameLevels.blockSize)

        for (let y = 0; y < map.length; y++) {
            GameLevels.tilesNodes.push([]);
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 0) continue

                const tile = cc.instantiate(this.tiles[map[y][x]])
                tile.parent = this.node
                tile.setPosition(x * GameLevels.blockSize, -y * GameLevels.blockSize)
                this.initTileButton(tile, x, y, map[y][x])
                GameLevels.tilesNodes[y][x] = tile;
            }
        }
        console.log(GameLevels.tilesNodes)
    }

    initPlayerPosition(position: cc.Vec2) {
        const player = cc.instantiate(this.lead)
        player.parent = this.node
        player.setPosition(position.x * GameLevels.blockSize, -position.y * GameLevels.blockSize);
        GameLevels.player = player;
    }

    /** 给Button指定回调函数*/
    addClickEvent(node: cc.Node, target: cc.Node, component: string, handler: string, customEventData: string) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        eventHandler.customEventData = customEventData;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    }

    initTileButton(node, x, y, type) {
        this.addClickEvent(node, this.node, 'MapGeneration', 'onSelectionTile', JSON.stringify({
            x,
            y,
            type
        }))
    }

    onSelectionTile(event, customEventData) {
        const data = JSON.parse(customEventData);
        GameLevels.canvas.emit('selection_tile', data);
    }

    // update (dt) {}
}
