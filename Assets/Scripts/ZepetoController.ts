import { Canvas, RenderMode, Vector2 } from "UnityEngine";
import { CanvasScaler } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class ZepetoController extends ZepetoScriptBehaviour {
  Start() {
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      this.gameObject.GetComponentInChildren<Canvas>().renderMode =
        RenderMode.ScreenSpaceCamera;
      this.gameObject.GetComponentInChildren<Canvas>().worldCamera =
        ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera;
      this.gameObject.GetComponentInChildren<Canvas>().planeDistance = 0.05;
      this.gameObject.GetComponentInChildren<CanvasScaler>().referenceResolution =
        new Vector2(1280, 720);
    });
  }
}
