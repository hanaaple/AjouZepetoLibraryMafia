import { GameObject } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { ButtonType, JobState } from "../Constants/Enum";

export default class InteractUI extends ZepetoScriptBehaviour {
  public reportButton: Button;
  public missionButton: Button;
  public killButton: Button;
  public killButtonBackground: GameObject;

  public Init(jobState: JobState) {
    this.gameObject.SetActive(true);
    if (jobState == JobState.Mafia) {
      this.killButton.gameObject.SetActive(true);
      this.reportButton.gameObject.SetActive(true);
      this.missionButton.gameObject.SetActive(true);
      this.killButtonBackground.SetActive(true);
    } else if (jobState == JobState.Citizen) {
      this.killButton.gameObject.SetActive(false);
      this.reportButton.gameObject.SetActive(true);
      this.missionButton.gameObject.SetActive(true);
      this.killButtonBackground.SetActive(false);
    }

    this.ActiveButton(ButtonType.KILL, false);
    this.ActiveButton(ButtonType.REPORT, false);
    this.ActiveButton(ButtonType.MISSION, false);
  }
  public ActiveButton(type: ButtonType, isActive: boolean) {
    let button: Button;
    switch (type) {
      case ButtonType.MISSION: {
        button = this.missionButton;
        break;
      }
      case ButtonType.REPORT: {
        button = this.reportButton;
        break;
      }
      case ButtonType.KILL: {
        button = this.killButton;
        break;
      }
      default: {
        button = null;
        break;
      }
    }
    button.interactable = isActive;
  }
}
