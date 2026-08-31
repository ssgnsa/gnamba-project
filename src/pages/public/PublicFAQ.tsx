import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  MessageCircle,
  Phone,
  ShieldCheck,
  Search,
} from "lucide-react";
import type { PublicPage } from "../../lib/publicRoutes";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Button,
  Card,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Flex,
  IconWrapper,
  Input,
} from "../../components/ui";

interface Props {
  onNavigate: (page: PublicPage) => void;
}

const faqs = [
  {
    question: "Comment réserver un lot à vendre ?",
    answer:
      "Après votre prise de contact, nous confirmons la disponibilité, les documents et les conditions commerciales avant toute réservation.",
  },
  {
    question: "Les lots publiés sont-ils vérifiés ?",
    answer:
      "Oui. Chaque fiche publique est contrôlée avant publication et accompagnée des éléments disponibles.",
  },
  {
    question: "Puis-je demander un lot avec peu d'informations ?",
    answer:
      "Oui, vous pouvez commencer avec les informations essentielles puis compléter la fiche plus tard.",
  },
  {
    question: "Quel est le délai de réponse ?",
    answer:
      "Notre engagement est une réponse sous 48h ouvrées maximum, par téléphone, WhatsApp ou email.",
  },
  {
    question: "À quoi sert l'espace foncier ?",
    answer:
      "L'espace foncier reste dédié au suivi administratif des lots après achat, vente ou régularisation. Le catalogue des lots à vendre est séparé.",
  },
  {
    question: "Quels documents sont généralement demandés ?",
    answer:
      "Attestation coutumière, plan de bornage, référence de lotissement et toute pièce utile à la sécurisation de la transaction.",
  },
];

export default function PublicFAQ({ onNavigate }: Props) {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const nav = (page: PublicPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0284c7 100%)' }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container size="xl" className="relative z-10 py-8">
          <Flex direction="col" align="center" gap="4" className="text-center max-w-4xl mx-auto">
            <Flex align="center" justify="center" gap="2" className="mb-2">
              <IconWrapper size="sm" variant="secondary" shape="circle" className="bg-white/10 text-white border-white/20">
                <ShieldCheck size={14} />
              </IconWrapper>
              <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
                FAQ
              </Badge>
            </Flex>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Questions <span className="bg-gradient-to-r from-white via-white to-sky-200 bg-clip-text text-transparent">fréquentes</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Des réponses claires sur les lots à vendre, la réservation, les
              documents et notre façon de travailler.
            </p>
            <Flex align="center" justify="center" gap="4" className="pt-4">
              <Button size="lg" variant="secondary" onClick={() => nav("contact")} iconRight={<ArrowRight size={20} />} className="shadow-lg">
                Demander un devis
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-base transition-all duration-200 shadow-lg"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Search */}
      <section className="py-8 bg-white border-b border-neutral-100">
        <Container size="xl">
          <Input
            placeholder="Rechercher une question..."
            iconLeft={<Search size={18} />}
            className="max-w-2xl"
          />
        </Container>
      </section>

      {/* FAQ List */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Aide rapide</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Questions Fréquentes</h2>
            <p className="text-neutral-500 text-lg leading-relaxed">Trouvez rapidement les réponses aux questions les plus posées par nos clients.</p>
          </Flex>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                variant="default"
                padding="none"
                className="overflow-hidden group"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 text-left hover:bg-neutral-50 transition-colors"
                >
                  <Flex align="center" justify="between" gap="4">
                    <h3 className="font-semibold text-neutral-900 text-base pr-10">{faq.question}</h3>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-neutral-400 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""}`}
                    />
                  </Flex>
                  {openIndex === index && (
                    <p className="mt-4 text-sm leading-7 text-neutral-600 animate-in fade-in duration-200">{faq.answer}</p>
                  )}
                </button>
              </Card>
            ))}
          </div>

          {/* CTA Card */}
          <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} className="text-white mt-10">
            <Flex direction="col" align="start" smDirection="row" smAlign="center" smJustify="between" gap="6">
              <Flex direction="col" gap="3">
                <Badge variant="secondary" size="sm" className="w-fit bg-white/10 text-white border-white/20">Besoin d'aide</Badge>
                <CardTitle className="text-2xl font-extrabold">Nous répondons sous 48h ouvrées</CardTitle>
                <CardDescription className="text-primary-100 max-w-xl">
                  Appelez-nous au {OFFICIAL_CONTACT.phone}, écrivez à{" "}
                  {OFFICIAL_CONTACT.email} ou utilisez WhatsApp pour une réponse
                  plus rapide.
                </CardDescription>
              </Flex>
              <a
                href={`tel:${OFFICIAL_CONTACT.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors min-w-[160px]"
              >
                <Phone size={18} />
                Appeler maintenant
              </a>
            </Flex>
          </Card>
        </Container>
      </section>
    </div>
  );
}