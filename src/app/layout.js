import localFont from 'next/font/local'
import "./globals.css";

const satoshi = localFont({
  src: '../../public/fonts/Satoshi-Variable.ttf',
  weight: '100 900', 
  display: 'swap',
  variable: '--font-satoshi',
})

export const metadata = {
  title: "Youtube Intelligence",
  description: "Extract transcripts from videos or playlists and chat with them.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${satoshi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
