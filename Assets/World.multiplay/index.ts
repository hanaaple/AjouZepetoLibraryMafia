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
