import localFont from "next/font/local";
import type { Metadata } from "next";
import { Anton, Archivo, Inter } from "next/font/google";
import "./globals.css";
import { ScrollExperience } from "@/components/ScrollExperience";

const novaQuinta = localFont({
    src: "../public/fonts/NovaQuinta.otf",
    variable: "--font-nova",
    display: "swap",
});

const archivo = Archivo({
    subsets: ["latin"],
    variable: "--font-archivo",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const anton = Anton({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-anton",
});

export const metadata: Metadata = {
    title: "Uyên Như — Lễ tốt nghiệp 2026",
    description: "Tốt nghiệp của Uyên Như.",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="vi"
            className={`h-full antialiased ${archivo.variable} ${inter.variable} ${anton.variable} ${novaQuinta.variable}`}
        >
        <body className="flex min-h-full flex-col font-sans">
            {children}
            <ScrollExperience />
        </body>
        </html>
    );
}