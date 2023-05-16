import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { NextPageLayout } from "./_app";
import styles from "@/styles/pages/Home.module.css";

import { Sono } from "next/font/google";

import KeyPressManager from "@/objects/managers/keypress_manager";
import PlayerManager from "@/objects/managers/player_manager";
import ContextManager from "@/objects/managers/context_manager";
import Point2D from "@/objects/point_2d";
import CollisionManager, { CollisionHitbox } from "@/objects/managers/collision_manager";
import ProjectileManager from "@/objects/managers/projectile_manager";
import SocketManager from "@/objects/managers/socket_manager";
import Player from "@/objects/player";

import Leaderboard from "@/components/leaderboard";

const font_sono = Sono({subsets: ["latin"]});

export const player_client      = {
	connection_transport: "Unknown",
	player_room:          "Offline"
};

export const socket_manager     = new SocketManager(process.env.server_url as string);
export const context_manager    = new ContextManager(null, 2000);
export const keypress_manager   = new KeyPressManager();
export const player_manager     = new PlayerManager();
export const collision_manager  = new CollisionManager([]);
export const projectile_manager = new ProjectileManager();

const Home: NextPageLayout = () => {

	let rerender_previous: number | null = null;

	const [leaderboard, set_leaderboard] = useState([] as Player[]);

	useEffect(() => {
		// assign canvas context to manager
		const canvas_element = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		context_manager.canvas_element(canvas_context);
		// register events
		canvas_rescale();
		window.addEventListener("resize",    canvas_rescale);
		window.addEventListener("keydown",   canvas_keyevent);
		window.addEventListener("keyup",     canvas_keyevent);
		window.addEventListener("mousemove", canvas_mouseevent);
		window.addEventListener("mousedown", canvas_mouseevent);
		window.addEventListener("mouseup",   canvas_mouseevent);
		window.requestAnimationFrame(canvas_rerender);
		(window as any).player_data = player_client;
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
		])]);
	}, []);

	function canvas_rerender(rerender_timestamp: number) {
		// calculates the frame delay
		if (rerender_previous === null) rerender_previous = rerender_timestamp;
		const rerender_interval = rerender_timestamp - rerender_previous;
		rerender_previous = rerender_timestamp;
		// render
		const canvas_element = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		context_manager.canvas_focus(player_manager.controller_get().chassis_get_coordinates());
		context_manager.canvas_clear();
		// some points for reference
		context_manager.canvas_point(new Point2D(0, 0), 10);
		context_manager.canvas_point(new Point2D(40, 40), 10);
		context_manager.canvas_point(new Point2D(-40, 40), 10);
		context_manager.canvas_point(new Point2D(40, -40), 10);
		context_manager.canvas_point(new Point2D(-40, -40), 10);

		collision_manager.hitbox_render();
		/*let reflection_origin  = player_manager.turret_get_coordinates();
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
		}*/
		// gui (written separately to ignore scaling)
		canvas_context.font  = `20px ${font_sono.style.fontFamily}`;
		canvas_context.fillText(`FPS: ${Math.floor(1000 / rerender_interval)}   Server: ${player_client.player_room}   Players: ${player_manager.player_all().length + 1}/10   Coordinates: (${Math.floor(player_manager.controller_get().chassis_get_coordinates().point_get_x())}, ${Math.floor(player_manager.controller_get().chassis_get_coordinates().point_get_y())})   Projectiles: ${projectile_manager.projectile_get().length}`, 10, 25);
		// player and projectiles
		context_manager.canvas_image("/tanks/chassis.png", player_manager.controller_get().chassis_get_coordinates(), 1);
		projectile_manager.projectile_render();
		context_manager.canvas_image("/tanks/turret.png", player_manager.controller_get().turret_get_coordinates(), 1);
		// render enemies
		const player_online = player_manager.player_all();
		for (let player_index = 0; player_index < player_online.length; player_index++) {
			const player_object = player_online[player_index];
			const player_name   = player_object.profile_get().player_username;
			context_manager.canvas_image("/tanks/chassis.png", player_object.chassis_get_coordinates(), 1);
			context_manager.canvas_image("/tanks/turret.png", player_object.turret_get_coordinates(), 1);
			context_manager.canvas_text(player_name, player_object.chassis_get_coordinates().vector_duplicate().vector_offset((-7 * player_name.length), -70, 0, 0), font_sono.style.fontFamily, 30);
		}
		// update player movement
		window.requestAnimationFrame(canvas_rerender);
		set_leaderboard([player_manager.controller_get(), ...player_manager.player_all()]);
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
		player_manager.chassis_update_movement();
	}

	function canvas_mouseevent(mouse_event: MouseEvent) {
		if      (mouse_event.type === "mousemove") player_manager.turret_update_heading(mouse_event);
		else if (mouse_event.type === "mousedown") player_manager.turret_firemode(true);
		else if (mouse_event.type === "mouseup")   player_manager.turret_firemode(false);
	}

	// check for unintended element render
	console.log("Element Rerender");

	return (
		<section className={styles.body}>
			<canvas id="canvas" className={styles.canvas}/>
			<Leaderboard leaderboard={leaderboard}/>
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