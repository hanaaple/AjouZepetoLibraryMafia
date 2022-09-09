import {
  Collider,
  GameObject,
  LayerMask,
  Material,
  SkinnedMeshRenderer,
  Sprite,
  Transform,
  Vector3,
} from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import InteractUI from "./InteractUI";
import MafiaPlayer from "./MafiaPlayer";
import PlayerId from "./PlayerId";

export default class Citizen extends MafiaPlayer {
  // 가장 가까운 플레이어를 잡아야되니까

  // private interactUI: InteractUI;

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
        this.Interact();
        if (this.interactState == InGameInteractState.MISSION) {
          this.Interact();
        } else if (this.interactState == InGameInteractState.CORPSE) {
          this.Report();
        }
      });
    }
  }

  private Interact() {
    console.log("Interact");
    ClientStarter.instance.Debug("인터랙트");
  }
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
    } else if (nearPlayer.state == InGameInteractState.MISSION) {
      this.interactUI.interactButton.image.sprite = this.missionButton;
    }
  }
}
