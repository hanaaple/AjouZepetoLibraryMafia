import {
  AudioClip,
  AudioSource,
  Collider,
  GameObject,
  Transform,
} from "UnityEngine";
import { ZepetoCharacter, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

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
    const zepetoCharacter = col.GetComponent<ZepetoCharacter>();
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character ==
      zepetoCharacter
    ) {
      if (this.audioManger != null && this.audioClip != null) {
        this.audioManger.PlayOneShot(this.audioClip);
      }
      zepetoCharacter.Teleport(
        this._connectedPotal.loadPos.position,
        this._connectedPotal.loadPos.rotation
      );
    }
  }
}
