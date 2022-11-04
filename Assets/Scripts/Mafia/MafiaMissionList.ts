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
    console.log("1");
    this._missionInteractors = new Array<MissionInteractor>();

    console.log("2");
    this.selectedMissionInteractors = new Array<MissionInteractor>();

    console.log("3");
    this.missionInteractors.forEach((item, index) => {
      const interactor = item.GetComponent<MissionInteractor>();
      // interactor.Initialize(
      //   this.missionProgressBar,
      //   this.missionLists[index],
      //   this.Complete
      // );
      this._missionInteractors.push(interactor);
      interactor.enabled = false;
    });
    console.log("4");
    ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
      ClientStarter.instance
        .GetRoom()
        .AddMessageHandler("UpdateMissionBar", (message: string) => {
          let percantage: number = parseFloat(message);
          this.missionBarImage.fillAmount = percantage;
        });
    });
  }

  Initialize(missionListIdx: string) {
    console.log("미션 초기화");
    const idxs = missionListIdx.split(",");
    idxs.forEach((item, idx) => {
      this._missionInteractors[item].Initialize(
        this.missionProgressBar,
        this.missionLists[idx],
        this.Complete
      );
      this._missionInteractors[item].enabled = true;
      this.selectedMissionInteractors.push(this._missionInteractors[item]);
      console.log(
        "idx: " +
          item +
          ", " +
          idx +
          " " +
          this._missionInteractors[item].context
      );
      this._missionInteractors[item].index = idx;
      this._missionInteractors[item].missionIndex = parseInt(item);

      this.missionLists[idx].text = this._missionInteractors[item].context;
      this.missionLists[idx].enabled = true;
    });

    this.missionBarImage.fillAmount = 0;
  }

  Complete(mission: MissionInteractor, text: Text) {
    console.log(this);
    console.log(mission);
    console.log(mission.index);
    console.log(this.missionLists);
    console.log(text);
    if (this.missionLists) {
      this.missionLists[mission.index].text =
        "(완료)" + this.missionLists[mission.index].text;
    } else if (text) {
      text.text = "(완료)" + text.text;
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
