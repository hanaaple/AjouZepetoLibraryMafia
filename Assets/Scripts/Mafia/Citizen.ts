import { GameObject, Transform } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import ClientStarter from "../ClientStarter";
import { JobState, ButtonType } from "../Constants/Enum";
import MafiaPlayer from "./MafiaPlayer";
import InteractUI from "./InteractUI";
import MissionInteractor from "./MissionInteractor";

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

  Start() {
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
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
        });
    });
  }

  private Interact() {
    console.log("Interact");
    ClientStarter.instance.Debug("인터랙트");
    if (this.missionInteractor) {
      this.missionInteractor.Interact();
    } else {
      this.interactUI.ActiveButton(ButtonType.MISSION, false);
    }
  }
}
