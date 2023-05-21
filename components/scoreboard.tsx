import type { NextPageLayout } from "../pages/_app";
import styles from "@/styles/components/Scoreboard.module.css";
import { number_fixed } from "@/utilities/number_fixed";

const Scoreboard: NextPageLayout<{scoreboard: RoomScoreboard, round_intermission: boolean}> = (props) => {

    const lifetime_legal    = Math.max(props.scoreboard.round_lifetime, 0);
    const lifetime_minutes  = Math.floor(lifetime_legal / 60E3);
    const lifetime_seconds  = Math.floor((lifetime_legal % 60E3) / 1E3);

	return (
		<div className={styles.scoreboard} data-intermission={props.round_intermission}>
            <div className={styles.round}>
                <div className={`${styles.score} ${styles.score_red}`}>
                    <p>{props.scoreboard.score_red}</p>
                </div>
                <div className={styles.status}>
                    <p>{RoomStatusName[props.scoreboard.round_status]}</p>
                    <p>{`${number_fixed(lifetime_minutes, 2)}:${number_fixed(lifetime_seconds, 2)}`}</p>
                </div>
                <div className={`${styles.score} ${styles.score_blue}`}>
                    <p>{props.scoreboard.score_blue}</p>
                </div>
            </div>
        </div>
	);
};

export default Scoreboard;

export interface RoomScoreboard {
    score_red:      number,
    score_blue:     number,
    round_status:   RoomStatus,
    round_lifetime: number
}

export interface RoomData {
    score_red:      number,
    score_blue:     number,
    round_status:   RoomStatus,
    round_lifespan: number,
    round_birthday: number
}

export enum RoomStatus {
    INTERMISSION,
    TEAM_DEATHMATCH
}

export const RoomStatusName = [
    "Intermission",
    "Team Deathmatch"
];