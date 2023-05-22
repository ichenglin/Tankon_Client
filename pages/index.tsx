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
import Lobby from "@/components/lobby";

import map_default from "@/data/map_default.json";
import Vector2D from "@/objects/vector_2d";

import asset_preload from "@/data/asset_preload.json";
import Scoreboard, { RoomScoreboard, RoomStatus } from "@/components/scoreboard";

const font_sono = Sono({subsets: ["latin"]});

export const player_client      = {
	connection_transport: "Unknown",
	player_room:          "Offline",
	ballistic_tracker:    false
};

export const socket_manager     = new SocketManager(process.env.server_url as string);
export const context_manager    = new ContextManager(null, 3000);
export const keypress_manager   = new KeyPressManager();
export const player_manager     = new PlayerManager();
export const collision_manager  = new CollisionManager([]);
export const projectile_manager = new ProjectileManager();

const Home: NextPageLayout = () => {

	let rerender_previous: number | null = null;

	const [leaderboard, set_leaderboard] = useState([] as Player[]);
	const [scoreboard,  set_scoreboard ] = useState({score_red: 0, score_blue: 0, round_status: RoomStatus.INTERMISSION, round_lifetime: 0} as RoomScoreboard);
	const [killscreen,    set_killscreen   ] = useState(null as Player | null);

	useEffect(() => {
		// assign canvas context to manager
		const canvas_element = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context = canvas_element.getContext("2d")   as CanvasRenderingContext2D;
		context_manager.canvas_element(canvas_context);
		// register window events
		canvas_rescale();
		window.addEventListener("resize",    canvas_rescale);
		window.addEventListener("keydown",   canvas_keyevent);
		window.addEventListener("keyup",     canvas_keyevent);
		window.addEventListener("mousemove", canvas_mouseevent);
		window.addEventListener("mousedown", canvas_mouseevent);
		window.addEventListener("mouseup",   canvas_mouseevent);
		window.requestAnimationFrame(canvas_rerender);
		// register lobby events
		const lobby_play = document.getElementById("play") as HTMLButtonElement;
		lobby_play.addEventListener("click", lobby_connect);
		(window as any).player_data = player_client;
		collision_manager.hitbox_set(map_default.map_hitbox.map(loop_hitbox => new CollisionHitbox(loop_hitbox.hitbox_anchor.map(loop_anchor => new Point2D(loop_anchor.x, loop_anchor.y)))));
		context_manager.canvas_preload(asset_preload);
		setInterval(() => {
			set_leaderboard([player_manager.controller_get(), ...player_manager.player_all()]);
			set_scoreboard(socket_manager.scoreboard_get());
			set_killscreen(player_manager.controller_spectate());
		}, 100);
	}, []);

	function canvas_rerender(rerender_timestamp: number) {
		// calculates the frame delay
		if (rerender_previous === null) rerender_previous = rerender_timestamp;
		const rerender_interval = rerender_timestamp - rerender_previous;
		rerender_previous = rerender_timestamp;
		// render
		const canvas_element    = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context    = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		context_manager.canvas_focus(player_manager.controller_focus());
		context_manager.canvas_clear();
		// some points for reference
		context_manager.canvas_point(new Point2D(0, 0), 10);
		context_manager.canvas_point(new Point2D(40, 40), 10);
		context_manager.canvas_point(new Point2D(-40, 40), 10);
		context_manager.canvas_point(new Point2D(40, -40), 10);
		context_manager.canvas_point(new Point2D(-40, -40), 10);

		collision_manager.hitbox_render();
		// ballistic tracker
		if (player_client.ballistic_tracker) {
			let reflection_origin  = player_manager.controller_get().turret_get_coordinates();
			let reflection_maximum = 3;
			while (reflection_maximum-- >= 0) {
				const reflection_collision   = collision_manager.collision_get(reflection_origin);
				canvas_context.strokeStyle = "gray";
				canvas_context.setLineDash([10, 15]);
				if (reflection_collision === null) {
					context_manager.canvas_line(reflection_origin, reflection_origin.vector_duplicate().vector_set(null, null, null, 500).vector_get_destination());
					canvas_context.strokeStyle = "black";
					canvas_context.setLineDash([]);
					break;
				}
				context_manager.canvas_line(reflection_origin, reflection_collision.collision_coordinates);
				canvas_context.strokeStyle = "black";
				canvas_context.setLineDash([]);
				reflection_origin = Vector2D.from_point(reflection_collision.collision_coordinates, reflection_collision.collision_reflect, 1E-10).vector_get_destination();
			}
		}
		// gui (written separately to ignore scaling)
		canvas_context.font  = `20px ${font_sono.style.fontFamily}`;
		canvas_context.fillText(`FPS: ${Math.floor(1000 / rerender_interval)}   Server: ${player_client.player_room}   Players: ${player_manager.player_all().length + 1}/10   Coordinates: (${Math.floor(player_manager.controller_get().chassis_get_coordinates().point_get_x())}, ${Math.floor(player_manager.controller_get().chassis_get_coordinates().point_get_y())})   Projectiles: ${projectile_manager.projectile_get().length}`, 10, 25);
		// render enemies
		projectile_manager.projectile_victims();
		player_manager.player_render();
		// player and projectiles
		player_manager.controller_get().render_chassis();
		projectile_manager.projectile_render();
		player_manager.controller_get().render_turret();
		player_manager.controller_get().render_shield();
		// update player movement
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
		player_manager.chassis_update_movement();
	}

	function canvas_mouseevent(mouse_event: MouseEvent) {
		if      (mouse_event.type === "mousemove") player_manager.turret_update_heading(mouse_event);
		else if (mouse_event.type === "mousedown") player_manager.turret_firemode(true);
		else if (mouse_event.type === "mouseup")   player_manager.turret_firemode(false);
	}

	function lobby_connect(press_event: MouseEvent) {
		const lobby_window   = document.getElementById("lobby")    as HTMLElement;
		const lobby_username = document.getElementById("username") as HTMLInputElement;
		const player_username = (lobby_username.value.length > 0 ? lobby_username.value : "Anonymous");
		socket_manager.client_connect(player_username);
		lobby_window.setAttribute("value-visibility", "false");
	}

	// check for unintended element render
	console.log("Element Rerender");

	const round_intermission = (scoreboard.round_status === RoomStatus.INTERMISSION);

	return (
		<section className={styles.body}>
			<canvas id="canvas" className={styles.canvas}/>
			<div>
				<div className={styles.intermission} data-intermission={round_intermission}>
					<div className={styles.report}>
						<h1>Round Ended!</h1>
						<Scoreboard  scoreboard={scoreboard}   round_intermission={round_intermission}/>
						<Leaderboard leaderboard={leaderboard} round_intermission={round_intermission}/>
					</div>
				</div>
				<div className={styles.killscreen} data-killscreen={killscreen !== null}>
					<h1>{`You were killed by ${killscreen?.data_get().player_username}`}</h1>
				</div>
			</div>
			<Lobby/>
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