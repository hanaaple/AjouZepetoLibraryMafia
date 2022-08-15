import {
  Canvas,
  GameObject,
  Random,
  SphereCollider,
  Transform,
  Vector3,
} from "UnityEngine";
import { UnityAction$1, UnityEvent$1 } from "UnityEngine.Events";
import { ZepetoPlayer, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room, RoomData } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import Citizen from "./Citizen";
import Mafia from "./Mafia";
import MafiaGameUiController from "./MafiaUiController";

export enum MafiaPlayerState {
  None = -1,
  Ready = 1,
  Play = 2,
}

export enum JobState {
  None = -2,
  Citizen = 1,
  Mafia = 2,
}

export enum InGameState {
  ALIVE = 1,
  GHOST = 2,
}

export default class MafiaGameManager extends ZepetoScriptBehaviour {
  private minPlayer: number = 8;

  public spawnPoints: Transform[];

  private static _instance: MafiaGameManager;

  public static get instance(): MafiaGameManager {
    return this._instance;
  }

  private state: State;

  public mafiaGameUIController: GameObject;

  private _mafiaGameUIController: MafiaGameUiController;

  @SerializeField()
  private canvasRoot: Transform;

  @SerializeField()
  private mafiaUiPrefab: GameObject;

  @SerializeField()
  private citizenUiPrefab: GameObject;

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

    this.state = state;

    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      this.AddPlayer();
    });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler(
        "UpdateReadyMafiaPlayer",
        (readyPlayerCount: number) => {
          this._mafiaGameUIController.UpdatePlayerCount(readyPlayerCount);
        }
      );

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("GameStart", (message) => {
        this.GameStart();
      });
    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("GameStartCount", (count: number) => {
        this.StartCoroutine(this._mafiaGameUIController.GameStartCount(count));
      });

    this._mafiaGameUIController.UpdatePlayerCount(state.readyPlayerCount);
  }

  // 로컬
  private SendState(state: number) {
    const data = new RoomData();
    data.Add("state", state);
    ClientStarter.instance
      .GetRoom()
      .Send("onMafiaChangedState", data.GetObject());
  }

  // 로컬
  public AddPlayer() {
    const data = new RoomData();
    data.Add("state", MafiaPlayerState.None);
    ClientStarter.instance.GetRoom().Send("onAddMafiaPlayer", data.GetObject());
  }

  public GameStateUpdate(state: MafiaPlayerState) {
    const data = new RoomData();
    data.Add("state", state);
    if (state == MafiaPlayerState.None) {
      ClientStarter.instance
        .GetRoom()
        .Send("onNotReadyMafiaPlayer", data.GetObject());
    } else if (state == MafiaPlayerState.Ready) {
      ClientStarter.instance
        .GetRoom()
        .Send("onReadyMafiaPlayer", data.GetObject());
    }
  }

  // public RemovePlayer() {
  //   if (
  //     this.state.players.ContainsKey(
  //       ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
  //     )
  //   ) {
  //     ClientStarter.instance.GetRoom().Send("onRemoveMafiaPlayer");
  //   }
  // }

  GameStart() {
    console.log("게임 시작");

    const player = this.state.players.get_Item(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
    );

    // console.log(
    //   ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id,
    //   ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.userId
    // );
    console.log(
      "직업 :  " +
        player.jobState +
        "  " +
        player.GamePlayerState +
        "    " +
        player.InGamePlayerState
    );
    this.state.players.ForEach((sessionId: string, player: Player) => {
      const character = ZepetoPlayers.instance.GetPlayer(sessionId);
      if (player.jobState == JobState.Mafia) {
        const mafia = character.character.gameObject.AddComponent<Mafia>();
        mafia.Initialize(
          this.mafiaUiPrefab,
          this.canvasRoot,
          character.isLocalPlayer
        );
      } else if (player.jobState == JobState.Citizen) {
        const citizen = character.character.gameObject.AddComponent<Citizen>();

        citizen.Initialize(
          this.citizenUiPrefab,
          this.canvasRoot,
          character.isLocalPlayer
        );
      }
    });

    // 플레이어 직업 할당, 미션 할당, State 할당
    // player.player
    // player.gameState
    // 맵 내 랜덤 이동 - spawn point[]가 존재
    let randomIdx = Math.floor(Random.Range(0, this.spawnPoints.length));

    // const message = new RoomData();
    // message.Add("radomIdx", randomIdx);
    // ClientStarter.instance.SendMessage("randomTeleport", message.GetObject());

    const spawnPoint = this.spawnPoints[randomIdx];
    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.Teleport(
      spawnPoint.position,
      spawnPoint.rotation
    );
    ClientStarter.instance.SendTransform(spawnPoint);
  }
}
