import {
  Collider,
  GameObject,
  SphereCollider,
  Sprite,
  Transform,
  Vector3,
} from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import InteractUI from "./InteractUI";
import PlayerId from "./PlayerId";

export default class MafiaPlayer extends ZepetoScriptBehaviour {
  protected interactUI: InteractUI;

  public sessionId: string;

  public playerJobState: JobState;

  protected interactState: InGameInteractState;

  public isLocal: boolean;

  protected killButton: Sprite;
  protected reportButton: Sprite;
  protected missionButton: Sprite;

  protected citizenArray: PlayerId[];

  protected defaultButton: Sprite;

  Start() {
    this.citizenArray = new Array<PlayerId>();
  }
  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean,
    jobState: JobState,
    sessionId: string,
    killButton: Sprite,
    reportButton: Sprite,
    missionButton: Sprite
  ) {
    this.isLocal = isLocal;
    this.playerJobState = jobState;
    this.sessionId = sessionId;
    if (isLocal) {
      this.killButton = killButton;
      this.reportButton = reportButton;
      this.missionButton = missionButton;

      if (jobState == JobState.Citizen) {
        this.defaultButton = missionButton;
      } else if (jobState == JobState.Mafia) {
        this.defaultButton = killButton;
      }
      const collider =
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject.AddComponent<SphereCollider>();
      collider.isTrigger = true;
      collider.center = new Vector3(0, 0.6, 0);
      collider.radius = 2;

      this.interactUI = GameObject.Instantiate<GameObject>(
        uiPrefab,
        parentCanvas
      ).GetComponent<InteractUI>();

      this.interactUI.interactButton.gameObject.SetActive(false);

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onKill", (message: any) => {
          const mafia = ZepetoPlayers.instance.GetPlayer(message.mafia);
          const killed = ZepetoPlayers.instance.GetPlayer(message.killed);

          this.citizenArray = this.citizenArray.filter(
            (item) => item != killed.character.GetComponent<PlayerId>()
          );
          if (this.citizenArray.length == 0) {
            this.interactUI.interactButton.gameObject.SetActive(false);
          }
        });
    }
  }

  public Report() {
    console.log("신고!");
    ClientStarter.instance.Debug("신고!");
    const position = this.transform.position;

    const nearCorpse = this.citizenArray.filter(
      (item) => item.state == InGameInteractState.CORPSE
    );

    const nearPlayer = nearCorpse.reduce((prev: PlayerId, cur: PlayerId) =>
      Vector3.Distance(position, prev.transform.position) >
      Vector3.Distance(position, cur.transform.position)
        ? cur
        : prev
    );
    const roomData = new RoomData();
    roomData.Add("reporter", this.sessionId);
    roomData.Add("corpse", nearPlayer.sessionId);
    ClientStarter.instance.GetRoom().Send("onReport", roomData.GetObject());
    this.interactUI.interactButton.gameObject.SetActive(false);
  }
  OnTriggerEnter(other: Collider) {
    console.log(other);
    const player: PlayerId = other.GetComponent<PlayerId>();
    console.log(player);
    if (!this.isLocal || player.sessionId == this.sessionId) return;

    if (player) {
      if (player.state == InGameInteractState.ALIVE) {
        const hasplayer = this.citizenArray.find((item) => {
          return item == player;
        });
        if (!hasplayer) {
          this.citizenArray.push(player);
          if (this.playerJobState == JobState.Mafia) {
            this.interactUI.interactButton.gameObject.SetActive(true);
          }
        }
      } else if (player.state == InGameInteractState.CORPSE) {
        const hasplayer = this.citizenArray.find((item) => {
          return item == player;
        });
        if (!hasplayer) {
          this.citizenArray.push(player);
          this.interactUI.interactButton.gameObject.SetActive(true);
        }
      }
    } else {
    }
  }

  OnTriggerExit(other: Collider) {
    if (!this.isLocal) return;
    const player = other.GetComponent<PlayerId>();
    if (player) {
      this.citizenArray = this.citizenArray.filter((item) => item != player);
      if (this.citizenArray.length == 0) {
        this.interactUI.interactButton.gameObject.SetActive(false);
      }
    }
  }
}
