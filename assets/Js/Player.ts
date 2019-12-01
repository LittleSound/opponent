const { ccclass, property } = cc._decorator;

import { GameLevels } from './GameLevels'

type MapClickData = {
    x: number
    y: number
    type: 0 | 1 | 2
}

/** A*寻路 地块 */
type AStarTile = {
    /** 位置 */
    // position: cc.Vec2
    /** 是起点 */
    isFirst: boolean
    /** 是终点 */
    isEnd: boolean
    /** 连接该点的总路程 （gn + hn）*/
    f: number
    /** 起点到该点的路程 */
    gn: number
    /** 该点到终点的路程 */
    hn: number
    /** 连接编号 */
    num: number
}

@ccclass
export default class Player extends cc.Component {

    // onLoad () {}
    serialNumber = 0;

    start() {
        GameLevels.canvas.on('selection_tile', this.moveLead, this);
    }

    onMapClick(data: MapClickData) {
        if (data.type === 0 || data.type === 2) return;
        if (data.type === 1) this.moveLead(data);
    }

    moveLead(data) {
        console.log(data);
        let aStarMap: AStarTile[][] = new Array(GameLevels.scene.map.length);
        for (let i = 0; i < aStarMap.length; i++) {
            aStarMap[i] = new Array(GameLevels.scene.map[1].length);
        }
        // 获取起点和终点
        const first = this.getPosition();
        const end = new cc.Vec2(data.x, data.y);
        // 吧起点加进表里
        aStarMap[first.y][first.x] = this.setAStarTile(first, end, first, true);
        aStarMap[first.y][first.x].num = this.serialNumber;
        console.log(aStarMap);
        let pointer = first;

        let searchRes = this.searchNearby(aStarMap, first, end, pointer);
        console.log('遍历一遍后的结果：', searchRes, aStarMap)
    }

    searchNearby(aStarMap: AStarTile[][], first: cc.Vec2, end: cc.Vec2, myself: cc.Vec2) {
        const searchList = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
        let searchRes: AStarTile[] = [];
        for (let i = 0; i < searchList.length; i++) {
            const pointer = new cc.Vec2(myself.x + searchList[i].x, myself.y + searchList[i].y);
            const tile = GameLevels.scene.map[pointer.y][pointer.x];
            const aStarTile = aStarMap[pointer.y][pointer.x];
            const isUsed = !aStarTile || aStarTile.num == null;
            if (tile !== 0 && tile !== 2 && isUsed) {
                aStarMap[pointer.y][pointer.x] = this.setAStarTile(first, end, pointer);
                searchRes.push(aStarMap[pointer.y][pointer.x]);
            }
        }
        return searchRes;
    }

    setAStarTile(first: cc.Vec2, end: cc.Vec2, myself: cc.Vec2, isFirst?: boolean, isEnd?: boolean) {
        const gn = Math.abs(myself.x - first.x) + Math.abs(myself.y - first.y)
        const hn = Math.abs(myself.x - end.x) + Math.abs(myself.y - end.y)
        return {
            isFirst: isFirst ? true : false,
            isEnd: isEnd ? true : false,
            f: gn + hn,
            gn,
            hn,
            num: null
        } as AStarTile
    }

    /** 获取玩家的坐标 */
    getPosition() {
        return new cc.Vec2(this.node.x / GameLevels.blockSize, -this.node.y / GameLevels.blockSize)
    }

    /** 设置玩家的坐标 */
    setPosition(ve2: cc.Vec2) {
        this.node.setPosition(ve2.x * GameLevels.blockSize, -ve2.y * GameLevels.blockSize)
    }

    // update (dt) {}
}
