import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horários & Ensalamento - UniCatólica",
  description: "Consulte horários e salas de aula de forma rápida e atualizada. Centro Universitário Católica do Tocantins.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
