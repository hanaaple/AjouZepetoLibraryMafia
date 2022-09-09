import { Camera, GameObject, Transform, Vector3 } from "UnityEngine";
import { Button } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import PlayerId from "./PlayerId";

export default class VoteManager extends ZepetoScriptBehaviour {
  private isVoting: boolean = false;

  @SerializeField()
  private votePoints: Transform[];

  @SerializeField()
  private canvasRoot: Transform;

  @SerializeField()
  private reportButtonPrefab: GameObject;

  @SerializeField()
  private reporterUiPrefab: GameObject;

  private reporterProps: PlayerId;
  private walkSpeed: number;
  private runSpeed: number;

  private playerIdArray: PlayerId[];

  Start() {
    this.playerIdArray = new Array<PlayerId>();
  }
  PushPlayer(playerId: PlayerId) {
    this.playerIdArray.push(playerId);
  }

  StartVote(reporterId: string, corpseId: string) {
    this.isVoting = true;
    const reporter = ZepetoPlayers.instance.GetPlayer(reporterId);
    // const corpse = ZepetoPlayers.instance.GetPlayer(corpseId);

    this.playerIdArray.forEach((item) => {
      const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(item.sessionId);
      const voteTransform = this.votePoints[item.order];
      zepetoPlayer.character.Teleport(
        voteTransform.position,
        voteTransform.rotation
      );

      // if (!zepetoPlayer.isLocalPlayer) {
      // const playerId = corpse.character.GetComponent<PlayerId>();
      const reportButton = GameObject.Instantiate<GameObject>(
        this.reportButtonPrefab,
        this.canvasRoot
      );
      item.reportButton = reportButton.GetComponent<Button>();
      item.reportButton.onClick.AddListener(() => {
        this.playerIdArray.forEach((item) => {
          if (item.reportButton) {
            GameObject.Destroy(item.reportButton.gameObject);
          }
        });

        const data = new RoomData();
        data.Add("targetPlayerId", item.sessionId);
        ClientStarter.instance.GetRoom().Send("onVote", data.GetObject());
      });
      // }
    });

    // if (!reporter.isLocalPlayer) {
    this.reporterProps = reporter.character.GetComponent<PlayerId>();
    this.reporterProps.reporterUi = GameObject.Instantiate<GameObject>(
      this.reporterUiPrefab,
      this.canvasRoot
    );
    // }
    this.SetMove(false);
    // 사람들 머리 위에 ui
    // ui를 누르면 투표
    // 자기 투표는 옆에 버튼
    // 안누르면 기권
  }

  private SetMove(isMovable: bool) {
    if (isMovable) {
      ZepetoPlayers.instance.characterData.walkSpeed = this.walkSpeed;
      ZepetoPlayers.instance.characterData.runSpeed = this.runSpeed;
    } else {
      this.walkSpeed = ZepetoPlayers.instance.characterData.walkSpeed;
      this.runSpeed = ZepetoPlayers.instance.characterData.runSpeed;
      ZepetoPlayers.instance.characterData.walkSpeed = 0;
      ZepetoPlayers.instance.characterData.runSpeed = 0;
    }
  }

  // message에 의한 투표 시 실행
  OnVote(playerId: PlayerId) {}

  EndVote() {
    console.log("투표 끝");
    this.isVoting = false;
    this.SetMove(true);
    this.playerIdArray.forEach((item) => {
      if (item.reportButton) {
        GameObject.Destroy(item.reportButton.gameObject);
      }
    });
    if (this.reporterProps) {
      GameObject.Destroy(this.reporterProps.reporterUi);
      this.reporterProps = null;
    }
    this.playerIdArray = new Array<PlayerId>();
  }

  Update() {
    if (!this.isVoting) {
      return;
    }
    this.playerIdArray.forEach((item) => {
      item.reportButton.transform.position =
        ZepetoPlayers.instance.ZepetoCamera.camera.WorldToScreenPoint(
          Vector3.op_Addition(item.transform.position, new Vector3(0, 2, 0))
        );
    });
    this.reporterProps.reporterUi.transform.position =
      ZepetoPlayers.instance.ZepetoCamera.camera.WorldToScreenPoint(
        Vector3.op_Addition(
          this.reporterProps.transform.position,
          new Vector3(0, 4, 0)
        )
      );
  }
}
