import ContextManager from "./context_manager";
import Point2D from "./point_2d";
import Vector2D from "./vector_2d";

export default class CollisionManager {

    private collision_hitboxes: CollisionHitbox[] = [];

    constructor(collision_hitboxes: CollisionHitbox[]) {
        this.hitbox_set(collision_hitboxes);
    }

    public collision_get(origin_coordinates: Vector2D) {
        let collision_length:      number  | null = null;
        let collision_coordinates: Point2D | null = null;
        let collision_slope:       number  | null = null;
        let collision_normal:      number  | null = null;
        for (let hitbox_index = 0; hitbox_index < this.collision_hitboxes.length; hitbox_index++) {
            const hitbox_anchors = this.collision_hitboxes[hitbox_index].anchor_get();
            for (let border_index = 0; border_index < hitbox_anchors.length - 1; border_index++ ) {
                const anchor_origin      = hitbox_anchors[border_index];
                const anchor_destination = hitbox_anchors[border_index + 1];
                // parametric of origin's direction
                const heading_x          = Math.cos(origin_coordinates.vector_get_direction());
                const heading_y          = Math.sin(origin_coordinates.vector_get_direction());
                // parametric of border's direction
                const offset_x           = anchor_destination.point_get_x() - anchor_origin.point_get_x();
                const offset_y           = anchor_destination.point_get_y() - anchor_origin.point_get_y();
                // calculates collision
                const border_collision_length = ((heading_x*(anchor_origin.point_get_y()-origin_coordinates.point_get_y())) - (heading_y*(anchor_origin.point_get_x()-origin_coordinates.point_get_x()))) / ((heading_y*offset_x) - (heading_x*offset_y));
                const origin_collision_length = ((offset_y*(origin_coordinates.point_get_x()-anchor_origin.point_get_x()))  - (offset_x*(origin_coordinates.point_get_y()-anchor_origin.point_get_y())))  / ((heading_y*offset_x) - (heading_x*offset_y));
                if (border_collision_length < 0 || border_collision_length > 1 || origin_collision_length < 0) continue;
                if (collision_length !== null && origin_collision_length > collision_length) continue;
                const border_collision_coordinates = anchor_origin.point_duplicate().point_offset((offset_x*border_collision_length), (offset_y*border_collision_length));
                collision_length                   = origin_collision_length;
                collision_coordinates              = border_collision_coordinates
                collision_slope                    = Vector2D.from_parametric(0, 0, offset_x, offset_y, 0).vector_get_direction();
            }
        }
        // process normal direction
        if (collision_slope === null) return null;
        const collision_normal_candidates = [collision_slope + (Math.PI*(1/2)), collision_slope + (Math.PI*(3/2))];
        let collision_normal_direction = 0;
        let collision_normal_acute     = 0;
        for (let candidate_index = 0; candidate_index < collision_normal_candidates.length; candidate_index++) {
            const candidate_direction = collision_normal_candidates[candidate_index] % (Math.PI*2);
            const candidate_acute     = Math.min(
                Math.abs(candidate_direction - origin_coordinates.vector_get_direction()),
                Math.abs(origin_coordinates.vector_get_direction() - candidate_direction + (Math.PI*2))
            );
            if (candidate_acute < collision_normal_acute) continue;
            collision_normal_direction = candidate_direction;
            collision_normal_acute     = candidate_acute;
        }
        collision_normal = collision_normal_direction;
        // package result
        return {
            collision_length:      collision_length      as number,
            collision_coordinates: collision_coordinates as Point2D,
            collision_slope:       collision_slope       as number,
            collision_normal:      collision_normal      as number,
            collision_reflect:     (collision_normal - (origin_coordinates.vector_get_direction()-collision_normal-(Math.PI)))
        };
    }

    public hitbox_set(collision_hitboxes: CollisionHitbox[]): void {
        this.collision_hitboxes = collision_hitboxes;
    }

    public hitbox_render(context_manager: ContextManager): void {
        for (let hitbox_index = 0; hitbox_index < this.collision_hitboxes.length; hitbox_index++) {
            const hitbox_anchors = this.collision_hitboxes[hitbox_index].anchor_get();
            for (let border_index = 0; border_index < hitbox_anchors.length - 1; border_index++ ) {
                const anchor_origin      = hitbox_anchors[border_index];
                const anchor_destination = hitbox_anchors[border_index + 1];
                context_manager.canvas_line(anchor_origin, anchor_destination);
                //context_manager.canvas_point(anchor_origin, 10);
                //context_manager.canvas_point(anchor_destination, 10);
            }
        }
    }
}

export class CollisionHitbox {

    private hitbox_anchors: Point2D[];

    constructor(hitbox_anchors: Point2D[]) {
        this.hitbox_anchors = hitbox_anchors;
    }

    public anchor_add(hitbox_anchor: Point2D): void {
        this.hitbox_anchors.push(hitbox_anchor);
    }

    public anchor_get(): Point2D[] {
        return this.hitbox_anchors;
    }

}