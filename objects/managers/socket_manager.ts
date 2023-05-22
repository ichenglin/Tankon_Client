import { io, Socket } from "socket.io-client";
import { Socket as Engine } from "engine.io-client";
import { player_client, player_manager, projectile_manager } from "@/pages";
import { PlayerMovement, PlayerData, PlayerShield, PlayerSpectate } from "../player";
import Vector2D from "../vector_2d";
import { RoomData, RoomScoreboard, RoomStatus } from "@/components/scoreboard";

export default class SocketManager {

    private socket_client: Socket;
    private socket_engine: Engine;

    private room_data:     RoomData;

    constructor(socket_url: string) {
        const socket_url_parsed = new URL(socket_url);
        this.socket_client      = io(socket_url_parsed.origin, {path: socket_url_parsed.pathname});
        this.socket_engine      = this.socket_client.io.engine;
        this.room_data          = {
            score_red:      0,
            score_blue:     0,
            round_status:   RoomStatus.INTERMISSION,
            round_lifespan: 0,
            round_birthday: Date.now()
        };
        // engine events
        player_client.connection_transport = this.socket_engine.transport.name;
        this.socket_engine.once("upgrade", () => player_client.connection_transport = this.socket_engine.transport.name);
        // socket events
        this.client_events();
    }

    private client_events() {
        // handle events
        this.socket_client.on("player_join", (player_data: PlayerData) => {
            player_manager.player_add(player_data);
        });
        this.socket_client.on("player_quit", (player_id: string) => {
            player_manager.player_remove(player_id);
        })
		this.socket_client.on("player_move", (player_id: string, movement_data: PlayerMovement) => {
            Object.setPrototypeOf(movement_data.movement_origin, Vector2D.prototype);
            // disable absolute timing for now to provide smoother but delayed movement
            movement_data.movement_timestamp = Date.now();
            player_manager.player_get(player_id)?.chassis_update_movement(movement_data);
        });
		this.socket_client.on("player_projectile", (player_projectile) => {
            projectile_manager.projectile_register(player_projectile);
        });
        this.socket_client.on("player_teleport", (player_coordinates: Vector2D) => {
            Object.setPrototypeOf(player_coordinates, Vector2D.prototype);
            player_manager.chassis_teleport(player_coordinates);
        });
        this.socket_client.on("player_data", (player_data: PlayerData[]) => {
            player_data.forEach(loop_leaderboard => {
                const leaderboard_player = player_manager.player_get(loop_leaderboard.player_id);
                leaderboard_player?.data_set(loop_leaderboard);
            });
        });
        this.socket_client.on("player_kill", (killer_id: string, victim_ids: string[]) => {
            // check if controller is killed
            const controller_id = player_manager.controller_get().data_get().player_id;
            if (!victim_ids.includes(controller_id)) return;
            // check if attacker exist
            const killer_player = player_manager.player_get(killer_id);
            if (killer_player === undefined) return;
            // apply spectate
            player_manager.controller_get().spectate_set({
                spectate_target:    killer_player,
                spectate_timestamp: Date.now(),
                spectate_lifespan:  (5 * (1E3))
            } as PlayerSpectate);
        });
        this.socket_client.on("player_shield", (player_id: string, player_shield: PlayerShield) => {
            const player_object             = player_manager.player_get(player_id);
            // transform shield so its animation is smooth
            const player_shield_transformed = {
                shield_timestamp: Date.now(),
                shield_lifespan:  player_shield.shield_lifespan - (Date.now() - player_shield.shield_timestamp)
            } as PlayerShield;
            player_object?.shield_set(player_shield_transformed);
        });
        this.socket_client.on("room_data", (room_data: RoomData) => {
            this.room_data = room_data;
        });
        this.socket_client.on("server_ping", () => {
            this.socket_client.emit("client_pong", Date.now());
        });
    }

    public client_connect(player_username: string): void {
        this.socket_client.emit("room_join", player_username, null, (join_status: any) => {
			if (!join_status.success) return;
			player_client.player_room = join_status.player_room;
            player_manager.controller_get().data_set(join_status.player_data);
		});
    }

    public client_hit(victim_ids: string[]): void {
        this.socket_client.emit("player_hit", victim_ids);
    }

    public client_get(): Socket {
        return this.socket_client;
    }

    public engine_get(): Engine {
        return this.socket_engine;
    }

    public scoreboard_get(): RoomScoreboard {
        const round_age      = (Date.now() - this.room_data.round_birthday);
        const round_lifetime = (this.room_data.round_lifespan - round_age);
        return {
            score_red:      this.room_data.score_red,
            score_blue:     this.room_data.score_blue,
            round_status:   this.room_data.round_status,
            round_lifetime: round_lifetime
        } as RoomScoreboard;
    }

}