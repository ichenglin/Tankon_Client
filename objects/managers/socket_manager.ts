import { io, Socket } from "socket.io-client";
import { Socket as Engine } from "engine.io-client";
import { player_client, projectile_manager } from "@/pages";

export default class SocketManager {

    private socket_client: Socket;
    private socket_engine: Engine;

    constructor(socket_url: string) {
        const socket_url_parsed = new URL(process.env.server_url as string);
        this.socket_client      = io(socket_url_parsed.origin, {path: socket_url_parsed.pathname});
        this.socket_engine      = this.socket_client.io.engine;
        // engine events
        player_client.connection_transport = this.socket_engine.transport.name;
        this.socket_engine.once("upgrade", () => player_client.connection_transport = this.socket_engine.transport.name);
        // socket events
        this.client_events();
    }

    private client_events() {
        this.socket_client.emit("room_join", "New Player", null, (join_status: any) => {
			if (!join_status.success) return;
			player_client.player_room = join_status.player_room;
		});
		//socket_client.on("player_move",       (coordinates) => console.log(coordinates));
		this.socket_client.on("player_projectile", (player_projectile) => projectile_manager.projectile_register(player_projectile));
    }

    public client_get(): Socket {
        return this.socket_client;
    }

    public engine_get(): Engine {
        return this.socket_engine;
    }

}