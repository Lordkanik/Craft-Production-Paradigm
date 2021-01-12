import sharp = require('sharp');

export class OrderImage
{
    private image: sharp.Sharp;
    private static readonly MAX_WIDTH: number = 600;
    private static readonly MAX_HEIGHT: number = 250;

    constructor(imageBuffer: Buffer)
    {
        this.image = sharp(imageBuffer).resize(OrderImage.MAX_WIDTH, OrderImage.MAX_HEIGHT, {
            fit: "inside"
        }).png();
    }

    public async toBuffer(): Promise<Buffer>
    {
        return this.image.toBuffer();
    }
}