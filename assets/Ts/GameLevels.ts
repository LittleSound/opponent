import { SceneType } from './Scenes'

export class GameLevels {
    /** Canvas */
    public static canvas: cc.Node = null;
    /** 玩家 */
    public static player: cc.Node = null;
    /** 地块尺寸 */
    public static blockSize: number = 80;
    /** 地图Node表 */
    public static tilesNodes: cc.Node[][] = [];
    /** 场景初始值 */
    public static scene: SceneType = {
        map: [],
        lead: {
            position: null
        }
    };

}