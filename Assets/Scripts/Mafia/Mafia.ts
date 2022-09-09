import { GameObject, Sprite, Transform, Vector3 } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import MafiaPlayer from "./MafiaPlayer";
import PlayerId from "./PlayerId";

export default class Mafia extends MafiaPlayer {
  Start() {
    super.Start();
  }
  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean,
    jobState: JobState,
    sessionId: string,
    killButton: Sprite,
    reportButton: Sprite,
    workButton: Sprite
  ) {
    super.Initialize(
      uiPrefab,
      parentCanvas,
      isLocal,
      jobState,
      sessionId,
      killButton,
      reportButton,
      workButton
    );

    if (isLocal) {
      this.interactUI.interactButton.onClick.AddListener(() => {
        if (this.interactState == InGameInteractState.ALIVE) {
          this.Attack();
        } else if (this.interactState == InGameInteractState.CORPSE) {
          this.Report();
        }
      });
    }
  }

  public Attack() {
    console.log("공격!");
    ClientStarter.instance.Debug("공격!");
    const position = this.transform.position;
    const nearPlayer = this.citizenArray.reduce(
      (prev: PlayerId, cur: PlayerId) =>
        Vector3.Distance(position, prev.transform.position) >
        Vector3.Distance(position, cur.transform.position)
          ? cur
          : prev
    );
    console.log(ZepetoPlayers.instance.GetPlayer(nearPlayer.sessionId));
    const roomData = new RoomData();
    roomData.Add("killed", nearPlayer.sessionId);
    roomData.Add("mafia", this.sessionId);
    ClientStarter.instance.GetRoom().Send("onKill", roomData.GetObject());

    this.citizenArray = this.citizenArray.filter((item) => item != nearPlayer);
    if (this.citizenArray.length == 0) {
      this.interactUI.interactButton.gameObject.SetActive(false);
    }
  }
  // 도중에 다른 마피아가 죽이면 array 줄여야됨
  Update() {
    if (this.citizenArray.length == 0) {
      return;
    }
    const position = this.transform.position;
    const nearPlayer = this.citizenArray.reduce(
      (prev: PlayerId, cur: PlayerId) =>
        Vector3.Distance(position, prev.transform.position) >
        Vector3.Distance(position, cur.transform.position)
          ? cur
          : prev
    );

    this.interactState = nearPlayer.state;
    if (nearPlayer.state == InGameInteractState.CORPSE) {
      this.interactUI.interactButton.image.sprite = this.reportButton;
    } else if (nearPlayer.state == InGameInteractState.ALIVE) {
      this.interactUI.interactButton.image.sprite = this.killButton;
    }
  }
}
