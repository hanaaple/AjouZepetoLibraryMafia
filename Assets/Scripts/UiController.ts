import {
  GameObject,
  Rect,
  RectTransform,
  Screen,
  Vector2,
  YieldInstruction,
} from "UnityEngine";
import { Button, Text } from "UnityEngine.UI";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { WorldMultiplayChatContent } from "ZEPETO.World";
import WaitForSecondsCash from "./WaitForSecondsCash";

export default class UiController extends ZepetoScriptBehaviour {
  @SerializeField()
  private safeAreaObjects: GameObject[];

  @Header("Toast Message")
  // public toastMessagePrefab : GameObject
  private waitForSecond: YieldInstruction;

  @Header("Quick Panel")
  public quickDefaultPanel: GameObject;
  public quickModePanel: GameObject;

  @Header("Quick Mode")
  public quickModeButton: Button;
  public quickExitButton: Button;
  public quickContentButtons: Button[];

  // TOAST_MESSAGE = {
  //   UPLOADING: "Uploading...",
  //   COMPLETE: "Done",
  //   FAILED: "Failed",
  //   SAVED: "Saved!",
  // };

  AddVector2(t1: Vector2, t2: Vector2): Vector2 {
    return new Vector2(t1.x + t2.x, t1.y + t2.y);
  }

  Start() {
    this.waitForSecond = WaitForSecondsCash.instance.WaitForSeconds(1);

    // SafeArea 설정
    let safeArea: Rect = Screen.safeArea;
    let newAnchorMin = safeArea.position;
    let newAnchorMax = this.AddVector2(safeArea.position, safeArea.size);
    newAnchorMin.x /= Screen.width;
    newAnchorMax.x /= Screen.width;
    newAnchorMin.y /= Screen.height;
    newAnchorMax.y /= Screen.height;

    this.safeAreaObjects.map((item) => {
      const rect = item.GetComponent<RectTransform>();
      rect.anchorMin = newAnchorMin;
      rect.anchorMax = newAnchorMax;
    });

    this.quickModeButton.onClick.AddListener(() => {
      this.quickDefaultPanel.SetActive(false);
      this.quickModePanel.SetActive(true);
    });

    this.quickExitButton.onClick.AddListener(() => {
      this.quickDefaultPanel.SetActive(true);
      this.quickModePanel.SetActive(false);
    });
    for (var index = 0; index < this.quickContentButtons.length; index++) {
      const idx = index;

      // ClientStarter.instance.Debug(quickMessages)
      // this.quickMessages[index] = this.quickContentButtons[index].transform.GetComponentInChildren<Text>().text
      this.quickContentButtons[idx].onClick.AddListener(() => {
        var quickMessages =
          this.quickContentButtons[idx].transform.GetComponentInChildren<Text>()
            .text;
        WorldMultiplayChatContent.instance.Send(quickMessages);
      });
    }
  }

  *ShowToastMessage(text: string) {
    // let toastMessage: GameObject = null;
    // if (text == this.TOAST_MESSAGE.feedFailed)
    //     toastMessage = GameObject.Instantiate<GameObject>(this.toastErrorMessage);
    // else
    //     toastMessage = GameObject.Instantiate<GameObject>(this.toastSuccessMessage);
    // toastMessage.transform.SetParent(this.screenShotResultPanel.transform);
    // toastMessage.GetComponentInChildren<Text>().text = text;
    // GameObject.Destroy(toastMessage, 1);
  }
}
