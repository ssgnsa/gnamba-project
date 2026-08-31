import { CheckCircle2, ArrowRight } from "lucide-react";
import { Container, Flex, Badge } from "../../components/ui";

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface Props {
  steps?: ProcessStep[];
  className?: string;
}

const defaultSteps: ProcessStep[] = [
  {
    number: "1",
    title: "Échange initial",
    description: "Vous décrivez votre projet, vos besoins et vos contraintes. Nous vous écoutons pour bien comprendre vos attentes.",
  },
  {
    number: "2",
    title: "Vérification & Devis",
    description: "Nous analysons votre dossier (vérification foncière, devis technique). Réponse claire et transparente sous 48h.",
  },
  {
    number: "3",
    title: "Exécution & Suivi",
    description: "Nous mettons en œuvre votre projet avec un suivi régulier. Vous êtes informé à chaque étape importante.",
  },
  {
    number: "4",
    title: "Livraison & Accompagnement",
    description: "Finalisation et livraison clé en main. Nous restons disponibles pour questions et suivi post-projet.",
  },
];

/**
 * ProcessSteps - Comment on travaille
 * Montre aux clients les 4 étapes standardisées du processus
 */
export default function ProcessSteps({ steps = defaultSteps, className = "" }: Props) {
  return (
    <section className={`py-20 sm:py-24 lg:py-28 bg-white ${className}`}>
      <Container size="xl">
        {/* Header */}
        <Flex direction="col" align="center" gap="4" className="mb-16 text-center max-w-3xl mx-auto">
          <Badge variant="primary" size="md" className="text-xs">
            Notre approche
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight">
            Comment nous travaillons
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Un processus clair, transparent et adapté à vos besoins. De l'échange initial à la livraison finale.
          </p>
        </Flex>

        {/* Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col">
              {/* Step Card */}
              <div className="flex-1 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-300">
                {/* Step Number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow connector (hidden on last item, hidden on mobile below 2 cols) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center h-12 text-neutral-300">
                  <ArrowRight size={20} className="rotate-90" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <Flex direction="col" align="center" gap="4" className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-neutral-600 text-lg leading-relaxed">
            Vous avez des questions sur notre approche ? Contactez-nous directement.
          </p>
        </Flex>
      </Container>
    </section>
  );
}
