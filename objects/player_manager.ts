import Coordinates from "./coordinates";
import KeyPressManager from "./keypress_manager";

export default class PlayerManager {

    // settings
    private chassis_velocity: number = 200; // pixels per second

    // states
    private chassis_coordinate: Coordinates;
    private chassis_movement:   boolean;
    private turret_direction:   number;

    constructor() {
        this.chassis_coordinate = new Coordinates(0, 0, 0);
        this.chassis_movement   = false;
        this.turret_direction   = 0;
    }

    public chassis_update_heading(keypress_manager: KeyPressManager) {
        const heading_x         = (keypress_manager.get_press("d") as unknown as number) - (keypress_manager.get_press("a") as unknown as number);
        const heading_y         = (keypress_manager.get_press("w") as unknown as number) - (keypress_manager.get_press("s") as unknown as number);
        // check if player moves
        this.chassis_movement = heading_x !== 0 || heading_y !== 0;
        if (!this.chassis_movement) return;
        // update heading direction
        let heading_direction = Math.atan(heading_y / heading_x);
        // patches the range of arctangent
        if (heading_x < 0) heading_direction += Math.PI;
        this.chassis_coordinate.set(null, null, heading_direction);
    }

    public chassis_update_movement(rerender_interval: number) {
        if (!this.chassis_movement) return;
        const movement_distance = this.chassis_velocity * (rerender_interval / 1000);
        const movement_x        = movement_distance * Math.cos(this.chassis_coordinate.get_direction());
        const movement_y        = movement_distance * Math.sin(this.chassis_coordinate.get_direction());
        this.chassis_coordinate.offset(movement_x, movement_y, 0);
    }

    public chassis_get_coordinates(): Coordinates {
        return this.chassis_coordinate;
    }

    public turret_update_heading(mouse_event: MouseEvent) {
        const heading_x = (mouse_event.pageX - (window.innerWidth / 2));
        const heading_y = ((window.innerHeight / 2) - mouse_event.pageY);
        if (heading_x === 0 && heading_y === 0) return;
        // update heading direction
        let heading_direction = Math.atan(heading_y / heading_x);
        // patches the range of arctangent
        if (heading_x < 0) heading_direction += Math.PI;
        this.turret_direction = heading_direction;
    }

    public turret_get_direction(): number {
        return this.turret_direction;
    }

}