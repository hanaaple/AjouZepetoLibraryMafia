import {
  Collider,
  GameObject,
  SphereCollider,
  Transform,
  Vector3,
} from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { ButtonType, InGameInteractState, JobState } from "../Constants/Enum";
import InteractUI from "./InteractUI";

import MissionInteractor from "./MissionInteractor";
import PlayerId from "./PlayerId";

export default class MafiaPlayer extends ZepetoScriptBehaviour {
  public interactUI: InteractUI;

  public sessionId: string;

  public jobState: JobState;

  protected interactState: InGameInteractState;

  public isLocal: boolean;

  protected alivePlayer: PlayerId[];
  protected corpsePlayer: PlayerId[];

  protected missionInteractor: MissionInteractor;

  private isEnable: boolean;

  public SetEnable(isEnable: boolean) {
    console.log("1");
    this.isEnable = isEnable;
    this.enabled = isEnable;
  }
  public Initialize(
    mafiaUI: GameObject,
    isLocal: boolean,
    jobState: JobState,
    sessionId: string
  ) {
    this.alivePlayer = new Array<PlayerId>();
    this.corpsePlayer = new Array<PlayerId>();
    this.enabled = true;
    this.isEnable = true;
    this.isLocal = isLocal;
    this.jobState = jobState;
    this.sessionId = sessionId;
    if (isLocal) {
      console.log("1");
      this.interactUI = mafiaUI.GetComponent<InteractUI>();

      console.log("2");
      this.interactUI.Init(jobState);

      console.log("3");
      this.interactUI.reportButton.onClick.RemoveAllListeners();
      this.interactUI.killButton.onClick.RemoveAllListeners();
      this.interactUI.missionButton.onClick.RemoveAllListeners();

      const collider =
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject.AddComponent<SphereCollider>();
      collider.isTrigger = true;
      collider.center = new Vector3(0, 0.6, 0);
      collider.radius = 2;

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onKill", (message: any) => {
          const mafia = ZepetoPlayers.instance.GetPlayer(message.mafia);
          const killed = ZepetoPlayers.instance.GetPlayer(message.killed);

          this.alivePlayer = this.alivePlayer.filter(
            (item) => item != killed.character.GetComponent<PlayerId>()
          );
          if (this.alivePlayer.length == 0) {
            this.interactUI.ActiveButton(ButtonType.KILL, false);
          }

          if (killed.isLocalPlayer) {
            this.alivePlayer = new Array<PlayerId>();
            this.corpsePlayer = new Array<PlayerId>();
          }
        });

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReset", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.players.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ) ||
            !ClientStarter.instance
              .GetRoom()
              .State.players.get_Item(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ).isMafiaPlayer
          ) {
            return;
          }

          this.alivePlayer = new Array<PlayerId>();
          this.corpsePlayer = new Array<PlayerId>();
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReport", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.players.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ) ||
            !ClientStarter.instance
              .GetRoom()
              .State.players.get_Item(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ).isMafiaPlayer
          ) {
            return;
          }

          this.alivePlayer = new Array<PlayerId>();
          this.corpsePlayer = new Array<PlayerId>();
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onStartNextDay", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.players.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ) ||
            !ClientStarter.instance
              .GetRoom()
              .State.players.get_Item(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              ).isMafiaPlayer
          ) {
            return;
          }

          this.alivePlayer = new Array<PlayerId>();
          this.corpsePlayer = new Array<PlayerId>();
        });
    }
  }

  ActiveInteractUi(buttonType: ButtonType, isActive: bool) {
    this.interactUI.ActiveButton(buttonType, isActive);
    if (!isActive && buttonType == ButtonType.MISSION) {
      this.missionInteractor = null;
    }
  }

  public Report() {
    console.log("신고!");
    const position = this.transform.position;

    const nearPlayer = this.corpsePlayer.reduce(
      (prev: PlayerId, cur: PlayerId) =>
        Vector3.Distance(position, prev.transform.position) >
        Vector3.Distance(position, cur.transform.position)
          ? cur
          : prev
    );
    const roomData = new RoomData();
    roomData.Add("reporter", this.sessionId);
    roomData.Add("corpse", nearPlayer.sessionId);
    ClientStarter.instance.GetRoom().Send("onReport", roomData.GetObject());
    this.interactUI.ActiveButton(ButtonType.REPORT, false);
  }
  OnTriggerEnter(other: Collider) {
    if (!this.isEnable || !this.isLocal) {
      return;
    }
    const player: PlayerId = other.GetComponent<PlayerId>();
    const missionInteractor = other.GetComponent<MissionInteractor>();
    this.missionInteractor = missionInteractor;

    if (
      missionInteractor &&
      missionInteractor.enabled &&
      !missionInteractor.isSuccess
    ) {
      this.interactUI.ActiveButton(ButtonType.MISSION, true);
    }

    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state != InGameInteractState.GHOST
    ) {
      if (player && player.sessionId != this.sessionId) {
        if (player.state == InGameInteractState.ALIVE) {
          const hasPlayer = this.alivePlayer.find((item) => {
            return item == player;
          });

          if (!hasPlayer) {
            console.log("플레이어 추가");
            this.alivePlayer.push(player);
            if (this.jobState == JobState.Mafia) {
              this.interactUI.ActiveButton(ButtonType.KILL, true);
            }
          }
        } else if (player.state == InGameInteractState.CORPSE) {
          const hasPlayer = this.corpsePlayer.find((item) => item == player);
          if (!hasPlayer) {
            this.corpsePlayer.push(player);
            this.interactUI.ActiveButton(ButtonType.REPORT, true);
          }
        }
      }
    }
  }

  OnTriggerExit(other: Collider) {
    if (!this.isEnable) return;
    if (!this.isLocal) return;
    const player = other.GetComponent<PlayerId>();
    const missionInteractor: MissionInteractor =
      other.GetComponent<MissionInteractor>();
    if (player) {
      this.alivePlayer = this.alivePlayer.filter((item) => item != player);
      if (this.alivePlayer.length == 0) {
        this.ActiveInteractUi(ButtonType.KILL, false);
      }
      this.corpsePlayer = this.corpsePlayer.filter((item) => item != player);
      if (this.corpsePlayer.length == 0) {
        this.ActiveInteractUi(ButtonType.REPORT, false);
      }
    }
    if (this.missionInteractor) {
      this.ActiveInteractUi(ButtonType.MISSION, false);
    }
  }
}
