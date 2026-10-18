import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing">
      <a className="skip-link" href="#public-content">
        Skip to content
      </a>
      <Navbar />
      <main id="public-content">{children}</main>
      <Footer />
    </div>
  );
}
