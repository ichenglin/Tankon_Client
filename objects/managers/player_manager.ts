import { collision_manager, keypress_manager, projectile_manager, socket_manager } from "@/pages";
import Player from "../player";
import Vector2D from "../vector_2d";

export default class PlayerManager {

    private player_online: Map<string, Player>;

    private controller_player: Player;

    constructor() {
        this.player_online       = new Map<string, Player>();
        this.controller_player   = new Player();
    }

    public turret_update_heading(mouse_event: MouseEvent) {
        const heading_x = (mouse_event.pageX - (window.innerWidth / 2));
        const heading_y = ((window.innerHeight / 2) - mouse_event.pageY);
        if (heading_x === 0 && heading_y === 0) return;
        // update heading direction
        const heading_new = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0);
        this.controller_player.turret_update_direction(heading_new.vector_get_direction());
    }

    public chassis_update_heading() {
        const heading_x         = (keypress_manager.get_press("d") as unknown as number) - (keypress_manager.get_press("a") as unknown as number);
        const heading_y         = (keypress_manager.get_press("w") as unknown as number) - (keypress_manager.get_press("s") as unknown as number);
        // check if player moves
        const controller_coordinates = this.controller_player.chassis_get_coordinates();
        const controller_moving      = heading_x !== 0 || heading_y !== 0;
        // stop movement if matches
        if (!controller_moving) {
            this.controller_player.chassis_update_movement({
                movement_origin:    controller_coordinates,
                movement_proceed:   false,
                movement_lifespan:  null,
                movement_timestamp: Date.now()
            });
            return;
        }
        // proceed movement
        const movement_heading   = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0).vector_get_direction();
        const movement_collision = collision_manager.collision_get(controller_coordinates.vector_duplicate().vector_set(null, null, movement_heading, 0));
        let   movement_lifespan  = movement_collision !== null ? (Math.max((movement_collision.collision_length - 1E-4), 0) / this.controller_player.tank_get().chassis_velocity) : null;
        this.controller_player.chassis_update_movement({
            movement_origin:    controller_coordinates.vector_duplicate().vector_set(null, null, movement_heading, 0),
            movement_proceed:   true,
            movement_lifespan:  movement_lifespan,
            movement_timestamp: Date.now()
        });
    }

    public controller_get(): Player {
        return this.controller_player;
    }

    public player_add(player_id: string): void {
        this.player_online.set(player_id, new Player());
    }

    public player_get(player_id: string): Player | undefined {
        return this.player_online.get(player_id);
    }

}