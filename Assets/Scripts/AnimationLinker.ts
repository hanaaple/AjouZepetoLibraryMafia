import { AnimationClip, GameObject, Transform } from "UnityEngine";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { ZepetoPlayer, ZepetoPlayers } from "ZEPETO.Character.Controller";
import ClientStarter from "./ClientStarter";
import WaitForSecondsCash from "./WaitForSecondsCash";

export default class AnimationLinker extends ZepetoScriptBehaviour {
  public gestures: AnimationClip[]; // GestureName, AnimationClip

  private playingGesture: Map<string, AnimationClip>; // sessionId, playingGesture

  private static _instance: AnimationLinker;

  public static get instance(): AnimationLinker {
    return this._instance;
  }

  Awake() {
    GameObject.DontDestroyOnLoad(this.gameObject);
    this.playingGesture = new Map<string, AnimationClip>();
    AnimationLinker._instance = this;
  }

  //Local에서 제스처 실행하는 함수
  PlayGesture(targetClip: string, isInfinite: boolean = false) {
    //실행한 상태에서 다시 실행하는 경우에는 ???
    console.log("하이111111");
    const player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
    console.log("하이2222222");
    this.GestureHandler(player, targetClip, isInfinite);
    console.log("하이3333333");
    ClientStarter.instance.SendGesture(targetClip);
    console.log("하이4444444");
  }

  GestureHandler(
    player: ZepetoPlayer,
    targetClip: string,
    isInfinite: boolean = false
  ) {
    ClientStarter.instance.Debug(
      `제스처 실행 여부 - ${this.GetIsGesturing(player.id)}`
    );
    // if(this.GetIsGesturing(player.id)) return
    ClientStarter.instance.Debug(
      `${player.character.gameObject}가 제스처 실행 - ${targetClip}, ${
        isInfinite ? "무한" : "1회성"
      }`
    );

    const clip = this.GetPlayerGesture(targetClip);
    console.log(clip);
    if (clip == undefined || clip == null) {
      this.StopGesture(player);
      return;
    }
    this.SetisGesture(player.id, clip);
    // this.StopCoroutine(this.GestureStop(player.character, clip.length))
    // 쓰읍 실행 중인 플레이어만 멈추려면 StopAllCorutine 쓰면 안되는데
    // 다른데랑 겹친다 Client에서 isGesturing() 체크하는 부분 다시 생각하도록
    player.character.SetGesture(clip);
    this.StopAllCoroutines();
    if (!isInfinite) {
      this.StartCoroutine(this.GestureStopCoroutine(player, clip.length));
    }
  }
  *GestureStopCoroutine(player: ZepetoPlayer, clipTime: float) {
    yield WaitForSecondsCash.instance.WaitForSeconds(clipTime);
    this.StopGesture(player);
    ClientStarter.instance.SendGesture("");
  }

  StopGesture(player: ZepetoPlayer) {
    if (this.playingGesture.has(player.id)) {
      this.playingGesture.delete(player.id);
    }
    player.character.CancelGesture();
  }

  public OnRemovePlayer(sessionId: string) {
    if (this.playingGesture.has(sessionId))
      this.playingGesture.delete(sessionId);
    //아이템을 갖고 있을 경우 아이템 삭제
  }

  GetPlayerGesture(gestureName: string): AnimationClip {
    var clip: AnimationClip = this.gestures.find((item) => {
      return item.name == gestureName;
    });
    return clip;
  }

  public GetPlayingGesture(sessionId: string): AnimationClip {
    return this.playingGesture.get(sessionId);
  }

  GetIsGesturing(sessionId: string): bool {
    var isGesture: bool = this.playingGesture.has(sessionId);
    return isGesture;
  }
  SetisGesture(sessionId: string, gesture: AnimationClip) {
    if (this.playingGesture.has(sessionId)) {
      ClientStarter.instance.Debug("이미 갖고 있습니다.");
    }
    this.playingGesture.set(sessionId, gesture);
  }
}
