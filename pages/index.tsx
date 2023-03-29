import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { NextPageLayout } from "./_app";
import styles from "@/styles/pages/Home.module.css";

import { Sono } from "next/font/google";
import KeyPressManager from "@/objects/keypress_manager";
import PlayerManager from "@/objects/player_manager";
import drawimage_rotation from "@/utilities/drawimage_rotation";

const font_sono = Sono({subsets: ["latin"]});

const Home: NextPageLayout = () => {

	let rerender_previous: number | null = null;
	const keypress_manager = new KeyPressManager();
	const player_manager   = new PlayerManager();

	useEffect(() => {
		canvas_rescale();
		window.addEventListener("resize",    canvas_rescale);
		window.addEventListener("keydown",   canvas_keyevent);
		window.addEventListener("keyup",     canvas_keyevent);
		window.addEventListener("mousemove", canvas_mouseevent);
		window.requestAnimationFrame(canvas_rerender);
	}, []);

	function canvas_rerender(rerender_timestamp: number) {
		// calculates the frame delay
		if (rerender_previous === null) rerender_previous = rerender_timestamp;
		const rerender_interval = rerender_timestamp - rerender_previous;
		rerender_previous = rerender_timestamp;
		// render
		const canvas_element = document.getElementById("canvas") as HTMLCanvasElement;
		const canvas_context = canvas_element.getContext("2d") as CanvasRenderingContext2D;
		canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
		// fps
		canvas_context.font  = `20px ${font_sono.style.fontFamily}`;
		canvas_context.fillText(`FPS: ${Math.floor(1000 / rerender_interval)}   Coordinates: (${player_manager.chassis_get_coordinates().point_get_x()}, ${player_manager.chassis_get_coordinates().point_get_y()})`, 10, 25);
		// player character
		const tank_image_chassis = new Image();
		const tank_image_turret = new Image();
		tank_image_chassis.src = "/tanks/chassis.png";
		tank_image_turret.src = "/tanks/turret.png";
		drawimage_rotation(canvas_context, tank_image_chassis, (window.innerWidth / 2), (window.innerHeight / 2), player_manager.chassis_get_coordinates().vector_get_direction());
		drawimage_rotation(canvas_context, tank_image_turret,  (window.innerWidth / 2), (window.innerHeight / 2), player_manager.turret_get_direction());
		// update player movement
		player_manager.chassis_update_movement(rerender_interval);
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