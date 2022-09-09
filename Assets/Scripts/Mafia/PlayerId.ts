import { GameObject } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { InGameInteractState } from "../Constants/Enum";

export default class PlayerId extends ZepetoScriptBehaviour {
  public sessionId: string;

  public order: number;

  public state: InGameInteractState;

  public reportButton: Button;

  public reporterUi: GameObject;
}
