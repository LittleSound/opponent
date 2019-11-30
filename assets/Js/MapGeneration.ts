const { ccclass, property } = cc._decorator;

import { scenes } from "./Map"

@ccclass
export default class MapGeneration extends cc.Component {

    @property(cc.Prefab)
    land: cc.Prefab = null;

    @property(cc.Prefab)
    wall: cc.Prefab = null;

    @property(cc.Prefab)
    lead: cc.Prefab = null;

    @property
    blockSize: number = 80;

    tiles: cc.Prefab[] = [];

    tilesNodes: cc.Node[][] = [];

    canvas: cc.Node = null;

    player: cc.Node = null;

    onLoad() {
        this.tiles = [null, this.land, this.wall]
        this.canvas = cc.find('Canvas');
    }

    start() {
        this.ergodicMap(scenes.scene1.map)
        this.initPlayerPosition(scenes.scene1.lead.position)
    }

    ergodicMap(map: number[][]) {
        const yMiddle = map.length / 2
        const xMiddle = map[0].length / 2
        this.node.setPosition(-xMiddle * this.blockSize, yMiddle * this.blockSize)

        for (let y = 0; y < map.length; y++) {
            this.tilesNodes.push([]);
            for (let x = 0; x < map[y].length; x++) {
                if (map[y][x] === 0) continue

                const tile = cc.instantiate(this.tiles[map[y][x]])
                tile.parent = this.node
                tile.setPosition(x * this.blockSize, -y * this.blockSize)
                this.initTileButton(tile, x, y, map[y][x])
                this.tilesNodes[y][x] = tile;
            }
        }
        console.log(this.tilesNodes)
    }

    initPlayerPosition(position: cc.Vec2) {
        const player = cc.instantiate(this.lead)
        player.parent = this.node
        player.setPosition(position.x * this.blockSize, -position.y * this.blockSize);
        this.player = player;
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
        this.canvas.emit('selection_tile', data);
        if (data.type === 1){
            console.log('移动到:', data.x, data.y)
            this.player.setPosition(data.x * this.blockSize, -data.y * this.blockSize)
        }else
            console.log('无法移动到墙里面！');
    }

    // update (dt) {}
}
