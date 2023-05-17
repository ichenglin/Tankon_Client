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
					const player_data = player_object.data_get();
					return <tr key={player_index}>
						<td data-team={player_data.player_team}>{player_data.player_username}</td>
						<td>{player_data.player_match.player_kills}</td>
						<td>{player_data.player_match.player_deaths}</td>
						<td>{`${player_data.player_latency.client_send + player_data.player_latency.client_receive}ms`}</td>
					</tr>;
				})}
			</tbody>
		</table>
	);
};

export default Leaderboard;