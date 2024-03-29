import { collision_manager, context_manager, player_manager, socket_manager } from "@/pages";
import Player, { PlayerTeam } from "../player";
import Vector2D from "../vector_2d";

export default class ProjectileManager {

    private projectile_active: Projectile[] = [];

    constructor() {}

    public projectile_add(projectile_origin: Vector2D, projectile_velocity: number, projectile_rebounces: number): void {
        const projectile_owner_data = player_manager.controller_get().data_get();
        const projectile_new        = new Projectile(projectile_origin, projectile_velocity, projectile_rebounces, projectile_owner_data.player_id, projectile_owner_data.player_team);
        this.projectile_active.push(projectile_new);
        socket_manager.client_get().emit("player_projectile", projectile_new);
    }

    public projectile_register(projectile_object: any): void {
        Object.setPrototypeOf(projectile_object.projectile_trajectory.projectile_origin, Vector2D.prototype);
        this.projectile_active.push(new Projectile(
            projectile_object.projectile_trajectory.projectile_origin,
            projectile_object.projectile_velocity,
            projectile_object.projectile_trajectory.projectile_rebounces,
            projectile_object.projectile_owner_id,
            projectile_object.projectile_owner_team,
            Date.now()
        ));
    }

    public projectile_victims(): void {
        const controller_data = player_manager.controller_get().data_get();
        const controller_victims: Player[] = [];
        for (let projectile_index = 0; projectile_index < this.projectile_active.length; projectile_index++) {
            const projectile_object = this.projectile_active[projectile_index];
            // only check on controller's projectiles
            if (projectile_object.owner_get() !== controller_data.player_id) continue;
            const projectile_coordinates = projectile_object.coordinates_get();
            player_manager.player_all().forEach(loop_player => {
                if (loop_player.data_get().player_team === controller_data.player_team)                return;
                if (loop_player.shield_alive())                                                        return;
                if (loop_player.chassis_get_coordinates().point_distance(projectile_coordinates) > 40) return;
                if (controller_victims.includes(loop_player))                                          return;
                controller_victims.push(loop_player);
            });
        }
        if (controller_victims.length > 0) socket_manager.client_hit(controller_victims.map(loop_victim => loop_victim.data_get().player_id));
    }

    public projectile_render(): void {
        this.projectile_active = this.projectile_active.filter(loop_projectile => loop_projectile.projectile_alive());
        for (let projectile_index = 0; projectile_index < this.projectile_active.length; projectile_index++) {
            const projectile_object = this.projectile_active[projectile_index];
            const projectile_color  = (projectile_object.team_get() === PlayerTeam.TEAM_BLUE) ? "blue" : "red";
            context_manager.canvas_image(`/tanks/projectile_${projectile_color}.png`, projectile_object.coordinates_get());
        }
    }

    public projectile_get(): Projectile[] {
        return this.projectile_active;
    }

}

export class Projectile {

    private projectile_trajectory: ProjectileTrajectory;
    private projectile_velocity:   number;
    private projectile_owner_id:   string;
    private projectile_owner_team: PlayerTeam;
    private projectile_birthday:   number;

    constructor(projectile_origin: Vector2D, projectile_velocity: number, projectile_rebounces: number, projectile_owner_id: string, projectile_owner_team: PlayerTeam, projectile_birthday: number = Date.now()) {
        this.projectile_trajectory = new ProjectileTrajectory(projectile_origin, projectile_rebounces);
        this.projectile_velocity   = projectile_velocity;
        this.projectile_owner_id   = projectile_owner_id;
        this.projectile_owner_team = projectile_owner_team;
        this.projectile_birthday   = projectile_birthday;
    }

    public coordinates_get(): Vector2D {
        const projectile_lifetime = (Date.now() - this.projectile_birthday) / 1E3;
        const trajectory_distance = this.projectile_velocity * projectile_lifetime;
        return this.projectile_trajectory.coordinates_get(trajectory_distance);
    }

    public owner_get(): string {
        return this.projectile_owner_id;
    }

    public team_get(): PlayerTeam {
        return this.projectile_owner_team;
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