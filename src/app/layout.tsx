import type { Metadata, Viewport } from "next";
import { DecisionProvider } from "@/components/decision-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "NextStep · AI 决策分析",
  description: "看清不同选择的取舍，让下一步更清晰。",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f6f1",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  function setZoom(){
    var w = window.innerWidth, h = window.innerHeight;
    var z = Math.min(1, (h - 24) / 958, (w - 40) / 460);
    document.documentElement.style.setProperty('--app-zoom', z);
  }
  setZoom();
  window.addEventListener('resize', setZoom);
  window.addEventListener('orientationchange', setZoom);
})();
`,
          }}
        />
      </head>
      <body>
        <DecisionProvider>{children}</DecisionProvider>
      </body>
    </html>
  );
}
