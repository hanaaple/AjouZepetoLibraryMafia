import { Coroutine, GameObject, Time, Transform, Vector3 } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import { ButtonType, JobState } from "../Constants/Enum";
import MafiaPlayer from "./MafiaPlayer";
import PlayerId from "./PlayerId";

export default class Mafia extends MafiaPlayer {
  private attackDelay: Coroutine;
  public Initialize(
    mafiaUI: GameObject,
    isLocal: boolean,
    jobState: JobState,
    sessionId: string
  ) {
    super.Initialize(mafiaUI, isLocal, jobState, sessionId);

    if (isLocal) {
      this.interactUI.reportButton.onClick.AddListener(() => {
        this.Report();
      });

      this.interactUI.killButton.onClick.AddListener(() => {
        this.Attack();
      });

      this.interactUI.missionButton.onClick.AddListener(() => {
        this.Interact();
      });
    }
  }
  Start() {
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("GameStart", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
          ) {
            return;
          }
          if (this.attackDelay) {
            this.interactUI.killButton.image.fillAmount = 1;
            this.interactUI.killButton.interactable = true;
            this.StopCoroutine(this.attackDelay);
            this.attackDelay = null;
          }
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReport", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
          ) {
            return;
          }
          if (this.attackDelay) {
            this.interactUI.killButton.image.fillAmount = 1;
            if (this.alivePlayer) {
              this.interactUI.killButton.interactable = true;
            } else {
              this.interactUI.killButton.interactable = false;
            }
            this.StopCoroutine(this.attackDelay);
            this.attackDelay = null;
          }
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReset", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
          ) {
            return;
          }
          if (this.attackDelay) {
            this.interactUI.killButton.image.fillAmount = 1;
            if (this.alivePlayer) {
              this.interactUI.killButton.interactable = true;
            } else {
              this.interactUI.killButton.interactable = false;
            }
            this.StopCoroutine(this.attackDelay);
            this.attackDelay = null;
          }
        });
    });
  }

  private Interact() {
    console.log("Interact");
    this.missionInteractor.Interact();
  }

  public Attack() {
    console.log("공격!");
    if (this.alivePlayer) {
      console.log("범위 내 플레이어: " + this.alivePlayer.length);
    }
    const position = this.transform.position;
    const nearPlayer = this.alivePlayer.reduce(
      (prev: PlayerId, cur: PlayerId) =>
        Vector3.Distance(position, prev.transform.position) >
        Vector3.Distance(position, cur.transform.position)
          ? cur
          : prev
    );
    const roomData = new RoomData();
    roomData.Add("killed", nearPlayer.sessionId);
    roomData.Add("mafia", this.sessionId);
    ClientStarter.instance.GetRoom().Send("onKill", roomData.GetObject());

    this.alivePlayer = this.alivePlayer.filter((item) => item != nearPlayer);
    if (this.alivePlayer.length == 0) {
      this.interactUI.ActiveButton(ButtonType.KILL, false);
    }

    this.interactUI.killButton.interactable = false;
    this.attackDelay = this.StartCoroutine(this.AttackDelay());
  }

  *AttackDelay() {
    this.interactUI.killButton.image.fillAmount = 0;
    let t = 0;
    while (t <= 30) {
      t += Time.deltaTime;
      this.interactUI.killButton.image.fillAmount = t / 30;
      yield null;
    }
    this.interactUI.killButton.image.fillAmount = 1;
    this.interactUI.killButton.interactable = true;

    this.attackDelay = null;
  }
}
