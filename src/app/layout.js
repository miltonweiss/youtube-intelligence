import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const satoshi = localFont({
  src: "../../public/fonts/Satoshi-Variable.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-satoshi",
});

export const metadata = {
  title: "Read-the-Video",
  description: "Extract YouTube video and playlist transcripts into your local library. Read, copy, and export transcripts anytime.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${satoshi.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
