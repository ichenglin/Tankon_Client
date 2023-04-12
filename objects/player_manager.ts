import { collision_manager, keypress_manager, projectile_manager } from "@/pages";
import Vector2D from "./vector_2d";

export default class PlayerManager {

    // settings
    private chassis_velocity: number = 500;  // pixels per second
    private turret_firerate:  number = 0.15; // shells per second

    // states
    private chassis_coordinate: Vector2D;
    private chassis_movement:   boolean;
    private turret_direction:   number;

    // loop intervals
    private turret_firing:      number | undefined;

    constructor() {
        this.chassis_coordinate = new Vector2D(0, 0, 0, 0);
        this.chassis_movement   = false;
        this.turret_direction   = 0;
    }

    public turret_firemode(turret_firemode: boolean) {
        // stop the current interval no matter firing or not
        if (this.turret_firing !== undefined) window.clearInterval(this.turret_firing);
        this.turret_firing = undefined;
        // set new interval if enabled
        if (turret_firemode !== true) return;
        this.turret_firing = window.setInterval(() => {
            projectile_manager.projectile_add(this.turret_get_coordinates().vector_duplicate().vector_offset(0, 0, -0.3, 0), 1000, 10)
            projectile_manager.projectile_add(this.turret_get_coordinates(), 1000, 10)
            projectile_manager.projectile_add(this.turret_get_coordinates().vector_duplicate().vector_offset(0, 0, 0.3, 0), 1000, 10)
        }, (this.turret_firerate*1000));
    }

    public turret_update_heading(mouse_event: MouseEvent) {
        const heading_x = (mouse_event.pageX - (window.innerWidth / 2));
        const heading_y = ((window.innerHeight / 2) - mouse_event.pageY);
        if (heading_x === 0 && heading_y === 0) return;
        // update heading direction
        const heading_new = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0);
        this.turret_direction = heading_new.vector_get_direction();
    }

    public turret_get_coordinates(): Vector2D {
        return new Vector2D(
            this.chassis_coordinate.point_get_x(),
            this.chassis_coordinate.point_get_y(),
            this.turret_direction,
            0
        );
    }

    public chassis_update_heading() {
        const heading_x         = (keypress_manager.get_press("d") as unknown as number) - (keypress_manager.get_press("a") as unknown as number);
        const heading_y         = (keypress_manager.get_press("w") as unknown as number) - (keypress_manager.get_press("s") as unknown as number);
        // check if player moves
        this.chassis_movement = heading_x !== 0 || heading_y !== 0;
        if (!this.chassis_movement) return;
        // update heading direction
        const heading_new = Vector2D.from_parametric(0, 0, heading_x, heading_y, 0);
        this.chassis_coordinate.vector_set(null, null, heading_new.vector_get_direction(), 0);
    }

    public chassis_update_movement(rerender_interval: number) {
        if (!this.chassis_movement) return;
        let movement_distance   = this.chassis_velocity * (rerender_interval / 1000);
        // check collision with walls
        const movement_collision = collision_manager.collision_get(this.chassis_coordinate);
        // apply movement
        let movement_x = 0, movement_y = 0;
        if (movement_collision === null || movement_collision.collision_length > 1E-2) {
            // free to move or collide into wall
            if (movement_collision !== null && movement_distance > movement_collision.collision_length) movement_distance = movement_collision.collision_length - 1E-4;
            movement_x = movement_distance * Math.cos(this.chassis_coordinate.vector_get_direction());
            movement_y = movement_distance * Math.sin(this.chassis_coordinate.vector_get_direction());
        } else {
            // slide by wall
        }
        this.chassis_coordinate.vector_offset(movement_x, movement_y, 0, 0);
    }

    public chassis_get_coordinates(): Vector2D {
        return this.chassis_coordinate;
    }
}