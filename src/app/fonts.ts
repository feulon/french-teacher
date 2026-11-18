import localFont from "next/font/local";

// Fraunces (títulos), Instrument Sans (interface) e Playwrite FR Moderne (cursiva
// escolar, só decoração) são subconjuntos latin das fontes do Google Fonts (OFL).
export const display = localFont({
  src: "./fonts/fraunces.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-display",
});

export const sans = localFont({
  src: "./fonts/instrument-sans.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-sans",
});

export const hand = localFont({
  src: "./fonts/playwrite-fr-moderne.woff2",
  weight: "100 400",
  display: "swap",
  variable: "--font-hand",
});

// Gentium Plus (SIL, OFL) em um único arquivo com todo o bloco IPA e os
// diacríticos combinantes (til de /ɑ̃/, /œ̃/...). As fontes de interface não têm
// esses glifos, e separar "latin" de "vietnamese" quebra o til combinante.
// Só é baixada quando alguma tela usa a classe .ipa.
export const ipa = localFont({
  src: "./fonts/gentium-plus-ipa.woff2",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-ipa",
});
