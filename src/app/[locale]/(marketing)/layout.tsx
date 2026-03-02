import { Inter } from "next/font/google";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { MarketingThemeInit } from "@/components/marketing/MarketingThemeInit";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`marketing-site flex min-h-screen flex-col bg-background text-foreground ${inter.variable}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <MarketingThemeInit />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
