import { GameObject, Sprite, Time, Transform, Vector3 } from "UnityEngine";
import { Button, Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import PlayerId from "./PlayerId";

export default class MafiaReadyUiController extends ZepetoScriptBehaviour {
  @SerializeField()
  private canvasRoot: Transform;

  @SerializeField()
  private readyPanel: GameObject;
  @SerializeField()
  private tempReadyPanel: GameObject;

  public attendButton: Button;

  public playerCountPanel: GameObject;
  public playerCountText: Text;

  public startCountPanel: GameObject;
  public startCountText: Text;

  public readySprite: Sprite;
  public readyCompleteSprite: Sprite;

  public readyImagePrefab: GameObject;
  public playerGettingReadySprite: Sprite;
  public playerReadySprite: Sprite;

  private playerIds: Map<string, PlayerId>;

  Start() {
    this.playerIds = new Map<string, PlayerId>();
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += this.OnStateChange;
    };
  }

  Update() {
    if (this.tempReadyPanel.activeSelf) {
      this.playerIds.forEach((item) => {
        if (!item || !item.readyImage) {
          return;
        }
        if (item.readyImage.gameObject.activeSelf) {
          item.readyImage.transform.position =
            ZepetoPlayers.instance.ZepetoCamera.camera.WorldToScreenPoint(
              Vector3.op_Addition(item.transform.position, new Vector3(0, 2, 0))
            );
        }
      });
    }
  }
  OnStateChange(state: State, isFirst: boolean) {
    if (!isFirst) return;

    ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId) => {
      const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
      if (character.gameObject.GetComponent<PlayerId>()) {
        const playerId = character.gameObject.GetComponent<PlayerId>();
        playerId.order = -1;
        playerId.sessionId = sessionId;
        playerId.jobState = JobState.None;
        playerId.state = InGameInteractState.NONE;

        playerId.readyImage = GameObject.Instantiate<GameObject>(
          this.readyImagePrefab,
          this.canvasRoot
        ).GetComponent<Image>();
        if (state.gameState == 1) {
          playerId.readyImage.gameObject.SetActive(true);
        } else {
          playerId.readyImage.gameObject.SetActive(false);
        }
      } else {
        const playerId = character.gameObject.AddComponent<PlayerId>();
        playerId.order = -1;
        playerId.sessionId = sessionId;
        playerId.jobState = JobState.None;
        playerId.state = InGameInteractState.NONE;
        playerId.readyImage = GameObject.Instantiate<GameObject>(
          this.readyImagePrefab,
          this.canvasRoot
        ).GetComponent<Image>();
        if (state.gameState == 1) {
          playerId.readyImage.gameObject.SetActive(true);
        } else {
          playerId.readyImage.gameObject.SetActive(false);
        }
      }
      const playerId = character.GetComponent<PlayerId>();
      this.playerIds.set(sessionId, playerId);
      console.log(sessionId + " 추가");
      this.playerIds.forEach((item) => {
        console.log(sessionId + "  " + item.sessionId + " " + item.readyImage);
      });
      if (state.mafiaPlayers.ContainsKey(sessionId)) {
        this.playerIds.forEach((item) => {
          console.log(
            sessionId + " " + item.sessionId + "  " + sessionId ==
              item.sessionId
          );
          if (item.sessionId == sessionId) {
            if (this.playerIds.get(item.sessionId)) {
              this.playerIds.get(item.sessionId).readyImage.sprite =
                this.playerReadySprite;
            }
          }
        });
      }
    });

    state.players.OnRemove += (player: Player, sessionId: string) => {
      GameObject.Destroy(this.playerIds.get(sessionId).readyImage.gameObject);
      this.playerIds.delete(sessionId);
    };

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("GameStartCount", (count: number) => {
        this.StartCoroutine(this.GameStartCount(count));
      });
    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler(
        "UpdateReadyMafiaPlayer",
        (readyPlayerCount: number) => {
          console.log("레디 플레이어 수 업데이트 " + readyPlayerCount);
          this.UpdatePlayerCount(readyPlayerCount);
        }
      );

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("OnAddReadyPlayer", (sessionId: string) => {
        console.log("id: " + sessionId + " " + this.playerIds.get(sessionId));
        this.playerIds.forEach((item) => {
          console.log(
            sessionId + " " + item.sessionId + "  " + sessionId ==
              item.sessionId
          );
          if (item.sessionId == sessionId) {
            if (this.playerIds.get(item.sessionId)) {
              this.playerIds.get(item.sessionId).readyImage.sprite =
                this.playerReadySprite;
            }
          }
        });
      });
    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("OnRemoveReadyPlayer", (sessionId: string) => {
        console.log("id: " + sessionId + " " + this.playerIds.get(sessionId));
        this.playerIds.forEach((item) => {
          console.log(
            sessionId + " " + item.sessionId + "  " + sessionId ==
              item.sessionId
          );
          if (item.sessionId == sessionId) {
            if (this.playerIds.get(item.sessionId)) {
              this.playerIds.get(item.sessionId).readyImage.sprite =
                this.playerGettingReadySprite;
            }
          }
        });
      });

    this.UpdatePlayerCount(
      ClientStarter.instance.GetRoom().State.readyPlayerCount
    );

    this.attendButton.onClick.AddListener(() => {
      if (this.attendButton.image.sprite == this.readySprite) {
        this.attendButton.image.sprite = this.readyCompleteSprite;
      } else {
        this.attendButton.image.sprite = this.readySprite;
      }
      ClientStarter.instance.GetRoom().Send("onReadyMafiaPlayer", "");
    });
  }

  public UpdatePlayerCount(playerCount: number) {
    this.playerCountText.text = playerCount.toString() + "명";
  }

  public *GameStartCount(startCount: number) {
    this.attendButton.gameObject.SetActive(false);
    this.attendButton.image.sprite = this.readySprite;
    this.playerCountText.text = "";
    this.startCountPanel.SetActive(true);
    this.playerCountPanel.SetActive(false);
    while (startCount > 0) {
      startCount -= Time.deltaTime;
      this.startCountText.text = startCount.toFixed(1).toString() + "초";
      yield null;
    }
    this.startCountPanel.SetActive(false);
    this.startCountText.text = "";
    this.attendButton.gameObject.SetActive(true);
    this.readyPanel.SetActive(false);
    this.tempReadyPanel.SetActive(false);
    this.playerIds.forEach((item) => {
      if (!item || !item.readyImage) {
        console.log("레디 버튼 없음 이상함 오류");
        return;
      }
      item.readyImage.sprite = this.playerGettingReadySprite;
      item.readyImage.gameObject.SetActive(true);
    });
    this.UpdatePlayerCount(0);
    this.playerCountPanel.SetActive(true);
  }
}
