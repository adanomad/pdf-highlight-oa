
import { AutoProcessor, Processor, CLIPVisionModelWithProjection } from '@xenova/transformers';
import { RawImage } from "@huggingface/transformers";

const quantized = true; //change to false for a more accurate but much larger model
let globalImageProcessor: Processor | null = null;
let globalVisionModel: CLIPVisionModelWithProjection | null = null;

export const clipImage = async (input: Blob | string): Promise<Object> => {
    console.log("Embedding image");
    if (!globalImageProcessor) {
        globalImageProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    }
    if (!globalVisionModel) {
        globalVisionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32', {quantized});
    }
    try {
        const image: RawImage = await RawImage.read(input);
        const imageInputs = await globalImageProcessor(image);
        if (Object.keys(imageInputs).length === 0) {
            console.log("Empty image input passed.");
            return {};
        }
        const { image_embeds } = await globalVisionModel(imageInputs);
        return image_embeds.data;
    } catch(err) {
        throw("Issue generating image embedding: " + err);
    }  
}