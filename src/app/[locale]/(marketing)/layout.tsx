import { Sora } from "next/font/google";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`marketing-site flex min-h-screen flex-col ${sora.variable}`}
      style={{ fontFamily: "var(--font-sora), system-ui, sans-serif" }}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
