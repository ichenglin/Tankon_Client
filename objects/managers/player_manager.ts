import { collision_manager, context_manager, keypress_manager, projectile_manager, socket_manager } from "@/pages";
import Player, { PlayerMovement, PlayerProfile } from "../player";
import Vector2D from "../vector_2d";

import { Sono } from "next/font/google";

const font_sono = Sono({subsets: ["latin"]});

export default class PlayerManager {

    private player_online:     Map<string, Player>;
    private controller_player: Player;

    // loop intervals
    private turret_firing:     number | undefined;

    constructor() {
        this.player_online       = new Map<string, Player>();
        this.controller_player   = new Player({player_id: "", player_username: "You"});
    }

    public turret_firemode(turret_firemode: boolean) {
        // stop the current interval no matter firing or not
        if (this.turret_firing !== undefined) window.clearInterval(this.turret_firing);
        this.turret_firing = undefined;
        // set new interval if enabled
        if (turret_firemode !== true) return;
        this.turret_firing = window.setInterval(() => {
            const turret_coordinates = this.controller_player.turret_get_coordinates();
            projectile_manager.projectile_add(turret_coordinates, 1000, 10, this.controller_player.profile_get().player_id);
        }, (this.controller_player.tank_get().turret_firerate*1000));
    }

    public turret_update_heading(mouse_event: MouseEvent) {
        const heading_x = (mouse_event.pageX - (window.innerWidth / 2));
        const heading_y = ((window.innerHeight / 2) - mouse_event.pageY);
        if (heading_x === 0 && heading_y === 0) return;
        // update heading direction
        const heading_new = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0);
        this.controller_player.turret_update_direction(heading_new.vector_get_direction());
    }

    public chassis_update_movement() {
        const heading_x         = (keypress_manager.get_press("d") as unknown as number) - (keypress_manager.get_press("a") as unknown as number);
        const heading_y         = (keypress_manager.get_press("w") as unknown as number) - (keypress_manager.get_press("s") as unknown as number);
        // check if player moves
        const controller_coordinates = this.controller_player.chassis_get_coordinates();
        const controller_moving      = heading_x !== 0 || heading_y !== 0;
        const movement_data          = (!controller_moving) ? {
            // stop movement
            movement_origin:    controller_coordinates,
            movement_proceed:   false,
            movement_lifespan:  null,
            movement_timestamp: Date.now()
        } : (() => {
            // proceed movement
            const movement_heading   = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0).vector_get_direction();
            const movement_collision = collision_manager.collision_get(controller_coordinates.vector_duplicate().vector_set(null, null, movement_heading, 0));
            const movement_lifespan  = movement_collision !== null ? (Math.max((movement_collision.collision_length - 1E-4), 0) / this.controller_player.tank_get().chassis_velocity) : null;
            return {
                movement_origin:    controller_coordinates.vector_duplicate().vector_set(null, null, movement_heading, 0),
                movement_proceed:   true,
                movement_lifespan:  movement_lifespan,
                movement_timestamp: Date.now()
            };
        })();
        this.controller_player.chassis_update_movement(movement_data);
        socket_manager.client_get().emit("player_move", movement_data);
    }

    public chassis_teleport(chassis_coordinates: Vector2D) {
        const movement_data: PlayerMovement = {
            movement_origin:    chassis_coordinates,
            movement_proceed:   false,
            movement_lifespan:  null,
            movement_timestamp: Date.now()
        }
        this.controller_player.chassis_update_movement(movement_data);
        this.chassis_update_movement();
    }

    public controller_get(): Player {
        return this.controller_player;
    }

    public player_add(player_profile: PlayerProfile): void {
        this.player_online.set(player_profile.player_id, new Player(player_profile));
    }

    public player_remove(player_id: string): void {
        this.player_online.delete(player_id);
    }

    public player_get(player_id: string): Player | undefined {
        if (player_id === this.controller_player.profile_get().player_id) return this.controller_player;
        return this.player_online.get(player_id);
    }

    public player_all(): Player[] {
        return Array.from(this.player_online.values());
    }

    public player_render(): void {
        const player_online = this.player_all();
		for (let player_index = 0; player_index < player_online.length; player_index++) {
			const player_object = player_online[player_index];
			const player_name   = player_object.profile_get().player_username;
			context_manager.canvas_image("/tanks/chassis.png", player_object.chassis_get_coordinates(), 1);
			context_manager.canvas_image("/tanks/turret.png", player_object.turret_get_coordinates(), 1);
			context_manager.canvas_text(player_name, player_object.chassis_get_coordinates().vector_duplicate().vector_offset(0, -70, 0, 0), font_sono.style.fontFamily, 30, "center");
		}
    }

}