import type { NextPageLayout } from "../pages/_app";
import styles from "@/styles/components/Leaderboard.module.css";
import Player from "@/objects/player";

const Leaderboard: NextPageLayout<{leaderboard: Player[]}> = (props) => {

	return (
		<table className={styles.leaderboard}>
			<caption>Leaderboard</caption>
			<tbody>
				<tr>
					<th>Username</th>
					<th>Kills</th>
					<th>Deaths</th>
					<th>Latency</th>
				</tr>
				{props.leaderboard.map((player_object, player_index) => {
					const player_latency = player_object.latency_get();
					return <tr key={player_index}>
						<td>{player_object.profile_get().player_username}</td>
						<td>0</td>
						<td>0</td>
						<td>{`${player_latency.client_send + player_latency.client_receive}ms`}</td>
					</tr>;
				})}
			</tbody>
		</table>
	);
};

export default Leaderboard;