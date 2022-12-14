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
        //   const selectCount = 3; /// ?????? ?????? ??????
        //   const totalCount = 11; /// ?????? ?????? ??????
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
          `?????? ??????: ${readyPlayerCount}???, ??? ??????: ${this.state.players.size}???`
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
          `?????? ??????: ${readyPlayerCount}???, ??? ??????: ${this.state.players.size}???`
        );
        if (
          readyPlayerCount >= 4 &&
          readyPlayerCount == this.state.players.size
        ) {
          this.broadcast("onConsoleLog", `?????? ?????? ?????????`);
          this.state.gameState = 4; // StartCount
          const gameCount = 5000;
          this.broadcast("GameStartCount", gameCount / 1000);
          this.broadcast("onConsoleLog", `111`);

          const timeToDelay = gameCount - 1000;
          this.broadcast("onConsoleLog", `${timeToDelay}`);
        }
      }

      console.log("?????? ????????? ??????: " + this.state.players.size);
    });
    this.onMessage("GameStartInit", (client, message) => {
      if (this.isAlreadyStartInit) {
        return;
      }
      this.isAlreadyStartInit = true;
      // ??????
      this.broadcast("onConsoleLog", `333`);

      this.broadcast("onConsoleLog", `?????? ?????? ????????? ?????? 1??? ???`);

      this.broadcast(
        "onConsoleLog",
        `${
          this.state.gameState == 4
            ? "?????? ?????? ?????? ?????? ??????"
            : "?????? ?????? ?????? ??????"
        }`
      );
      // ????????? ????????? OnLeave??? ?????? ???????????? ??????, ???????????? ??????
      if (this.state.gameState == 4) {
        console.log("?????? ?????? ??????");
        this.broadcast("onConsoleLog", `?????? ?????? ??????`);
        this.onStartGameInit();
      }
    });
    this.onMessage("onGameStart", (client, message) => {
      if (this.isAlreadyOnGameStart) {
        return;
      }
      this.isAlreadyOnGameStart = true;
      // ??????
      console.log("?????? ????????????");
      this.broadcast(
        "onConsoleLog",
        `?????? ?????? ?????? ${this.state.gameState == 4 ? "?????? ??????" : "??????"}`
      );
      if (this.state.gameState == 4) {
        this.state.gameState = 2;
        this.broadcast("GameStart", "");
        this.broadcast("onConsoleLog", `?????? ??????`);
      }
    });
    this.onMessage("onKill", (client, message) => {
      const targetPlayer = this.state.players.get(message.killed);

      console.log(
        "?????? ???: " + message.killed + "   " + targetPlayer.zepetoUserId
      );
      console.log("??????: " + message.mafia + "    " + client.userId);

      targetPlayer.InGamePlayerState = 2; // GHOST
      this.broadcast("onKill", message);

      const livingCitizenCount = this.getLivingCitizenCount();
      const mafiaCount = this.getMafiaCount();
      console.log("?????? ???????????? ?????? ???: " + livingCitizenCount);
      console.log("?????? ????????? ???: " + mafiaCount);

      if (mafiaCount == 0) {
        //?????? ???
        this.WinCitizen();
      } else if (livingCitizenCount <= mafiaCount) {
        //????????? ???
        this.WinMafia();
      }
    });

    this.onMessage("onReport", (client, message) => {
      this.isAlreadyInitVoteResult = false;
      this.isAlreadyVoteResult = false;
      this.isAlreadyStartNextDay = false;

      console.log("?????????: " + message.reporter);
      console.log("??????: " + message.corpse);
      // ?????? ????????? ??????
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
      console.log("?????? ??????");
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

      console.log("?????????");

      console.log(
        `${
          this.state.gameState == 3 ? "???????????? ?????????" : "????????? ?????? ?????????"
        }`
      );
      this.broadcast(
        "onConsoleLog",
        `${
          this.state.gameState == 3 ? "???????????? ?????????" : "????????? ?????? ?????????"
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

      console.log("??? ???????????? ?????? ???: " + this.state.voteCount);

      console.log("???????????? ???: " + this.GetMafiaPlayerCount());

      this.broadcast("onAbstain", message);

      let livingCount = this.getLivingCount();

      console.log("???????????? ???????????? ???: " + livingCount);
      if (this.state.voteCount == livingCount) {
        this.onVoteResult();
      }
    });

    this.onMessage("onVote", (client, message) => {
      console.log(
        "????????? ??????: " +
          message.playerId +
          " ???????????? ??????: " +
          message.targetPlayerId
      );
      // ???????????? ?????? ??? ????????????
      this.state.voteCount++;

      const player = this.state.players.get(client.sessionId);
      player.isAbstention = false;
      player.isVoted = true;
      player.voteTarget = message.targetPlayerId;
      const targetPlayer = this.state.players.get(message.targetPlayerId);
      targetPlayer.votedCount++;

      console.log(`?????? ???????????? ?????? ???: ${targetPlayer.votedCount}`);
      this.broadcast(
        "onConsoleLog",
        `?????? ???????????? ?????? ???: ${targetPlayer.votedCount}`
      );

      console.log(`??? ???????????? ?????? ???: ${this.state.voteCount}`);
      this.broadcast("onConsoleLog");
      console.log(`??? ?????? ???: ${this.state.abstentionCount}`);
      this.broadcast(
        "onConsoleLog",
        `??? ?????? ???: ${this.state.abstentionCount}`
      );
      console.log(`???????????? ???: ${this.GetMafiaPlayerCount()}`);
      this.broadcast(
        "onConsoleLog",
        `???????????? ???: ${this.GetMafiaPlayerCount()}`
      );
      message.voteCount = this.state.voteCount;
      message.abstentionCount = this.state.abstentionCount;
      this.broadcast("onVote", message);

      let livingCount = this.getLivingCount();

      console.log("???????????? ???????????? ???: " + livingCount);
      if (this.state.voteCount == livingCount) {
        this.onVoteResult();
      }
    });

    this.onMessage("onCompleteMission", (client, message) => {
      // ?????? ???????????? ?????? ??????
      const player = this.state.players.get(client.sessionId);
      console.log(message.missionIndex);

      console.log(player.completeMissionList);
      console.log(player.completeMissionList.length == 0);
      console.log(player.completeMissionList == "");
      let completeMissionList: string[];
      if (player.completeMissionList == "") {
        completeMissionList = [];
        console.log("??????: 0 ????????? ??????" + completeMissionList.length);
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
          console.log(`?????? - ${player.completeMissionList}`);
          console.log(
            `?????? ??????: ${
              player.missionList.split(",").length
            }, ????????? ??????: ${addNum}`
          );
        }
      });

      console.log("??? ??????: " + totalNum + " ????????? ??????: " + totalCompleteNum);
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
      console.log("?????????");
      return;
    }

    let max = 0;
    let targetSessionId: string[] = [];
    this.state.players.forEach((player, sessionId) => {
      if (player.isMafiaPlayer && player.InGamePlayerState == 1) {
        console.log(
          player.sessionId + " ??????????????? ?????? ??????: " + player.votedCount
        );
        this.broadcast(
          "onConsoleLog",
          `${player.sessionId} ??????????????? ?????? ??????: ${player.votedCount}`
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
        console.log(`?????? ?????? ?????? ????????????: ${item}`);
        this.broadcast("onConsoleLog", `?????? ?????? ?????? ????????????: ${item}`);

        const player = this.state.players.get(item);
        player.InGamePlayerState = 2; // GHOST

        this.broadcast("onVoteResultEventInit", item.toString());
      });
    }
    this.broadcast("onVoteResult", "");

    console.log(
      `?????? ??????: ${
        max == this.state.abstentionCount ? `?????? ????????? ${max}` : max
      }`
    );

    this.broadcast(
      "onConsoleLog",
      `?????? ??????: ${
        max == this.state.abstentionCount ? `?????? ????????? ${max}` : max
      }`
    );
    console.log(
      `?????? ??????: ${
        max == this.state.abstentionCount ? `?????? ????????? ${max}` : max
      }`
    );
    const livingCitizenCount = this.getLivingCitizenCount();
    const mafiaCount = this.getMafiaCount();
    console.log(`?????? ???????????? ?????? ???: ${livingCitizenCount}`);
    console.log(`?????? ????????? ???: ${mafiaCount}`);

    this.broadcast(
      "onConsoleLog",
      `?????? ???????????? ?????? ???: ${livingCitizenCount}`
    );
    this.broadcast("onConsoleLog", `?????? ????????? ???: ${mafiaCount}`);
  }

  VoteResult() {
    const livingCitizenCount = this.getLivingCitizenCount();
    const mafiaCount = this.getMafiaCount();

    if (mafiaCount == 0) {
      //?????? ???
      this.WinCitizen();
    } else if (livingCitizenCount <= mafiaCount) {
      //????????? ???
      this.WinMafia();
    } else {
      // StartNextDay

      let max = -1;
      let targetSessionId: string[] = [];
      this.state.players.forEach((player, sessionId) => {
        if (player.isMafiaPlayer && player.InGamePlayerState == 1) {
          console.log(
            `${player.sessionId} ??????????????? ?????? ??????: ${player.votedCount}`
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
          console.log("?????? ?????? ?????? ????????????: " + item);
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
        console.log("Player??? ????????? ??????????????? ??????: " + player.sessionId);
        return;
      }
      this.broadcast("onConsoleLog", `${player.sessionId}??? Idx : ${Idx}`);
      player.order = Idx;
      Idx++;
      Idx %= 8;
    });

    let mafiaPlayerCount = this.GetMafiaPlayerCount();

    const ran = Math.floor(Math.random() * mafiaPlayerCount);

    this.broadcast(
      "onConsoleLog",
      `????????? Idx: ${ran}, ?????? ${mafiaPlayerCount}`
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
          "?????????: " + player.sessionId + "   " + player.zepetoUserId
        );
        this.broadcast(
          "onConsoleLog",
          `?????????: ${player.sessionId}, UserId: ${player.zepetoUserId}`
        );
      } else {
        player.jobState = 1; // Citizen
      }
      const selectCount = 3; /// ?????? ?????? ??????
      const totalCount = 11; /// ?????? ?????? ??????
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
        `${player.sessionId}??? ?????? ?????????: ${randomIndexArray.toString()}`
      );
      console.log("?????? ?????????");
      console.log(randomIndexArray);
      console.log(randomIndexArray.toString());
      player.missionList = randomIndexArray.toString();
      num++;
    });
  }

  onJoin(client: SandboxPlayer) {
    // schemas.json ?????? ????????? player ????????? ?????? ??? ????????? ??????.
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
    // client ????????? ?????? ????????? sessionId ??? ???????????? ?????? ????????? ??????.
    // set ?????? ????????? player ????????? ?????? ????????? ???????????????????????? players ????????? add_OnAdd ???????????? ???????????? ?????? ??? ??? ??????.
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
          // ????????? ????????? ????????? ??????
          this.WinError();
        } else if (this.state.gameState == 2) {
          // play
          const livingCitizenCount = this.getLivingCitizenCount();
          const mafiaCount = this.getMafiaCount();
          console.log("?????? ???????????? ???????????? ???: " + livingCitizenCount);

          console.log("?????? ????????? ???: " + mafiaCount);

          // if (mafiaCount == 0 && livingCitizenCount == 0) {
          // }
          if (mafiaCount == 0 && livingCitizenCount != 0) {
            this.WinCitizen();
            //?????? ???
          } else if (mafiaCount != 0 && livingCitizenCount <= mafiaCount) {
            //????????? ???
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
                console.log(`?????? - ${player.completeMissionList}`);
                console.log(
                  `?????? ??????: ${
                    player.missionList.split(",").length
                  }, ????????? ??????: ${addNum}`
                );
              }
            });

            console.log(
              "??? ??????: " + totalNum + " ????????? ??????: " + totalCompleteNum
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
          // vote ?????? ????????? ??????
          const livingCitizenCount = this.getLivingCitizenCount();
          const mafiaCount = this.getMafiaCount();
          console.log("?????? ???????????? ???????????? ???: " + livingCitizenCount);

          console.log("?????? ????????? ???: " + mafiaCount);

          // ?????? ?????? ????????? ?????? - EventReset
          // ?????? ?????? ????????? ?????? -

          if (mafiaCount == 0 && livingCitizenCount != 0) {
            //?????? ????????? ?????? ????????? ?????? ??? ?????? ??????
            this.WinCitizen();
            //?????? ?????? ????????? ??? ?????? ??????
            // ?????? ?????? ????????? ?????? ui??? ??????(??????) ??? ?????? ??????
            // this.DelayWinCitizen();
            //?????? ???
          } else if (mafiaCount != 0 && livingCitizenCount <= mafiaCount) {
            //????????? ???
            //?????? ????????? ?????? ????????? ?????? ??? ?????? ??????
            // ?????? ?????? ????????? ?????? ui??? ??????(??????) ??? ?????? ??????
            //?????? ?????? ????????? ??? ?????? ??????
            this.WinMafia();

            // this.DelayWinMafia();
          } else if (livingCitizenCount == 0 && mafiaCount == 0) {
            this.WinError();
            //?????? ????????? ?????? ????????? ?????? ??? ?????? ?????????
            //?????? ?????? ????????? ??? ?????? ?????????
            // ?????? ?????? ????????? ?????? ui??? ??????(??????) ??? ?????? ?????????
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
    console.log("?????? ?????? ???!");
    this.broadcast("onMissionWin", "");
    this.ResetGame();
  }

  WinCitizen() {
    console.log("?????? ???");
    this.broadcast("onCitizenWin", "");
    this.ResetGame();
  }
  WinMafia() {
    console.log("????????? ???");
    this.broadcast("onMafiaWin", "");
    this.ResetGame();
  }
  WinError() {
    console.log("?????? ???");
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
