import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getSpecificYoutubeVideo } from "../supabase/videos";

export async function splitText(id) {
  const text = await getSpecificYoutubeVideo(id)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 150,
  })
  const texts = await splitter.createDocuments([text.text || ""])
  console.log(texts);
  return texts;
}

export async function splitTextFromString(text, chunkSize = 400, chunkOverlap = 150) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
  const chunks = await splitter.createDocuments([text])
  return chunks;
}