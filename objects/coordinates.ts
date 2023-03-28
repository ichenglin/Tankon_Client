export default class Coordinates {

    private coordinates: number[] = [0, 0, 0];

    constructor(coordinate_x: number, coordinate_y: number, coordinate_direction: number) {
        this.set(coordinate_x, coordinate_y, coordinate_direction);
    }

    public offset(offset_x: number, offset_y: number, offset_direction: number): void {
        this.coordinates[0] += offset_x;
        this.coordinates[1] += offset_y;
        this.coordinates[2] += offset_direction;
    }

    public set(coordinate_x: number | null, coordinate_y: number | null, coordinate_direction: number | null): void {
        this.coordinates = [
            (coordinate_x         !== null ? coordinate_x         : this.coordinates[0]),
            (coordinate_y         !== null ? coordinate_y         : this.coordinates[1]),
            (coordinate_direction !== null ? coordinate_direction : this.coordinates[2])
        ];
    }

    public get_x(): number {
        return this.coordinates[0];
    }

    public get_y(): number {
        return this.coordinates[1];
    }

    public get_direction(): number {
        return this.coordinates[2];
    }

}