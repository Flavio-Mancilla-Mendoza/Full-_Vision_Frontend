import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const legalLinks = [
    { label: "Términos y condiciones", path: "/terminos" },
    { label: "Política de privacidad", path: "/privacidad" },
    { label: "Política de envíos", path: "/envios" },
    { label: "Política de devoluciones", path: "/devoluciones" },
  ];

  const serviceLinks = ["Preguntas frecuentes", "Seguimiento de pedido", "Guía de tallas", "Contáctanos"];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicio al Cliente */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Servicio al Cliente</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <p>Email: fullvision_optica@outlook.es</p>
              <p>Teléfono: +51 930639641</p>
              <p>Horario: Lun-Sáb 10:00-19:00</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary-foreground to-accent bg-clip-text text-transparent">
              Full Vision
            </h2>
            <p className="text-sm text-primary-foreground/80">© 2025 Full Vision. Todos los derechos reservados.</p>
          </div>

          {/* Social Media */}
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all hover-lift"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all hover-lift"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all hover-lift"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-all hover-lift"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
