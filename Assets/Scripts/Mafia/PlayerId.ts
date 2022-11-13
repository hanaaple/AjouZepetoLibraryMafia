import { GameObject } from "UnityEngine";
import { Button, Image } from "UnityEngine.UI";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { InGameInteractState, JobState } from "../Constants/Enum";

export default class PlayerId extends ZepetoScriptBehaviour {
  public sessionId: string;

  public order: number;

  public jobState: JobState;

  public state: InGameInteractState;

  public readyImage: Image;

  public voteButton: Button;

  public reporterUi: GameObject;

  public votedCheckUI: GameObject;

  public voteTargetUI: GameObject[];

  public Init(sessionId: string) {
    this.order = -1;
    this.sessionId = sessionId;
    this.jobState = JobState.None;
    this.state = InGameInteractState.NONE;
  }
}
