import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {
  isVoteResulting: boolean;
  isAlreadyStartInit: boolean;
  isAlreadyOnGameStart: boolean;
  isAlreadyInitVoteResult: boolean;
  isAlreadyVoteResult: boolean;
  isAlreadyStartNextDay: boolean;
  constructor() {
    super();
  }

  onCreate(options: SandboxOptions) {
    this.state.gameState = 1;
    this.isAlreadyStartInit = false;
    this.isAlreadyOnGameStart = false;
    this.isAlreadyInitVoteResult = false;
    this.isAlreadyVoteResult = false;
    this.isAlreadyStartNextDay = false;
    this.onMessage("onChangedTransform", (client, message) => {
      const player = this.state.players.get(client.sessionId);

      const transform = new Transform();
      transform.position = new Vector3();
      transform.position.x = message.position.x;
      transform.position.y = message.position.y;
      transform.position.z = message.position.z;

      transform.rotation = new Vector3();
      transform.rotation.x = message.rotation.x;
      transform.rotation.y = message.rotation.y;
      transform.rotation.z = message.rotation.z;

      player.transform = transform;
    });

    this.onMessage("onChangedState", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.state = message.state;
      player.subState = message.subState;
    });
    this.onMessage("onChangedGesture", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.gesture = message.gesture;
    });
    this.onMessage("Debug", (client, message) => {
      console.log("[Debug]: " + message.sentence);
    });

    this.onMessage("onReadyMafiaPlayer", (client, message) => {
      if (
        this.state.players.has(client.sessionId) &&
        this.state.players.get(client.sessionId).isMafiaPlayer
      ) {
        this.state.players.get(client.sessionId).isReady = false;
        this.state.players.get(client.sessionId).isMafiaPlayer = false;
        const readyPlayerCount = this.GetReadyCount();
        // {
        //   const selectCount = 3; /// 선택 미션 개수
        //   const totalCount = 11; /// 미션 최대 개수
        //   let randomIndexArray = [];
        //   let i = 0;
        //   while (i < selectCount) {
        //     let randomNum = Math.floor(Math.random() * totalCount);
        //     if (randomIndexArray.indexOf(randomNum) === -1) {
        //       randomIndexArray.push(randomNum);
        //       i++;
        //     }
        //   }

        //   randomIndexArray.sort((a: number, b: number): number => {
        //     return a - b;
        //   });
        //   this.broadcast("TestMission", randomIndexArray.toString());
        // }

        this.broadcast("UpdateReadyMafiaPlayer", readyPlayerCount);
        this.broadcast("OnUnReadyPlayer", client.sessionId);
        this.broadcast(
          "onConsoleLog",
          `준비 인원: ${readyPlayerCount}명, 총 인원: ${this.state.players.size}명`
        );
      } else if (this.state.players.has(client.sessionId)) {
        const player = this.state.players.get(client.sessionId);
        player.isMafiaPlayer = true;
        player.isReady = true;
        const readyPlayerCount = this.GetReadyCount();
        this.broadcast("UpdateReadyMafiaPlayer", readyPlayerCount);
        this.broadcast("OnReadyPlayer", client.sessionId);
        this.broadcast(
          "onConsoleLog",
          `준비 인원: ${readyPlayerCount}명, 총 인원: ${this.state.players.size}명`
        );
        if (
          readyPlayerCount >= 4 &&
          readyPlayerCount == this.state.players.size
        ) {
          this.broadcast("onConsoleLog", `게임 시작 카운트`);
          this.state.gameState = 4; // StartCount
          const gameCount = 5000;
          this.broadcast("GameStartCount", gameCount / 1000);
          this.broadcast("onConsoleLog", `111`);

          const timeToDelay = gameCount - 1000;
          this.broadcast("onConsoleLog", `${timeToDelay}`);
        }
      }

      console.log("전체 플레이 인수: " + this.state.players.size);
    });
    this.onMessage("GameStartInit", (client, message) => {
      if (this.isAlreadyStartInit) {
        return;
      }
      this.isAlreadyStartInit = true;
      // 체크
      this.broadcast("onConsoleLog", `333`);

      this.broadcast("onConsoleLog", `게임 시작 카운트 종료 1초 전`);

      this.broadcast(
        "onConsoleLog",
        `${
          this.state.gameState == 4
            ? "게임 시작 준비 문제 없음"
            : "게임 시작 준비 오류"
        }`
      );
      // 카운트 도중에 OnLeave로 인해 끝났는지 확인, 끝났다면 중지
      if (this.state.gameState == 4) {
        console.log("게임 시작 준비");
        this.broadcast("onConsoleLog", `게임 시작 준비`);
        this.onStartGameInit();
      }
    });
    this.onMessage("onGameStart", (client, message) => {
      if (this.isAlreadyOnGameStart) {
        return;
      }
      this.isAlreadyOnGameStart = true;
      // 체크
      console.log("게임 시작시작");
      this.broadcast(
        "onConsoleLog",
        `게임 시작 확인 ${this.state.gameState == 4 ? "문제 없음" : "오류"}`
      );
      if (this.state.gameState == 4) {
        this.state.gameState = 2;
        this.broadcast("GameStart", "");
        this.broadcast("onConsoleLog", `게임 시작`);
      }
    });
    this.onMessage("onKill", (client, message) => {
      const targetPlayer = this.state.players.get(message.killed);

      console.log(
        "죽은 거: " + message.killed + "   " + targetPlayer.zepetoUserId
      );
      console.log("마녀: " + message.mafia + "    " + client.userId);

      targetPlayer.InGamePlayerState = 2; // GHOST
      this.broadcast("onKill", message);

      const livingCitizenCount = this.getLivingCitizenCount();
      const mafiaCount = this.getMafiaCount();
      console.log("남은 살아있는 시민 수: " + livingCitizenCount);
      console.log("남은 마피아 수: " + mafiaCount);

      if (mafiaCount == 0) {
        //시민 승
        this.WinCitizen();
      } else if (livingCitizenCount <= mafiaCount) {
        //마피아 승
        this.WinMafia();
      }
    });

    this.onMessage("onReport", (client, message) => {
      this.isAlreadyInitVoteResult = false;
      this.isAlreadyVoteResult = false;
      this.isAlreadyStartNextDay = false;

      console.log("제보자: " + message.reporter);
      console.log("유령: " + message.corpse);
      // 소환 위치는 고정
      this.state.voteCount = 0;
      this.state.abstentionCount = 0;
      this.state.gameState = 3;
      this.state.players.forEach((player: Player) => {
        player.votedCount = 0;
        player.isAbstention = false;
        player.isVoted = false;
        player.voteTarget = "";
      });
      this.isVoteResulting = false;
      this.broadcast("onReport", message);
      console.log("토론 대기");
    });
    this.onMessage("InitVoteResult", (client, message) => {
      this.onVoteResult();
    });
    this.onMessage("VoteResult", (client, message) => {
      if (this.isAlreadyVoteResult) {
        return;
      }
      this.isAlreadyVoteResult = true;
      this.VoteResult();
    });

    this.onMessage("StartNextDay", (client, message) => {
      if (this.isAlreadyStartNextDay) {
        return;
      }
      this.isAlreadyStartNextDay = true;

      console.log("다음날");

      console.log(
        `${
          this.state.gameState == 3 ? "업데이트 안됐네" : "도중에 누가 나갔나"
        }`
      );
      this.broadcast(
        "onConsoleLog",
        `${
          this.state.gameState == 3 ? "업데이트 안됐네" : "도중에 누가 나갔나"
        }`
      );

      if (this.state.gameState == 3) {
        this.state.gameState = 2;
        this.broadcast("onStartNextDay", "");
      }
    });

    this.onMessage("onAbstain", (client, message) => {
      console.log(message.playerId);
      this.state.voteCount++;
      this.state.abstentionCount++;
      const player = this.state.players.get(client.sessionId);
      player.isAbstention = true;
      player.isVoted = true;
      player.voteTarget = "";

      message.voteCount = this.state.voteCount;
      message.abstentionCount = this.state.abstentionCount;

      console.log("총 플레이어 투표 수: " + this.state.voteCount);

      console.log("플레이어 수: " + this.GetMafiaPlayerCount());

      this.broadcast("onAbstain", message);

      let livingCount = this.getLivingCount();

      console.log("살아있는 플레이어 수: " + livingCount);
      if (this.state.voteCount == livingCount) {
        this.onVoteResult();
      }
    });

    this.onMessage("onVote", (client, message) => {
      console.log(
        "투표한 사람: " +
          message.playerId +
          " 투표받은 사람: " +
          message.targetPlayerId
      );
      // 플레이어 투표 수 업데이트
      this.state.voteCount++;

      const player = this.state.players.get(client.sessionId);
      player.isAbstention = false;
      player.isVoted = true;
      player.voteTarget = message.targetPlayerId;
      const targetPlayer = this.state.players.get(message.targetPlayerId);
      targetPlayer.votedCount++;

      console.log(`타겟 플레이어 투표 수: ${targetPlayer.votedCount}`);
      this.broadcast(
        "onConsoleLog",
        `타겟 플레이어 투표 수: ${targetPlayer.votedCount}`
      );

      console.log(`총 플레이어 투표 수: ${this.state.voteCount}`);
      this.broadcast("onConsoleLog");
      console.log(`총 기권 수: ${this.state.abstentionCount}`);
      this.broadcast(
        "onConsoleLog",
        `총 기권 수: ${this.state.abstentionCount}`
      );
      console.log(`플레이어 수: ${this.GetMafiaPlayerCount()}`);
      this.broadcast(
        "onConsoleLog",
        `플레이어 수: ${this.GetMafiaPlayerCount()}`
      );
      message.voteCount = this.state.voteCount;
      message.abstentionCount = this.state.abstentionCount;
      this.broadcast("onVote", message);

      let livingCount = this.getLivingCount();

      console.log("살아있는 플레이어 수: " + livingCount);
      if (this.state.voteCount == livingCount) {
        this.onVoteResult();
      }
    });

    this.onMessage("onCompleteMission", (client, message) => {
      // 해당 플레이어 투표 표시
      const player = this.state.players.get(client.sessionId);
      console.log(message.missionIndex);

      console.log(player.completeMissionList);
      console.log(player.completeMissionList.length == 0);
      console.log(player.completeMissionList == "");
      let completeMissionList: string[];
      if (player.completeMissionList == "") {
        completeMissionList = [];
        console.log("길이: 0 아니면 안됨" + completeMissionList.length);
      } else {
        completeMissionList = player.completeMissionList.split(",");
      }
      console.log(completeMissionList);
      completeMissionList.push(message.missionIndex);
      player.completeMissionList = completeMissionList.toString();
      console.log(completeMissionList);
      console.log(player.completeMissionList);

      let totalNum: number = 0;
      let totalCompleteNum: number = 0;
      this.state.players.forEach((player) => {
        if (!player.isMafiaPlayer) {
          return;
        }
        if (player.jobState == 1) {
          console.log(player.completeMissionList.split(","));
          console.log(player.completeMissionList.split(",").length);
          let addNum = player.completeMissionList.split(",").length;
          if (player.completeMissionList.split(",")[0] == "") {
            addNum = 0;
          }
          totalNum += player.missionList.split(",").length;
          totalCompleteNum += addNum;
          console.log(`미션 - ${player.completeMissionList}`);
          console.log(
            `미션 개수: ${
              player.missionList.split(",").length
            }, 완료한 개수: ${addNum}`
          );
        }
      });

      console.log("총 개수: " + totalNum + " 완료한 개수: " + totalCompleteNum);
      this.broadcast(
        "UpdateMissionBar",
        (totalCompleteNum / totalNum).toString()
      );

      if (totalCompleteNum == totalNum) {
        this.CitizenMissionWin();
      }
    });
  }

  onVoteResult() {
    if (this.isAlreadyInitVoteResult) {
      return;
    }
    this.isAlreadyInitVoteResult = true;

    if (this.isVoteResulting) {
      return;
    }

    this.isVoteResulting = true;
    if (this.state.gameState != 3) {
      console.log("오류임");
      return;
    }

    let max = 0;
    let targetSessionId: string[] = [];
    this.state.players.forEach((player, sessionId) => {
      if (player.isMafiaPlayer && player.InGamePlayerState == 1) {
        console.log(
          player.sessionId + " 플레이어가 당한 투표: " + player.votedCount
        );
        this.broadcast(
          "onConsoleLog",
          `${player.sessionId} 플레이어가 당한 투표: ${player.votedCount}`
        );
        if (max < player.votedCount) {
          max = player.votedCount;
          targetSessionId = [];
          targetSessionId.push(player.sessionId);
        } else if (max == player.votedCount) {
          targetSessionId.push(player.sessionId);
        }
        if (max <= this.state.abstentionCount) {
          max = this.state.abstentionCount;
          targetSessionId = [];
        }
      }
    });

    console.log(targetSessionId.length);
    this.broadcast("onConsoleLog", `target Len: ${targetSessionId.length}`);
    targetSessionId.forEach((item) => {
      console.log(item);
      this.broadcast("onConsoleLog", `target: ${item}`);
    });

    if (targetSessionId.length == 1 && targetSessionId[0] != "") {
      targetSessionId.forEach((item) => {
        console.log(`가장 많이 당한 플레이어: ${item}`);
        this.broadcast("onConsoleLog", `가장 많이 당한 플레이어: ${item}`);

        const player = this.state.players.get(item);
        player.InGamePlayerState = 2; // GHOST

        this.broadcast("onVoteResultEventInit", item.toString());
      });
    }
    this.broadcast("onVoteResult", "");

    console.log(
      `최대 개수: ${
        max == this.state.abstentionCount ? `기권 개수임 ${max}` : max
      }`
    );

    this.broadcast(
      "onConsoleLog",
      `최대 개수: ${
        max == this.state.abstentionCount ? `기권 개수임 ${max}` : max
      }`
    );
    console.log(
      `최대 개수: ${
        max == this.state.abstentionCount ? `기권 개수임 ${max}` : max
      }`
    );
    const livingCitizenCount = this.getLivingCitizenCount();
    const mafiaCount = this.getMafiaCount();
    console.log(`남은 살아있는 시민 수: ${livingCitizenCount}`);
    console.log(`남은 마피아 수: ${mafiaCount}`);

    this.broadcast(
      "onConsoleLog",
      `남은 살아있는 시민 수: ${livingCitizenCount}`
    );
    this.broadcast("onConsoleLog", `남은 마피아 수: ${mafiaCount}`);
  }

  VoteResult() {
    const livingCitizenCount = this.getLivingCitizenCount();
    const mafiaCount = this.getMafiaCount();

    if (mafiaCount == 0) {
      //시민 승
      this.WinCitizen();
    } else if (livingCitizenCount <= mafiaCount) {
      //마피아 승
      this.WinMafia();
    } else {
      // StartNextDay

      let max = -1;
      let targetSessionId: string[] = [];
      this.state.players.forEach((player, sessionId) => {
        if (player.isMafiaPlayer && player.InGamePlayerState == 1) {
          console.log(
            `${player.sessionId} 플레이어가 당한 투표: ${player.votedCount}`
          );
          if (max < player.votedCount) {
            max = player.votedCount;
            targetSessionId = [];
            targetSessionId.push(player.sessionId);
          } else if (max == player.votedCount) {
            targetSessionId.push(player.sessionId);
          }
          if (max <= this.state.abstentionCount) {
            max = this.state.abstentionCount;
            targetSessionId = [];
          }
        }
      });

      console.log(targetSessionId.length);
      targetSessionId.forEach((item) => {
        console.log(item);
      });

      if (
        targetSessionId.length >= 2 ||
        targetSessionId.length == 0 ||
        (targetSessionId.length == 1 && targetSessionId[0] == "")
      ) {
        this.broadcast("onVoteResultEvent", "");
      } else if (targetSessionId.length == 1) {
        targetSessionId.forEach((item) => {
          console.log("가장 많이 당한 플레이어: " + item);
          this.broadcast("onVoteResultEvent", item.toString());
          this.broadcast("onVoteTarget", item.toString());
        });
      }

      this.broadcast("WaitStartNextDay", 4);
    }
  }

  onStartGameInit() {
    let Idx = Math.floor(Math.random() * 8);
    this.state.players.forEach((player: Player) => {
      if (!player.isMafiaPlayer) {
        console.log("Player가 마피아 플레이어가 아님: " + player.sessionId);
        return;
      }
      this.broadcast("onConsoleLog", `${player.sessionId}의 Idx : ${Idx}`);
      player.order = Idx;
      Idx++;
      Idx %= 8;
    });

    let mafiaPlayerCount = this.GetMafiaPlayerCount();

    const ran = Math.floor(Math.random() * mafiaPlayerCount);

    this.broadcast(
      "onConsoleLog",
      `마피아 Idx: ${ran}, 인원 ${mafiaPlayerCount}`
    );
    let num = 0;
    this.state.players.forEach((player: Player) => {
      if (!player.isMafiaPlayer) {
        return;
      }
      player.isReady = false;
      player.isPlay = true;
      player.InGamePlayerState = 1; // ALIVE
      if (ran == num) {
        player.jobState = 2; // Mafia
        console.log(
          "마피아: " + player.sessionId + "   " + player.zepetoUserId
        );
        this.broadcast(
          "onConsoleLog",
          `마피아: ${player.sessionId}, UserId: ${player.zepetoUserId}`
        );
      } else {
        player.jobState = 1; // Citizen
      }
      const selectCount = 3; /// 선택 미션 개수
      const totalCount = 11; /// 미션 최대 개수
      let randomIndexArray = [];
      let i = 0;
      while (i < selectCount) {
        let randomNum = Math.floor(Math.random() * totalCount);
        if (randomIndexArray.indexOf(randomNum) === -1) {
          randomIndexArray.push(randomNum);
          i++;
        }
      }

      randomIndexArray.sort((a: number, b: number): number => {
        return a - b;
      });

      this.broadcast(
        "onConsoleLog",
        `${player.sessionId}의 미션 리스트: ${randomIndexArray.toString()}`
      );
      console.log("미션 리스트");
      console.log(randomIndexArray);
      console.log(randomIndexArray.toString());
      player.missionList = randomIndexArray.toString();
      num++;
    });
  }

  onJoin(client: SandboxPlayer) {
    // schemas.json 에서 정의한 player 객체를 생성 후 초기값 설정.
    console.log(
      `[OnJoin] sessionId : ${client.sessionId}, HashCode : ${client.hashCode}, userId : ${client.userId}`
    );

    const player = new Player();
    player.sessionId = client.sessionId;

    if (client.hashCode) {
      player.zepetoHash = client.hashCode;
    }
    if (client.userId) {
      player.zepetoUserId = client.userId;
    }
    player.isReady = false;
    player.isMafiaPlayer = false;
    player.isPlay = false;
    // client 객체의 고유 키값인 sessionId 를 사용해서 유져 객체를 관리.
    // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
    this.state.players.set(client.sessionId, player);

    console.log("[Add Player Map]");
  }
  onLeave(client: SandboxPlayer, consented?: boolean) {
    if (this.state.players.has(client.sessionId)) {
      if (!this.state.players.get(client.sessionId).isMafiaPlayer) {
        this.state.players.delete(client.sessionId);
      } else {
        if (this.state.players.get(client.sessionId).isVoted) {
          this.state.voteCount--;
          if (
            this.state.players.get(client.sessionId).voteTarget != "" &&
            this.state.players.get(client.sessionId).voteTarget != undefined
          ) {
            this.state.players.get(
              this.state.players.get(client.sessionId).voteTarget
            ).votedCount--;
          }
        }
        if (this.state.players.get(client.sessionId).isAbstention) {
          this.state.abstentionCount--;
        }
        this.state.players.delete(client.sessionId);

        if (this.state.gameState == 4) {
          // 카운팅 도중에 나가는 경우
          this.WinError();
        } else if (this.state.gameState == 2) {
          // play
          const livingCitizenCount = this.getLivingCitizenCount();
          const mafiaCount = this.getMafiaCount();
          console.log("남은 살아있는 플레이어 수: " + livingCitizenCount);

          console.log("남은 마피아 수: " + mafiaCount);

          // if (mafiaCount == 0 && livingCitizenCount == 0) {
          // }
          if (mafiaCount == 0 && livingCitizenCount != 0) {
            this.WinCitizen();
            //시민 승
          } else if (mafiaCount != 0 && livingCitizenCount <= mafiaCount) {
            //마피아 승
            this.WinMafia();
          } else if (livingCitizenCount == 0 && mafiaCount == 0) {
            this.WinError();
          } else {
            let totalNum: number = 0;
            let totalCompleteNum: number = 0;
            this.state.players.forEach((player) => {
              if (!player.isMafiaPlayer) {
                return;
              }
              if (player.jobState == 1) {
                console.log(player.completeMissionList.split(","));
                console.log(player.completeMissionList.split(",").length);
                let addNum = player.completeMissionList.split(",").length;
                if (player.completeMissionList.split(",")[0] == "") {
                  addNum = 0;
                }
                totalNum += player.missionList.split(",").length;
                totalCompleteNum += addNum;
                console.log(`미션 - ${player.completeMissionList}`);
                console.log(
                  `미션 개수: ${
                    player.missionList.split(",").length
                  }, 완료한 개수: ${addNum}`
                );
              }
            });

            console.log(
              "총 개수: " + totalNum + " 완료한 개수: " + totalCompleteNum
            );
            this.broadcast(
              "UpdateMissionBar",
              (totalCompleteNum / totalNum).toString()
            );

            if (totalCompleteNum == totalNum) {
              this.CitizenMissionWin();
            }
          }
        } else if (this.state.gameState == 3) {
          // vote 신고 이벤트 중에
          const livingCitizenCount = this.getLivingCitizenCount();
          const mafiaCount = this.getMafiaCount();
          console.log("남은 살아있는 플레이어 수: " + livingCitizenCount);

          console.log("남은 마피아 수: " + mafiaCount);

          // 토론 중에 나가는 경우 - EventReset
          // 투표 중에 나가는 경우 -

          if (mafiaCount == 0 && livingCitizenCount != 0) {
            //신고 이벤트 중에 이벤트 정지 및 즉시 승리
            this.WinCitizen();
            //토론 중에 나가기 및 즉시 승리
            // 투표 중에 나가는 경우 ui들 끄기(삭제) 및 즉시 승리
            // this.DelayWinCitizen();
            //시민 승
          } else if (mafiaCount != 0 && livingCitizenCount <= mafiaCount) {
            //마피아 승
            //신고 이벤트 중에 이벤트 정지 및 즉시 승리
            // 투표 중에 나가는 경우 ui들 끄기(삭제) 및 즉시 승리
            //토론 중에 나가기 및 즉시 승리
            this.WinMafia();

            // this.DelayWinMafia();
          } else if (livingCitizenCount == 0 && mafiaCount == 0) {
            this.WinError();
            //신고 이벤트 중에 이벤트 정지 및 즉시 나가기
            //토론 중에 나가기 및 즉시 나가기
            // 투표 중에 나가는 경우 ui들 끄기(삭제) 및 즉시 나가기
          } else if (this.state.voteCount >= this.getLivingCount()) {
            this.onVoteResult();
          }
        }
      }
    }
  }

  getLivingCitizenCount(): number {
    let livingCount = 0;
    this.state.players.forEach((player, sessionId) => {
      if (
        player.isMafiaPlayer &&
        player.jobState == 1 &&
        player.InGamePlayerState == 1
      ) {
        livingCount++;
      }
    });
    return livingCount;
  }

  getLivingCount(): number {
    let livingCount = 0;
    this.state.players.forEach((player, sessionId) => {
      if (player.isMafiaPlayer && player.InGamePlayerState == 1) {
        livingCount++;
      }
    });
    return livingCount;
  }
  getMafiaCount(): number {
    let mafiaCount = 0;
    this.state.players.forEach((player, sessionId) => {
      if (
        player.isMafiaPlayer &&
        player.jobState == 2 &&
        player.InGamePlayerState == 1
      ) {
        mafiaCount++;
      }
    });
    return mafiaCount;
  }

  GetReadyCount(): number {
    let readyCount = 0;
    this.state.players.forEach((player, sessionId) => {
      if (player.isMafiaPlayer && player.isReady) {
        readyCount++;
      }
    });
    return readyCount;
  }

  GetMafiaPlayerCount(): number {
    let mafiaPlayerCount = 0;
    this.state.players.forEach((player, sessionId) => {
      if (player.isMafiaPlayer) {
        mafiaPlayerCount++;
      }
    });
    return mafiaPlayerCount;
  }

  CitizenMissionWin() {
    console.log("미션 승리 끝!");
    this.broadcast("onMissionWin", "");
    this.ResetGame();
  }

  WinCitizen() {
    console.log("시민 승");
    this.broadcast("onCitizenWin", "");
    this.ResetGame();
  }
  WinMafia() {
    console.log("마피아 승");
    this.broadcast("onMafiaWin", "");
    this.ResetGame();
  }
  WinError() {
    console.log("에러 승");
    this.broadcast("OnErrorWin", "");
    this.ResetGame();
  }

  ResetGame() {
    this.state.gameState = 1;
    this.isAlreadyOnGameStart = false;
    this.isAlreadyStartInit = false;
    this.isAlreadyInitVoteResult = false;
    this.isAlreadyVoteResult = false;
    this.isAlreadyStartNextDay = false;
    this.broadcast("onReset", "");

    this.state.players.forEach((player) => {
      player.missionList = "";
      player.completeMissionList = "";
      player.order = 0;
      player.isReady = false;
      player.isPlay = false;
      player.isMafiaPlayer = false;
      player.jobState = -2;
      player.InGamePlayerState = 0;
    });

    const readyPlayerCount = this.GetReadyCount();
    this.broadcast("UpdateReadyMafiaPlayer", readyPlayerCount);
  }
}
