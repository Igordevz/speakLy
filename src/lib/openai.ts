import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioFile: Buffer, filename: string, contentType: string): Promise<string> {
  // Use the native File class available in Bun
  const file = new File([audioFile], filename, { type: contentType });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
  });

  return transcription.text;
}

export async function summarizeText(text: string): Promise<string> {
  const chatCompletion:any = await openai.chat.completions.create({
    messages: [{ role: "user", content: `Resuma o seguinte texto em português: ${text}` }],
    model: "gpt-3.5-turbo",
  });

  return chatCompletion.choices[0].message.content || "Simulated summary.";
}
