import {
  GameObject,
  LayerMask,
  Material,
  SkinnedMeshRenderer,
  Transform,
} from "UnityEngine";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
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
    isLocal: boolean,
    sessionId: string
  ) {
    super.Initialize(uiPrefab, parentCanvas, isLocal, sessionId);

    if (isLocal) {
      this.interactUI.interactButton.onClick.AddListener(() => {
        this.Interact();
      });
    }
  }
  public OnAttack(sessionId: string) {
    ClientStarter.instance.Debug("내가 공격받음");
    // const roomData = new RoomData();
    // roomData.Add("", "value");
    // ClientStarter.instance.GetRoom().Send("asd", roomData);
    // localPlayer.setShader - 자기 쉐이더 변경
    const player = ZepetoPlayers.instance.GetPlayer(sessionId);

    this.ChangeLayersRecursively(player.character.transform, "Ghost");
  }
  public ChangeLayersRecursively(trans: Transform, name: string) {
    trans.gameObject.layer = LayerMask.NameToLayer(name);
    for (var i = 0; i < trans.childCount; i++) {
      this.ChangeLayersRecursively(trans.GetChild(i), name);
    }
  }

  public AddMaterial(trans: Transform, material: Material) {
    const mesh = trans.GetComponentsInChildren<SkinnedMeshRenderer>();
    mesh.forEach((item: SkinnedMeshRenderer) => {
      item.materials.push(material);
    });
  }

  public OnDied(sessionId: string) {
    ZepetoPlayers.instance.GetPlayer(sessionId).character.gameObject.layer =
      LayerMask.NameToLayer("Ghost");
  }

  private Interact() {
    console.log("Interact");
    ClientStarter.instance.Debug("인터랙트");
  }
}
