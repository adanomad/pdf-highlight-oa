import { AutoTokenizer, PreTrainedTokenizer, CLIPTextModelWithProjection } from '@xenova/transformers';

const quantized = true; //change to false for a more accurate but much larger model
let tokenizer: PreTrainedTokenizer | null = null;
let textModel: CLIPTextModelWithProjection | null = null;

export const clipText = async (input:string): Promise<Object> => {
    console.log("Embedding text");
    if (!tokenizer) {
        tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
    }
    if (!textModel) {
        textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32', {quantized});
    }

    // get text embedding:
    if (typeof input !== 'string') {
        console.error('Invalid input type:', typeof input, input);
        throw new Error('Input to tokenizer must be a string');
    }
    const textInputs = tokenizer(input, { padding: true, truncation: true });
    console.log(textInputs);
    if (Object.keys(textInputs).length === 0) {
        console.log("Empty text input passed.");
        return {};
    }
    const rawEmbeds = await textModel(textInputs);
    const { text_embeds } = rawEmbeds;
    const data = text_embeds.data;
    return text_embeds.data;
}
