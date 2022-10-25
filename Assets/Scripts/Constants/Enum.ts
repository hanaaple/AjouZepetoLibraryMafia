export enum MafiaPlayerState {}
// Ready = 1,
// Play = 2,

export enum JobState {
  None = -2,
  Citizen = 1,
  Mafia = 2,
}

export enum InGameInteractState {
  NONE = 0,
  ALIVE = 1,
  GHOST = 2,
  CORPSE = 3,
  MISSION = 4,
}

export enum ButtonType {
  REPORT,
  MISSION,
  KILL,
}
