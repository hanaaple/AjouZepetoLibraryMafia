import { GameObject, Time } from "UnityEngine";
import { Button, Text } from "UnityEngine.UI";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import MafiaGameManager, { MafiaPlayerState } from "./MafiaGameManager";

export default class MafiaGameUiController extends ZepetoScriptBehaviour {
  public gameManager: GameObject;
  private _gameManager: MafiaGameManager;

  @SerializeField()
  private readyPanel: GameObject;

  public attendButton: Button;

  public playerCount: number;
  public text: Text;

  public startCount: number;
  public startCountText: Text;

  private playerState: MafiaPlayerState = MafiaPlayerState.None;
  Start() {
    this._gameManager = this.gameManager.GetComponent<MafiaGameManager>();
    this.attendButton.onClick.AddListener(() => {
      if (this.playerState == MafiaPlayerState.None) {
        this.playerState = MafiaPlayerState.Ready;
        this._gameManager.GameStateUpdate(MafiaPlayerState.Ready);
      } else if (this.playerState == MafiaPlayerState.Ready) {
        this.playerState = MafiaPlayerState.None;
        this._gameManager.GameStateUpdate(MafiaPlayerState.None);
      }
    });
  }

  public UpdatePlayerCount(playerCount: number) {
    this.playerCount = playerCount;
    this.text.text = "플레이어 수" + playerCount.toString();
  }

  public *GameStartCount(playerCount: number) {
    this.attendButton.gameObject.SetActive(false);
    this.text.text = "";
    this.startCount = playerCount;
    while (this.startCount > 0) {
      this.startCount -= Time.deltaTime;
      this.startCountText.text = "스타트 카운트" + this.startCount.toString();
      yield null;
    }
    this.startCountText.text = "시작";
    this.readyPanel.SetActive(false);
  }
}
