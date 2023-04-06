import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { NextPageLayout } from "./_app";
import styles from "@/styles/pages/Home.module.css";

import { Sono } from "next/font/google";
import KeyPressManager from "@/objects/keypress_manager";
import PlayerManager from "@/objects/player_manager";
import ContextManager from "@/objects/context_manager";
import Point2D from "@/objects/point_2d";
import CollisionManager, { CollisionHitbox } from "@/objects/collision_manager";
import Vector2D from "@/objects/vector_2d";
import ProjectileManager from "@/objects/projectile_manager";

const font_sono = Sono({subsets: ["latin"]});

const Home: NextPageLayout = () => {

	let rerender_previous: number | null = null;
	const keypress_manager   = new KeyPressManager();
	const player_manager     = new PlayerManager();
	const collision_manager  = new CollisionManager([]);
	const projectile_manager = new ProjectileManager(collision_manager);

	useEffect(() => {
		canvas_rescale();
		window.addEventListener("resize",    canvas_rescale);
		window.addEventListener("keydown",   canvas_keyevent);
		window.addEventListener("keyup",     canvas_keyevent);
		window.addEventListener("mousemove", canvas_mouseevent);
		window.addEventListener("mousedown", () => projectile_manager.projectile_add(player_manager.turret_get_coordinates(), 1000, 10));
		window.requestAnimationFrame(canvas_rerender);
		collision_manager.hitbox_set([new CollisionHitbox([
			new Point2D(100, 200),
			new Point2D(-100, 200),
			new Point2D(-150, 300),
			new Point2D(100, 200)
		]),
		new CollisionHitbox([
			new Point2D(200, 100),
			new Point2D(200, 0)
		]),
		new CollisionHitbox([
			new Point2D(-200, 100),
			new Point2D(-100, -300)
		])])
	}, []);

	function canvas_rerender(rerender_timestamp: number) {
		// calculates the frame delay
		if (rerender_previous === null) rerender_previous = rerender_timestamp;
		const rerender_interval = rerender_timestamp - rerender_previous;
		rerender_previous = rerender_timestamp;
		// render
		const canvas_element = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		const context_manager = new ContextManager(canvas_context, 1000);
		context_manager.canvas_focus(player_manager.chassis_get_coordinates());
		context_manager.canvas_clear();
		// some points for reference
		context_manager.canvas_point(new Point2D(0, 0), 10);
		context_manager.canvas_point(new Point2D(40, 40), 10);
		context_manager.canvas_point(new Point2D(-40, 40), 10);
		context_manager.canvas_point(new Point2D(40, -40), 10);
		context_manager.canvas_point(new Point2D(-40, -40), 10);

		collision_manager.hitbox_render(context_manager);
		let reflection_origin  = player_manager.turret_get_coordinates();
		let reflection_maximum = 10;
		while (reflection_maximum-- >= 0) {
			const reflection_collision   = collision_manager.collision_get(reflection_origin);
			canvas_context.setLineDash([15, 10]);
			if (reflection_collision === null) {
				context_manager.canvas_line(reflection_origin, reflection_origin.vector_duplicate().vector_set(null, null, null, 500).vector_get_destination());
				canvas_context.setLineDash([]);
				break;
			}
			context_manager.canvas_line(reflection_origin, reflection_collision.collision_coordinates);
			canvas_context.setLineDash([]);
			//const collision_normal = Vector2D.from_point(reflection_collision.collision_coordinates, reflection_collision.collision_normal, 100).vector_get_destination();
			//context_manager.canvas_point(collision_normal, 10);
			//context_manager.canvas_line(reflection_collision.collision_coordinates, collision_normal);
			reflection_origin = Vector2D.from_point(reflection_collision.collision_coordinates, reflection_collision.collision_reflect, 1E-10).vector_get_destination();
		}
		// gui (written separately to ignore scaling)
		canvas_context.font  = `20px ${font_sono.style.fontFamily}`;
		canvas_context.fillText(`FPS: ${Math.floor(1000 / rerender_interval)}   Coordinates: (${player_manager.chassis_get_coordinates().point_get_x()}, ${player_manager.chassis_get_coordinates().point_get_y()})`, 10, 25);
		// player character
		context_manager.canvas_image("/tanks/chassis.png", player_manager.chassis_get_coordinates(), 1);
		context_manager.canvas_image("/tanks/turret.png", player_manager.turret_get_coordinates(), 1);
		// update player movement
		player_manager.chassis_update_movement(collision_manager, rerender_interval);
		// projectiles
		projectile_manager.projectile_render(context_manager);
		window.requestAnimationFrame(canvas_rerender);
	}

	function canvas_rescale() {
		const canvas_element  = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context  = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		canvas_element.width  = window.innerWidth  * window.devicePixelRatio;
		canvas_element.height = window.innerHeight * window.devicePixelRatio;
		canvas_element.style.width  = window.innerWidth  + "px";
		canvas_element.style.height = window.innerHeight + "px";
		canvas_context.scale(window.devicePixelRatio, window.devicePixelRatio);
	}

	function canvas_keyevent(key_event: KeyboardEvent) {
		if      (key_event.repeat) return;
		if      (key_event.type === "keydown") keypress_manager.set_press(key_event.key);
		else if (key_event.type === "keyup")   keypress_manager.set_release(key_event.key);
		player_manager.chassis_update_heading(keypress_manager);
	}

	function canvas_mouseevent(mouse_event: MouseEvent) {
		player_manager.turret_update_heading(mouse_event);
	}

	// check for unintended element render
	console.log("Element Rerender");

	return (
		<section className={styles.body}>
			<canvas id="canvas" className={styles.canvas}/>
		</section>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	return {props: {
		page_name:        "Tankon",
		page_description: "Tankon multiplayer tank game."
	}};
}

export default Home;