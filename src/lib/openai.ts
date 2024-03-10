import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({ apiKey });

// Then we export the default open ai
export default openai;

export async function getEmbeding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  const embedding = response.data[0].embedding;
  if (!embedding) throw Error("Error generating embedding.");

  // We can also try to log the embedding in order to see it.
  console.log(embedding);
  return embedding;
}
