import {
  Canvas,
  Coroutine,
  GameObject,
  Rect,
  Sprite,
  Texture,
  Texture2D,
  Time,
  Vector2,
} from "UnityEngine";
import { Button, Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import { Users, ZepetoWorldHelper } from "ZEPETO.World";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, JobState } from "../Constants/Enum";
import WaitForSecondsCash from "../WaitForSecondsCash";
import Citizen from "./Citizen";
import Mafia from "./Mafia";
import PlayerId from "./PlayerId";

export default class UIController extends ZepetoScriptBehaviour {
  public static instance: UIController;
  @SerializeField()
  private howToPlayButton: Button;
  @SerializeField()
  private howToPlayExitButton: Button;
  @SerializeField()
  private howToPlayPanel: GameObject;

  @SerializeField()
  private missionListButton: Button;
  @SerializeField()
  private missionListExitButton: Button;
  @SerializeField()
  private missionListPanel: GameObject;

  @Space(10)
  @Header("결과")
  @SerializeField()
  private resultBackButton: Button;
  @SerializeField()
  private resultPanel: GameObject;
  @SerializeField()
  private winnerImage: Image;
  @SerializeField()
  private mafiaWinSprite: Sprite;
  @SerializeField()
  private citizenWinSprite: Sprite;
  @SerializeField()
  private missionWinSprite: Sprite;
  @SerializeField()
  private mafiaImage: Image;
  @SerializeField()
  private mafiaName: Text;

  @Space(10)
  @SerializeField()
  private readyPanel: GameObject;
  @SerializeField()
  private playPanel: GameObject;
  @SerializeField()
  private votePanel: GameObject;
  @SerializeField()
  private errorPanel: GameObject;
  @SerializeField()
  private errorExitButton: Button;

  @SerializeField()
  private howToPlayJobButton: Button;
  @SerializeField()
  private howToPlayJobExitButton: Button;
  @SerializeField()
  private howToPlayJobPanel: GameObject;
  @SerializeField()
  private howToPlayJobImage: Image;
  @SerializeField()
  private howToPlayMafiaSprite: Sprite;
  @SerializeField()
  private howToPlayCitizenSprite: Sprite;

  @Space(10)
  @Header("Event")
  @SerializeField()
  private onEventImage: Image;
  @SerializeField()
  private onKilledSprite: Sprite;
  @SerializeField()
  private onReportSprite: Sprite;

  @Space(10)
  @Header("투표")
  @SerializeField()
  private voteToastImage: Image;
  @SerializeField()
  private voteToastDebateSprite: Sprite;
  @SerializeField()
  private voteToastSprite: Sprite;
  @SerializeField()
  private timeoutPanel: GameObject;
  @SerializeField()
  private voteTimeoutText: Text;
  @SerializeField()
  private voteCountPanel: GameObject;
  @SerializeField()
  private voteSkipPanel: GameObject;
  @SerializeField()
  private voteResultImage: Image;
  @SerializeField()
  private voteCitizenSprite: Sprite;
  @SerializeField()
  private voteMatchTieSprite: Sprite;
  @SerializeField()
  private voteResultTargetImage: Image;
  @SerializeField()
  private voteResultTargetText: Text;

  @Space(10)
  @Header("지도")
  @SerializeField()
  private mapPanel: GameObject;
  @SerializeField()
  private mapOpenButton: Button;
  @SerializeField()
  private mapExitButton: Button;
  @SerializeField()
  private mapImage: Image;
  @SerializeField()
  private floorButtons: Button[];
  @SerializeField()
  private floorSprites: Sprite[];
  private selectedButton: Button;

  private timeout: Coroutine;
  private event: Coroutine;

  Awake() {
    UIController.instance = this;
  }
  Start() {
    this.howToPlayButton.onClick.AddListener(() => {
      this.howToPlayButton.gameObject.SetActive(false);
      this.howToPlayPanel.SetActive(true);
    });
    this.howToPlayExitButton.onClick.AddListener(() => {
      this.howToPlayButton.gameObject.SetActive(true);
      this.howToPlayPanel.SetActive(false);
    });

    this.missionListButton.onClick.AddListener(() => {
      this.missionListButton.gameObject.SetActive(false);
      this.missionListPanel.SetActive(true);
    });

    this.missionListExitButton.onClick.AddListener(() => {
      this.missionListButton.gameObject.SetActive(true);
      this.missionListPanel.SetActive(false);
    });

    this.resultBackButton.onClick.AddListener(() => {
      this.resultPanel.SetActive(false);
    });
    this.errorExitButton.onClick.AddListener(() => {
      this.errorPanel.SetActive(false);
    });

    this.howToPlayJobButton.onClick.AddListener(() => {
      this.howToPlayJobButton.gameObject.SetActive(false);
      this.howToPlayJobPanel.SetActive(true);
    });
    this.howToPlayJobExitButton.onClick.AddListener(() => {
      this.howToPlayJobButton.gameObject.SetActive(true);
      this.howToPlayJobPanel.SetActive(false);
    });

    this.mapOpenButton.onClick.AddListener(() => {
      this.mapPanel.SetActive(true);
      ZepetoPlayers.instance.GetComponentInChildren<Canvas>().sortingOrder = -1;
    });
    this.mapExitButton.onClick.AddListener(() => {
      this.mapPanel.SetActive(false);
      ZepetoPlayers.instance.GetComponentInChildren<Canvas>().sortingOrder = 0;
    });

    this.selectedButton = this.floorButtons[0];
    this.floorButtons.forEach((button: Button, idx: number) => {
      button.onClick.AddListener(() => {
        if (this.selectedButton && button != this.selectedButton) {
          const t = this.selectedButton.image.color;
          t.a = 150 / 255;
          this.selectedButton.image.color = t;
          this.selectedButton = button;
        }

        const color = button.image.color;
        color.a = 1;
        button.image.color = color;

        this.mapImage.sprite = this.floorSprites[idx];
      });
    });

    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += (state: State, isFirst: boolean) => {
        //console.log("입장 시 " + isFirst);
        if (!isFirst) {
          return;
        }

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onReset", (message: any) => {
            this.Reset();
          });

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("OnErrorWin", (message: any) => {
            this.errorPanel.SetActive(true);
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("GameStart", (message) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.GameStart();
          });

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onKill", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.mapPanel.SetActive(false);
            if (
              message.killed ==
              ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
            ) {
              this.event = this.StartCoroutine(this.KilledEvent());
            }
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onReport", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }

            this.mapPanel.SetActive(false);

            if (this.event) {
              this.StopCoroutine(this.event);
            }
            this.event = this.StartCoroutine(this.ReportEvent());
          });
        // ClientStarter.instance
        //   .GetRoom()
        //   .AddMessageHandler("StartDebateCount", (message: number) => {
        //     if (
        //       !ClientStarter.instance
        //         .GetRoom()
        //         .State.players.ContainsKey(
        //           ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //         ) ||
        //       !ClientStarter.instance
        //         .GetRoom()
        //         .State.players.get_Item(
        //           ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //         ).isMafiaPlayer
        //     ) {
        //       return;
        //     }
        //     this.OnDebateCount(message);
        //   });
        // ClientStarter.instance
        //   .GetRoom()
        //   .AddMessageHandler("StartVoteCount", (message: number) => {
        //     if (
        //       !ClientStarter.instance
        //         .GetRoom()
        //         .State.players.ContainsKey(
        //           ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //         ) ||
        //       !ClientStarter.instance
        //         .GetRoom()
        //         .State.players.get_Item(
        //           ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
        //         ).isMafiaPlayer
        //     ) {
        //       return;
        //     }
        //     this.OnVoteToast(message);
        //   });

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onMafiaWin", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.StartCoroutine(this.ResultWin(this.mafiaWinSprite));
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onCitizenWin", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.StartCoroutine(this.ResultWin(this.citizenWinSprite));
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onMissionWin", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.StartCoroutine(this.ResultWin(this.missionWinSprite));
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onStartNextDay", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }

            this.playPanel.SetActive(true);
            this.votePanel.SetActive(false);

            const character =
              ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            const playerId = character.GetComponent<PlayerId>();
            if (playerId.jobState == JobState.Citizen) {
              const citizen = character.GetComponent<Citizen>();
              citizen.interactUI.Init(citizen.jobState);

              if (playerId.state == InGameInteractState.GHOST) {
                citizen.interactUI.reportButton.gameObject.SetActive(false);
              }
            } else if (
              playerId.jobState == JobState.Mafia &&
              playerId.state == InGameInteractState.ALIVE
            ) {
              const mafia = character.GetComponent<Mafia>();
              mafia.interactUI.Init(mafia.jobState);
            }
          });

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onVoteResultEventInit", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            let mafiaUserId: string;
            console.log("투표 결과 타겟 초기화: " + message);
            state.players.ForEach((sessionId: string, player: Player) => {
              if (player.isMafiaPlayer) {
                console.log(
                  "투표 결과 유저 아이디" + player.sessionId == message
                );
                if (player.sessionId == message) {
                  mafiaUserId = player.zepetoUserId;
                }
              }
            });

            ZepetoWorldHelper.GetProfileTexture(
              mafiaUserId,
              (texture: Texture) => {
                this.voteResultTargetImage.sprite = this.GetSprite(texture);
              },
              (error) => {
                console.log(error);
              }
            );

            const userIds: string[] = [];

            userIds.push(mafiaUserId);
            ZepetoWorldHelper.GetUserInfo(
              userIds,
              (info: Users[]) => {
                this.voteResultTargetText.text = info[0].name;
              },
              (error) => {
                console.log(error);
              }
            );
          });
        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onVoteResultEvent", (message: any) => {
            if (
              !ClientStarter.instance
                .GetRoom()
                .State.players.ContainsKey(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ) ||
              !ClientStarter.instance
                .GetRoom()
                .State.players.get_Item(
                  ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
                ).isMafiaPlayer
            ) {
              return;
            }
            this.StartCoroutine(this.VoteResultEvent(message));
          });
      };
    };
  }

  //Local 실행
  private *KilledEvent() {
    const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
    const playerId = character.GetComponent<PlayerId>();
    if (playerId.jobState == JobState.Citizen) {
      const citizen = character.GetComponent<Citizen>();
      citizen.interactUI.Init(citizen.jobState);
      citizen.interactUI.reportButton.gameObject.SetActive(false);
    } else if (playerId.jobState == JobState.Mafia) {
      const mafia = character.GetComponent<Mafia>();
      mafia.interactUI.reportButton.gameObject.SetActive(false);
      mafia.interactUI.killButton.gameObject.SetActive(false);
      mafia.interactUI.missionButton.gameObject.SetActive(false);
      mafia.interactUI.killButtonBackground.SetActive(false);
    }

    this.onEventImage.gameObject.SetActive(true);
    this.onEventImage.sprite = this.onKilledSprite;
    const tColor = this.onEventImage.color;
    tColor.a = 1;
    this.onEventImage.color = tColor;
    yield WaitForSecondsCash.instance.WaitForSeconds(0.5);
    let t = 3;
    while (t >= 0) {
      t -= Time.deltaTime;
      const color = this.onEventImage.color;
      color.a = t / 3;
      this.onEventImage.color = color;
      yield null;
    }
    const color = this.onEventImage.color;
    color.a = 1;
    this.onEventImage.color = color;
    this.onEventImage.gameObject.SetActive(false);
    this.event = null;
  }

  private *ReportEvent() {
    const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
    const playerId = character.GetComponent<PlayerId>();
    if (playerId.jobState == JobState.Citizen) {
      const citizen = character.GetComponent<Citizen>();
      citizen.interactUI.reportButton.gameObject.SetActive(false);
      citizen.interactUI.missionButton.gameObject.SetActive(false);
    } else if (playerId.jobState == JobState.Mafia) {
      const mafia = character.GetComponent<Mafia>();
      mafia.interactUI.reportButton.gameObject.SetActive(false);
      mafia.interactUI.killButton.gameObject.SetActive(false);
      mafia.interactUI.missionButton.gameObject.SetActive(false);
      mafia.interactUI.killButtonBackground.SetActive(false);
    }

    console.log("신고 이미지 활성화" + this.playPanel.activeSelf);
    this.onEventImage.gameObject.SetActive(true);
    this.onEventImage.sprite = this.onReportSprite;
    const tColor = this.onEventImage.color;
    tColor.a = 1;
    this.onEventImage.color = tColor;
    yield WaitForSecondsCash.instance.WaitForSeconds(0.5);
    let t = 3;
    while (t >= 0) {
      t -= Time.deltaTime;
      const color = this.onEventImage.color;
      color.a = t / 3;
      this.onEventImage.color = color;
      yield null;
    }
    const color = this.onEventImage.color;
    color.a = 1;
    this.onEventImage.color = color;
    this.onEventImage.gameObject.SetActive(false);
    this.event = null;
    console.log("신고 이미지 비활성화" + this.playPanel.activeSelf);
  }

  private *VoteResultEvent(message: string) {
    this.voteResultImage.gameObject.SetActive(true);
    if (message == null || message.length == 0 || message == "") {
      this.voteResultImage.sprite = this.voteMatchTieSprite;
      this.voteResultTargetImage.gameObject.SetActive(false);
      this.voteResultTargetText.gameObject.SetActive(false);
    } else {
      this.voteResultImage.sprite = this.voteCitizenSprite;
      this.voteResultTargetImage.gameObject.SetActive(true);
      this.voteResultTargetText.gameObject.SetActive(true);
    }

    console.log(message);

    const tColor = this.voteResultImage.color;
    tColor.a = 1;
    this.voteResultImage.color = tColor;
    let t = 3;
    while (t >= 0) {
      t -= Time.deltaTime;
      const color = this.voteResultImage.color;
      color.a = t;
      this.voteResultImage.color = color;
      yield null;
    }
    yield WaitForSecondsCash.instance.WaitForSeconds(2);
    const color = this.voteResultImage.color;
    color.a = 1;
    this.voteResultImage.color = color;
    this.voteResultImage.gameObject.SetActive(false);
  }

  public OnDebateCount(timeout: number) {
    if (this.event) {
      this.StopCoroutine(this.event);
      const color = this.onEventImage.color;
      color.a = 1;
      this.onEventImage.color = color;
      this.onEventImage.gameObject.SetActive(false);
      this.event = null;
    }

    const state = ClientStarter.instance.GetRoom().State;
    const localPlayer = state.players.get_Item(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
    );
    console.log("토론 시작, InGameState: " + localPlayer.InGamePlayerState);

    if (
      localPlayer &&
      localPlayer.InGamePlayerState == InGameInteractState.ALIVE
    ) {
      this.playPanel.SetActive(false);
      this.votePanel.SetActive(true);
      this.voteSkipPanel.SetActive(false);
      this.voteCountPanel.SetActive(false);
      this.voteToastImage.gameObject.SetActive(true);
      this.voteToastImage.sprite = this.voteToastDebateSprite;
      this.StartCoroutine(this.VoteToast());
      if (this.timeout) {
        this.StopCoroutine(this.timeout);
      }
      this.timeout = this.StartCoroutine(this.StartTimeout(timeout));
    }
  }

  OnVoteToast(timeout: number) {
    console.log("투표 Toast");
    const state = ClientStarter.instance.GetRoom().State;
    const localPlayer = state.players.get_Item(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
    );
    if (localPlayer && localPlayer.InGamePlayerState == 1) {
      this.voteSkipPanel.SetActive(true);
      this.voteCountPanel.SetActive(true);
      this.voteToastImage.gameObject.SetActive(true);
      this.voteToastImage.sprite = this.voteToastSprite;
      this.StartCoroutine(this.VoteToast());
      if (this.timeout) {
        this.StopCoroutine(this.timeout);
      }
      this.timeout = this.StartCoroutine(this.StartTimeout(timeout));
    }
  }

  *VoteToast() {
    let t = 5;
    while (t >= 0) {
      t -= Time.deltaTime;
      let color = this.voteToastImage.color;
      color.a = t / 5;
      this.voteToastImage.color = color;
      yield null;
    }
    let color = this.voteToastImage.color;
    color.a = 1;
    this.voteToastImage.color = color;
    this.voteToastImage.gameObject.SetActive(false);
  }

  *StartTimeout(timeout: number) {
    this.timeoutPanel.SetActive(true);
    this.voteTimeoutText.text = "";
    let _timeout: number = timeout;
    while (_timeout > 0) {
      _timeout -= Time.deltaTime;
      this.voteTimeoutText.text = _timeout.toFixed(0).toString();
      yield null;
    }
    this.voteTimeoutText.text = "";
    this.timeoutPanel.SetActive(false);
    this.timeout = null;
  }

  private *ResultWin(winnerSprite: Sprite) {
    this.winnerImage.sprite = winnerSprite;
    this.resultPanel.SetActive(true);
    let t = 0;
    while (t <= 1) {
      t += Time.deltaTime;
      let colorImage = this.winnerImage.color;
      colorImage.a = t;
      this.winnerImage.color = colorImage;

      let colorBack = this.resultBackButton.image.color;
      colorBack.a = t;
      this.resultBackButton.image.color = colorBack;
      yield null;
    }
    let color = this.winnerImage.color;
    color.a = 1;
    this.winnerImage.color = color;

    let colorBack = this.resultBackButton.image.color;
    colorBack.a = 1;
    this.resultBackButton.image.color = colorBack;
  }

  private GetSprite(texture: Texture) {
    let rect: Rect = new Rect(0, 0, texture.width, texture.height);
    return Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
  }

  private GameStart() {
    this.playPanel.SetActive(true);

    const state = ClientStarter.instance.GetRoom().State;
    const localPlayer = state.players.get_Item(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
    );
    if (localPlayer.jobState == JobState.Mafia) {
      this.howToPlayJobImage.sprite = this.howToPlayMafiaSprite;
    } else if (localPlayer.jobState == JobState.Citizen) {
      this.howToPlayJobImage.sprite = this.howToPlayCitizenSprite;
    }

    let mafiaUserId: string;

    state.players.ForEach((sessionId: string, player: Player) => {
      if (player.isMafiaPlayer && player.jobState == JobState.Mafia) {
        mafiaUserId = player.zepetoUserId;
      }
    });

    ZepetoWorldHelper.GetProfileTexture(
      mafiaUserId,
      (texture: Texture) => {
        this.mafiaImage.sprite = this.GetSprite(texture);
      },
      (error) => {
        console.log(error);
      }
    );

    const userIds: string[] = [];

    userIds.push(mafiaUserId);
    ZepetoWorldHelper.GetUserInfo(
      userIds,
      (info: Users[]) => {
        this.mafiaName.text = info[0].name;
      },
      (error) => {
        console.log(error);
      }
    );
  }
  Reset() {
    if (this.event) {
      this.StopCoroutine(this.event);
      const color = this.onEventImage.color;
      color.a = 1;
      this.onEventImage.color = color;
      this.onEventImage.gameObject.SetActive(false);
      this.event = null;
    }
    if (this.timeout) {
      this.StopCoroutine(this.timeout);
      this.timeout = null;
    }
    this.readyPanel.SetActive(true);
    this.playPanel.SetActive(false);
    this.votePanel.SetActive(false);
    this.mapPanel.SetActive(false);

    this.howToPlayButton.gameObject.SetActive(true);
    this.howToPlayPanel.SetActive(false);
    this.howToPlayJobButton.gameObject.SetActive(true);
    this.howToPlayJobPanel.SetActive(false);

    this.timeoutPanel.SetActive(false);
    this.voteToastImage.gameObject.SetActive(false);
    this.voteResultImage.gameObject.SetActive(false);
  }
}
