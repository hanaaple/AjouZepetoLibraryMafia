import {
  GameObject,
  RectTransform,
  RectTransformUtility,
  Sprite,
  Time,
  Transform,
  Vector2,
  Vector3,
  WaitForSeconds,
} from "UnityEngine";
import { Button, Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import {
  JobState,
  MafiaGameState,
  InGameInteractState,
} from "../Constants/Enum";
import PlayerId from "./PlayerId";

export default class MafiaReadyUiController extends ZepetoScriptBehaviour {
  @SerializeField()
  private canvas: RectTransform;

  @SerializeField()
  private root: Transform;

  @SerializeField()
  private readyPanel: GameObject;

  public attendButton: Button;

  public playerCountPanel: GameObject;
  public playerCountText: Text;
  public totalPlayerCount: Text;

  public startCountPanel: GameObject;
  public startCountText: Text;

  public readySprite: Sprite;
  public readyCompleteSprite: Sprite;

  public readyImagePrefab: GameObject;
  public playerGettingReadySprite: Sprite;
  public playerReadySprite: Sprite;

  public playingPanel: GameObject;

  private playerIds: Map<string, PlayerId>;

  Start() {
    this.playerIds = new Map<string, PlayerId>();
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += this.OnStateChange;
    };
    // ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId) => {
    //   this.OnAddPlayer(sessionId);
    // });
  }
  OnStateChange(state: State, isFirst: boolean) {
    //console.log("입장 시 " + isFirst);
    if (!isFirst) {
      return;
    }

    ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId) => {
      const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;

      if (character.gameObject.GetComponent<PlayerId>() == null) {
        character.gameObject.AddComponent<PlayerId>();
      }
      const playerId = character.GetComponent<PlayerId>();

      playerId.Init(sessionId);

      const readyImage = GameObject.Instantiate<GameObject>(
        this.readyImagePrefab,
        this.root
      );
      playerId.readyImage = readyImage.GetComponent<Image>();

      this.playerIds.set(sessionId, playerId);
      console.log(sessionId + " 추가");
      const state = ClientStarter.instance.GetRoom().State;
      console.log(state.gameState == MafiaGameState.Ready ? "Ready" : "???");
      if (state.gameState == MafiaGameState.Ready) {
        if (
          state.players.ContainsKey(sessionId) &&
          state.players.get_Item(sessionId).isMafiaPlayer
        ) {
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
      }

      let count = 0;
      ClientStarter.instance.GetRoom().State.players.ForEach((id, player) => {
        if (player.isMafiaPlayer && player.isReady) {
          count++;
        }
      });
      this.UpdatePlayerCount(count);
    });

    this.attendButton.image.sprite = this.readySprite;
    this.attendButton.onClick.AddListener(() => {
      if (
        state.players.get_Item(
          ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        )?.isReady
      ) {
        this.attendButton.image.sprite = this.readySprite;
      } else {
        this.attendButton.image.sprite = this.readyCompleteSprite;
      }
      ClientStarter.instance.GetRoom().Send("onReadyMafiaPlayer", "");
    });
    if (state.gameState != MafiaGameState.Ready) {
      this.attendButton.gameObject.SetActive(false);
      this.root.gameObject.SetActive(false);
      this.playingPanel.gameObject.SetActive(true);
    }
    if (state.gameState != MafiaGameState.Ready) {
      this.attendButton.gameObject.SetActive(false);
      this.root.gameObject.SetActive(false);
      this.playingPanel.gameObject.SetActive(true);
    }

    state.players.OnRemove += (player: Player, id: string) => {
      if (this.playerIds.has(id)) {
        GameObject.Destroy(this.playerIds.get(id).readyImage.gameObject);
        this.playerIds.delete(id);
      }
      let count = 0;
      ClientStarter.instance.GetRoom().State.players.ForEach((id, player) => {
        if (player.isMafiaPlayer && player.isReady) {
          count++;
        }
      });
      this.UpdatePlayerCount(count);
    };

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("GameStartCount", (count: number) => {
        console.log(
          state.players.ContainsKey(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          )
        );
        console.log(
          state.players.get_Item(
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
          ).isMafiaPlayer
        );

        // if (
        //   state.players.ContainsKey(
        //     ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //   ) &&
        //   state.players.get_Item(
        //     ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //   ).isMafiaPlayer
        // )
        {
          this.StartCoroutine(this.GameStartCount(count));
        }
      });

    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("onReset", (message: any) => {
        this.Reset();
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
      .AddMessageHandler("OnReadyPlayer", (id: string) => {
        this.playerIds.forEach((item) => {
          if (item.sessionId == id) {
            if (this.playerIds.has(item.sessionId)) {
              this.playerIds.get(item.sessionId).readyImage.sprite =
                this.playerReadySprite;
            }
          }
        });
      });
    ClientStarter.instance
      .GetRoom()
      .AddMessageHandler("OnUnReadyPlayer", (id: string) => {
        this.playerIds.forEach((item) => {
          if (item.sessionId == id) {
            if (this.playerIds.has(item.sessionId)) {
              this.playerIds.get(item.sessionId).readyImage.sprite =
                this.playerGettingReadySprite;
            }
          }
        });
      });
  }

  Update() {
    if (this.root.gameObject.activeSelf) {
      this.playerIds.forEach((item) => {
        if (!item || !item.readyImage) {
          return;
        }
        {
          const offsetPos = Vector3.op_Addition(
            item.transform.position,
            new Vector3(0, 2, 0)
          );

          const screenPoint =
            ZepetoPlayers.instance.ZepetoCamera.camera.WorldToScreenPoint(
              offsetPos
            );

          let ref = $ref<Vector2>();
          if (
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
              this.canvas,
              new Vector2(screenPoint.x, screenPoint.y),
              ZepetoPlayers.instance.ZepetoCamera.camera,
              ref
            )
          ) {
            let canvasPos = $unref(ref);
            // Set
            item.readyImage.rectTransform.localPosition = new Vector3(
              canvasPos.x,
              canvasPos.y,
              0
            );
          }
        }
      });
    }
  }

  // OnAddPlayer(sessionId: string) {
  //   const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
  //   if (character.gameObject.GetComponent<PlayerId>() == null) {
  //     character.gameObject.AddComponent<PlayerId>();
  //   }
  //   const playerId = character.GetComponent<PlayerId>();

  //   playerId.Init(sessionId);

  //   const readyImage = GameObject.Instantiate<GameObject>(
  //     this.readyImagePrefab,
  //     this.root
  //   );
  //   playerId.readyImage = readyImage.GetComponent<Image>();

  //   this.playerIds.set(sessionId, playerId);

  //   const state = ClientStarter.instance.GetRoom().State;
  //   if (state.gameState == MafiaGameState.Ready) {
  //     state.mafiaPlayers.ForEach((id: string, player: Player) => {
  //       console.log();
  //       console.log(
  //         player.sessionId + "  " + sessionId + "  " + player.sessionId ==
  //           sessionId
  //       );
  //       console.log(state.mafiaPlayers.ContainsKey(player.sessionId));
  //       console.log(state.mafiaPlayers.ContainsKey(sessionId));
  //       console.log(state.mafiaPlayers.ContainsKey(id));

  //       if (player.sessionId == sessionId) {
  //         console.log(state.mafiaPlayers.ContainsKey(player.sessionId));
  //         console.log(state.mafiaPlayers.ContainsKey(sessionId));
  //         console.log(state.mafiaPlayers.ContainsKey(id));
  //         if (state.mafiaPlayers.get_Item(sessionId).isReady) {
  //           this.playerIds.forEach((item) => {
  //             if (item.sessionId == sessionId) {
  //               if (this.playerIds.has(item.sessionId)) {
  //                 this.playerIds.get(item.sessionId).readyImage.sprite =
  //                   this.playerReadySprite;
  //               }
  //             }
  //           });
  //         }
  //       }
  //     });
  //   }

  //   let count = 0;
  //   ClientStarter.instance
  //     .GetRoom()
  //     .State.mafiaPlayers.ForEach((id, player) => {
  //       if (player.isReady) {
  //         count++;
  //       }
  //     });
  //   this.UpdatePlayerCount(count);
  // }

  public UpdatePlayerCount(playerCount: number) {
    this.playerCountText.text = playerCount.toString() + "명";
    this.totalPlayerCount.text =
      ClientStarter.instance.GetRoom().State.players.Count + "명";
  }

  public *GameStartCount(startCount: number) {
    this.attendButton.gameObject.SetActive(false);
    this.playerCountPanel.SetActive(false);
    this.root.gameObject.SetActive(false);

    this.startCountPanel.SetActive(true);
    let isActivated = false;
    while (startCount > 0) {
      startCount -= Time.deltaTime;
      if (startCount <= 1 && !isActivated) {
        ClientStarter.instance.GetRoom().Send("GameStartInit", "");
        isActivated = true;
      }
      this.startCountText.text = startCount.toFixed(1).toString() + "초";
      yield null;
    }
    this.startCountPanel.SetActive(false);
    this.startCountText.text = "";

    this.readyPanel.SetActive(false);

    ClientStarter.instance.GetRoom().Send("onGameStart", "");
  }

  private Reset() {
    this.StopAllCoroutines();
    this.startCountPanel.SetActive(false);

    this.root.gameObject.SetActive(true);
    this.playingPanel.gameObject.SetActive(false);
    this.attendButton.gameObject.SetActive(true);
    this.attendButton.image.sprite = this.readySprite;
    this.playerCountPanel.SetActive(true);

    this.playerIds.forEach((item) => {
      if (!item || !item.readyImage) {
        console.log("레디 버튼 없음 이상함 오류");
        return;
      }
      item.readyImage.sprite = this.playerGettingReadySprite;
    });
  }
}
