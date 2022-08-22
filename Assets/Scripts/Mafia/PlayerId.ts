import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class PlayerId extends ZepetoScriptBehaviour {
  public sessionId: string;
  public isDead: boolean = false;
}
