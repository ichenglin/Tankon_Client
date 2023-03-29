export default class Point2D {

    private point_x: number = 0;
    private point_y: number = 0;

    constructor(point_x: number, point_y: number) {
        this.point_set(point_x, point_y);
    }

    public point_set(point_x: number | null, point_y: number | null) {
        if (point_x !== null) this.point_x = point_x;
        if (point_y !== null) this.point_y = point_y;
    }

    public point_offset(offset_x: number, offset_y: number) {
        this.point_x += offset_x;
        this.point_y += offset_y;
    }

    public point_get_x(): number {
        return this.point_x;
    }

    public point_get_y(): number {
        return this.point_y;
    }

}