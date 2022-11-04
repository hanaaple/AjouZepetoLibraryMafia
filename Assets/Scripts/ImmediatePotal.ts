import {
  AudioClip,
  AudioSource,
  Collider,
  GameObject,
  Transform,
} from "UnityEngine";
import { ZepetoCharacter, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { JobState } from "./Constants/Enum";
import PlayerId from "./Mafia/PlayerId";

export default class ImmediatePotal extends ZepetoScriptBehaviour {
  @SerializeField()
  private connectedPotal: GameObject;
  private _connectedPotal: ImmediatePotal;

  @SerializeField()
  private audioManger: AudioSource;
  @SerializeField()
  private audioClip: AudioClip;

  public loadPos: Transform;
  Start() {
    this._connectedPotal = this.connectedPotal.GetComponent<ImmediatePotal>();
  }

  OnTriggerEnter(col: Collider) {
    const playerId = col.GetComponent<PlayerId>();
    if (playerId && playerId.jobState != JobState.None) {
      if (this.audioManger != null && this.audioClip != null) {
        this.audioManger.PlayOneShot(this.audioClip);
      }
      playerId
        .GetComponent<ZepetoCharacter>()
        .Teleport(
          this._connectedPotal.loadPos.position,
          this._connectedPotal.loadPos.rotation
        );
    }
  }
}
