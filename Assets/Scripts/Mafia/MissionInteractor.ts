import { AnimationClip, Time, WaitUntil } from "UnityEngine";
import { UnityAction$1 } from "UnityEngine.Events";
import { Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import AnimationLinker from "../AnimationLinker";
import ClientStarter from "../ClientStarter";

export default class MissionInteractor extends ZepetoScriptBehaviour {
  public animationClip: AnimationClip;

  public animationSec: number;

  public isSuccess: boolean;

  public context: string;

  // @NonSerialized()
  public index: number;

  // @NonSerialized()
  public missionIndex: number;

  public slide: Image;
  public text: Text;

  public onComplete: UnityAction$1<MissionInteractor>;

  Initialize(
    slide: Image,
    text: Text,
    onComplete: UnityAction$1<MissionInteractor>
  ) {
    this.slide = slide;
    this.text = text;
    this.onComplete = onComplete;
    this.isSuccess = false;
  }

  Start() {
    this.isSuccess = false;
    if (this.animationSec == 0) {
      this.animationSec = 5;
    }
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReset", (message: any) => {
          this.Reset();
        });
    });

    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onKill", (message: any) => {
          if (
            message.killed == ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          ) {
            this.StopInteract();
          }
        });
    });
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReport", (message: any) => {
          this.StopInteract();
        });
    });
  }

  Reset() {
    this.StopInteract();

    this.slide = null;
    this.text = null;
    this.onComplete = null;
    this.isSuccess = false;
  }
  public Interact() {
    if (this.isSuccess) {
      console.log("잘못함잘못함잘못함잘못함잘못함잘못함잘못함잘못함");
      return;
    }
    console.log("인터랙트 시작");
    this.SetObjs(true);
    const player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
    if (!AnimationLinker.instance.GetIsGesturing(player.id)) {
      AnimationLinker.instance.PlayGesture(this.animationClip.name);
      this.StartCoroutine(this.Interacting());
    }
  }

  public StopInteract() {
    this.StopAllCoroutines();
    this.SetObjs(false);
    AnimationLinker.instance.StopGesture(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer
    );
  }

  *Interacting() {
    console.log("인터랙트 중");
    this.StartCoroutine(this.WaitForMove());

    console.log(this.animationSec);
    let t: number = 0;
    while (t <= this.animationSec) {
      t += Time.deltaTime;
      this.slide.fillAmount = t / this.animationSec;
      console.log(this.slide.fillAmount);
      yield null;
    }
    this.OnComplete();
  }

  private OnComplete() {
    console.log("성공");
    this.StopInteract();
    this.isSuccess = true;

    this.onComplete(this);
  }

  private SetObjs(isOn: boolean) {
    if (isOn) {
      // missionPanel.SetActive(true);
      this.slide.gameObject.SetActive(true);
      this.slide.fillAmount = 0;
    } else {
      this.slide.gameObject.SetActive(false);
      // missionPanel.SetActive(false);
    }
  }

  *WaitForMove() {
    yield new WaitUntil(() => {
      return (
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.tryMove ||
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.tryJump
      );
    });
    this.StopInteract();
  }
}
