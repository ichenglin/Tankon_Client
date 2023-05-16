import type { NextPageLayout } from "../pages/_app";
import styles from "@/styles/components/Lobby.module.css";

import { Audiowide } from "next/font/google";
import { faExplosion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const font_audiowide = Audiowide({weight: "400", subsets: ["latin"]});

const Lobby: NextPageLayout = () => {

	return (
		<section className={styles.lobby} id="lobby">
            <div className={styles.logo}>
                <h1 className={font_audiowide.className}>
                    <FontAwesomeIcon icon={faExplosion} width="100" height="100"/>
                    <span>T</span>
                    <span>ank-</span>
                    <span>O</span>
                    <span>n</span>
                </h1>
                <h3>A Multiplayer Tank Game</h3>
            </div>
            <div className={styles.connect}>
                <input type="text"   id="username" name="username" spellCheck="false" maxLength={16} />
                <input type="button" id="play"     value="Play" className={font_audiowide.className} />
            </div>
		</section>
	);
};

export default Lobby;