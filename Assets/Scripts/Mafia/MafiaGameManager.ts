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
  Time,
  Transform,
  WaitForSeconds,
  WaitWhile,
} from "UnityEngine";
import { Image } from "UnityEngine.UI";
import {
  SpawnInfo,
  ZepetoCharacter,
  ZepetoCharacterCreator,
  ZepetoPlayers,
} from "ZEPETO.Character.Controller";
import { Room } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import Citizen from "./Citizen";
import KilledCharacter from "./KilledCharacter";
import Mafia from "./Mafia";
import MafiaMissionList from "./MafiaMissionList";
import PlayerId from "./PlayerId";

class SkinMesh {
  public materials: Material[];
}

export default class MafiaGameManager extends ZepetoScriptBehaviour {
  @SerializeField()
  private spawnPoints: Transform[];

  private static _instance: MafiaGameManager;

  public static get instance(): MafiaGameManager {
    return this._instance;
  }

  private state: State;

  @SerializeField()
  private mafiaUI: GameObject;
  @SerializeField()
  private mafiaMissionList: GameObject;
  @SerializeField()
  private _mafiaMissionList: MafiaMissionList;

  @SerializeField()
  private animator: RuntimeAnimatorController;

  @SerializeField()
  private animation: AnimationClip;

  @SerializeField()
  private ghostMaterial: Material;

  @SerializeField()
  private jobTextImage: Image;
  @SerializeField()
  private mafiaTextSprite: Sprite;
  @SerializeField()
  private citizenTextSprite: Sprite;

  private corpseArray: GameObject[];

  private savedMaterials: Map<string, SkinMesh[]>;

  private isKilled: boolean;

  Awake() {
    MafiaGameManager._instance = this;
  }

  Start() {
    this.savedMaterials = new Map<string, SkinMesh[]>();
    this.corpseArray = new Array<GameObject>();
    this._mafiaMissionList =
      this.mafiaMissionList.GetComponent<MafiaMissionList>();
    ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
      const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
      if (character.gameObject.GetComponent<PlayerId>()) {
        const playerId = character.gameObject.GetComponent<PlayerId>();
        playerId.order = -1;
        playerId.sessionId = sessionId;
        playerId.jobState = JobState.None;
        playerId.state = InGameInteractState.NONE;
      } else {
        const playerId = character.gameObject.AddComponent<PlayerId>();
        playerId.order = -1;
        playerId.sessionId = sessionId;
        playerId.jobState = JobState.None;
        playerId.state = InGameInteractState.NONE;
      }
    });
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += this.OnStateChange;
    };
  }

  OnStateChange(state: State, isFirst: boolean) {
    if (!isFirst) return;

    this.state = state;

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("GameStart", (message) => {
        if (
          !state.mafiaPlayers.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        ) {
          return;
        }
        this.GameStart();
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onKill", (message: any) => {
        if (
          !state.mafiaPlayers.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        ) {
          return;
        }
        console.log("마피아: " + message.mafia);
        console.log("죽은 사람: " + message.killed);

        this.isKilled = true;
        const mafia = ZepetoPlayers.instance.GetPlayer(message.mafia);
        const killed = ZepetoPlayers.instance.GetPlayer(message.killed);

        if (killed.isLocalPlayer) {
          ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask =
            ~0;
        }
        killed.character.GetComponent<PlayerId>().state =
          InGameInteractState.GHOST;
        this.AddMaterial(
          this.ghostMaterial,
          killed.character.transform,
          killed.id
        );

        mafia.character.transform.position =
          killed.character.gameObject.transform.position;
        mafia.character.transform.rotation =
          killed.character.gameObject.transform.rotation;

        if (mafia.id == ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id) {
          ClientStarter.instance.Teleport(mafia.character.transform);
        }

        this.ChangeLayersRecursively(killed.character.transform, "Ghost");
        // killed.setState
        const spawnInfo = new SpawnInfo();
        spawnInfo.position = killed.character.transform.position;
        spawnInfo.rotation = killed.character.transform.rotation;
        ZepetoCharacterCreator.CreateByUserId(
          killed.userId,
          spawnInfo,
          (model: ZepetoCharacter) => {
            this.isKilled = false;
            const corpse = model.gameObject;
            this.corpseArray.push(corpse);

            console.log(killed.id + "의 시체 생성됨" + model);
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
            killedCharacter.Initialize();
          }
        );
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onReport", (message: any) => {
        if (
          !state.mafiaPlayers.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        ) {
          return;
        }

        console.log(
          "신고!! - 신고자: " +
            message.reporter +
            "\n" +
            "죽은 자: " +
            message.corpse
        );

        this.corpseArray.forEach((item) => {
          GameObject.Destroy(item);
        });
        this.corpseArray = new Array<GameObject>();
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onVoteTarget", (sessionId: string) => {
        if (
          !state.mafiaPlayers.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        ) {
          return;
        }

        this.state.mafiaPlayers.ForEach((sId: string, player: Player) => {
          if (sessionId == sId) {
            sessionId = sId;
          }
        });

        const voteTargetPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);

        if (voteTargetPlayer.isLocalPlayer) {
          ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask =
            ~0;
        }
        voteTargetPlayer.character.GetComponent<PlayerId>().state =
          InGameInteractState.GHOST;
        this.AddMaterial(
          this.ghostMaterial,
          voteTargetPlayer.character.transform,
          voteTargetPlayer.id
        );

        this.ChangeLayersRecursively(
          voteTargetPlayer.character.transform,
          "Ghost"
        );
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onStartNextDay", (message: any) => {
        if (
          !state.mafiaPlayers.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        ) {
          return;
        }
        this.StartNextDay();
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onReset", (message: any) => {
        this.StartCoroutine(this.Reset());
      });
  }

  public AddMaterial(material: Material, trans: Transform, sessionId: string) {
    if (!material) return;
    console.log("Material 변환!  " + sessionId + " 플레이어, " + trans);
    const mesh = trans.GetComponentsInChildren<SkinnedMeshRenderer>();
    const skinMeshArr = new Array<SkinMesh>();
    this.savedMaterials.set(sessionId, skinMeshArr);
    mesh.forEach((item: SkinnedMeshRenderer, idx: number) => {
      const skinMesh = new SkinMesh();
      skinMesh.materials = item.materials;
      skinMeshArr.push(skinMesh);
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

  private ResetMaterial(trans: Transform, sessionId: string) {
    const skinnedMeshs = trans.GetComponentsInChildren<SkinnedMeshRenderer>();
    skinnedMeshs.forEach((item: SkinnedMeshRenderer, idx: number) => {
      if (this.savedMaterials.get(sessionId)) {
        item.materials = this.savedMaterials.get(sessionId)[idx].materials;
      }
    });
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

    const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
    character.transform.position = spawnPoint.position;
    character.transform.rotation = spawnPoint.rotation;
    ClientStarter.instance.Teleport(spawnPoint);
  }

  *ShowJobText(jobState: number) {
    if (jobState == 2) {
      // Mafia
      this.jobTextImage.sprite = this.mafiaTextSprite;
    } else {
      // Citizen
      this.jobTextImage.sprite = this.citizenTextSprite;
    }
    this.jobTextImage.gameObject.SetActive(true);

    yield new WaitForSeconds(5);

    let t = 1;
    while (t >= 0) {
      t -= Time.deltaTime;
      let color = this.jobTextImage.color;
      color.a = t;
      this.jobTextImage.color = color;
      yield null;
    }
    this.jobTextImage.gameObject.SetActive(false);
    let color = this.jobTextImage.color;
    color.a = 1;
    this.jobTextImage.color = color;
  }

  GameStart() {
    console.log("게임 시작");
    this.isKilled = false;
    const localPlayer = this.state.mafiaPlayers.get_Item(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
    );
    this.StartCoroutine(this.ShowJobText(localPlayer.jobState));

    console.log(
      "직업 :  " +
        (localPlayer.jobState == 2 ? "Mafia" : "Citizen") +
        "    " +
        (localPlayer.InGamePlayerState == 2 ? "GHOST" : "ALIVE")
    );

    this._mafiaMissionList.Initialize(localPlayer.missionList);
    this.state.mafiaPlayers.ForEach((sessionId: string, player: Player) => {
      const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);

      this.ChangeLayersRecursively(zepetoPlayer.character.transform, "Live");
      if (zepetoPlayer.character.gameObject.GetComponent<PlayerId>()) {
        const playerId =
          zepetoPlayer.character.gameObject.GetComponent<PlayerId>();
        playerId.order = player.order;
        playerId.sessionId = sessionId;
        playerId.jobState = player.jobState;
        playerId.state = InGameInteractState.ALIVE;
      } else {
        const playerId =
          zepetoPlayer.character.gameObject.AddComponent<PlayerId>();
        playerId.order = player.order;
        playerId.sessionId = sessionId;
        playerId.jobState = player.jobState;
        playerId.state = InGameInteractState.ALIVE;
      }

      if (player.jobState == JobState.Mafia) {
        if (zepetoPlayer.character.gameObject.GetComponent<Mafia>()) {
          const mafia = zepetoPlayer.character.gameObject.GetComponent<Mafia>();
          mafia.Initialize(
            this.mafiaUI,
            zepetoPlayer.isLocalPlayer,
            player.jobState,
            zepetoPlayer.id
          );
        } else {
          const mafia = zepetoPlayer.character.gameObject.AddComponent<Mafia>();
          mafia.Initialize(
            this.mafiaUI,
            zepetoPlayer.isLocalPlayer,
            player.jobState,
            zepetoPlayer.id
          );
        }
      } else if (player.jobState == JobState.Citizen) {
        if (zepetoPlayer.character.gameObject.GetComponent<Citizen>()) {
          const citizen =
            zepetoPlayer.character.gameObject.GetComponent<Citizen>();

          citizen.Initialize(
            this.mafiaUI,
            zepetoPlayer.isLocalPlayer,
            player.jobState,
            zepetoPlayer.id
          );
        } else {
          const citizen =
            zepetoPlayer.character.gameObject.AddComponent<Citizen>();

          citizen.Initialize(
            this.mafiaUI,
            zepetoPlayer.isLocalPlayer,
            player.jobState,
            zepetoPlayer.id
          );
        }
      }
    });

    // 여기도 서버에서 보내고 각 클라이언트에서 직접 보내

    // 플레이어 직업 할당, 미션 할당, State 할당
    // player.player
    // player.gameState
    // 맵 내 랜덤 이동 - spawn point[]가 존재
    let randomIdx = Math.floor(Random.Range(0, this.spawnPoints.length));

    const spawnPoint = this.spawnPoints[randomIdx];
    const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
    character.transform.position = spawnPoint.position;
    character.transform.rotation = spawnPoint.rotation;

    ClientStarter.instance.Teleport(spawnPoint);

    ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask = ~(
      1 << LayerMask.NameToLayer("Ghost")
    );
  }

  public ChangeLayersRecursively(trans: Transform, name: string) {
    trans.gameObject.layer = LayerMask.NameToLayer(name);
    for (var i = 0; i < trans.childCount; i++) {
      this.ChangeLayersRecursively(trans.GetChild(i), name);
    }
  }

  private *Reset() {
    yield new WaitWhile(() => this.isKilled);
    console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
    console.log("리셋");
    this.state.mafiaPlayers.ForEach((sessionId: string, player: Player) => {
      const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
      character.transform.position = ClientStarter.instance.spawnPoint.position;
      character.transform.rotation = ClientStarter.instance.spawnPoint.rotation;
      ClientStarter.instance.Teleport(character.transform);
      this.ChangeLayersRecursively(character.transform, "Player");

      const mafia = character.gameObject.GetComponent<Mafia>();
      const citizen = character.gameObject.GetComponent<Citizen>();
      const playerId = character.gameObject.GetComponent<PlayerId>();
      playerId.order = -1;
      playerId.jobState = JobState.None;
      playerId.state = InGameInteractState.NONE;
      if (mafia) {
        mafia.SetEnable(false);
      }
      if (citizen) {
        citizen.SetEnable(false);
      }

      console.log(
        sessionId + "의 현재 상태: " + player.InGamePlayerState
          ? "GHOST"
          : "ALIVE"
      );
      if (player.InGamePlayerState == 2) {
        this.ResetMaterial(character.transform, sessionId);
      }
    });
    ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera.cullingMask = ~0;

    console.log("시체 개수: " + this.corpseArray.length);
    this.corpseArray.forEach((item) => {
      GameObject.Destroy(item);
    });
    this.corpseArray = new Array<GameObject>();

    this.savedMaterials.clear();
    console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
  }
}
