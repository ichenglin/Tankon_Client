import Vector2D from "./vector_2d";

export default class Player {

    private player_data:        PlayerData;
    private player_tank:        PlayerTank;
    private player_movement:    PlayerMovement;
    private player_latency:     PlayerLatency;
    private turret_direction:   number;

    constructor(player_data: PlayerData) {
        this.player_data = player_data;
        this.player_tank = {
            chassis_velocity: 300, // pixels per second
            turret_firerate:  0.15 // shells per second
        };
        this.player_movement = {
            movement_origin:    new Vector2D(0, 0, 0, 0),
            movement_proceed:   false,
            movement_lifespan:  null,
            movement_timestamp: Date.now()
        };
        this.player_latency = {
            client_send:    0,
            client_receive: 0
        }
        this.turret_direction = 0;
    }

    public chassis_update_movement(movement_new: PlayerMovement): void {
        this.player_movement = movement_new;
    }

    public chassis_get_coordinates(): Vector2D {
        if (!this.player_movement.movement_proceed) {
            return this.player_movement.movement_origin;
        }
        const movement_timespan = Math.min(((Date.now() - this.player_movement.movement_timestamp) / 1E3), (this.player_movement.movement_lifespan !== null ? this.player_movement.movement_lifespan : Number.MAX_VALUE));
        const movement_distance = this.player_tank.chassis_velocity * movement_timespan;
        return this.player_movement.movement_origin.vector_duplicate().vector_set(null, null, null, movement_distance).vector_get_destination();
    }

    public turret_update_direction(turret_direction: number): void {
        this.turret_direction = turret_direction;
    }

    public turret_get_coordinates(): Vector2D {
        return this.chassis_get_coordinates().vector_duplicate().vector_set(null, null, this.turret_direction, null);
    }

    public tank_get(): PlayerTank {
        return this.player_tank;
    }

    public data_set(player_data: PlayerData): void {
        this.player_data = player_data;
    }

    public data_get(): PlayerData {
        return this.player_data;
    }

    public movement_get(): PlayerMovement {
        return this.player_movement;
    }

    public latency_set(player_latency: PlayerLatency): void {
        this.player_latency = player_latency;
    }

    public latency_get(): PlayerLatency {
        return this.player_latency;
    }
}

export interface PlayerData {
    player_id:       string,
    player_username: string,
    player_team:     PlayerTeam,
    player_kills:    number,
    player_deaths:   number,
    player_latency:  PlayerLatency
}

export interface PlayerTank {
    chassis_velocity: number,
    turret_firerate:  number
};

export interface PlayerMovement {
    movement_origin:    Vector2D,
    movement_proceed:   boolean,
    movement_lifespan:  number | null,
    movement_timestamp: number
}

export interface PlayerLatency {
    client_send:    number, // client to server
    client_receive: number  // server to client
}

export enum PlayerTeam {
    TEAM_RED,
    TEAM_BLUE,
    TEAM_LOBBY
}