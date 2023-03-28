export default class KeyPressManager {

    private keypress_list: Map<string, number>;

    constructor() {
        this.keypress_list = new Map<string, number>();
    }

    public set_press(keypress_key: string): void {
        this.keypress_list.set(keypress_key, Date.now());
    }

    public set_release(keypress_key: string): void {
        this.keypress_list.delete(keypress_key);
    }

    public get_press(keypress_key: string): boolean {
        return this.keypress_list.has(keypress_key);
    }

    public get_press_all() {
        return Array.from(this.keypress_list.entries()).map(entry => entry[0]);
    }

}