import { GameObject, Transform, Vector3 } from "UnityEngine";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import { ButtonType, JobState } from "../Constants/Enum";
import MafiaPlayer from "./MafiaPlayer";
import PlayerId from "./PlayerId";

export default class Mafia extends MafiaPlayer {
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
  }
}
