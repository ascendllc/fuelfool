import { useEffect, useState } from "react";
import { Link } from "wouter";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import mapBg from "@assets/IMG_0122_1781468294605.jpeg";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FuelFool",
  url: "https://fuelfool.replit.app/",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tacoma",
    addressRegion: "WA",
    addressCountry: "US",
  },
  telephone: "+12534862452",
};

function ProtectedEmail() {
  const [visible, setVisible] = useState(false);

  const parts = ["info", "@", "fuelfool", ".", "com"];
  const email = parts.join("");

  return visible ? (
    <a
      href={`mailto:${email}`}
      className="text-primary hover:brightness-110 transition-colors"
    >
      {email}
    </a>
  ) : (
    <button
      onClick={() => setVisible(true)}
      className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors text-sm cursor-pointer"
      aria-label="Reveal email address"
    >
      Click to reveal email
    </button>
  );
}

export default function Contact() {
  useEffect(() => {
    document.title = "Contact — FuelFool";
    const desc = document.querySelector('meta[name="description"]');
    if (desc)
      desc.setAttribute(
        "content",
        "Contact FuelFool. Located in Tacoma, Washington, USA.",
      );
    return () => {
      document.title = "FuelFool — Don't be Fooled By How Much Fuel";
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${mapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.09,
          mixBlendMode: "luminosity",
        }}
        aria-hidden="true"
      />
      <JsonLd data={contactSchema} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">
        <PageHeader />

        <h2 className="text-3xl font-bold text-foreground mb-2">Contact</h2>
        <p className="text-muted-foreground mb-12 text-sm">
          Please utilize the details listed below to connect with us.
        </p>

        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card/60 backdrop-blur-sm px-6 py-5">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1">Location</p>
            <p className="text-sm text-foreground">Tacoma, Washington, USA</p>
          </div>

          <div className="rounded-xl border border-card-border bg-card/60 backdrop-blur-sm px-6 py-5">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1">Email</p>
            <ProtectedEmail />
          </div>

          <div className="rounded-xl border border-card-border bg-card/60 backdrop-blur-sm px-6 py-5">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1">Phone</p>
            <a
              href="tel:+12534862452"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              253.486.2452
            </a>
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground/50 border-t border-card-border pt-8">
          Data provided by U.S. Energy Information Administration, FuelEconomy.gov, and Google Maps.
          {" · "}
          <Link href="/how-it-works" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">How It Works</Link>
          {" · "}
          <Link href="/faq" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">FAQ</Link>
          {" · "}
          <Link href="/" className="hover:text-muted-foreground underline underline-offset-2 transition-colors">Calculator</Link>
        </footer>
      </div>
    </div>
  );
}
