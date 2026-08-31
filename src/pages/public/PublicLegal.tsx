import {
  Building2,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Scale,
  AlertCircle,
} from "lucide-react";
import { OFFICIAL_CONTACT, buildWhatsAppUrl } from "../../lib/officialContact";

// Premium UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Container,
  Grid,
  Flex,
  IconWrapper,
  Divider,
} from "../../components/ui";

const legalPoints = [
  {
    icon: Building2,
    label: "Raison sociale",
    value: OFFICIAL_CONTACT.legalName,
  },
  {
    icon: FileText,
    label: "Forme juridique",
    value: OFFICIAL_CONTACT.legalForm,
  },
  {
    icon: ClipboardList,
    label: "RCCM",
    value: OFFICIAL_CONTACT.rccm,
  },
  {
    icon: FileText,
    label: "NCC",
    value: OFFICIAL_CONTACT.ncc,
  },
  {
    icon: User,
    label: "Dirigeant",
    value: OFFICIAL_CONTACT.director,
  },
  {
    icon: ShieldCheck,
    label: "Capital social",
    value: OFFICIAL_CONTACT.capitalSocial,
  },
];

export default function PublicLegal() {
  const whatsappUrl = buildWhatsAppUrl(OFFICIAL_CONTACT.phone);

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
                <Scale size={14} />
              </IconWrapper>
              <Badge variant="secondary" size="md" className="text-xs bg-white/10 text-white border-white/20">
                Mentions légales
              </Badge>
            </Flex>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Informations légales <span className="bg-gradient-to-r from-white via-white to-sky-200 bg-clip-text text-transparent">et contacts</span>
            </h1>
            <p className="text-sky-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Les données officielles de l'entreprise et les informations utiles
              pour nous contacter ou vérifier l'identité de GNAMBA SERVICES.
            </p>
          </Flex>
        </Container>
      </section>

      {/* Legal Info Grid */}
      <section className="py-20 sm:py-24 lg:py-28 bg-neutral-50">
        <Container size="xl">
          <Flex direction="col" align="center" gap="4" className="mb-12 text-center max-w-3xl mx-auto">
            <Badge variant="primary" size="md" className="text-xs">Identité de l'entreprise</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight">Informations Officielles</h2>
          </Flex>

          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
            {legalPoints.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} variant="elevated" padding="lg" interactive className="h-full">
                  <Flex align="center" gap="3">
                    <IconWrapper size="lg" variant="primary" shape="circle">
                      <Icon size={22} className="text-primary-600" />
                    </IconWrapper>
                    <Flex direction="col" gap="0.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{item.label}</span>
                      <p className="text-sm font-semibold text-neutral-900 break-words">{item.value}</p>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* Contact & Data Protection */}
      <section className="py-20 sm:py-24 lg:py-28 bg-white border-y border-neutral-100">
        <Container size="xl">
          <Grid cols={{ base: 1, lg: 2 }} gap="xl" gapY="md">
            <Card variant="elevated" padding="xl">
              <CardHeader className="mb-6">
                <Badge variant="primary" size="sm" className="mb-4">Coordonnées</Badge>
                <CardTitle className="text-2xl font-extrabold text-neutral-900">Nous joindre</CardTitle>
              </CardHeader>

              <div className="space-y-5">
                <Flex align="start" gap="4">
                  <IconWrapper size="md" variant="primary" shape="circle" className="flex-shrink-0">
                    <MapPin size={20} className="text-primary-600" />
                  </IconWrapper>
                  <Flex direction="col" gap="0.5">
                    <span className="font-semibold text-neutral-900">Adresse</span>
                    <p className="text-sm text-neutral-600">{OFFICIAL_CONTACT.address}</p>
                    <p className="text-sm text-neutral-500">{OFFICIAL_CONTACT.physicalAddress}</p>
                  </Flex>
                </Flex>

                <Flex align="start" gap="4">
                  <IconWrapper size="md" variant="primary" shape="circle" className="flex-shrink-0">
                    <Phone size={20} className="text-primary-600" />
                  </IconWrapper>
                  <Flex direction="col" gap="0.5">
                    <span className="font-semibold text-neutral-900">Téléphone</span>
                    <a href={`tel:${OFFICIAL_CONTACT.phone.replace(/\s+/g, "")}`} className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                      {OFFICIAL_CONTACT.phone}
                    </a>
                  </Flex>
                </Flex>

                <Flex align="start" gap="4">
                  <IconWrapper size="md" variant="primary" shape="circle" className="flex-shrink-0">
                    <Mail size={20} className="text-primary-600" />
                  </IconWrapper>
                  <Flex direction="col" gap="0.5">
                    <span className="font-semibold text-neutral-900">Email</span>
                    <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="text-sm text-primary-600 hover:text-primary-700 transition-colors">
                      {OFFICIAL_CONTACT.email}
                    </a>
                    <a href={`mailto:${OFFICIAL_CONTACT.quoteEmail}`} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                      {OFFICIAL_CONTACT.quoteEmail}
                    </a>
                  </Flex>
                </Flex>
              </div>

              <Divider className="my-6" />

              <CardTitle className="text-lg font-bold text-neutral-900 mb-3">Horaires</CardTitle>
              <p className="text-sm text-neutral-600">{OFFICIAL_CONTACT.hours}. Délai de réponse: {OFFICIAL_CONTACT.responseTime}.</p>
            </Card>

            <Card variant="default" padding="xl" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} className="text-white">
              <CardHeader className="mb-6">
                <Badge variant="secondary" size="sm" className="mb-4 bg-white/10 text-white border-white/20">Protection des données</Badge>
                <CardTitle className="text-2xl font-extrabold">Vos Données Protégées</CardTitle>
              </CardHeader>

              <div className="space-y-4 mb-8">
                <p className="text-sm text-primary-100 leading-relaxed">
                  Les informations que vous transmettez via nos formulaires sont
                  utilisées uniquement pour traiter votre demande, qualifier
                  votre besoin et vous recontacter.
                </p>
                <p className="text-sm text-primary-100 leading-relaxed">
                  Les lots publiés sur la vitrine peuvent être retirés,
                  réservés ou modifiés selon leur disponibilité et les mises à
                  jour commerciales.
                </p>
                <p className="text-sm text-primary-100 leading-relaxed">
                  Pour toute demande relative à la protection des données ou à la
                  suppression d'une fiche, contactez-nous à{" "}
                  <a href={`mailto:${OFFICIAL_CONTACT.email}`} className="font-semibold text-white underline hover:text-amber-200">
                    {OFFICIAL_CONTACT.email}
                  </a>
                  .
                </p>
              </div>

              <Flex gap="3" wrap>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors min-w-[140px]"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:${OFFICIAL_CONTACT.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors min-w-[140px]"
                >
                  <Mail size={16} />
                  Envoyer un email
                </a>
              </Flex>
            </Card>
          </Grid>

          {/* Disclaimer */}
          <Card variant="bordered" padding="lg" className="mt-10 max-w-4xl mx-auto text-center">
            <Flex align="center" justify="center" gap="2" className="mb-2">
              <IconWrapper size="sm" variant="primary" shape="circle" className="text-primary-600">
                <AlertCircle size={14} />
              </IconWrapper>
              <Badge variant="primary" size="sm">Important</Badge>
            </Flex>
            <CardDescription className="text-sm text-neutral-600">
              Contrôle en ligne opéré via la plateforme GNAMBA SERVICES. Pour tout
              doute, rapprochez la référence affichée du registre administratif
              physique.
            </CardDescription>
          </Card>
        </Container>
      </section>
    </div>
  );
}