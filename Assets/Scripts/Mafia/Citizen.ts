import { GameObject, Transform } from "UnityEngine";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import InteractUI from "./InteractUI";
import MafiaPlayer from "./MafiaPlayer";

export default class Citizen extends MafiaPlayer {
  // 가장 가까운 플레이어를 잡아야되니까
  private citizenArray: MafiaPlayer[];

  // private interactUI: InteractUI;

  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean
  ) {
    super.Initialize(uiPrefab, parentCanvas, isLocal);

    if (isLocal) {
      this.interactUI.interactButton.onClick.AddListener(() => {
        this.Interact();
      });
    }
  }
  public OnAttack() {
    ClientStarter.instance.Debug("내가 공격받음");
    // const roomData = new RoomData();
    // roomData.Add("", "value");
    // ClientStarter.instance.GetRoom().Send("asd", roomData);
    // localPlayer.setShader - 자기 쉐이더 변경
    // localPlayer.setLayer - 못보도록, 대화 못하도록 - 이게 제일 크네;;
  }

  private Interact() {
    console.log("Interact");
    ClientStarter.instance.Debug("인터랙트");
  }
}
