const { ccclass, property } = cc._decorator;

import { GameLevels } from './GameLevels'
import { Scenes } from './Scenes';

type MapClickData = {
    x: number
    y: number
    type: 0 | 1 | 2
}

/** A*寻路 地块 */
type AStarTile = {
    /** 位置 */
    position: cc.Vec2
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
        GameLevels.canvas.on('selection_tile', this.onMapClick, this);
    }

    /**
     * 地图上的地块被点击
     * @param data 
     */
    onMapClick(data: MapClickData) {
        if (data.type === 0 || data.type === 2) console.log('无法抵达此区域');
        else if (data.type === 1) this.moveLead(data);
    }

    /**
     * 自动寻路到目标位置
     * @param data x, y, type
     */
    async moveLead(data) {
        console.log(data);
        this.serialNumber = 0;
        this.initButtonColor();
        let aStarMap: AStarTile[][] = new Array(GameLevels.scene.map.length);
        for (let i = 0; i < aStarMap.length; i++) {
            aStarMap[i] = new Array(GameLevels.scene.map[0].length);
        }
        // 获取起点和终点
        const first = this.getPosition();
        const end = new cc.Vec2(data.x, data.y);
        // 吧起点加进表里
        aStarMap[first.y][first.x] = this.setAStarTile(first, end, first);
        aStarMap[first.y][first.x].num = this.serialNumber;
        console.log(aStarMap);
        let pointer = first;

        while (pointer.x !== end.x || pointer.y !== end.y) {
            aStarMap = this.searchNearby(aStarMap, first, end, pointer);
            let minTile = this.getMinFOpenTile(aStarMap, pointer);
            // 输出、染色
            console.log('遍历一遍后的结果：', this.serialNumber + 1, minTile.f, minTile, aStarMap)
            if (minTile || this.serialNumber > 9999) {
                this.setTileColor(minTile.position, cc.Color.ORANGE)
            }
            else {
                console.error('寻路失败');
                return;
            }

            pointer = minTile.position
            aStarMap[pointer.y][pointer.x].num = ++this.serialNumber;
            // 延迟
            // await this.delay();
        }
        // 根据num最小原则寻找最短路径
        const route = this.getShortestRoute(aStarMap, end);
        console.log('遍历结束', route, aStarMap);
        // 移动到目的地
        this.moveGo(route);
    }

    /**
     * 遍历 myself 周围的地块
     * @param aStarMap A*地图
     * @param first 起点坐标
     * @param end 终点坐标
     * @param myself 当前坐标
     */
    searchNearby(aStarMap: AStarTile[][], first: cc.Vec2, end: cc.Vec2, myself: cc.Vec2) {
        const searchList = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
        let searchRes: AStarTile[] = [];
        for (let i = 0; i < searchList.length; i++) {
            const pointer = new cc.Vec2(myself.x + searchList[i].x, myself.y + searchList[i].y);
            // 超出范围的不需要遍历
            const noOverflow = pointer.y < GameLevels.scene.map.length && pointer.x < GameLevels.scene.map[0].length;
            const isTooSmall = pointer.y < 0 || pointer.x < 0;
            if (!noOverflow || isTooSmall) continue;

            const tile = GameLevels.scene.map[pointer.y][pointer.x];
            const aStarTile = aStarMap[pointer.y][pointer.x];
            const isUsed = !aStarTile || aStarTile.num == null;
            if (tile && tile !== 2 && isUsed) {
                let newTile = this.setAStarTile(myself, end, pointer, aStarMap[myself.y][myself.x]);
                if (aStarMap[pointer.y][pointer.x]) {
                    if (aStarMap[pointer.y][pointer.x].f > newTile.f)
                        aStarMap[pointer.y][pointer.x] = newTile;
                    else continue;
                }
                else aStarMap[pointer.y][pointer.x] = newTile;

                searchRes.push(aStarMap[pointer.y][pointer.x]);
                // 染色
                this.setTileColor(pointer, cc.Color.CYAN)
            }
        }
        return aStarMap;
    }

    /**
     * 生成地块信息
     * @param first 起点坐标
     * @param end 终点坐标
     * @param myself 当前坐标
     * @param isFirst 是不是起点
     * @param isEnd 是不是终点
     */
    setAStarTile(first: cc.Vec2, end: cc.Vec2, myself: cc.Vec2, parent?: AStarTile) {
        let gn = Math.abs(myself.x - first.x) + Math.abs(myself.y - first.y);
        const hn = Math.abs(myself.x - end.x) + Math.abs(myself.y - end.y);

        if (parent) gn += parent.gn;
        const f = gn + hn;

        return {
            position: new cc.Vec2(myself.x, myself.y),
            isFirst: gn === 0 ? true : false,
            isEnd: hn === 0 ? true : false,
            f,
            gn,
            hn,
            num: null
        } as AStarTile;
    }

    /**
     * 获取aStarMap中f值最小的子集地块
     * @param aStarMap 
     */
    getMinFOpenTile(aStarMap: AStarTile[][], parent: cc.Vec2) {
        let minTile: AStarTile[] = [];
        for (let y = 0; y < aStarMap.length; y++) {
            for (let x = 0; x < aStarMap[y].length; x++) {
                // 排除空的和已经获得编号的地块
                if (aStarMap[y][x] && aStarMap[y][x].num == null) {
                    // 如果该地块是终点，则直接选择该地块
                    if (aStarMap[y][x].hn === 0) return aStarMap[y][x];
                    // 筛选f值较小的地块 ，如果相等则扩充到队列的后方
                    if (!minTile[0] || aStarMap[y][x].f < minTile[0].f) {
                        minTile = [aStarMap[y][x]];
                    }
                    else if (aStarMap[y][x].f === minTile[0].f) {
                        minTile.push(aStarMap[y][x]);
                    }
                }
            }
        }
        // 选出f值最小的队列中离终点最近的地块
        minTile.sort((a, b) => a.hn - b.hn)
        console.log('搜索优化0', minTile[0], minTile);
        minTile = minTile.filter(a => a.hn === minTile[0].hn) 
        console.log('搜索优化0', minTile[0], minTile);  
        minTile.sort((a, b) => {
            const an = Math.abs(a.position.x - parent.x) + Math.abs(a.position.y - parent.y);
            const bn = Math.abs(b.position.x - parent.x) + Math.abs(b.position.y - parent.y);
            return an - bn
        })
        console.log('搜索优化0', minTile[0], minTile);
        return minTile[0];
    }

    /**
     * 从终点开始按照编号寻找最短的路程
     * @param aStarMap 
     * @param end 
     */
    getShortestRoute(aStarMap: AStarTile[][], end: cc.Vec2) {
        // 路径数组
        let route: AStarTile[] = [aStarMap[end.y][end.x]];
        // 遍历列表
        const searchList = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];

        // 遍历直至找到序号0的地块位置
        for (let i = 0; i < 10000; i++) {
            const routeTile = route[route.length - 1];
            let minNumTile: AStarTile;
            // 遍历当前地块附近的地块
            for (let i = 0; i < searchList.length; i++) {
                const pointer = new cc.Vec2(routeTile.position.x + searchList[i].x, routeTile.position.y + searchList[i].y);
                // 超出范围的不需要遍历
                const noOverflow = pointer.y < GameLevels.scene.map.length && pointer.x < GameLevels.scene.map[0].length;
                const isTooSmall = pointer.y < 0 || pointer.x < 0;
                if (!noOverflow || isTooSmall) continue;
                // 排除没有序号的地块，筛选当前地块附近序号最小的地块
                if (!aStarMap[pointer.y][pointer.x] || aStarMap[pointer.y][pointer.x].num == null)
                    continue;
                else if (!minNumTile || aStarMap[pointer.y][pointer.x].num < minNumTile.num)
                    minNumTile = aStarMap[pointer.y][pointer.x];
            }
            // 如果搜索到序号0（回到起点）则结束遍历
            if (minNumTile.num !== 0) {
                route.push(minNumTile);
                console.log('最短路径', minNumTile.num, minNumTile);
                this.setTileColor(minNumTile.position, cc.Color.GREEN)
            }
            else break;
        }
        // 正序结果并返回
        route.sort((a, b) => a.num - b.num)
        return route;
    }

    /** 行走路线动画 */
    moveGo(route: AStarTile[]) {
        let actionList: any[] = [];
        for (let routeTile of route) {
            let ve2 = routeTile.position;
            actionList.push(cc.moveTo(0.3, cc.v2(Math.round(ve2.x * GameLevels.blockSize), Math.round(-ve2.y * GameLevels.blockSize))))
        }
        const action = cc.sequence(cc.show(), ...actionList);
        this.node.runAction(action);
    }

    /** 获取玩家的坐标 */
    getPosition() {
        return new cc.Vec2(Math.round(this.node.x / GameLevels.blockSize), Math.round(-this.node.y / GameLevels.blockSize))
    }

    /** 设置玩家的坐标 */
    setPosition(ve2: cc.Vec2) {
        this.node.setPosition(Math.round(ve2.x * GameLevels.blockSize), Math.round(-ve2.y * GameLevels.blockSize))
    }

    /**
     * 设置地块颜色
     * @param position 位置
     * @param color 颜色
     */
    setTileColor(position: cc.Vec2, color: cc.Color) {
        GameLevels.tilesNodes[position.y][position.x].color = color;
    }

    /** 延时 */
    async delay() {
        var promise = new Promise(function (resolve, reject) {
            setTimeout(() => resolve('abcd'), 100)
        })
        return promise;
    }

    /** 恢复按钮颜色 */
    initButtonColor() {
        console.log('aaaa', GameLevels.tilesNodes[0][0])
        for (let y = 0; y < GameLevels.tilesNodes.length; y++) {
            for (let x = 0; x < GameLevels.tilesNodes[y].length; x++) {
                if (GameLevels.tilesNodes[y][x] && GameLevels.tilesNodes[y][x].name === 'land') {
                    //@ts-ignore
                    GameLevels.tilesNodes[y][x].color = new cc.Color(85, 85, 85);
                }
            }
        }
    }

    // update (dt) {}
}
