import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { Room, RoomData } from "ZEPETO.Multiplay";
import {
  Player,
  State,
  Vector3 as Vector3Schema,
} from "ZEPETO.Multiplay.Schema";
import {
  CharacterJumpState,
  CharacterState,
  SpawnInfo,
  ZepetoPlayers,
} from "ZEPETO.Character.Controller";
import { ZepetoWorldMultiplay } from "ZEPETO.World";
import {
  AudioListener,
  GameObject,
  LayerMask,
  Quaternion,
  Time,
  Transform,
  Vector3,
} from "UnityEngine";
import WaitForSecondsCash from "./WaitForSecondsCash";

export default class ClientStarter extends ZepetoScriptBehaviour {
  public multiplay: ZepetoWorldMultiplay;

  @SerializeField()
  private spawnPoint: Transform;

  private room: Room;
  private static _instance: ClientStarter;

  public static get instance(): ClientStarter {
    return this._instance;
  }
  public GetRoom(): Room {
    return this.room;
  }

  Awake() {
    if (ClientStarter._instance) {
      GameObject.Destroy(this);
    } else {
      ClientStarter._instance = this;
      GameObject.DontDestroyOnLoad(this.gameObject);
    }
  }

  Start() {
    this.multiplay.RoomCreated += (room: Room) => {
      this.room = room;
    };

    this.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += this.OnStateChange;
    };
  }

  private *SendMessageLoop(tick: number) {
    const waitForSeconds = WaitForSecondsCash.instance.WaitForSeconds(tick);
    const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
    while (true) {
      yield waitForSeconds;

      if (this.room != null && this.room.IsConnected) {
        if (ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) {
          if (myPlayer.character.CurrentState != CharacterState.Idle) {
            this.SendTransform(myPlayer.character.transform);
          }
        }
      }
    }
  }

  private OnStateChange(state: State, isFirst: boolean) {
    if (isFirst) {
      state.players.ForEach((sessionId: string, player: Player) =>
        this.OnJoinPlayer(sessionId, player)
      );

      state.players.OnAdd += (player: Player, sessionId: string) =>
        this.OnJoinPlayer(sessionId, player);

      state.players.OnRemove += (player: Player, sessionId: string) =>
        this.OnLeavePlayer(sessionId, player);

      // On Add Local Player
      ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
        this.Debug(
          `[로컬 플레이어 생성] player ${ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id}`
        );

        this.StartCoroutine(this.SendMessageLoop(Time.deltaTime));

        const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
        myPlayer.character.gameObject.AddComponent<AudioListener>();
        myPlayer.character.OnChangedState.AddListener((next, cur) => {
          console.log("로컬 State 변경", cur, next);
          this.SendState(next);
        });
        myPlayer.character.gameObject.layer =
          LayerMask.NameToLayer("LocalPlayer");
        this.SendTransform(myPlayer.character.transform);
      });

      // On Add Player
      ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
        const isLocal = this.room.SessionId === sessionId;
        const player: Player = this.room.State.players.get_Item(sessionId);
        if (player == null || player == undefined) return;

        if (!isLocal) {
          this.Debug(`[온라인 플레이어 생성] player  ${sessionId}`);
          player.OnChange += (changeValues) =>
            this.OnUpdateMultiPlayer(sessionId, player);
        }
      });
    }
  }

  private OnJoinPlayer(sessionId: string, player: Player) {
    console.log(
      `[OnJoinPlayer] roomSession - ${this.room.SessionId}\nplayerSession - ${player.sessionId}\nsessionId - ${sessionId}`
    );
    const spawnInfo = new SpawnInfo();

    if (this.IsZeroPosition(player.transform.position)) {
      spawnInfo.position = this.spawnPoint.position;
      spawnInfo.rotation = this.spawnPoint.rotation;
    } else {
      const position = this.ParseVector3(player.transform.position);
      const rotation = this.ParseVector3(player.transform.rotation);
      spawnInfo.position = position;
      spawnInfo.rotation = Quaternion.Euler(rotation);
    }

    console.log(
      spawnInfo.position.x,
      spawnInfo.position.y,
      spawnInfo.position.z
    );

    const isLocal = this.room.SessionId === player.sessionId;
    ZepetoPlayers.instance.CreatePlayerWithUserId(
      sessionId,
      player.zepetoUserId,
      spawnInfo,
      isLocal
    );
  }

  private OnLeavePlayer(sessionId: string, player: Player) {
    console.log(`[OnRemove] players - sessionId : ${sessionId}`);
    ZepetoPlayers.instance.RemovePlayer(sessionId);
  }

  private OnUpdateMultiPlayer(sessionId: string, player: Player) {
    const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);

    const position = this.ParseVector3(player.transform.position);
    const rotation = Quaternion.Euler(
      this.ParseVector3(player.transform.rotation)
    );
    const moveDir = Vector3.op_Subtraction(
      position,
      zepetoPlayer.character.transform.position
    );
    const manhattenDir = new Vector3(moveDir.x, 0, moveDir.z);

    if (moveDir.magnitude > 5) {
      console.log("텔레포트");
      zepetoPlayer.character.Teleport(position, rotation);
    } else if (manhattenDir.magnitude < 0.05) {
      if (player.state === CharacterState.MoveTurn) return;
      zepetoPlayer.character.StopMoving();
    } else {
      zepetoPlayer.character.MoveToPosition(position);
    }

    if (player.state === CharacterState.Jump) {
      if (zepetoPlayer.character.CurrentState !== CharacterState.Jump) {
        zepetoPlayer.character.Jump();
      }

      if (player.subState === CharacterJumpState.JumpDouble) {
        zepetoPlayer.character.DoubleJump();
      }
    }
  }

  public SendTransform(transform: Transform) {
    const data = new RoomData();

    const pos = new RoomData();
    pos.Add("x", transform.localPosition.x);
    pos.Add("y", transform.localPosition.y);
    pos.Add("z", transform.localPosition.z);
    data.Add("position", pos.GetObject());

    const rot = new RoomData();
    rot.Add("x", transform.localEulerAngles.x);
    rot.Add("y", transform.localEulerAngles.y);
    rot.Add("z", transform.localEulerAngles.z);
    data.Add("rotation", rot.GetObject());
    this.room.Send("onChangedTransform", data.GetObject());
  }

  private SendState(state: CharacterState) {
    const data = new RoomData();
    data.Add("state", state);
    if (state === CharacterState.Jump) {
      data.Add(
        "subState",
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.MotionV2
          .CurrentJumpState
      );
    }
    this.room.Send("onChangedState", data.GetObject());
  }

  public Debug(obj: any) {
    const data = new RoomData();
    data.Add("sentence", obj);
    this.room.Send("DebugUpdate", data.GetObject());
  }

  private ParseVector3(vector3: Vector3Schema): Vector3 {
    return new Vector3(vector3.x, vector3.y, vector3.z);
  }

  private IsZeroPosition(pos: Vector3Schema) {
    return pos.x == null || pos.y == null || pos.z == null;
  }
}
