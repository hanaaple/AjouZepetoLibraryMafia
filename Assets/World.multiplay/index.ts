import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { Player, Transform, Vector3 } from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {
  constructor() {
    super();
  }

  onCreate(options: SandboxOptions) {
    // Room 객체가 생성될 때 호출됩니다.
    // Room 객체의 상태나 데이터 초기화를 처리 한다.

    // console.log(options.tickInterval)

    this.state.readyPlayerCount = 0;

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

    this.onMessage("DebugUpdate", (client, message) => {
      console.log("[Debug]: " + message.sentence);
    });

    this.onMessage("onAddMafiaPlayer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.GamePlayerState = message.state;

      // this.broadcast("AddMafiaPlayer", client.sessionId);
    });

    this.onMessage("onNotReadyMafiaPlayer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.GamePlayerState = message.state;
      this.state.readyPlayerCount--;
      this.broadcast("UpdateReadyMafiaPlayer", this.state.readyPlayerCount);
    });

    this.onMessage("onReadyMafiaPlayer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      player.GamePlayerState = message.state;
      this.state.readyPlayerCount++;
      console.log(this.state.readyPlayerCount);
      this.broadcast("UpdateReadyMafiaPlayer", this.state.readyPlayerCount);
      if (this.state.readyPlayerCount == 1) {
        let Idx: number = Math.floor(Math.random() * 8);
        this.state.players.forEach((player: Player) => {
          player.order = Idx;
          Idx++;
          Idx %= 8;
        });
        (async () => {
          const gameCount = 5000;
          this.broadcast("GameStartCount", gameCount / 1000);
          const wait = (timeToDelay: number) =>
            new Promise((resolve) => setTimeout(resolve, timeToDelay)); //이와 같이 선언 후
          await wait(gameCount - 1000);
          this.onStartGame();
        })();
      }
    });

    this.onMessage("onRemoveMafiaPlayer", (client, message) => {
      //딱히
    });

    this.onMessage("onKill", (client, message) => {
      console.log(message.killed);
      console.log(message.mafia);
      const player = this.state.players.get(message.killed);
      player.InGamePlayerState = 2; // GHOST
      this.broadcast("onKill", message);
    });

    this.onMessage("onReport", (client, message) => {
      console.log(message.reporter);
      console.log(message.corpse);
      // 소환 위치는 고정
      this.broadcast("onReport", message);
    });

    this.onMessage("onVote", (client, message) => {
      // 해당 플레이어 투표 표시
      this.broadcast("onVote", message);
    });

    this.onMessage("onVoteResult", (client, message) => {
      // 모든 플레이어에서 투표 합산

      this.broadcast("onVoteResult", message);

      // if (this.state.readyPlayerCount == 1) {
      //   (async () => {
      //     const gameCount = 5000;
      //     this.broadcast("NextDayCount", gameCount / 1000);
      //     const wait = (timeToDelay: number) =>
      //       new Promise((resolve) => setTimeout(resolve, timeToDelay)); //이와 같이 선언 후
      //     await wait(gameCount - 1000);
      //     this.onNextDay();
      //   })();
      // }
    });
  }

  onNextDay() {
    (async () => {
      const gameCount = 1000;
      const wait = (timeToDelay: number) =>
        new Promise((resolve) => setTimeout(resolve, timeToDelay)); //이와 같이 선언 후
      await wait(gameCount);
      this.broadcast("GameStart", "");
    })();
  }

  onStartGame() {
    // const playerCount = this.state.players.size;

    // console.log(playerCount);
    // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
    // for (var i = 0; i < 100; i++) {
    //   console.log(Math.floor(Math.random() * playerCount));
    // }
    // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ");
    // const ran = Math.floor(Math.random() * playerCount);
    const ran = 0;
    // console.log("랜덤" + ran.toString());
    let num: number = 0;
    this.state.players.forEach((player: Player) => {
      console.log(num);
      player.GamePlayerState = 2; // Play
      player.InGamePlayerState = 1; // ALIVE
      if (ran == num) {
        player.jobState = 2; // Mafia
        console.log(
          "너가 마피아 : " + player.sessionId + "   " + player.zepetoUserId
        );
      } else {
        player.jobState = 1; // Citizen
      }
      num++;

      console.log(
        "직업 :  " +
          player.jobState +
          "/" +
          player.GamePlayerState +
          "/" +
          player.InGamePlayerState
      );
    });
    console.log("브로드캐스트");
    (async () => {
      const gameCount = 1000;
      const wait = (timeToDelay: number) =>
        new Promise((resolve) => setTimeout(resolve, timeToDelay)); //이와 같이 선언 후
      await wait(gameCount);
      this.broadcast("GameStart", "");
    })();
  }

  async onJoin(client: SandboxPlayer) {
    // schemas.json 에서 정의한 player 객체를 생성 후 초기값 설정.
    console.log(
      `[OnJoin] sessionId : ${client.sessionId}, HashCode : ${client.hashCode}, userId : ${client.userId}`
    );

    // 입장 Player Storage Load
    const storage: DataStorage = client.loadDataStorage();

    const player = new Player();
    player.sessionId = client.sessionId;

    if (client.hashCode) {
      player.zepetoHash = client.hashCode;
    }
    if (client.userId) {
      player.zepetoUserId = client.userId;
    }

    // storage에 입장 유저의 transform이 존재하는 지 확인한 다음, 갱신합니다.
    const raw_val = (await storage.get("transform")) as string;
    const json_val = raw_val != null ? JSON.parse(raw_val) : JSON.parse("{}");

    const transform = new Transform();
    transform.position = new Vector3();
    transform.rotation = new Vector3();

    if (json_val.position) {
      transform.position.x = json_val.position.x;
      transform.position.y = json_val.position.y;
      transform.position.z = json_val.position.z;
    }

    if (json_val.rotation) {
      transform.rotation.x = json_val.rotation.x;
      transform.rotation.y = json_val.rotation.y;
      transform.rotation.z = json_val.rotation.z;
    }

    // let visit_cnt = await storage.get("VisitCount") as number;
    // if (visit_cnt == null) visit_cnt = 0;

    // console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`)

    // // [DataStorage] Player의 방문 횟수를 갱신한다음 Storage Save
    // await storage.set("VisitCount", ++visit_cnt);

    player.transform = transform;

    // client 객체의 고유 키값인 sessionId 를 사용해서 유져 객체를 관리.
    // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
    this.state.players.set(client.sessionId, player);
    console.log("[Add Player Map]");
  }
  async onLeave(client: SandboxPlayer, consented?: boolean) {
    // 퇴장 Player Storage Load
    const storage: DataStorage = client.loadDataStorage();

    const _player = this.state.players.get(client.sessionId);
    const _pos = _player.transform.position;
    const _rot = _player.transform.rotation;

    const _trans = {
      position: { x: _pos.x, y: _pos.y, z: _pos.z },
      rotation: { x: _rot.x, y: _rot.y, z: _rot.z },
    };

    // console.log(`[onLeave] last transform : ${JSON.stringify(_trans)}`);
    // 퇴장하는 유저의 transform을 json 형태로 저장한 다음, 재접속 시 load 합니다.
    await storage.set("transform", JSON.stringify(_trans));

    // allowReconnection 설정을 통해 순단에 대한 connection 유지 처리등을 할 수 있으나 기본 가이드에서는 즉시 정리.
    // delete 된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnRemove 이벤트를 추가하여 확인 할 수 있음.
    this.state.players.delete(client.sessionId);
  }
}
