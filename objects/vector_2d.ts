import Point2D from "./point_2d";

export default class Vector2D extends Point2D {

    private vector_direction: number = 0;
    private vector_magnitude: number = 0;
    
    constructor(point_x: number, point_y: number, vector_direction: number, vector_magnitude: number) {
        super(point_x, point_y);
        this.vector_set(null, null, vector_direction, vector_magnitude);
    }

    public static from_parametric(point_x: number, point_y: number, heading_x: number, heading_y: number, heading_length: number | null): Vector2D {
        // direction of vector (later patches the range of arctangent)
        let heading_direction = Math.atan(heading_y / heading_x);
        if (heading_x < 0) heading_direction += Math.PI;
        // magnitude of vector
        const heading_magnitude = (heading_length !== null) ? heading_length : Math.sqrt(Math.pow(heading_x, 2) + Math.pow(heading_y, 2));
        return new Vector2D(point_x, point_y, heading_direction, heading_magnitude);
    }

    public vector_set(point_x: number | null, point_y: number | null, vector_direction: number | null, vector_magnitude: number | null) {
        this.point_set(point_x, point_y);
        if (vector_direction !== null) this.vector_direction = vector_direction;
        if (vector_magnitude !== null) this.vector_magnitude = vector_magnitude;
    }

    public vector_offset(offset_x: number, offset_y: number, offset_direction: number, offset_magnitude: number) {
        this.point_offset(offset_x, offset_y);
        this.vector_direction += offset_direction;
        this.vector_magnitude += offset_magnitude;
    }

    public vector_get_direction(): number {
        return this.vector_direction;
    }

    public vector_get_magnitude(): number {
        return this.vector_magnitude;
    }

}