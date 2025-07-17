export async function convertImagesToBase64(files: File[]): Promise<string[]> {
    const base64Images = await Promise.all(files.map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }));

    return base64Images;
}