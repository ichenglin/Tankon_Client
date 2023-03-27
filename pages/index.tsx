import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { NextPageLayout } from "./_app";
import styles from "@/styles/pages/Home.module.css";

import { Sono } from "next/font/google";

const font_sono = Sono({subsets: ["latin"]});

const Home: NextPageLayout = () => {

	let rerender_previous: number | null = null;

	useEffect(() => {
		canvas_rescale();
		window.addEventListener("resize", canvas_rescale);
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
		canvas_context.fillText(`FPS: ${Math.floor(1000 / rerender_interval)}`, 10, 25);
		// content
		canvas_context.fillRect(100, 100, 100, 100);
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