import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LangChain.js x AI SDK",
  description: "LangChain.js examples with AI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mx-auto w-full max-w-2xl py-4 flex flex-row gap-2">
          <a href="/stream">Streaming example</a>
          <a href="/tools">Tool calling example</a>
          <a href="/agent">Agent streaming example</a>
        </div>
        {children}
      </body>
    </html>
  );
}
