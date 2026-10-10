/**
 * Client-Side Image Optimization Utility
 * Automatically converts any user-uploaded image (PNG, JPG, HEIC, etc.) to a compressed WebP format
 * before sending to the backend API or storing in state.
 */
export async function convertToWebP(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.85
): Promise<File> {
    // If it's already an SVG or tiny file, return as-is
    if (file.type === "image/svg+xml" || file.size < 5000) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio while respecting maximum dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(file); // fallback to original file if canvas context unavailable
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }

                        // Create clean WebP file with .webp extension
                        const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const webpFile = new File([blob], cleanName, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        resolve(webpFile);
                    },
                    "image/webp",
                    quality
                );
            };

            img.onerror = () => resolve(file);
            img.src = readerEvent.target?.result as string;
        };

        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
