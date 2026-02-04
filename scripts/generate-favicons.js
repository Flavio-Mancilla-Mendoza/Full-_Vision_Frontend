import fs from "fs";
import path from "path";
import sharp from "sharp";

const publicDir = path.resolve(process.cwd(), "public");
const src = path.join(publicDir, "placeholder.svg");

const sizes = [16, 32, 48, 192, 180];

async function generate() {
    if (!fs.existsSync(src)) {
        console.error("Source SVG not found:", src);
        process.exit(1);
    }

    try {
        // Generate PNGs
        for (const size of sizes) {
            const out = path.join(publicDir, `favicon-${size}.png`);
            await sharp(src).resize(size, size).png().toFile(out);
            console.log("Generated", out);
        }

        // Create favicon.ico containing 16,32,48
        const icoOut = path.join(publicDir, "favicon.ico");
        await sharp()
            .composite([
                { input: path.join(publicDir, "favicon-16.png") },
                { input: path.join(publicDir, "favicon-32.png") },
                { input: path.join(publicDir, "favicon-48.png") },
            ])
            .toFile(icoOut);

        console.log("Generated", icoOut);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

generate();
