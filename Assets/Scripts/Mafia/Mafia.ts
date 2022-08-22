import { Collider, GameObject, Transform, Vector3 } from "UnityEngine";
import {
  ZepetoCharacter,
  ZepetoPlayer,
  ZepetoPlayers,
} from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import ClientStarter from "../ClientStarter";
import Citizen from "./Citizen";
import MafiaPlayer from "./MafiaPlayer";
import PlayerId from "./PlayerId";

export default class Mafia extends MafiaPlayer {
  // 가장 가까운 플레이어를 잡아야되니까
  private citizenArray: PlayerId[];

  Start() {
    this.citizenArray = new Array<PlayerId>();
  }
  public Initialize(
    uiPrefab: GameObject,
    parentCanvas: Transform,
    isLocal: boolean,
    sessionId: string
  ) {
    super.Initialize(uiPrefab, parentCanvas, isLocal, sessionId);

    if (isLocal) {
      this.interactUI.interactButton.onClick.AddListener(() => {
        this.Attack();
      });
    }
  }
  public Attack() {
    console.log("공격!");
    ClientStarter.instance.Debug("공격!");
    const position = this.transform.position;
    const nearPlayer = this.citizenArray.reduce(
      (prev: PlayerId, cur: PlayerId) =>
        Vector3.Distance(position, prev.transform.position) >
        Vector3.Distance(position, cur.transform.position)
          ? cur
          : prev
    );
    console.log(ZepetoPlayers.instance.GetPlayer(nearPlayer.sessionId));
    const roomData = new RoomData();
    roomData.Add("killed", nearPlayer.sessionId);
    roomData.Add("mafia", this.sessionId);
    ClientStarter.instance.GetRoom().Send("onKill", roomData.GetObject());

    this.citizenArray = this.citizenArray.filter((item) => item != nearPlayer);
    if (this.citizenArray.length == 0) {
      this.interactUI.interactButton.gameObject.SetActive(false);
    }
  }

  OnTriggerEnter(other: Collider) {
    if (!this.isLocal) return;

    const player: PlayerId = other.GetComponent<PlayerId>();
    if (player && player.sessionId != this.sessionId && !player.isDead) {
      const hasplayer = this.citizenArray.find((item) => {
        return item == player;
      });
      if (!hasplayer && player.sessionId != this.sessionId) {
        this.citizenArray.push(player);
        this.interactUI.interactButton.gameObject.SetActive(true);
      }
    }
  }

  OnTriggerExit(other: Collider) {
    if (!this.isLocal) return;
    const player = other.GetComponent<PlayerId>();
    if (player) {
      this.citizenArray = this.citizenArray.filter((item) => item != player);
      if (this.citizenArray.length == 0) {
        this.interactUI.interactButton.gameObject.SetActive(false);
      }
    }
  }
}
