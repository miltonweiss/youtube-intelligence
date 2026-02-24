import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";



export const metadata = {
  title: "Youtube Transcript Intelligence",
  description: "Extract transcripts from videos or playlists and chat with them.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`$ antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
