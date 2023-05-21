import type { NextPageLayout } from "../pages/_app";
import styles from "@/styles/components/Leaderboard.module.css";
import Player from "@/objects/player";
import { RoomStatus } from "./scoreboard";

const Leaderboard: NextPageLayout<{leaderboard: Player[], round_intermission: boolean}> = (props) => {

	return (
		<table className={styles.leaderboard} data-intermission={props.round_intermission}>
			<caption>Leaderboard</caption>
			<tbody>
				<tr>
					<th>Username</th>
					<th>Kills</th>
					<th>Deaths</th>
					<th>Latency</th>
				</tr>
				{props.leaderboard.sort((player_a, player_b) => {
					const data_a  = player_a.data_get().player_match;
					const data_b  = player_b.data_get().player_match;
					const score_a = (data_a.player_kills - data_a.player_deaths);
					const score_b = (data_b.player_kills - data_b.player_deaths);
					return score_b - score_a;
				}).map((player_object, player_index) => {
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