import Point2D from "./point_2d";
import Vector2D from "./vector_2d";

export default class ContextManager {

    private canvas_context:   CanvasRenderingContext2D | null;
    private canvas_center:    Point2D;
    private canvas_viewfield: number; // coordinate unit on screen for x/y

    constructor(canvas_context: CanvasRenderingContext2D | null, canvas_viewfield: number) {
        // variables
        this.canvas_context   = canvas_context;
        this.canvas_center    = new Point2D(0, 0);
        this.canvas_viewfield = canvas_viewfield;
        this.canvas_element(canvas_context);
    }

    public canvas_element(canvas_context: CanvasRenderingContext2D | null): void {
        this.canvas_context = canvas_context;
        if (this.canvas_context !== null) this.canvas_context.imageSmoothingEnabled = false;
    }

    public canvas_focus(canvas_center: Point2D): void {
        this.canvas_center = canvas_center;
    }

    public canvas_point(point_coordinates: Point2D, point_radius: number): void {
        // only draw when context is set
        if (this.canvas_context === null) return;
        // draw
        const point_coordinates_relative = this.canvas_coordinates_relative(point_coordinates);
        const text_size_relative = this.canvas_scale_relative(point_radius);
        this.canvas_context.fillRect(point_coordinates_relative.point_get_x() - (text_size_relative/2), point_coordinates_relative.point_get_y() - (text_size_relative/2), text_size_relative, text_size_relative);
    }

    public canvas_line(line_origin: Point2D, line_destination: Point2D): void {
        // only draw when context is set
        if (this.canvas_context === null) return;
        // draw
        const line_origin_relative      = this.canvas_coordinates_relative(line_origin);
        const line_destination_relative = this.canvas_coordinates_relative(line_destination);
        this.canvas_context.beginPath();
        this.canvas_context.moveTo(line_origin_relative.point_get_x(), line_origin_relative.point_get_y());
        this.canvas_context.lineTo(line_destination_relative.point_get_x(), line_destination_relative.point_get_y());
        this.canvas_context.stroke();
    }

    public canvas_text(text_content: string, text_coordinates: Point2D, text_font: string, text_size: number): void {
        // only draw when context is set
        if (this.canvas_context === null) return;
        // draw
        const text_coordinates_relative = this.canvas_coordinates_relative(text_coordinates);
        const text_size_relative = this.canvas_scale_relative(text_size);
        this.canvas_context.font  = `${text_size_relative}px ${text_font}`;
		this.canvas_context.fillText(text_content, text_coordinates_relative.point_get_x(), text_coordinates_relative.point_get_y());
    }

    public canvas_image(image_source: string, image_coordinates: Vector2D, image_scale: number = 1): void {
        // only draw when context is set
        if (this.canvas_context === null) return;
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
        // only draw when context is set
        if (this.canvas_context === null) return;
        // draw
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