import type { Metadata, Viewport } from "next";
import { DecisionProvider } from "@/components/decision-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextStep — 看清取舍，决定由你 🎯",
  description: "超有趣的 AI 决策分析工具，帮你在重大选择前想清楚再行动！",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-bg" aria-hidden="true">
          <div className="blob pink" />
          <div className="blob yellow" />
          <div className="blob cyan" />
          <div className="blob purple" />
          <span className="emoji" style={{ top: "15%", left: "10%", fontSize: "2rem" }}>✨</span>
          <span className="emoji" style={{ top: "40%", right: "8%", fontSize: "1.5rem" }}>💭</span>
          <span className="emoji" style={{ bottom: "30%", left: "5%", fontSize: "2.5rem" }}>🎯</span>
          <span className="emoji" style={{ top: "60%", right: "12%", fontSize: "1.5rem" }}>🌈</span>
          <span className="emoji" style={{ bottom: "15%", right: "25%", fontSize: "2rem" }}>🎪</span>
          <div className="dot-pattern" />
        </div>
        <DecisionProvider>{children}</DecisionProvider>
      </body>
    </html>
  );
}
