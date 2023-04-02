import Point2D from "./point_2d";
import Vector2D from "./vector_2d";

export default class ContextManager {

    private canvas_context:   CanvasRenderingContext2D;
    private canvas_center:    Point2D;
    private canvas_viewfield: number; // coordinate unit on screen for x/y

    constructor(canvas_context: CanvasRenderingContext2D, canvas_viewfield: number) {
        this.canvas_context   = canvas_context;
        this.canvas_center    = new Point2D(0, 0);
        this.canvas_viewfield = canvas_viewfield;
    }

    public canvas_focus(canvas_center: Point2D): void {
        this.canvas_center = canvas_center;
    }

    public canvas_point(point_coordinates: Point2D, point_radius: number): void {
        const point_coordinates_relative = this.canvas_coordinates_relative(point_coordinates);
        this.canvas_context.fillRect(point_coordinates_relative.point_get_x(), point_coordinates_relative.point_get_y(), point_radius, point_radius);
    }

    public canvas_image(image_source: string, image_coordinates: Vector2D, image_scale: number = 1): void {
        // image object
        const image_element = new Image();
        image_element.src = image_source;
        // image location
        const image_coordinates_relative = this.canvas_coordinates_relative(image_coordinates);
        const image_width_relative       = this.canvas_scale_relative(image_element.width)  * image_scale;
        const image_height_relative      = this.canvas_scale_relative(image_element.height) * image_scale;
        // draw image with rotation
        this.canvas_context.save();
        this.canvas_context.translate(image_coordinates_relative.point_get_x(), image_coordinates_relative.point_get_y());
        this.canvas_context.rotate(-image_coordinates.vector_get_direction() + (Math.PI/2));
        this.canvas_context.drawImage(image_element, -(image_width_relative/2), -(image_height_relative/2), image_width_relative, image_height_relative);
        this.canvas_context.restore();
    }

    public canvas_clear(): void {
        this.canvas_context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    private canvas_coordinates_relative<PointVector2D extends Point2D>(point_coordinates: PointVector2D): Point2D {
        const viewfield_x = (window.innerHeight > window.innerWidth) ? (this.canvas_viewfield * (window.innerWidth/window.innerHeight)) : this.canvas_viewfield;
        const viewfield_y = (window.innerHeight < window.innerWidth) ? (this.canvas_viewfield * (window.innerHeight/window.innerWidth)) : this.canvas_viewfield;
        const viewfield_origin = new Point2D(
            this.canvas_center.point_get_x() - (viewfield_x/2),
            this.canvas_center.point_get_y() + (viewfield_y/2)
        );
        const relative_x  = point_coordinates.point_get_x() - viewfield_origin.point_get_x();
        const relative_y  = viewfield_origin.point_get_y()  - point_coordinates.point_get_y();
        return new Point2D(
            window.innerWidth  * (relative_x/viewfield_x),
            window.innerHeight * (relative_y/viewfield_y),
        );
    }

    private canvas_scale_relative(scale_pixel: number): number {
        return (scale_pixel / this.canvas_viewfield) * Math.max(window.innerWidth, window.innerHeight);
    }
}