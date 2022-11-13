import { WaitForSeconds } from "UnityEngine";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";

export default class WaitForSecondsCash extends ZepetoScriptBehaviour {
  private static _instance: WaitForSecondsCash;

  public static get instance(): WaitForSecondsCash {
    return this._instance;
  }

  private _timeInterval: Map<number, WaitForSeconds>;

  Awake() {
    WaitForSecondsCash._instance = this;
    this._timeInterval = new Map<number, WaitForSeconds>();
  }
  public WaitForSeconds(seconds: number): WaitForSeconds {
    if (!this._timeInterval.has(seconds)) {
      this._timeInterval.set(seconds, new WaitForSeconds(seconds));
    }
    return this._timeInterval.get(seconds);
  }
}
