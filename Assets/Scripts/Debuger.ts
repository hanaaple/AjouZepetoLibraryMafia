import { Room } from "ZEPETO.Multiplay";
import { State } from "ZEPETO.Multiplay.Schema";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "./ClientStarter";

export default class Debuger extends ZepetoScriptBehaviour {
  Start() {
    ClientStarter.instance.multiplay.RoomJoined += (room: Room) => {
      room.OnStateChange += (state: State, isFirst: boolean) => {
        //console.log("입장 시 " + isFirst);
        if (!isFirst) {
          return;
        }

        ClientStarter.instance
          .GetRoom()
          .AddMessageHandler("onConsoleLog", (message: any) => {
            console.log("[Index.ts] 서버 - " + message);
          });
      };
    };
  }
}
