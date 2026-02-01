import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const generateMotivation = async (
    amount: number,
    unit: string,
    challengeTitle: string
): Promise<string> => {
    if (!genAI) return "Godt jobbet! (AI er ikke konfigurert)";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Generer en kort, morsom og motiverende melding på norsk til en bruker som nettopp logget ${amount} ${unit} i utfordringen "${challengeTitle}". Hold det under 20 ord.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Godt jobbet! Fortsett slik!";
    }
};

export const generateChallengeDescription = async (title: string): Promise<string> => {
    if (!genAI) return "En spennende utfordring!";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Lag en engasjerende og kort beskrivelse (max 30 ord) på norsk for en utfordring som heter "${title}". Fokuser på samhold og konkurranse.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Description Error:", error);
        return "Bli med venner og nå målene deres sammen!";
    }
};
