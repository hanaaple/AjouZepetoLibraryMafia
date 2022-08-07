import { GameObject, Random, Transform } from "UnityEngine";
import { UnityAction$1, UnityEvent$1 } from "UnityEngine.Events";
import { ZepetoPlayer, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room, RoomData } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import MafiaGameUiController from "./MafiaUiController";
import ClientStarter from "../../../../AjouZepetoLibrary/Assets/Scripts/ClientStarter";

enum MafiaPlayerState {
  None = -2,
  Ready = -1,
  Citizen = 0,
  Mafia = 1,
  Ghost = 99,
}

export default class MafiaGameManager extends ZepetoScriptBehaviour {
  private playerCount: number = 0;

  private minPlayer: number = 8;

  public spawnPoints: Transform[];

  private static _instance: MafiaGameManager;

  public static get instance(): MafiaGameManager {
    return this._instance;
  }

  private state: State;

  public mafiaGameUIController: GameObject;

  private _mafiaGameUIController: MafiaGameUiController;

  Awake() {
    MafiaGameManager._instance = this;
  }

  Start() {
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += this.OnStateChange;
    };
    this._mafiaGameUIController =
      this.mafiaGameUIController.GetComponent<MafiaGameUiController>();
  }

  OnStateChange(state: State, isFirst: boolean) {
    if (!isFirst) return;

    this.state = ClientStarter.instance.GetRoom().State;
    state.players.ForEach((sessionId: string, player: Player) => {
      this.OnAddPlayerHandler(player);
    });

    state.players.OnAdd((sessionId: string, player: Player) => {
      this.OnAddPlayerHandler(player);
    });
  }

  // 로컬
  private SendState(state: MafiaPlayerState) {
    const data = new RoomData();
    data.Add("state", state as number);
    ClientStarter.instance
      .GetRoom()
      .Send("onMafiaChangedState", data.GetObject());
  }

  // 로컬
  public AddReadyPlayer() {
    if (
      this.state.players.ContainsKey(
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
      )
    )
      return;
    ClientStarter.instance.GetRoom().Send("onAddMafiaPlayer");
  }

  public RemovePlayer() {
    if (
      !this.state.players.ContainsKey(
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
      )
    )
      return;
    // ClientStarter.instance.GetRoom().Send("onRemoveMafiaPlayer");
  }

  // 온라인
  public OnAddPlayerHandler(player: Player) {
    // this.SendState(MafiaPlayerState.Ready);
    this.playerCount = this.state.players.Count;
    this._mafiaGameUIController.UpdatePlayerCount(this.playerCount);
  }

  CheckPlayerNum() {
    return this.playerCount >= this.minPlayer;
  }

  GameStart() {
    //아래 코드는 서버 단에서 실행
    // const player: Player = this.state.players.get_Item(
    //   Random.Range(0, this.state.players.Count - 1)
    // );
    // player.gameState = MafiaPlayerState.Mafia;

    this.state.players.ForEach((sessionId, player: Player) => {
      if (player.gameState != MafiaPlayerState.Mafia) {
        player.gameState = MafiaPlayerState.Citizen;
      }
      // 플레이어 직업 할당, 미션 할당, State 할당
      // player.player
      // player.gameState

      //맵 내 랜덤 이동 - spawn point[]가 존재
      // let randomPoint = Random.Range(0, this.spawnPoints.length - 1);
      // this.spawnPoints.get_Item(randomPoint);
    });
  }
}
