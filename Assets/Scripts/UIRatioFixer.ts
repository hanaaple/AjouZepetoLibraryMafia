import { Application, Camera, Color, GL, Rect, Screen } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class UIRatioFixer extends ZepetoScriptBehaviour {
  Start() {
    Camera.onPreCull = () => {
      GL.Clear(true, true, Color.black);
    };
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      this.SetLetterBox(
        ZepetoPlayers.instance.LocalPlayer.zepetoCamera.camera
      );      
    });
  }

  SetLetterBox(camera: Camera) {
    var rect: Rect = camera.rect;
    console.log(Screen.width);
    console.log(Screen.height);
    console.log(Screen.width / Screen.height, 16.0 / 9.0);
    var scaleheight = Screen.width / Screen.height / (16.0 / 9.0); // (가로 / 세로)
    var scalewidth = 1.0 / scaleheight;
    if (scaleheight < 1) {
      rect.height = scaleheight;
      rect.y = (1.0 - scaleheight) / 2.0;
    } else {
      rect.width = scalewidth;
      rect.x = (1.0 - scalewidth) / 2.0;
    }
    console.log(rect.x);
    console.log(rect.y);
    camera.rect = rect;
  }
}
