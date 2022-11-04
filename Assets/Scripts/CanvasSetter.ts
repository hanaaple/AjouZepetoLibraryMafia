import { Canvas, RenderMode } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class CanvasSetter extends ZepetoScriptBehaviour {
  Start() {
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      this.gameObject.GetComponentInChildren<Canvas>().renderMode =
        RenderMode.ScreenSpaceCamera;
      this.gameObject.GetComponentInChildren<Canvas>().worldCamera =
        ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;
      this.gameObject.GetComponentInChildren<Canvas>().planeDistance = 0.05;
    });
  }
}
