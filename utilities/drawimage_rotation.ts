export default function drawimage_rotation(canvas_context: CanvasRenderingContext2D, image: CanvasImageSource, coordinate_x: number, coordinate_y: number, rotation: number) {
    canvas_context.save();
    canvas_context.translate(coordinate_x, coordinate_y);
    canvas_context.rotate(-rotation + (Math.PI  / 2));
    canvas_context.drawImage(image, -((image.width as number) / 2), -((image.height as number) / 2));
    canvas_context.restore();
}