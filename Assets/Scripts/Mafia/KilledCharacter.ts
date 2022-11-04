import { CapsuleCollider, SphereCollider, Vector3 } from "UnityEngine";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class KilledCharacter extends ZepetoScriptBehaviour {
  Initialize() {
    const collider = this.gameObject.AddComponent<CapsuleCollider>();
    collider.isTrigger = true;
    // collider.center = new Vector3(0, 0.6, 0);
    // collider.radius = 2;
  }
}
