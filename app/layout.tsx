import type { Metadata } from "next";
import { getPublicSiteUrl } from "../lib/public-site-url";
import { withSiteBasePath } from "../lib/site-paths";
import "./globals.css";

const publicSiteUrl = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
const isIndexable = Boolean(
  publicSiteUrl && process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true",
);

const socialImage = publicSiteUrl
  ? new URL("og-loft-v2-1200.png", publicSiteUrl).toString()
  : undefined;

const fontRoot = withSiteBasePath("/fonts");
const localFontStyles = `
  @font-face {
    font-family: "Manrope";
    src: url("${fontRoot}/Manrope-Regular.ttf") format("truetype");
    font-style: normal;
    font-weight: 400;
    font-display: swap;
  }
  @font-face {
    font-family: "Manrope";
    src: url("${fontRoot}/Manrope-SemiBold.ttf") format("truetype");
    font-style: normal;
    font-weight: 600;
    font-display: swap;
  }
  @font-face {
    font-family: "Cormorant Garamond";
    src: url("${fontRoot}/CormorantGaramond-Regular.ttf") format("truetype");
    font-style: normal;
    font-weight: 400;
    font-display: swap;
  }
  @font-face {
    font-family: "Cormorant Garamond";
    src: url("${fontRoot}/CormorantGaramond-Italic.ttf") format("truetype");
    font-style: italic;
    font-weight: 400;
    font-display: swap;
  }
`;

export const metadata: Metadata = {
  ...(publicSiteUrl ? { metadataBase: publicSiteUrl } : {}),
  ...(publicSiteUrl
    ? {
        alternates: { canonical: publicSiteUrl },
      }
    : {}),
  title: "Фитнес-студия — сила в своём ритме",
  description: "Концепция фитнес-студии с разными направлениями, расписанием и личным кабинетом в премиальной лофтовой эстетике.",
  icons: {
    icon: withSiteBasePath("/favicon.svg"),
  },
  robots: isIndexable
    ? { index: true, follow: true }
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
  openGraph: {
    title: "Фитнес-студия — сила в своём ритме",
    description: "Тренировки, расписание и личный кабинет в единой системе.",
    type: "website",
    locale: "ru_RU",
    ...(publicSiteUrl ? { url: publicSiteUrl } : {}),
    ...(socialImage
      ? {
          images: [
            {
              url: socialImage,
              width: 1200,
              height: 630,
              alt: "Премиальная фитнес-студия в лофтовой эстетике.",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: socialImage ? "summary_large_image" : "summary",
    title: "Фитнес-студия — сила в своём ритме",
    description: "Тренировки, расписание и личный кабинет в единой системе.",
    ...(socialImage ? { images: [socialImage] } : {}),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <style>{localFontStyles}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
