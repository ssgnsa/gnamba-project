import { Trash2, Plus, Image, X } from "lucide-react";
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
  ServiceItem,
  TestimonialItem,
  FAQItem,
  FooterLink,
} from "./types";
import MediaPicker from "../media/MediaPicker";
import { useState } from "react";

interface PropsPanelProps {
  section: PageSection;
  onChange: (updated: PageSection) => void;
  onDelete: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 bg-white";
const textareaCls =
  "w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 bg-white resize-none";

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de l'image..."
          className={inputCls + " flex-1"}
        />
        <button
          onClick={() => setPickerOpen(true)}
          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1 text-xs text-slate-600 flex-shrink-0"
        >
          <Image size={13} />
        </button>
      </div>
      {value && (
        <img
          src={value}
          alt=""
          className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-200"
        />
      )}
      {pickerOpen && (
        <MediaPicker
          onSelect={(media) => {
            onChange(media.url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Field>
  );
}

function HeroEditor({
  props,
  onChange,
}: {
  props: HeroProps;
  onChange: (p: HeroProps) => void;
}) {
  const u = (k: keyof HeroProps, v: string | number) =>
    onChange({ ...props, [k]: v });
  return (
    <div className="space-y-4">
      <Field label="Titre principal">
        <input
          value={props.title}
          onChange={(e) => u("title", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Sous-titre">
        <textarea
          value={props.subtitle}
          onChange={(e) => u("subtitle", e.target.value)}
          rows={3}
          className={textareaCls}
        />
      </Field>
      <ImageField
        label="Image de fond"
        value={props.bg_image_url}
        onChange={(v) => u("bg_image_url", v)}
      />
      <Field label="Opacité overlay (%)">
        <input
          type="range"
          min={0}
          max={100}
          value={props.overlay_opacity}
          onChange={(e) => u("overlay_opacity", Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-slate-400">{props.overlay_opacity}%</span>
      </Field>
      <Field label="Texte du bouton CTA">
        <input
          value={props.cta_text}
          onChange={(e) => u("cta_text", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Lien du bouton CTA">
        <input
          value={props.cta_url}
          onChange={(e) => u("cta_url", e.target.value)}
          className={inputCls}
        />
      </Field>
    </div>
  );
}

function TextEditor({
  props,
  onChange,
}: {
  props: TextProps;
  onChange: (p: TextProps) => void;
}) {
  const u = (k: keyof TextProps, v: string) =>
    onChange({ ...props, [k]: v } as TextProps);
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => u("title", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Contenu">
        <textarea
          value={props.content}
          onChange={(e) => u("content", e.target.value)}
          rows={6}
          className={textareaCls}
        />
      </Field>
      <Field label="Alignement">
        <select
          value={props.align}
          onChange={(e) => u("align", e.target.value)}
          className={inputCls}
        >
          <option value="left">Gauche</option>
          <option value="center">Centré</option>
          <option value="right">Droite</option>
        </select>
      </Field>
    </div>
  );
}

function ServicesEditor({
  props,
  onChange,
}: {
  props: ServicesProps;
  onChange: (p: ServicesProps) => void;
}) {
  const updateItem = (i: number, k: keyof ServiceItem, v: string) => {
    const items = [...props.items];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...props, items });
  };
  const addItem = () =>
    onChange({
      ...props,
      items: [
        ...props.items,
        { icon: "⚡", title: "Nouveau service", description: "" },
      ],
    });
  const removeItem = (i: number) =>
    onChange({ ...props, items: props.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <Field label="Titre de la section">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Sous-titre">
        <input
          value={props.subtitle}
          onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
          className={inputCls}
        />
      </Field>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Services ({props.items.length})
          </label>
          <button
            onClick={addItem}
            className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {props.items.map((item, i) => (
            <div
              key={i}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">
                  Service {i + 1}
                </span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  placeholder="Icône (emoji)"
                  value={item.icon}
                  onChange={(e) => updateItem(i, "icon", e.target.value)}
                  className={inputCls + " text-lg"}
                />
                <input
                  placeholder="Titre"
                  value={item.title}
                  onChange={(e) => updateItem(i, "title", e.target.value)}
                  className={inputCls}
                />
                <textarea
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  rows={2}
                  className={textareaCls}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryEditor({
  props,
  onChange,
}: {
  props: GalleryProps;
  onChange: (p: GalleryProps) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const addImage = (url: string) =>
    onChange({
      ...props,
      images: [...(props.images || []), { url, caption: "" }],
    });
  const removeImage = (i: number) =>
    onChange({ ...props, images: props.images.filter((_, idx) => idx !== i) });
  const updateCaption = (i: number, caption: string) => {
    const images = [...props.images];
    images[i] = { ...images[i], caption };
    onChange({ ...props, images });
  };
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Colonnes">
        <select
          value={props.columns}
          onChange={(e) =>
            onChange({ ...props, columns: Number(e.target.value) as 2 | 3 | 4 })
          }
          className={inputCls}
        >
          <option value={2}>2 colonnes</option>
          <option value={3}>3 colonnes</option>
          <option value={4}>4 colonnes</option>
        </select>
      </Field>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Images ({(props.images || []).length})
          </label>
          <button
            onClick={() => setPickerOpen(true)}
            className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter une image
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(props.images || []).map((img, i) => (
            <div key={i} className="relative group">
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                {img.url && (
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
              <input
                placeholder="Légende..."
                value={img.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 rounded"
              />
            </div>
          ))}
        </div>
      </div>
      {pickerOpen && (
        <MediaPicker
          onSelect={(media) => {
            addImage(media.url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function TestimonialsEditor({
  props,
  onChange,
}: {
  props: TestimonialsProps;
  onChange: (p: TestimonialsProps) => void;
}) {
  const updateItem = (i: number, k: keyof TestimonialItem, v: string) => {
    const items = [...props.items];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...props, items });
  };
  const addItem = () =>
    onChange({
      ...props,
      items: [
        ...props.items,
        { name: "Nouveau client", role: "Client", text: "", avatar_url: "" },
      ],
    });
  const removeItem = (i: number) =>
    onChange({ ...props, items: props.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Témoignages ({props.items.length})
          </label>
          <button
            onClick={addItem}
            className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
        {props.items.map((item, i) => (
          <div
            key={i}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3"
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">
                Témoignage {i + 1}
              </span>
              <button
                onClick={() => removeItem(i)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={13} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                placeholder="Nom"
                value={item.name}
                onChange={(e) => updateItem(i, "name", e.target.value)}
                className={inputCls}
              />
              <input
                placeholder="Rôle/Titre"
                value={item.role}
                onChange={(e) => updateItem(i, "role", e.target.value)}
                className={inputCls}
              />
              <textarea
                placeholder="Témoignage..."
                value={item.text}
                onChange={(e) => updateItem(i, "text", e.target.value)}
                rows={3}
                className={textareaCls}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactEditor({
  props,
  onChange,
}: {
  props: ContactProps;
  onChange: (p: ContactProps) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Sous-titre">
        <input
          value={props.subtitle}
          onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Adresse">
        <input
          value={props.address}
          onChange={(e) => onChange({ ...props, address: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Téléphone">
        <input
          value={props.phone}
          onChange={(e) => onChange({ ...props, phone: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Email">
        <input
          value={props.email}
          onChange={(e) => onChange({ ...props, email: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Afficher le formulaire">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.show_form}
            onChange={(e) =>
              onChange({ ...props, show_form: e.target.checked })
            }
            className="w-4 h-4 accent-teal-600"
          />
          <span className="text-sm text-slate-600">
            Afficher le formulaire de contact
          </span>
        </label>
      </Field>
    </div>
  );
}

function CTAEditor({
  props,
  onChange,
}: {
  props: CTAProps;
  onChange: (p: CTAProps) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Sous-titre">
        <textarea
          value={props.subtitle}
          onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
          rows={2}
          className={textareaCls}
        />
      </Field>
      <Field label="Texte du bouton">
        <input
          value={props.button_text}
          onChange={(e) => onChange({ ...props, button_text: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Lien du bouton">
        <input
          value={props.button_url}
          onChange={(e) => onChange({ ...props, button_url: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Couleur de fond">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.bg_color}
            onChange={(e) => onChange({ ...props, bg_color: e.target.value })}
            className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
          />
          <input
            value={props.bg_color}
            onChange={(e) => onChange({ ...props, bg_color: e.target.value })}
            className={inputCls}
          />
        </div>
      </Field>
    </div>
  );
}

function FAQEditor({
  props,
  onChange,
}: {
  props: FAQProps;
  onChange: (p: FAQProps) => void;
}) {
  const updateItem = (i: number, k: keyof FAQItem, v: string) => {
    const items = [...props.items];
    items[i] = { ...items[i], [k]: v };
    onChange({ ...props, items });
  };
  const addItem = () =>
    onChange({
      ...props,
      items: [
        ...props.items,
        { question: "Nouvelle question ?", answer: "Réponse..." },
      ],
    });
  const removeItem = (i: number) =>
    onChange({ ...props, items: props.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <Field label="Titre">
        <input
          value={props.title}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Questions ({props.items.length})
          </label>
          <button
            onClick={addItem}
            className="text-xs text-teal-600 flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
        {props.items.map((item, i) => (
          <div
            key={i}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3"
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">
                Q{i + 1}
              </span>
              <button onClick={() => removeItem(i)} className="text-red-400">
                <X size={13} />
              </button>
            </div>
            <input
              placeholder="Question"
              value={item.question}
              onChange={(e) => updateItem(i, "question", e.target.value)}
              className={inputCls + " mb-2"}
            />
            <textarea
              placeholder="Réponse"
              value={item.answer}
              onChange={(e) => updateItem(i, "answer", e.target.value)}
              rows={3}
              className={textareaCls}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterEditor({
  props,
  onChange,
}: {
  props: FooterProps;
  onChange: (p: FooterProps) => void;
}) {
  const updateLink = (i: number, k: keyof FooterLink, v: string) => {
    const links = [...props.links];
    links[i] = { ...links[i], [k]: v };
    onChange({ ...props, links });
  };
  const addLink = () =>
    onChange({
      ...props,
      links: [...props.links, { label: "Lien", url: "/" }],
    });
  const removeLink = (i: number) =>
    onChange({ ...props, links: props.links.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-4">
      <ImageField
        label="Logo"
        value={props.logo_url}
        onChange={(v) => onChange({ ...props, logo_url: v })}
      />
      <Field label="Tagline">
        <input
          value={props.tagline}
          onChange={(e) => onChange({ ...props, tagline: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Copyright">
        <input
          value={props.copyright}
          onChange={(e) => onChange({ ...props, copyright: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Afficher les réseaux sociaux">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={props.show_social}
            onChange={(e) =>
              onChange({ ...props, show_social: e.target.checked })
            }
            className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-xs text-slate-600">
            Afficher les icônes de réseaux sociaux dans le footer
          </span>
        </label>
      </Field>
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-xs font-medium text-slate-600">
            Liens ({props.links.length})
          </label>
          <button
            onClick={addLink}
            className="text-xs text-teal-600 flex items-center gap-1"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
        {props.links.map((link, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Libellé"
              value={link.label}
              onChange={(e) => updateLink(i, "label", e.target.value)}
              className={inputCls}
            />
            <input
              placeholder="URL"
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
              className={inputCls}
            />
            <button
              onClick={() => removeLink(i)}
              className="text-red-400 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPanel({
  section,
  onChange,
  onDelete,
}: PropsPanelProps) {
  const handlePropsChange = (newProps: unknown) => {
    onChange({ ...section, props: newProps as typeof section.props });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Propriétés</h3>
          <p className="text-xs text-slate-400 capitalize">{section.type}</p>
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors"
        >
          <Trash2 size={13} />
          Supprimer
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {section.type === "hero" && (
          <HeroEditor
            props={section.props as HeroProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "text" && (
          <TextEditor
            props={section.props as TextProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "services" && (
          <ServicesEditor
            props={section.props as ServicesProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "gallery" && (
          <GalleryEditor
            props={section.props as GalleryProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "testimonials" && (
          <TestimonialsEditor
            props={section.props as TestimonialsProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "contact" && (
          <ContactEditor
            props={section.props as ContactProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "cta" && (
          <CTAEditor
            props={section.props as CTAProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "faq" && (
          <FAQEditor
            props={section.props as FAQProps}
            onChange={handlePropsChange}
          />
        )}
        {section.type === "footer" && (
          <FooterEditor
            props={section.props as FooterProps}
            onChange={handlePropsChange}
          />
        )}
      </div>
    </div>
  );
}
