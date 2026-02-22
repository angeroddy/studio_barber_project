import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { getMetadataBase, SITE_NAME } from "@/lib/seo";

const bebasNeue = localFont({
  src: [
    {
      path: "../public/fonts/bebas-neue/BebasNeue Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/bebas-neue/BebasNeue Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/bebas-neue/BebasNeue Book.otf",
      weight: "350",
      style: "normal",
    },
    {
      path: "../public/fonts/bebas-neue/BebasNeue Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/bebas-neue/BebasNeue Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-bebas",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const monumentExtended = localFont({
  src: [
    {
      path: "../public/fonts/Monument/MonumentExtended-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Monument/MonumentExtended-Ultrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-monument-extended",
});

const cyGrotesk = localFont({
  src: "../public/fonts/CyGrotesk/kobuzan-cy-grotesk-grand-dark.otf",
  variable: "--font-cy-grotesk",
});

const archivo = localFont({
  src: [
    {
      path: "../public/fonts/Archivo/Archivo-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/Archivo/Archivo-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/Archivo/Archivo-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: `${SITE_NAME} | Barbier a Grenoble`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Studio Barber Grenoble: deux salons de barbier, tarifs clairs et reservation en ligne rapide.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Barbier a Grenoble`,
    description:
      "Studio Barber Grenoble: deux salons de barbier, tarifs clairs et reservation en ligne rapide.",
    url: "/",
    images: [
      {
        url: "/logoApp.png",
        width: 1200,
        height: 630,
        alt: "Logo Studio Barber Grenoble",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Barbier a Grenoble`,
    description:
      "Studio Barber Grenoble: deux salons de barbier, tarifs clairs et reservation en ligne rapide.",
    images: ["/logoApp.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${bebasNeue.variable} ${geistMono.variable} ${monumentExtended.variable} ${cyGrotesk.variable} ${archivo.variable} antialiased`}
      >
        <QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
