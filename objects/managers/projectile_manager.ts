import { collision_manager, context_manager, socket_manager } from "@/pages";
import Vector2D from "../vector_2d";

export default class ProjectileManager {

    private projectile_active: Projectile[] = [];

    constructor() {}

    public projectile_add(projectile_origin: Vector2D, projectile_velocity: number, projectile_rebounces: number): void {
        const projectile_new = new Projectile(projectile_origin, projectile_velocity, projectile_rebounces);
        this.projectile_active.push(projectile_new);
        socket_manager.client_get().emit("player_projectile", projectile_new);
    }

    public projectile_register(projectile_object: any): void {
        Object.setPrototypeOf(projectile_object.projectile_trajectory.projectile_origin, Vector2D.prototype);
        this.projectile_active.push(new Projectile(
            projectile_object.projectile_trajectory.projectile_origin,
            projectile_object.projectile_velocity,
            projectile_object.projectile_trajectory.projectile_rebounces,
            
            Date.now()
        ));
    }

    public projectile_render(): void {
        this.projectile_active = this.projectile_active.filter(loop_projectile => loop_projectile.projectile_alive());
        for (let projectile_index = 0; projectile_index < this.projectile_active.length; projectile_index++) {
            const projectile_object = this.projectile_active[projectile_index];
            context_manager.canvas_image("/tanks/ammo_normal.png", projectile_object.coordinates_get());
        }
    }

    public projectile_get(): Projectile[] {
        return this.projectile_active;
    }

}

export class Projectile {

    private projectile_trajectory: ProjectileTrajectory;
    private projectile_velocity:   number;
    private projectile_birthday:   number;

    constructor(projectile_origin: Vector2D, projectile_velocity: number, projectile_rebounces: number, projectile_birthday: number = Date.now()) {
        this.projectile_trajectory = new ProjectileTrajectory(projectile_origin, projectile_rebounces);
        this.projectile_velocity   = projectile_velocity;
        this.projectile_birthday   = projectile_birthday;
    }

    public coordinates_get(): Vector2D {
        const projectile_lifetime = (Date.now() - this.projectile_birthday) / 1E3;
        const trajectory_distance = this.projectile_velocity * projectile_lifetime;
        return this.projectile_trajectory.coordinates_get(trajectory_distance);
    }

    public projectile_alive(): boolean {
        const trajectory_distance_maximum = this.projectile_trajectory.trajectory_distance();
        const projectile_lifespan = trajectory_distance_maximum / this.projectile_velocity;
        const projectile_lifetime = (Date.now() - this.projectile_birthday) / 1E3;
        return projectile_lifespan > projectile_lifetime;
    }

}

export class ProjectileTrajectory {

    private projectile_origin:    Vector2D;
    private projectile_rebounces: number;
    private trajectory_anchors:   Vector2D[] = [];
    private trajectory_distances: number[]   = [];

    constructor(projectile_origin: Vector2D, projectile_rebounces: number) {
        this.projectile_origin    = projectile_origin;
        this.projectile_rebounces = projectile_rebounces;
        this.anchor_update();
    }

    public coordinates_get(progress_distance: number): Vector2D {
        let anchor_begin = (this.trajectory_distances.length - 1);
        for (let distance_index = 0; distance_index < this.trajectory_distances.length; distance_index++) {
            const distance_length = this.trajectory_distances[distance_index];
            if (distance_length < progress_distance) continue;
            // over loop anchor's distance
            anchor_begin = distance_index;
            break;
        }
        const projectile_distance_remain =  (anchor_begin > 0) ? (progress_distance - this.trajectory_distances[anchor_begin - 1]) : progress_distance;
        return this.trajectory_anchors[anchor_begin].vector_duplicate().vector_set(null, null, null, projectile_distance_remain).vector_get_destination();
    }

    public trajectory_distance(): number {
        return this.trajectory_distances[this.trajectory_distances.length - 1];
    }

    private anchor_update(): void {
        let rebounce_origin    = this.projectile_origin;
        let rebounce_distance  = 0;
        let rebounce_available = this.projectile_rebounces;
        const rebounce_anchors:   Vector2D[] = [];
        const rebounce_distances: number[]   = [];
		while (rebounce_available-- >= 0) {
            rebounce_anchors.push(rebounce_origin);
			const reflection_collision = collision_manager.collision_get(rebounce_origin);
			if (reflection_collision === null) {
                rebounce_anchors.push(rebounce_origin.vector_duplicate().vector_set(null, null, null, 10000));
                rebounce_distances.push(rebounce_distance + 10000);
                break;
            }
            rebounce_distance += rebounce_origin.point_distance(reflection_collision.collision_coordinates);
			rebounce_origin   =  Vector2D.from_point(reflection_collision.collision_coordinates, reflection_collision.collision_reflect, 1E-10).vector_get_destination();
            rebounce_distances.push(rebounce_distance);
		}
        this.trajectory_anchors   = rebounce_anchors;
        this.trajectory_distances = rebounce_distances;
    }

}