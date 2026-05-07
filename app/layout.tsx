import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blackout Casino — GTA RP",
  description: "Painel flutuante premium para FiveM NUI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var f=window.location.href.indexOf('cfx-nui-')!==-1;document.documentElement.style.background=f?'transparent':'#0a0a0a';})();` }} />
      </head>
      <body style={{ overflow: "hidden", height: "100%", margin: 0, background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
