import { Collider, GameObject, Transform } from "UnityEngine";
import ClientStarter from "../ClientStarter";
import Citizen from "./Citizen";
import MafiaPlayer from "./MafiaPlayer";

export default class Mafia extends MafiaPlayer {
  // 가장 가까운 플레이어를 잡아야되니까
  private citizenArray: MafiaPlayer[];

  Start() {
    this.citizenArray = new Array<MafiaPlayer>();
  }
  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean
  ) {
    super.Initialize(uiPrefab, parentCanvas, isLocal);

    if (isLocal) {
      this.interactUI.interactButton.onClick.AddListener(() => {
        this.Attack();
      });
    }
  }
  public Attack() {
    console.log("공격!");
    ClientStarter.instance.Debug("공격!");
    // const roomData = new RoomData();
    // roomData.Add("", "value");
    // ClientStarter.instance.GetRoom().Send("asd", roomData);

    // 서버에서는 broadcast
    // 그리고 OnAttacked 실행
  }

  OnTriggerEnter(other: Collider) {
    if (!this.isLocal) return;
    if (other.GetComponent<Citizen>()) {
      const player = other.GetComponent<Citizen>();
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // this.citizenArray.forEach((t: MafiaPlayer) => {
      //   console.log(t);
      // });
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      const hasplayer = this.citizenArray.find((item) => {
        return item == player;
      });
      if (!hasplayer) {
        this.citizenArray.push(player);
      }

      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // this.citizenArray.forEach((t: MafiaPlayer) => {
      //   console.log(t);
      // });
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // if (this.citizenArray.length > 0) {
      //   this.interactUI.interactButton.gameObject.SetActive(true);
      // }
    }
  }

  OnTriggerExit(other: Collider) {
    if (!this.isLocal) return;
    if (other.GetComponent<Citizen>()) {
      const player = other.GetComponent<Citizen>();
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // this.citizenArray.forEach((t: MafiaPlayer) => {
      //   console.log(t);
      // });
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // const hasplayer = this.citizenArray.find((item) => {
      //   return item == player;
      // });
      this.citizenArray = this.citizenArray.filter((item) => item != player);

      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      // this.citizenArray.forEach((t: MafiaPlayer) => {
      // console.log(t);
      // });
      // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");

      if (this.citizenArray.length == 0) {
        this.interactUI.interactButton.gameObject.SetActive(false);
      }
    }
  }
}
