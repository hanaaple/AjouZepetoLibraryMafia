declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		voteCount: number;
		abstentionCount: number;
		gameState: number;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoHash: string;
		zepetoUserId: string;
		transform: Transform;
		state: number;
		subState: number;
		jobState: number;
		InGamePlayerState: number;
		order: number;
		gesture: string;
		missionList: string;
		completeMissionList: string;
		votedCount: number;
		isReady: boolean;
		isPlay: boolean;
		isMafiaPlayer: boolean;
		isAbstention: boolean;
		isVoted: boolean;
		voteTarget: string;
	}
	class Transform extends Schema {
		position: Vector3;
		rotation: Vector3;
	}
	class Vector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
}