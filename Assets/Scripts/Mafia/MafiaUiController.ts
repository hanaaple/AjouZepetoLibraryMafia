import { GameObject } from "UnityEngine";
import { Button, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import MafiaGameManager from "./MafiaGameManager";

export default class MafiaGameUiController extends ZepetoScriptBehaviour {
  public gameManager: GameObject;
  private _gameManager: MafiaGameManager;

  public attendButton: Button;

  public playerCount: number;
  public text: Text;

  Start() {
    this._gameManager = this.gameManager.GetComponent<MafiaGameManager>();
    this.attendButton.onClick.AddListener(() => {
      this.OnClickAttendGame();
    });
  }

  public UpdatePlayerCount(playerCount: number) {
    this.playerCount = playerCount;
    this.text.text = playerCount.toString();
  }

  OnClickAttendGame() {
    this._gameManager.AddReadyPlayer();
  }
}
