import { AnimationClip, Time, WaitUntil } from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import AnimationLinker from "../AnimationLinker";
import MafiaMissionList from "./MafiaMissionList";

export default class MissionInteractor extends ZepetoScriptBehaviour {
  public animationClip: AnimationClip;

  public animationSec: number;

  public isSuccess: boolean;

  public context: string;

  @NonSerialized()
  public index: number;

  @NonSerialized()
  public missionIndex: number;

  Start() {
    this.isSuccess = false;
    if (this.animationSec == 0) {
      this.animationSec = 5;
    }
  }
  public Interact() {
    if (this.isSuccess) {
      console.log("잘못함잘못함잘못함잘못함잘못함잘못함잘못함잘못함");
    }
    console.log("인터랙트 시작");
    this.SetObjs(true);
    const player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
    if (!AnimationLinker.instance.GetIsGesturing(player.id)) {
      AnimationLinker.instance.PlayGesture(this.animationClip.name);
      this.StartCoroutine(this.WaitForMove());
    }

    this.StartCoroutine(this.Interacting());
  }

  *Interacting() {
    console.log("인터랙트 중");
    this.StartCoroutine(this.WaitForMove());

    const slide = MafiaMissionList.instance.slide;
    console.log(this.animationSec);
    let t: number = 0;
    while (t <= this.animationSec) {
      t += Time.deltaTime;
      slide.value = t / this.animationSec;
      console.log(slide.value);
      yield null;
    }
    this.OnComplete();
  }

  private OnComplete() {
    console.log("성공");
    this.SetObjs(false);
    this.StopAllCoroutines();
    this.isSuccess = true;

    AnimationLinker.instance.StopGesture(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer
    );

    MafiaMissionList.instance.Complete(this);
  }

  private SetObjs(isOn: boolean) {
    const slide = MafiaMissionList.instance.slide;

    if (isOn) {
      // missionPanel.SetActive(true);
      slide.gameObject.SetActive(true);
      slide.value = 0;
    } else {
      slide.gameObject.SetActive(false);
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
    AnimationLinker.instance.StopGesture(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer
    );

    this.SetObjs(false);
    this.StopAllCoroutines();
  }
}
