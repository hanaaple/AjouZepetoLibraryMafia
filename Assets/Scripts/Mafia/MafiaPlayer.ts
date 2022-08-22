import {
  CapsuleCollider,
  GameObject,
  SphereCollider,
  Transform,
  Vector3,
} from "UnityEngine";
import { ZepetoCharacter, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import InteractUI from "./InteractUI";

export default class MafiaPlayer extends ZepetoScriptBehaviour {
  //   public jobState: JobState;
  protected interactUI: InteractUI;

  public sessionId: string;

  public isLocal: boolean;

  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean,
    sessionId: string
  ) {
    this.isLocal = isLocal;

    this.sessionId = sessionId;
    if (isLocal) {
      const collider =
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject.AddComponent<SphereCollider>();
      collider.isTrigger = true;
      collider.center = new Vector3(0, 0.6, 0);
      collider.radius = 2;

      this.interactUI = GameObject.Instantiate<GameObject>(
        uiPrefab,
        parentCanvas
      ).GetComponent<InteractUI>();

      this.interactUI.interactButton.gameObject.SetActive(false);
    }
  }
}
