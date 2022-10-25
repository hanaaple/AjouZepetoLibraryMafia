import { GameObject, Transform } from "UnityEngine";
import ClientStarter from "../ClientStarter";
import { JobState } from "../Constants/Enum";
import MafiaPlayer from "./MafiaPlayer";

export default class Citizen extends MafiaPlayer {
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

      this.interactUI.missionButton.onClick.AddListener(() => {
        this.Interact();
      });
    }
  }

  private Interact() {
    console.log("Interact");
    ClientStarter.instance.Debug("인터랙트");
    this.missionInteractor.Interact();
  }
}
