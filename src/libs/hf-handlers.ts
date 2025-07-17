import hf from "./hf-config";

export const generateImageCaption = async (imageFile: File) => {
    try {
        if (!imageFile) return;

        const imageBlob = await convertImageToBlob(imageFile);

        const output = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ data: imageBlob })
        });

        return await output.json();
    } catch (error) {
        console.error("Error in generateImageCaption:", error);
    }
};

const convertImageToBlob = async (imageFile: File) => {
    return new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const type = imageFile?.type || "image/png";
            resolve(new Blob([arrayBuffer], { type }));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(imageFile);
    });
};

export const analyzeFakeReport = async (text: string) => {
    try {
        console.log(text);
        if (!text.trim()) return;


        // Use a Hugging Face emotion detection model (example: j-hartmann/emotion-english-distilroberta-base)
        const output = await fetch("https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: text }) // Only send the text to the model
        });
        console.log(output)
        const result = await output.json();
        console.log(result)
        // Process the model output and return relevant emotion data
        return result[0];

    } catch (error) {
        console.error("Error in analyzeFakeReport:", error);
    }
};


export const detectFakeImage = async (imageUrl: any) => {
    try {
        if (!imageUrl) return;

        // Call the local Express server endpoint
        const response = await fetch('http://localhost:5000/api/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const output = await response.json();
        return output;
    } catch (error) {
        console.error("AI Image Fake Detection Error:", error);
        return {
            error: true,
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
};