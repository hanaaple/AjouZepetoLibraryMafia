import {
  AnimationClip,
  AnimatorOverrideController,
  GameObject,
  LayerMask,
  Material,
  Random,
  RuntimeAnimatorController,
  SkinnedMeshRenderer,
  Sprite,
  Transform,
} from "UnityEngine";
import {
  SpawnInfo,
  ZepetoCharacter,
  ZepetoCharacterCreator,
  ZepetoPlayers,
} from "ZEPETO.Character.Controller";
import { Room, RoomData } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import {
  InGameInteractState,
  JobState,
  MafiaPlayerState,
} from "../Constants/Enum";
import Citizen from "./Citizen";
import KilledCharacter from "./KilledCharacter";
import Mafia from "./Mafia";
import MafiaGameUiController from "./MafiaUiController";
import PlayerId from "./PlayerId";
import VoteManager from "./VoteManager";

export default class MafiaGameManager extends ZepetoScriptBehaviour {
  @SerializeField()
  private spawnPoints: Transform[];

  private static _instance: MafiaGameManager;

  public static get instance(): MafiaGameManager {
    return this._instance;
  }

  private state: State;

  @SerializeField()
  private mafiaGameUIController: GameObject;

  private _mafiaGameUIController: MafiaGameUiController;

  @SerializeField()
  private voteManager: GameObject;

  private _voteManager: VoteManager;

  @SerializeField()
  private canvasRoot: Transform;

  @SerializeField()
  private mafiaUiPrefab: GameObject;

  @SerializeField()
  private citizenUiPrefab: GameObject;

  @SerializeField()
  private animator: RuntimeAnimatorController;

  @SerializeField()
  private animation: AnimationClip;

  @SerializeField()
  private ghostMaterial: Material;

  @SerializeField()
  private killButton: Sprite;
  @SerializeField()
  private reportButtonSprite: Sprite;
  @SerializeField()
  private missionButton: Sprite;

  private corpseArray: GameObject[];

  Awake() {
    MafiaGameManager._instance = this;
  }

  Start() {
    this._voteManager = this.voteManager.GetComponent<VoteManager>();
    this.corpseArray = new Array<GameObject>();

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

    this._mafiaGameUIController.UpdatePlayerCount(state.readyPlayerCount);

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

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onKill", (message: any) => {
        console.log(message);
        console.log(message.mafia);
        console.log(message.killed);

        const mafia = ZepetoPlayers.instance.GetPlayer(message.mafia);
        const killed = ZepetoPlayers.instance.GetPlayer(message.killed);

        if (killed.isLocalPlayer) {
          ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask =
            ~0;
        }
        killed.character.GetComponent<PlayerId>().state =
          InGameInteractState.GHOST;
        this.AddMaterial(this.ghostMaterial, killed.character.transform);

        mafia.character.Teleport(
          killed.character.gameObject.transform.position,
          killed.character.gameObject.transform.rotation
        );

        this.ChangeLayersRecursively(killed.character.transform, "Ghost");
        // killed.setState
        const spawnInfo = new SpawnInfo();
        spawnInfo.position = killed.character.transform.position;
        spawnInfo.rotation = killed.character.transform.rotation;
        ZepetoCharacterCreator.CreateByUserId(
          killed.userId,
          spawnInfo,
          (model: ZepetoCharacter) => {
            const corpse = model.gameObject;
            this.corpseArray.push(corpse);

            console.log(model, "생성됨");
            var overrideController: AnimatorOverrideController =
              new AnimatorOverrideController(
                model.ZepetoAnimator.runtimeAnimatorController
              );
            overrideController.runtimeAnimatorController = this.animator;

            overrideController["gesture"] = this.animation;

            model.ZepetoAnimator.runtimeAnimatorController = overrideController;
            model.SetGesture(this.animation);

            const playerId = model.gameObject.AddComponent<PlayerId>();
            playerId.sessionId = killed.id;
            playerId.state = InGameInteractState.CORPSE;

            const killedCharacter =
              model.gameObject.AddComponent<KilledCharacter>();
            console.log(killedCharacter);
            killedCharacter.Initialize();
          }
        );
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onReport", (message: any) => {
        console.log(message);
        console.log(message.reporter);
        console.log(message.corpse);
        // schema에 번호 부여

        this.corpseArray.forEach((item) => {
          GameObject.Destroy(item);
        });
        this.corpseArray = new Array<GameObject>();
        // ui 및 애니메이션 대기 후 실행
        this._voteManager.StartVote(message.reporter, message.corpse);
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onVote", (message: any) => {
        // 뭔가를 띄운다
        // 머리 위 카운트가 123 늘어나고 카메라가 저기로 이동되도록
        // 귀찮네
        // 모든 ui 삭제
        const player = ZepetoPlayers.instance.GetPlayer(message.targetPlayerId);
        const playerId = player.character.gameObject.GetComponent<PlayerId>();
        this._voteManager.OnVote(playerId);
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onVoteResult", (message: any) => {
        // 뭔가를 띄운다
        // 머리 위 카운트가 123 늘어나고 카메라가 저기로 이동되도록
        // 귀찮네
        // 모든 ui 삭제
        this._voteManager.EndVote();
        this.StartNextDay();
      });
  }
  public AddMaterial(material: Material, trans: Transform) {
    if (!material) return;
    const mesh = trans.GetComponentsInChildren<SkinnedMeshRenderer>();
    mesh.forEach((item: SkinnedMeshRenderer) => {
      console.log(item.materials.length);
      let mats: Material[] = new Array<Material>(item.materials.length);
      for (let idx = 0; idx < item.materials.length; idx++) {
        if (item.materials[idx].name == "eyelash(Clone)") {
          continue;
        }
        mats[idx] = material;
      }
      item.materials = mats;
    });
  }

  // 로컬
  private SendInGameState(state: InGameInteractState) {
    const data = new RoomData();
    data.Add("inGameState", state);
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

  StartNextDay() {
    // 맵 내 랜덤 이동 - spawn point[]가 존재
    let randomIdx = Math.floor(Random.Range(0, this.spawnPoints.length));

    const spawnPoint = this.spawnPoints[randomIdx];
    ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.Teleport(
      spawnPoint.position,
      spawnPoint.rotation
    );
    ClientStarter.instance.SendTransform(spawnPoint);
  }

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

      this.ChangeLayersRecursively(character.character.transform, "Live");
      const playerId = character.character.gameObject.AddComponent<PlayerId>();
      playerId.order = player.order;
      playerId.sessionId = character.id;
      playerId.state = InGameInteractState.ALIVE;

      this._voteManager.PushPlayer(playerId);

      if (player.jobState == JobState.Mafia) {
        const mafia = character.character.gameObject.AddComponent<Mafia>();
        mafia.Initialize(
          this.mafiaUiPrefab,
          this.canvasRoot,
          character.isLocalPlayer,
          player.jobState,
          character.id,
          this.killButton,
          this.reportButtonSprite,
          this.missionButton
        );
      } else if (player.jobState == JobState.Citizen) {
        const citizen = character.character.gameObject.AddComponent<Citizen>();

        citizen.Initialize(
          this.citizenUiPrefab,
          this.canvasRoot,
          character.isLocalPlayer,
          player.jobState,
          character.id,
          this.killButton,
          this.reportButtonSprite,
          this.missionButton
        );
      }
    });

    // 여기도 서버에서 보내고 각 클라이언트에서 직접 보내

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

    ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask = ~(
      1 << LayerMask.NameToLayer("Ghost")
    );
  }

  //모든 플레이어 세팅 및 죽었을 경우에도 모든 클라에 실행
  public ChangeLayersRecursively(trans: Transform, name: string) {
    trans.gameObject.layer = LayerMask.NameToLayer(name);
    for (var i = 0; i < trans.childCount; i++) {
      this.ChangeLayersRecursively(trans.GetChild(i), name);
    }
  }
}
