import { GameObject } from "UnityEngine";
import { Image, Text } from "UnityEngine.UI";
import { ZepetoPlayers } from "ZEPETO.Character.Controller";
import { RoomData } from "ZEPETO.Multiplay";
import { ZepetoScriptBehaviour } from "ZEPETO.Script";
import ClientStarter from "../ClientStarter";
import { ButtonType, JobState } from "../Constants/Enum";
import Citizen from "./Citizen";
import Mafia from "./Mafia";
import MissionInteractor from "./MissionInteractor";
import PlayerId from "./PlayerId";

export default class MafiaMissionList extends ZepetoScriptBehaviour {
  public missionBarImage: Image;

  public missionInteractors: GameObject[];
  private _missionInteractors: MissionInteractor[];

  private selectedMissionInteractors: MissionInteractor[];

  public missionLists: Text[];

  public missionProgressBar: Image;

  Start() {
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("UpdateMissionBar", (message: string) => {
          let percantage: number = parseFloat(message);
          this.missionBarImage.fillAmount = percantage;
        });
    });
    this._missionInteractors = new Array<MissionInteractor>();
    this.missionInteractors.forEach((item, index) => {
      const interactor = item.GetComponent<MissionInteractor>();
      this._missionInteractors.push(interactor);
    });
  }

  Initialize(missionListIdx: string) {
    this.selectedMissionInteractors = new Array<MissionInteractor>();

    this._missionInteractors.forEach((interactor, index) => {
      interactor.enabled = false;
      interactor.isSuccess = false;
    });

    console.log("미션 초기화 " + missionListIdx.toString());
    const idxs = missionListIdx.toString().split(",");
    idxs.forEach((item, idx) => {
      const missionIdx = parseInt(item);

      this._missionInteractors[missionIdx].Initialize(
        this.missionProgressBar,
        this.missionLists[idx],
        this.Complete
      );
      this.selectedMissionInteractors.push(
        this._missionInteractors[missionIdx]
      );
      console.log(
        "idx: " +
          missionIdx +
          ", " +
          idx +
          " " +
          this._missionInteractors[missionIdx].context
      );
      this._missionInteractors[missionIdx].index = idx;
      this._missionInteractors[missionIdx].missionIndex = missionIdx;

      this._missionInteractors[missionIdx].text.text =
        this._missionInteractors[missionIdx].context;
      this._missionInteractors[missionIdx].enabled = true;
    });

    this.missionBarImage.fillAmount = 0;
  }

  Complete(mission: MissionInteractor) {
    console.log(this);
    console.log(mission);
    console.log(mission.index);
    console.log(this.missionLists);
    if (mission.text) {
      mission.text.text = "(완료)" + mission.context;
    }

    //해당 미션 체크, 슬라이드
    const playerId =
      ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<PlayerId>();

    let player = null;
    if (playerId.jobState == JobState.Mafia) {
      player =
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<Mafia>();
    } else if (playerId.jobState == JobState.Citizen) {
      player =
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.GetComponent<Citizen>();
    }
    console.log(player);
    if (player) {
      player.ActiveInteractUi(ButtonType.MISSION, false);
    }

    const data = new RoomData();
    data.Add("missionIndex", mission.missionIndex);

    ClientStarter.instance
      .GetRoom()
      .Send("onCompleteMission", data.GetObject());
  }
}
