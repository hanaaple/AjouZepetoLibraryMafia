declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		readyPlayerCount: number;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoHash: string;
		zepetoUserId: string;
		transform: Transform;
		state: number;
		subState: number;
		GamePlayerState: number;
		jobState: number;
		InGamePlayerState: number;
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