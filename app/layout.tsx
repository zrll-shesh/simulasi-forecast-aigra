import "./globals.css";
export const metadata = { title: "AIGRA Insight Simulator", description: "Simulasi insight dan rekomendasi AI untuk kumbung jamur" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body>{children}</body></html>);
}
