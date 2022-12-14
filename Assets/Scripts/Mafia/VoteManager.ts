import {
  GameObject,
  RectTransform,
  RectTransformUtility,
  Sprite,
  Transform,
  Vector2,
  Vector3,
} from "UnityEngine";
import { Button, Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room, RoomData } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { InGameInteractState, MafiaGameState } from "../Constants/Enum";
import WaitForSecondsCash from "../WaitForSecondsCash";
import PlayerId from "./PlayerId";
import UIController from "./UIController";

export default class VoteManager extends ZepetoScriptBehaviour {
  @SerializeField()
  private votePoints: Transform[];

  @SerializeField()
  private canvas: RectTransform;

  @SerializeField()
  private voteRoot: Transform;

  @SerializeField()
  private reportButtonPrefab: GameObject;

  @SerializeField()
  private reporterUiPrefab: GameObject;

  @SerializeField()
  private voteCheckUIPrefab: GameObject;

  @SerializeField()
  private voteTargetUIPrefab: GameObject;

  @SerializeField()
  private voteUnCheckSprite: Sprite;
  @SerializeField()
  private voteCheckSprite: Sprite;

  @SerializeField()
  private voteText: Text;
  @SerializeField()
  private skipText: Text;
  @SerializeField()
  private skipButton: Button;

  @SerializeField()
  private voteCheckOffset: Vector3;
  @SerializeField()
  private voteButtonOffset: Vector3;
  @SerializeField()
  private voteTargetUIHorOffset: Vector3;
  @SerializeField()
  private voteTargetUIOffset: Vector3;
  @SerializeField()
  private reporterOffset: Vector3;

  private reporterProps: PlayerId;

  private playerIdArray: PlayerId[];

  private isVoting: boolean = false;

  private walkSpeed: number;
  private runSpeed: number;

  Start() {
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += (state: State, isFirst: boolean) => {
        //console.log("입장 시 " + isFirst);
        if (!isFirst) return;

        state.players.OnRemove += (player: Player, sessionId: string) => {
          if (player.isMafiaPlayer) {
            this.OnLeavePlayer(sessionId, player);
          }
        };
      };

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onReset", (message: any) => {
          this.Reset();
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

          console.log(message.reporter);
          console.log(message.corpse);
          // schema에 번호 부여

          // ui 및 애니메이션 대기 후 실행
          this.ReadyVote(message.reporter, message.corpse);

          this.StartCoroutine(this.VoteCoroutine(message));
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onVoteStart", (message: any) => {
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
          this.StartVote(message.reporter, message.corpse);

          this.VoteCountUpdate(0, 0);
        });

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onAbstain", (message: any) => {
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
          // 뭔가를 띄운다
          // 머리 위 카운트가 123 늘어나고 카메라가 저기로 이동되도록
          // 귀찮네
          // 모든 ui 삭제
          const player = ZepetoPlayers.instance.GetPlayer(message.playerId);
          const playerId = player.character.gameObject.GetComponent<PlayerId>();

          this.OnVoteUpdate(
            playerId,
            message.voteCount,
            message.abstentionCount
          );
        });

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onVote", (message: any) => {
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
          // 뭔가를 띄운다
          // 머리 위 카운트가 123 늘어나고 카메라가 저기로 이동되도록
          // 귀찮네
          // 모든 ui 삭제
          const player = ZepetoPlayers.instance.GetPlayer(message.playerId);
          const playerId = player.character.gameObject.GetComponent<PlayerId>();
          const targetPlayer = ZepetoPlayers.instance.GetPlayer(
            message.targetPlayerId
          );

          this.OnVoteUpdate(
            playerId,
            message.voteCount,
            message.abstentionCount
          );
        });

      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onVoteResult", (message: any) => {
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
          this.StartCoroutine(this.EndVote());
        });

      this.skipButton.onClick.AddListener(() => {
        this.Abstain();
      });
    };
  }

  *VoteCoroutine(message: any) {
    yield WaitForSecondsCash.instance.WaitForSeconds(3.6);
    if (
      ClientStarter.instance.GetRoom().State.gameState == MafiaGameState.Vote
    ) {
      UIController.instance.OnDebateCount(60);
      console.log("토론시작");
      yield WaitForSecondsCash.instance.WaitForSeconds(60);
      if (
        ClientStarter.instance.GetRoom().State.gameState == MafiaGameState.Vote
      ) {
        console.log("토론 종료");
        console.log("투표 시작");
        this.StartVote(message.reporter, message.corpse);
        this.VoteCountUpdate(0, 0);

        UIController.instance.OnVoteToast(30);
        yield WaitForSecondsCash.instance.WaitForSeconds(30);
        if (
          ClientStarter.instance.GetRoom().State.gameState ==
          MafiaGameState.Vote
        ) {
          console.log("투표 종료");
          ClientStarter.instance.GetRoom().Send("InitVoteResult", "");
        }
      }
    }
  }
  ReadyVote(reporterId: string, corpseId: string) {
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state != InGameInteractState.ALIVE
    ) {
      return;
    }
    console.log("투표 시작");
    this.isVoting = true;
    const reporter = ZepetoPlayers.instance.GetPlayer(reporterId);
    this.reporterProps = reporter.character.GetComponent<PlayerId>();
    // 시체는 여러개가 가능하다. 단, 신고한 시체의 id
    // const corpse = ZepetoPlayers.instance.GetPlayer(corpseId);
    this.playerIdArray = new Array<PlayerId>();

    ClientStarter.instance
      .GetRoom()
      .State.players.ForEach((sessionId: string, player: Player) => {
        if (!player.isMafiaPlayer) {
          return;
        }
        console.log("플레이어 추가");
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        const playerId = character.gameObject.GetComponent<PlayerId>();
        if (playerId.state == InGameInteractState.ALIVE) {
          this.playerIdArray.push(playerId);

          const voteTransform = this.votePoints[playerId.order];
          character.transform.position = voteTransform.position;
          character.transform.rotation = voteTransform.rotation;
        }
      });
    ClientStarter.instance.Teleport(
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform
    );

    this.SetUI(true);
    this.SetMove(false);
  }

  StartVote(reporterId: string, corpseId: string) {
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state != InGameInteractState.ALIVE
    ) {
      return;
    }
    this.skipButton.gameObject.SetActive(true);
    this.playerIdArray.forEach((item) => {
      item.voteButton.gameObject.SetActive(true);
      item.votedCheckUI.SetActive(true);
    });
  }

  private SetMove(isMovable: bool) {
    if (isMovable) {
      ZepetoPlayers.instance.characterData.walkSpeed = this.walkSpeed;
      ZepetoPlayers.instance.characterData.runSpeed = this.runSpeed;
    } else {
      if (
        ZepetoPlayers.instance.characterData.walkSpeed != 0 &&
        ZepetoPlayers.instance.characterData.runSpeed != 0
      ) {
        this.walkSpeed = ZepetoPlayers.instance.characterData.walkSpeed;
        this.runSpeed = ZepetoPlayers.instance.characterData.runSpeed;
        ZepetoPlayers.instance.characterData.walkSpeed = 0;
        ZepetoPlayers.instance.characterData.runSpeed = 0;
      }
    }
  }
  Vote(targetSessionId: string) {
    // 모든 버튼 없애기
    this.playerIdArray.forEach((item) => {
      if (item.voteButton) {
        item.voteButton.gameObject.SetActive(false);
      }
    });
    this.skipButton.gameObject.SetActive(false);
    // onVote
    const data = new RoomData();
    data.Add("playerId", ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id);
    data.Add("targetPlayerId", targetSessionId);
    data.Add("voteCount", -1);
    data.Add("abstentionCount", -1);
    ClientStarter.instance.GetRoom().Send("onVote", data.GetObject());
  }

  Abstain() {
    this.playerIdArray.forEach((item) => {
      if (item.voteButton) {
        item.voteButton.gameObject.SetActive(false);
      }
    });
    this.skipButton.gameObject.SetActive(false);
    const data = new RoomData();
    data.Add("playerId", ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id);
    data.Add("voteCount", -1);
    data.Add("abstentionCount", -1);
    console.log("기권");
    ClientStarter.instance.GetRoom().Send("onAbstain", data.GetObject());
  }

  // message에 의한 투표 시 실행
  OnVoteUpdate(playerId: PlayerId, voteCount: number, abstentionCount: number) {
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state == InGameInteractState.ALIVE
    ) {
      playerId.votedCheckUI.GetComponent<Image>().sprite = this.voteCheckSprite;

      this.VoteCountUpdate(voteCount, abstentionCount);
    }
  }
  VoteCountUpdate(voteCount: number, abstentionCount: number) {
    console.log("투표 수: " + voteCount + " " + abstentionCount);
    this.skipText.text = abstentionCount.toString();
    this.voteText.text = (voteCount - abstentionCount).toString();
    // 투표한 플레이어 체크 표시
  }

  *EndVote() {
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state != InGameInteractState.ALIVE
    ) {
      return;
    }
    console.log("투표 끝");

    // 투표 수 집계
    const state = ClientStarter.instance.GetRoom().State;

    console.log("기권 수: " + state.abstentionCount);

    let index: number = 0;
    // 0 ~ 3까지 4번
    yield yield WaitForSecondsCash.instance.WaitForSeconds(0.1);
    while (true) {
      let isContinue = false;
      console.log("인덱스: " + index);
      this.playerIdArray.forEach((playerId: PlayerId) => {
        if (
          !playerId ||
          !state.players.ContainsKey(playerId.sessionId) ||
          !state.players.get_Item(playerId.sessionId).isMafiaPlayer ||
          playerId.state != InGameInteractState.ALIVE
        ) {
          return;
        }
        const player = state.players.get_Item(playerId.sessionId);

        console.log(
          playerId.sessionId + " 플레이어가 투표 당한 수: " + player.votedCount
        );
        if (index < player.votedCount) {
          isContinue = true;
          // 업데이트
          console.log(
            playerId.sessionId + " 플레이어가 " + index + "번 지목당함"
          );
          playerId.voteTargetUI[index].SetActive(true);
        }
      });
      yield yield WaitForSecondsCash.instance.WaitForSeconds(0.5);
      if (!isContinue) {
        break;
      }
      index++;
    }
    yield WaitForSecondsCash.instance.WaitForSeconds(1);
    this.isVoting = false;
    this.SetMove(true);
    this.SetUI(false);
    if (ClientStarter.instance.GetRoom().State.gameState == 3) {
      yield WaitForSecondsCash.instance.WaitForSeconds(1);
      if (ClientStarter.instance.GetRoom().State.gameState == 3) {
        ClientStarter.instance.GetRoom().Send("VoteResult", "");
      }
    }
  }

  SetUI(isOn: bool) {
    console.log("ui 세팅");
    if (!this.playerIdArray) {
      return;
    }
    if (isOn) {
      this.playerIdArray.forEach((item) => {
        if (item.state != InGameInteractState.ALIVE) {
          console.log("오류오류오류");
        }

        const voteButton = GameObject.Instantiate<GameObject>(
          this.reportButtonPrefab,
          this.voteRoot
        );

        item.voteButton = voteButton.GetComponent<Button>();
        item.voteButton.onClick.AddListener(() => {
          this.Vote(item.sessionId);
        });

        item.votedCheckUI = GameObject.Instantiate<GameObject>(
          this.voteCheckUIPrefab,
          this.voteRoot
        );

        item.voteTargetUI = new Array<GameObject>();

        for (let i = 0; i < this.playerIdArray.length; i++) {
          item.voteTargetUI.push(
            GameObject.Instantiate<GameObject>(
              this.voteTargetUIPrefab,
              this.voteRoot
            )
          );
        }
        item.voteButton.gameObject.SetActive(false);
        this.skipButton.gameObject.SetActive(false);
        item.voteTargetUI.forEach((voteTarget) => {
          voteTarget.gameObject.SetActive(false);
        });
        item.votedCheckUI.SetActive(false);
      });

      this.reporterProps.reporterUi = GameObject.Instantiate<GameObject>(
        this.reporterUiPrefab,
        this.voteRoot
      );
    } else {
      this.playerIdArray.forEach((item) => {
        if (item.voteTargetUI) {
          item.voteTargetUI.forEach((voteTarget) => {
            GameObject.Destroy(voteTarget);
          });
          item.voteTargetUI = null;
        }
        if (item.voteButton) {
          GameObject.Destroy(item.voteButton.gameObject);
          item.voteButton = null;
        }
        if (item.votedCheckUI) {
          GameObject.Destroy(item.votedCheckUI);
          item.votedCheckUI = null;
        }
      });

      this.skipButton.gameObject.SetActive(false);
      if (this.reporterProps) {
        if (this.reporterProps.reporterUi) {
          GameObject.Destroy(this.reporterProps.reporterUi);
          this.reporterProps.reporterUi = null;
        }
        this.reporterProps = null;
      }
      this.playerIdArray = new Array<PlayerId>();
    }
  }

  Update() {
    if (!this.isVoting || !this.playerIdArray) {
      return;
    }
    const camera = ZepetoPlayers.instance.ZepetoCamera.camera;
    this.playerIdArray.forEach((item) => {
      if (item.voteButton) {
        const screenPoint = camera.WorldToScreenPoint(
          Vector3.op_Addition(
            item.transform.position,
            Vector3.op_Addition(
              Vector3.op_Addition(
                Vector3.op_Multiply(
                  this.voteButtonOffset.x,
                  item.transform.right
                ),
                Vector3.op_Multiply(this.voteButtonOffset.y, item.transform.up)
              ),
              Vector3.op_Multiply(
                this.voteButtonOffset.z,
                item.transform.forward
              )
            )
          )
        );

        let ref = $ref<Vector2>();
        if (
          RectTransformUtility.ScreenPointToLocalPointInRectangle(
            this.canvas,
            new Vector2(screenPoint.x, screenPoint.y),
            camera,
            ref
          )
        ) {
          let canvasPos = $unref(ref);
          // Set
          item.voteButton.image.rectTransform.localPosition = new Vector3(
            canvasPos.x,
            canvasPos.y,
            0
          );
        }
      }

      if (item.votedCheckUI) {
        const screenPoint = camera.WorldToScreenPoint(
          Vector3.op_Addition(
            item.transform.position,
            Vector3.op_Addition(
              Vector3.op_Addition(
                Vector3.op_Multiply(
                  this.voteCheckOffset.x,
                  item.transform.right
                ),
                Vector3.op_Multiply(this.voteCheckOffset.y, item.transform.up)
              ),
              Vector3.op_Multiply(
                this.voteCheckOffset.z,
                item.transform.forward
              )
            )
          )
        );

        let ref = $ref<Vector2>();
        if (
          RectTransformUtility.ScreenPointToLocalPointInRectangle(
            this.canvas,
            new Vector2(screenPoint.x, screenPoint.y),
            camera,
            ref
          )
        ) {
          let canvasPos = $unref(ref);
          // Set
          item.votedCheckUI.GetComponent<RectTransform>().localPosition =
            new Vector3(canvasPos.x, canvasPos.y, 0);
        }
      }

      if (item.voteTargetUI) {
        item.voteTargetUI.forEach((voteTargetUI, idx) => {
          if (voteTargetUI && voteTargetUI.activeSelf) {
            const screenPoint = camera.WorldToScreenPoint(
              Vector3.op_Addition(
                item.transform.position,
                Vector3.op_Addition(
                  Vector3.op_Addition(
                    Vector3.op_Addition(
                      Vector3.op_Multiply(
                        this.voteTargetUIOffset.x,
                        item.transform.right
                      ),
                      Vector3.op_Multiply(
                        this.voteTargetUIOffset.y,
                        item.transform.up
                      )
                    ),
                    Vector3.op_Multiply(
                      this.voteTargetUIOffset.z,
                      item.transform.forward
                    )
                  ),
                  Vector3.op_Addition(
                    Vector3.op_Addition(
                      Vector3.op_Multiply(
                        idx,
                        Vector3.op_Multiply(
                          this.voteTargetUIHorOffset.x,
                          item.transform.right
                        )
                      ),
                      Vector3.op_Multiply(
                        idx,
                        Vector3.op_Multiply(
                          this.voteTargetUIHorOffset.y,
                          item.transform.up
                        )
                      )
                    ),
                    Vector3.op_Multiply(
                      idx,
                      Vector3.op_Multiply(
                        this.voteTargetUIHorOffset.z,
                        item.transform.forward
                      )
                    )
                  )
                )
              )
            );
            let ref = $ref<Vector2>();
            if (
              RectTransformUtility.ScreenPointToLocalPointInRectangle(
                this.canvas,
                new Vector2(screenPoint.x, screenPoint.y),
                camera,
                ref
              )
            ) {
              let canvasPos = $unref(ref);
              // Set
              voteTargetUI.GetComponent<RectTransform>().localPosition =
                new Vector3(canvasPos.x, canvasPos.y, 0);
            }
          }
        });
      }
    });

    if (this.reporterProps && this.reporterProps.reporterUi) {
      const screenPoint = camera.WorldToScreenPoint(
        Vector3.op_Addition(
          this.reporterProps.transform.position,
          Vector3.op_Addition(
            Vector3.op_Addition(
              Vector3.op_Multiply(
                this.reporterOffset.x,
                this.reporterProps.transform.right
              ),
              Vector3.op_Multiply(
                this.reporterOffset.y,
                this.reporterProps.transform.up
              )
            ),
            Vector3.op_Multiply(
              this.reporterOffset.z,
              this.reporterProps.transform.forward
            )
          )
        )
      );

      let ref = $ref<Vector2>();
      if (
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
          this.canvas,
          new Vector2(screenPoint.x, screenPoint.y),
          camera,
          ref
        )
      ) {
        let canvasPos = $unref(ref);
        // Set
        this.reporterProps.reporterUi.GetComponent<RectTransform>().localPosition =
          new Vector3(canvasPos.x, canvasPos.y, 0);
      }
    }
  }

  OnLeavePlayer(sessionId: string, player: Player) {
    if (ZepetoPlayers.instance.HasPlayer(sessionId)) {
      const mafiaPlayerId = ZepetoPlayers.instance
        .GetPlayer(sessionId)
        .character.GetComponent<PlayerId>();
      if (mafiaPlayerId) {
        if (mafiaPlayerId.voteButton) {
          GameObject.Destroy(mafiaPlayerId.voteButton.gameObject);
          mafiaPlayerId.voteButton = null;
        }
        if (mafiaPlayerId.votedCheckUI) {
          GameObject.Destroy(mafiaPlayerId.votedCheckUI);
          mafiaPlayerId.votedCheckUI = null;
        }
      }
    }

    if (this.reporterProps) {
      if (this.reporterProps.sessionId == sessionId) {
        if (this.reporterProps.reporterUi) {
          GameObject.Destroy(this.reporterProps.reporterUi);
          this.reporterProps.reporterUi = null;
        }
        this.reporterProps = null;
      }
    }
    if (this.playerIdArray) {
      this.playerIdArray = this.playerIdArray.filter(
        (playerId) => playerId.sessionId != sessionId
      );
    }
  }

  Reset() {
    this.StopAllCoroutines();
    this.SetUI(false);
    this.SetMove(true);
    this.isVoting = false;
  }
}
