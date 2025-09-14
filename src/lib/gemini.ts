import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssemblyAI } from "assemblyai"; // Import AssemblyAI SDK

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); 

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;

const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const params = {
    audio: audioUrl, // Pass the URL directly
    language_code: "pt", // Adicionado: Código do idioma para português
  };

  const transcript = await client.transcripts.transcribe(params);

  console.log("[AssemblyAI] Full Transcript Result:", transcript); // Log the full transcript result

  if (transcript.status === "completed") {
    return transcript.text || "No transcription text found.";
  } else if (transcript.status === "error") {
    throw new Error(`Transcription failed: ${transcript.error}`);
  } else {
    throw new Error(`Transcription status: ${transcript.status}. Unexpected status after transcribe call.`);
  }
}

export async function summarizeText(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use gemini-1.5-flash

  const prompt = `Resuma o seguinte texto em português: ${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text();

  return summary || "Simulated summary using Gemini.";
}
