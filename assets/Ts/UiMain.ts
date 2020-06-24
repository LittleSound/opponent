const { ccclass, property } = cc._decorator;

export type UiStateType = 'start' | 'choose-destination' | 'moving-ing'
export type StateCallback =  { type: UiStateType, callback: () => void }

export class UiState {
    public static start: UiStateType = 'start'
    public static chooseDestination: UiStateType = 'choose-destination'
    public static movingIng: UiStateType = 'moving-ing'
}

@ccclass
export class UiMain extends cc.Component {

    public static state: UiStateType = UiState.start;

    public static enterStateCallback: Map<UiStateType, (any?) => void>;

    public static setState(data: UiStateType) {
        this.state = data;
        const callback = this.enterStateCallback.get(data);
        if(callback) callback();
    }

    @property(cc.Label)
    title: cc.Label = null;

    @property(cc.Node)
    moveButton: cc.Node = null;

    @property(cc.Node)
    refreshButton: cc.Node = null;

    @property(cc.Node)
    blockInputEvents: cc.Node = null;

    onLoad () {
        UiMain.enterStateCallback = new Map<UiStateType, any>();

        UiMain.enterStateCallback.set(UiState.chooseDestination, this.enterChooseDestination.bind(this));
        UiMain.enterStateCallback.set(UiState.start, this.enterStart.bind(this));
        UiMain.enterStateCallback.set(UiState.movingIng, this.enterMovingIng.bind(this));
    }

    // start() {}

    onMoveButtonClick(event, customEventData) {
        if (UiMain.state !== UiState.start) return console.warn('非法的UI状态转换');
        UiMain.setState(UiState.chooseDestination)
    }

    enterChooseDestination() {
        this.moveButton.active = false;
        this.refreshButton.active = false;
        this.blockInputEvents.active = false;
        this.title.string = '选择移动目标'
    }

    enterStart() {
        this.moveButton.active = true;
        this.refreshButton.active = true;
        this.title.string = '选择指令'
    }

    enterMovingIng() {
        this.blockInputEvents.active = true;
        this.title.string = '玩家行动中'
    }

    onRefreshButtonClick() {
        cc.director.loadScene("map");
    }

    // update (dt) {}
}
