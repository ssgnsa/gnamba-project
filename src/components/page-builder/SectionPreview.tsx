import {
  PageSection,
  HeroProps,
  TextProps,
  ServicesProps,
  GalleryProps,
  TestimonialsProps,
  ContactProps,
  CTAProps,
  FAQProps,
  FooterProps,
} from "./types";

function HeroPreview({ props }: { props: HeroProps }) {
  return (
    <div
      className="relative h-48 overflow-hidden rounded-lg"
      style={{
        background: props.bg_image_url
          ? `url(${props.bg_image_url}) center/cover`
          : "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0,0,0,${(props.overlay_opacity || 60) / 100})`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-xl font-bold text-white drop-shadow mb-2 line-clamp-2">
          {props.title}
        </h1>
        <p className="text-sm text-white/80 mb-4 line-clamp-2">
          {props.subtitle}
        </p>
        {props.cta_text && (
          <button className="px-4 py-1.5 bg-white text-teal-700 text-xs font-semibold rounded-full shadow">
            {props.cta_text}
          </button>
        )}
      </div>
    </div>
  );
}

function TextPreview({ props }: { props: TextProps }) {
  const alignClass =
    props.align === "center"
      ? "text-center"
      : props.align === "right"
        ? "text-right"
        : "text-left";
  return (
    <div className={`py-8 px-6 ${alignClass}`}>
      <h2 className="text-lg font-bold text-slate-800 mb-3">{props.title}</h2>
      <p className="text-sm text-slate-600 leading-relaxed">{props.content}</p>
    </div>
  );
}

function ServicesPreview({ props }: { props: ServicesProps }) {
  return (
    <div className="py-8 px-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">{props.title}</h2>
        <p className="text-xs text-slate-500 mt-1">{props.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(props.items || []).slice(0, 3).map((item, i) => (
          <div key={i} className="text-center p-3 rounded-xl bg-slate-50">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="text-xs font-semibold text-slate-700">{item.title}</p>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryPreview({ props }: { props: GalleryProps }) {
  const cols = props.columns || 3;
  return (
    <div className="py-8 px-6">
      <h2 className="text-lg font-bold text-slate-800 text-center mb-5">
        {props.title}
      </h2>
      {(props.images || []).length === 0 ? (
        <div
          className={`grid gap-3`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-slate-400 text-xs">Image {i + 1}</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-3`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {(props.images || []).slice(0, cols * 2).map((img, i) => (
            <div
              key={i}
              className="aspect-video bg-slate-100 rounded-lg overflow-hidden"
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Photo
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsPreview({ props }: { props: TestimonialsProps }) {
  return (
    <div className="py-8 px-6 bg-slate-50">
      <h2 className="text-lg font-bold text-slate-800 text-center mb-5">
        {props.title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {(props.items || []).slice(0, 2).map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs text-slate-600 italic mb-3 line-clamp-3">
              "{item.text}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-600">
                {item.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {item.name}
                </p>
                <p className="text-xs text-slate-400">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview({ props }: { props: ContactProps }) {
  return (
    <div className="py-8 px-6">
      <div className="text-center mb-5">
        <h2 className="text-lg font-bold text-slate-800">{props.title}</h2>
        <p className="text-xs text-slate-500 mt-1">{props.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-base">📍</span>
            {props.address}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-base">📞</span>
            {props.phone}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-base">✉️</span>
            {props.email}
          </div>
        </div>
        {props.show_form && (
          <div className="space-y-2">
            <div className="h-7 bg-slate-100 rounded-lg" />
            <div className="h-7 bg-slate-100 rounded-lg" />
            <div className="h-16 bg-slate-100 rounded-lg" />
            <button className="w-full py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg">
              Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CTAPreview({ props }: { props: CTAProps }) {
  return (
    <div
      className="py-10 px-6 text-center rounded-lg"
      style={{ backgroundColor: props.bg_color || "#0f766e" }}
    >
      <h2 className="text-lg font-bold text-white mb-2">{props.title}</h2>
      <p className="text-sm text-white/80 mb-5">{props.subtitle}</p>
      <button
        className="px-6 py-2 bg-white text-sm font-semibold rounded-full"
        style={{ color: props.bg_color || "#0f766e" }}
      >
        {props.button_text}
      </button>
    </div>
  );
}

function FAQPreview({ props }: { props: FAQProps }) {
  return (
    <div className="py-8 px-6">
      <h2 className="text-lg font-bold text-slate-800 text-center mb-5">
        {props.title}
      </h2>
      <div className="space-y-2">
        {(props.items || []).slice(0, 3).map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200"
          >
            <p className="text-xs font-semibold text-slate-700 mb-1">
              {item.question}
            </p>
            <p className="text-xs text-slate-500 line-clamp-2">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterPreview({ props }: { props: FooterProps }) {
  return (
    <div className="py-6 px-6 bg-slate-800 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          {props.logo_url ? (
            <img
              src={props.logo_url}
              alt="Logo"
              className="h-8 object-contain"
            />
          ) : (
            <div className="font-bold text-sm">Gnamba Services</div>
          )}
          <p className="text-xs text-slate-400 mt-1">{props.tagline}</p>
        </div>
        <div className="flex gap-3">
          {(props.links || []).slice(0, 4).map((link, i) => (
            <span key={i} className="text-xs text-slate-400">
              {link.label}
            </span>
          ))}
        </div>
      </div>
      {props.show_social !== false && (
        <div className="flex justify-center gap-4 mb-3">
          <span className="text-lg">📘</span>
          <span className="text-lg">📺</span>
          <span className="text-lg">💼</span>
          <span className="text-lg">🐦</span>
        </div>
      )}
      <div className="border-t border-slate-700 pt-3">
        <p className="text-xs text-slate-500 text-center">{props.copyright}</p>
      </div>
    </div>
  );
}

interface SectionPreviewProps {
  section: PageSection;
}

export default function SectionPreview({ section }: SectionPreviewProps) {
  switch (section.type) {
    case "hero":
      return <HeroPreview props={section.props as HeroProps} />;
    case "text":
      return <TextPreview props={section.props as TextProps} />;
    case "services":
      return <ServicesPreview props={section.props as ServicesProps} />;
    case "gallery":
      return <GalleryPreview props={section.props as GalleryProps} />;
    case "testimonials":
      return <TestimonialsPreview props={section.props as TestimonialsProps} />;
    case "contact":
      return <ContactPreview props={section.props as ContactProps} />;
    case "cta":
      return <CTAPreview props={section.props as CTAProps} />;
    case "faq":
      return <FAQPreview props={section.props as FAQProps} />;
    case "footer":
      return <FooterPreview props={section.props as FooterProps} />;
    default:
      return <div className="p-6 text-slate-400 text-sm">Section inconnue</div>;
  }
}
