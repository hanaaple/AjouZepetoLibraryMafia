import { GameObject, Sprite, Transform, Vector3 } from "UnityEngine";
import { Button, Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Room, RoomData } from "ZEPETO.Multiplay";
import { Player, State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { InGameInteractState } from "../Constants/Enum";
import WaitForSecondsCash from "../WaitForSecondsCash";
import PlayerId from "./PlayerId";

export default class VoteManager extends ZepetoScriptBehaviour {
  @SerializeField()
  private votePoints: Transform[];

  @SerializeField()
  private votePanel: Transform;

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
        if (!isFirst) return;

        state.mafiaPlayers.OnRemove += (player: Player, sessionId: string) =>
          this.OnLeavePlayer(sessionId, player);
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
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
          ) {
            return;
          }

          console.log(message.reporter);
          console.log(message.corpse);
          // schema에 번호 부여

          // ui 및 애니메이션 대기 후 실행
          this.ReadyVote(message.reporter, message.corpse);
        });
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("onVoteStart", (message: any) => {
          if (
            !ClientStarter.instance
              .GetRoom()
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
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
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
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
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
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
              .State.mafiaPlayers.ContainsKey(
                ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id
              )
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

    const mafiaPlayers = ClientStarter.instance.GetRoom().State.mafiaPlayers;
    mafiaPlayers.ForEach((sessionId: string, player: Player) => {
      console.log("플레이어:  " + sessionId);
    });
    const mafiaPlayerCount = mafiaPlayers.Count;
    for (let count = 0, idx = 0; count < mafiaPlayerCount; idx++) {
      const t = mafiaPlayers.GetByIndex(idx);
      if (t != null) {
        count++;
        console.log(t + ", " + idx + "번째");
        console.log(t.sessionId);
      }
    }

    mafiaPlayers.ForEach((sessionId: string, player: Player) => {
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

    console.log(this.playerIdArray.length);

    this.SetUI(true);
    this.SetMove(false);

    // 사람들 머리 위에 ui
    // ui를 누르면 투표
    // 자기 투표는 옆에 버튼
    // 안누르면 기권
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
      this.walkSpeed = ZepetoPlayers.instance.characterData.walkSpeed;
      this.runSpeed = ZepetoPlayers.instance.characterData.runSpeed;
      ZepetoPlayers.instance.characterData.walkSpeed = 0;
      ZepetoPlayers.instance.characterData.runSpeed = 0;
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
    // 뭔가를 띄운다
    // 머리 위 카운트가 123 늘어나고 카메라가 저기로 이동되도록
    // 귀찮네
    // 모든 ui 삭제
    if (
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>()
        .state != InGameInteractState.ALIVE
    ) {
      return;
    }
    console.log("투표 끝");

    // 투표 수 집계
    const state = ClientStarter.instance.GetRoom().State;

    let index: number = 0;
    // 0 ~ 3까지 4번
    while (true) {
      let isContinue = false;
      console.log("인덱스: " + index);
      this.playerIdArray.forEach((playerId: PlayerId) => {
        const player = state.mafiaPlayers.get_Item(playerId.sessionId);
        if (playerId.state != InGameInteractState.ALIVE) {
          return;
        }

        console.log(
          playerId.sessionId + " 플레이어가 투표 당한 수: " + player.votedCount
        );
        if (index < player.votedCount) {
          isContinue = true;
          // 업데이트
          console.log(
            playerId.sessionId + " 플레이어가 " + index + "번 지목당함"
          );
          console.log(playerId.voteTargetUI.length);
          console.log(playerId.voteTargetUI[index]);
          playerId.voteTargetUI[index].SetActive(true);
        }
      });
      console.log("기권 수: " + state.abstentionCount);
      if (index < state.abstentionCount) {
        // isContinue = true;
        // 업데이트
      }
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
  }

  SetUI(isOn: bool) {
    if (!this.playerIdArray) {
      return;
    }
    // this.votePanel.gameObject.SetActive(isOn);

    console.log("ui 세팅");
    console.log(this.playerIdArray);
    console.log(this.playerIdArray.length);
    if (isOn) {
      this.playerIdArray.forEach((item) => {
        console.log(item.sessionId);
        if (item.state != InGameInteractState.ALIVE) {
          console.log("오류오류오류");
        }
        // if (!zepetoPlayer.isLocalPlayer) {
        // const playerId = corpse.character.GetComponent<PlayerId>();
        const voteButton = GameObject.Instantiate<GameObject>(
          this.reportButtonPrefab,
          this.votePanel
        );

        item.voteButton = voteButton.GetComponent<Button>();
        item.voteButton.onClick.AddListener(() => {
          this.Vote(item.sessionId);
        });

        item.votedCheckUI = GameObject.Instantiate<GameObject>(
          this.voteCheckUIPrefab,
          this.votePanel
        );

        item.voteTargetUI = new Array<GameObject>();
        console.log(this.playerIdArray.length + "개 넣기");
        for (let i = 0; i < this.playerIdArray.length; i++) {
          item.voteTargetUI.push(
            GameObject.Instantiate<GameObject>(
              this.voteTargetUIPrefab,
              this.votePanel
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
        this.votePanel
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
        GameObject.Destroy(this.reporterProps.reporterUi);
        this.reporterProps.reporterUi = null;
        this.reporterProps = null;
      }
      this.playerIdArray = new Array<PlayerId>();
    }
  }

  Update() {
    if (!this.isVoting) {
      return;
    }
    const camera = ZepetoPlayers.instance.ZepetoCamera.camera;
    this.playerIdArray.forEach((item) => {
      if (!item.voteButton) {
        console.log("리포트 버튼 없음 이상함 오류");
        return;
      }

      item.voteButton.transform.position = camera.WorldToScreenPoint(
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
            Vector3.op_Multiply(this.voteButtonOffset.z, item.transform.forward)
          )
        )
      );

      item.votedCheckUI.transform.position = camera.WorldToScreenPoint(
        Vector3.op_Addition(
          item.transform.position,
          Vector3.op_Addition(
            Vector3.op_Addition(
              Vector3.op_Multiply(this.voteCheckOffset.x, item.transform.right),
              Vector3.op_Multiply(this.voteCheckOffset.y, item.transform.up)
            ),
            Vector3.op_Multiply(this.voteCheckOffset.z, item.transform.forward)
          )
        )
      );

      if (item.voteTargetUI) {
        item.voteTargetUI.forEach((voteTargetUI, idx) => {
          if (voteTargetUI && voteTargetUI.activeSelf) {
            voteTargetUI.transform.position = camera.WorldToScreenPoint(
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
          }
        });
      }
    });

    this.reporterProps.reporterUi.transform.position =
      camera.WorldToScreenPoint(
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
  }

  OnLeavePlayer(sessionId: string, player: Player) {
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

    if (this.reporterProps) {
      if (this.reporterProps.sessionId == sessionId) {
        GameObject.Destroy(this.reporterProps.reporterUi);
        this.reporterProps.reporterUi = null;
        this.reporterProps = null;
      }
    }
  }

  Reset() {
    this.SetUI(false);
  }
}
