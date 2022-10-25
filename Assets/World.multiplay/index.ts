import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { Player, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {
  isVoting: boolean;

  constructor() {
    super();
  }

  onCreate(options: SandboxOptions) {
    this.state.readyPlayerCount = 0;
    this.state.gameState = 1;

    this.onMessage("onChangedTransform", (client, message) => {
      console.log("onChangeTransform");
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
    this.onMessage("DebugUpdate", (client, message) => {
      console.log("[Debug]: " + message.sentence);
    });

    this.onMessage("onReadyMafiaPlayer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      this.state.players.forEach((item) => {
        console.log(item.sessionId);
      });
      console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      if (this.state.mafiaPlayers.has(client.sessionId)) {
        this.state.mafiaPlayers.delete(client.sessionId);
        this.state.readyPlayerCount--;
        this.broadcast("UpdateReadyMafiaPlayer", this.state.readyPlayerCount);
        this.broadcast("OnRemoveReadyPlayer", client.sessionId);
      } else {
        this.state.mafiaPlayers.set(client.sessionId, player);

        this.state.readyPlayerCount++;
        this.broadcast("UpdateReadyMafiaPlayer", this.state.readyPlayerCount);
        this.broadcast("OnAddReadyPlayer", client.sessionId);
        /// 플레이어 수
        if (this.state.readyPlayerCount == 6) {
          let Idx: number = Math.floor(Math.random() * 8);
          this.state.mafiaPlayers.forEach((item: Player) => {
            item.order = Idx;
            Idx++;
            Idx %= 8;
          });
          this.state.gameState = 2;
          (async () => {
            const gameCount = 5000;
            this.broadcast("GameStartCount", gameCount / 1000);
            const wait = (timeToDelay: number) =>
              new Promise((resolve) => setTimeout(resolve, timeToDelay + 10)); //이와 같이 선언 후
            await wait(gameCount - 1000);
            console.log("게임 시작 준비");
            this.onStartGame();
          })();
        }
      }

      console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
      this.state.mafiaPlayers.forEach((item) => {
        console.log(item.sessionId);
      });
      console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
    });

    this.onMessage("onRemoveMafiaPlayer", (client, message) => {
      //딱히
    });

    this.onMessage("onKill", (client, message) => {
      const player = this.state.mafiaPlayers.get(message.killed);
      player.InGamePlayerState = 2; // GHOST
      this.broadcast("onKill", message);

      console.log("죽은 거: " + message.killed + "   " + player.zepetoUserId);
      console.log(
        "마녀: " +
          message.mafia +
          "    " +
          this.state.mafiaPlayers.get(message.mafia)?.zepetoUserId
      );

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
      console.log("제보자: " + message.reporter);
      console.log("유령: " + message.corpse);
      // 소환 위치는 고정
      this.isVoting = true;
      this.state.voteCount = 0;
      this.state.abstentionCount = 0;
      this.state.gameState = 3;
      this.state.mafiaPlayers.forEach((player: Player) => {
        player.votedCount = 0;
      });
      this.broadcast("onReport", message);

      (async () => {
        console.log("토론 대기");
        const wait = (timeToDelay: number) =>
          new Promise((resolve) => setTimeout(resolve, timeToDelay + 10)); //이와 같이 선언 후
        await wait(3500);
        let debateTimeout = 5 * 1000;
        this.broadcast("StartDebateCount", debateTimeout / 1000);
        console.log("토론 시작");
        while (debateTimeout > 2000) {
          debateTimeout -= 1000;
          await wait(1000);
        }
        await wait(debateTimeout);
        console.log("토론 종료");
        console.log("투표 시작");
        let voteTimeout = 100 * 1000;
        this.broadcast("onVoteStart", message);
        this.broadcast("StartVoteCount", voteTimeout / 1000);
        while (voteTimeout > 2000) {
          voteTimeout -= 1000;
          await wait(1000);
        }
        await wait(voteTimeout);
        console.log("투표 종료");
        this.onVoteResult();
      })();
    });

    this.onMessage("onAbstain", (client, message) => {
      console.log(message.playerId);
      this.state.voteCount++;
      this.state.abstentionCount++;

      message.voteCount = this.state.voteCount;
      message.abstentionCount = this.state.abstentionCount;

      console.log("총 플레이어 투표 수: " + this.state.voteCount);

      console.log("플레이어 수: " + this.state.mafiaPlayers.size);

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

      const targetPlayer = this.state.mafiaPlayers.get(message.targetPlayerId);
      targetPlayer.votedCount++;

      console.log("타겟 플레이어 투표 수: " + targetPlayer.votedCount);

      console.log("총 플레이어 투표 수: " + this.state.voteCount);

      console.log("총 기권 수: " + this.state.abstentionCount);

      console.log("플레이어 수: " + this.state.mafiaPlayers.size);

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
      const player = this.state.mafiaPlayers.get(client.sessionId);
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
      this.state.mafiaPlayers.forEach((player) => {
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
    if (!this.isVoting) {
      return;
    }

    let max = -1;
    let targetSessionId: string[] = [];
    this.state.mafiaPlayers.forEach((player, sessionId) => {
      if (player.InGamePlayerState == 1) {
        console.log(
          player.sessionId + " 플레이어가 당한 투표: " + player.votedCount
        );
        if (max < player.votedCount) {
          max = player.votedCount;
          targetSessionId = [];
          targetSessionId.push(player.sessionId);
        } else if (max == player.votedCount) {
          targetSessionId.push(player.sessionId);
        }
        if (max == this.state.abstentionCount) {
          max = this.state.abstentionCount;
          targetSessionId = [];
        }
      }
    });

    if (targetSessionId.length == 1) {
      targetSessionId.forEach((item) => {
        console.log("가장 많이 당한 플레이어: " + item);

        const player = this.state.mafiaPlayers.get(item);
        player.InGamePlayerState = 2; // GHOST

        this.broadcast("onVoteResultEventInit", item.toString());
      });
    }

    (async () => {
      const gameCount = 1000;
      const wait = (timeToDelay: number) =>
        new Promise((resolve) => setTimeout(resolve, timeToDelay)); //이와 같이 선언 후
      await wait(gameCount);
      this.isVoting = false;

      this.broadcast("onVoteResult", "");

      await wait(max * 500 + 1000);

      const livingCitizenCount = this.getLivingCitizenCount();
      const mafiaCount = this.getMafiaCount();
      console.log("남은 살아있는 시민 수: " + livingCitizenCount);
      console.log("남은 마피아 수: " + mafiaCount);

      await wait(1000);

      if (mafiaCount == 0) {
        //시민 승
        this.WinCitizen();
      } else if (livingCitizenCount <= mafiaCount) {
        //마피아 승
        this.WinMafia();
      } else {
        // StartNextDay
        if (targetSessionId.length >= 2) {
          this.broadcast("onVoteResultEvent", "");
        } else if (targetSessionId.length == 1) {
          targetSessionId.forEach((item) => {
            console.log("가장 많이 당한 플레이어: " + item);
            this.broadcast("onVoteResultEvent", item.toString());
            this.broadcast("onVoteTarget", item.toString());
          });
        }

        const voteResultToastCount = 3000;
        await wait(voteResultToastCount);
        this.onNextDay();
      }

      const resetCount = 1000;
      await wait(resetCount);
      this.state.voteCount = 0;
      this.state.abstentionCount = 0;
      this.state.mafiaPlayers.forEach((player, sessionId) => {
        player.votedCount = 0;
      });
    })();
  }

  onNextDay() {
    console.log("다음날");

    this.broadcast("onStartNextDay", "");
  }

  onStartGame() {
    const ran = Math.floor(Math.random() * this.state.mafiaPlayers.size);

    let num: number = 0;
    this.state.mafiaPlayers.forEach((player: Player) => {
      console.log(num);
      player.InGamePlayerState = 1; // ALIVE
      if (ran == num) {
        player.jobState = 2; // Mafia
        console.log(
          "너가 마피아 : " + player.sessionId + "   " + player.zepetoUserId
        );
      } else {
        player.jobState = 1; // Citizen
      }
      const selectCount = 3; /// 선택 미션 개수
      const totalCount = 5; /// 미션 최대 개수
      let randomIndexArray = [];
      for (let i = 0; i < selectCount; i++) {
        let randomNum = Math.floor(Math.random() * totalCount);
        if (randomIndexArray.indexOf(randomNum) === -1) {
          randomIndexArray.push(randomNum);
        } else {
          i--;
        }
      }

      randomIndexArray.sort((a: number, b: number): number => {
        return a - b;
      });

      console.log("미션 리스트");
      console.log(randomIndexArray);
      console.log(randomIndexArray.toString());
      player.missionList = randomIndexArray.toString();
      num++;
    });

    (async () => {
      const gameCount = 1000;
      const wait = (timeToDelay: number) =>
        new Promise((resolve) => setTimeout(resolve, timeToDelay + 10)); //이와 같이 선언 후
      await wait(gameCount);
      console.log("게임 시작");
      this.broadcast("GameStart", "");
    })();
  }

  async onJoin(client: SandboxPlayer) {
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
    // client 객체의 고유 키값인 sessionId 를 사용해서 유져 객체를 관리.
    // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
    this.state.players.set(client.sessionId, player);
    console.log("[Add Player Map]");
  }
  async onLeave(client: SandboxPlayer, consented?: boolean) {
    if (this.state.mafiaPlayers.has(client.sessionId)) {
      this.state.mafiaPlayers.delete(client.sessionId);
      if (this.state.gameState == 1) {
        // ready;
        this.state.readyPlayerCount--;
        this.broadcast("UpdateReadyMafiaPlayer", this.state.readyPlayerCount);
      } else if (this.state.gameState == 2) {
        // play
        const livingCitizenCount = this.getLivingCitizenCount();
        const mafiaCount = this.getMafiaCount();
        console.log("남은 살아있는 플레이어 수: " + livingCitizenCount);

        console.log("남은 마피아 수: " + mafiaCount);

        if (mafiaCount == 0) {
          //시민 승
          this.WinCitizen();
        } else if (livingCitizenCount <= mafiaCount) {
          //마피아 승
          this.WinMafia();
        }
      } else if (this.state.gameState == 3) {
        // vote
        const livingCitizenCount = this.getLivingCitizenCount();
        const mafiaCount = this.getMafiaCount();
        console.log("남은 살아있는 플레이어 수: " + livingCitizenCount);

        console.log("남은 마피아 수: " + mafiaCount);

        if (mafiaCount == 0) {
          //시민 승
          this.WinCitizen();
        } else if (livingCitizenCount <= mafiaCount) {
          //마피아 승
          this.WinMafia();
        }

        const livingCount = this.getLivingCount();
        if (this.state.voteCount == livingCount) {
          this.onVoteResult();
        }
      }
    }
    this.state.players.delete(client.sessionId);
  }

  getLivingCitizenCount(): number {
    let livingCount = 0;
    this.state.mafiaPlayers.forEach((player, sessionId) => {
      if (player.jobState == 1 && player.InGamePlayerState == 1) {
        livingCount++;
      }
    });
    return livingCount;
  }

  getLivingCount(): number {
    let livingCount = 0;
    this.state.mafiaPlayers.forEach((player, sessionId) => {
      if (player.InGamePlayerState == 1) {
        livingCount++;
      }
    });
    return livingCount;
  }
  getMafiaCount(): number {
    let mafiaCount = 0;
    this.state.mafiaPlayers.forEach((player, sessionId) => {
      if (player.jobState == 2 && player.InGamePlayerState == 1) {
        mafiaCount++;
      }
    });
    return mafiaCount;
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

  ResetGame() {
    (async () => {
      this.broadcast("onReset", "");

      const gameCount = 1000;
      const wait = (timeToDelay: number) =>
        new Promise((resolve) => setTimeout(resolve, timeToDelay + 10)); //이와 같이 선언 후
      await wait(gameCount);
      this.state.readyPlayerCount = 0;
      this.state.gameState = 1;
      this.state.mafiaPlayers.forEach((player) => {
        player.missionList = "";
        player.completeMissionList = "";
        player.order = 0;
        player.jobState = -2;
        player.InGamePlayerState = 0;
      });
      this.state.mafiaPlayers.clear();
    })();
  }
}
