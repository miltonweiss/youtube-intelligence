import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function splitTextFromString(text, chunkSize = 400, chunkOverlap = 150) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
  const chunks = await splitter.createDocuments([text])
  return chunks;
}
