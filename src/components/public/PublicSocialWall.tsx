import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Building2,
  ExternalLink,
  Facebook,
  HardHat,
  Map,
  Package,
  Radio,
  Youtube,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import dbClient from "../../data/tableClient";

const DEFAULT_FACEBOOK_PAGE =
  "https://www.facebook.com/entreprisegnambaservices/";
const DEFAULT_YOUTUBE_SOURCE = "https://www.youtube.com/embed/jgrxlWmkn7E";

interface SocialNewsCard {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  year: number;
  image_url?: string;
}

const fallbackNewsCards: SocialNewsCard[] = [
  {
    id: "fb-btp",
    title: "Suivi de chantiers BTP",
    description:
      "Avancement des travaux, livraisons et temps forts de nos interventions sur le terrain.",
    category: "btp",
    location: "Abidjan",
    year: new Date().getFullYear(),
  },
  {
    id: "fb-immo",
    title: "Mises à jour immobilier",
    description:
      "Biens valorisés, gestion locative et nouveautés autour de nos opérations immobilières.",
    category: "immobilier",
    location: "Côte d’Ivoire",
    year: new Date().getFullYear(),
  },
  {
    id: "fb-foncier",
    title: "Actualités foncières",
    description:
      "Sécurisation de dossiers, accompagnement des clients et opérations foncières récentes.",
    category: "foncier",
    location: "Grand Abidjan",
    year: new Date().getFullYear(),
  },
];

const categoryMeta: Record<
  string,
  {
    label: string;
    icon: ComponentType<{ size?: number | string; className?: string }>;
    accent: string;
  }
> = {
  btp: { label: "BTP", icon: HardHat, accent: "from-blue-600 to-blue-800" },
  immobilier: {
    label: "Immobilier",
    icon: Building2,
    accent: "from-sky-500 to-sky-700",
  },
  foncier: {
    label: "Foncier",
    icon: Map,
    accent: "from-emerald-500 to-emerald-700",
  },
  fournitures: {
    label: "Fournitures",
    icon: Package,
    accent: "from-amber-500 to-amber-700",
  },
};

function extractIframeSrc(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.includes("<iframe")) return trimmed;
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match?.[1]?.trim() || trimmed;
}

function normalizeUrl(value: string): string {
  const raw = extractIframeSrc(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.toString();
  } catch {
    return raw;
  }
}

function normalizeFacebookPageUrl(value: string): string {
  const source = normalizeUrl(value);
  if (!source) return DEFAULT_FACEBOOK_PAGE;

  try {
    const url = new URL(source);
    if (
      url.hostname === "web.facebook.com" ||
      url.hostname === "m.facebook.com"
    ) {
      url.hostname = "www.facebook.com";
    }
    url.search = "";
    return url.toString();
  } catch {
    return source
      .replace("://web.facebook.com", "://www.facebook.com")
      .replace("://m.facebook.com", "://www.facebook.com");
  }
}

function buildFacebookPagePluginUrl(pageUrl: string): string {
  const source = normalizeFacebookPageUrl(pageUrl);
  return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(source)}&tabs=timeline&width=500&height=760&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&lazy=true`;
}

function getYouTubeVideoId(value: string): string | null {
  const source = normalizeUrl(value);
  if (!source) return null;

  const embedMatch = source.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch?.[1]) return embedMatch[1];

  const shortMatch = source.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch?.[1]) return shortMatch[1];

  try {
    const url = new URL(source);
    const directId = url.searchParams.get("v");
    if (directId) return directId;

    const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch?.[1]) return shortsMatch[1];
  } catch {
    return null;
  }

  return null;
}

function getYouTubePlaylistId(value: string): string | null {
  const source = normalizeUrl(value);
  if (!source) return null;

  try {
    const url = new URL(source);
    return url.searchParams.get("list");
  } catch {
    const match = source.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match?.[1] || null;
  }
}

function getYouTubeChannelIdentifier(value: string): string | null {
  const source = normalizeUrl(value);
  if (!source) return null;

  try {
    const url = new URL(source);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length === 0) return null;

    if (segments[0]?.startsWith("@")) {
      return segments[0].slice(1) || null;
    }

    if (
      (segments[0] === "channel" ||
        segments[0] === "user" ||
        segments[0] === "c") &&
      segments[1]
    ) {
      return segments[1];
    }
  } catch {
    return null;
  }

  return null;
}

function buildYouTubePlaylistEmbed(playlistId: string): string {
  return `https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(playlistId)}&rel=0&playsinline=1&hl=fr&cc_lang_pref=fr`;
}

function buildYouTubeUploadsEmbed(identifier: string): string {
  return `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${encodeURIComponent(identifier)}&rel=0&playsinline=1&hl=fr&cc_lang_pref=fr`;
}

function buildYouTubeVideoEmbed(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1&hl=fr&cc_lang_pref=fr&cc_load_policy=1`;
}

function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function isCspBlockedEnvironment() {
  if (typeof window === "undefined") return false;
  return (
    /Firefox|Chrome|Safari/.test(navigator.userAgent || "") &&
    window.location.protocol === "https:"
  );
}

export default function PublicSocialWall() {
  const { settings } = useSettings();
  const [derivedChannel, setDerivedChannel] = useState<{
    identifier: string;
    url: string;
    label: string;
  } | null>(null);
  const [newsCards, setNewsCards] = useState<SocialNewsCard[]>([]);
  const [socialBlocked] = useState<boolean>(() => isCspBlockedEnvironment());

  const facebookUrl = normalizeFacebookPageUrl(
    settings.social_facebook?.trim() || DEFAULT_FACEBOOK_PAGE,
  );
  const facebookEmbedUrl = useMemo(
    () => buildFacebookPagePluginUrl(facebookUrl),
    [facebookUrl],
  );
  const youtubeSource =
    settings.social_youtube?.trim() || DEFAULT_YOUTUBE_SOURCE;

  const normalizedYoutubeSource = useMemo(
    () => normalizeUrl(youtubeSource),
    [youtubeSource],
  );
  const playlistId = useMemo(
    () => getYouTubePlaylistId(normalizedYoutubeSource),
    [normalizedYoutubeSource],
  );
  const directChannelIdentifier = useMemo(
    () => getYouTubeChannelIdentifier(normalizedYoutubeSource),
    [normalizedYoutubeSource],
  );
  const videoId = useMemo(
    () => getYouTubeVideoId(normalizedYoutubeSource),
    [normalizedYoutubeSource],
  );

  useEffect(() => {
    let cancelled = false;

    if (socialBlocked) {
      setDerivedChannel(null);
      return () => {
        cancelled = true;
      };
    }

    if (playlistId || directChannelIdentifier || !videoId) {
      setDerivedChannel(null);
      return () => {
        cancelled = true;
      };
    }

    const watchUrl = buildYouTubeWatchUrl(videoId);

    fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("oEmbed unavailable");
        return response.json() as Promise<{
          author_name?: string;
          author_url?: string;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        const identifier = getYouTubeChannelIdentifier(data.author_url || "");
        if (!identifier) return;

        setDerivedChannel({
          identifier,
          url: data.author_url || watchUrl,
          label: data.author_name || "Chaîne YouTube",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDerivedChannel(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [directChannelIdentifier, playlistId, socialBlocked, videoId]);

  const youtubeEmbedUrl = useMemo(() => {
    if (playlistId) return buildYouTubePlaylistEmbed(playlistId);
    if (directChannelIdentifier)
      return buildYouTubeUploadsEmbed(directChannelIdentifier);
    if (derivedChannel?.identifier)
      return buildYouTubeUploadsEmbed(derivedChannel.identifier);
    if (videoId) return buildYouTubeVideoEmbed(videoId);
    return null;
  }, [
    derivedChannel?.identifier,
    directChannelIdentifier,
    playlistId,
    videoId,
  ]);

  const youtubeLink = useMemo(() => {
    if (playlistId) return normalizedYoutubeSource;
    if (directChannelIdentifier) return normalizedYoutubeSource;
    if (derivedChannel?.url) return derivedChannel.url;
    if (videoId) return buildYouTubeWatchUrl(videoId);
    return normalizedYoutubeSource;
  }, [
    derivedChannel?.url,
    directChannelIdentifier,
    normalizedYoutubeSource,
    playlistId,
    videoId,
  ]);

  const youtubeStatus = playlistId
    ? "Contenus vidéo de l'entreprise"
    : directChannelIdentifier || derivedChannel?.identifier
      ? "Dernières vidéos de l'entreprise"
      : "Vidéo de présentation";

  useEffect(() => {
    if (socialBlocked) {
      return;
    }

    let cancelled = false;
    const fetchNewsCards = async () => {
      try {
        const { data } = await dbClient
          .from("site_realisations")
          .select(
            "id, title, description, category, year, location, image_url, featured, sort_order",
          )
          .order("featured", { ascending: false })
          .order("sort_order")
          .limit(5);

        if (cancelled) return;
        const cards = ((data as SocialNewsCard[] | null) || []).filter(
          (item) => item.title && item.category,
        );
        setNewsCards(cards.slice(0, 5));
      } catch {
        if (!cancelled) {
          setNewsCards([]);
        }
      }
    };

    void fetchNewsCards();

    return () => {
      cancelled = true;
    };
  }, [socialBlocked]);

  const facebookCards = newsCards.length > 0 ? newsCards : fallbackNewsCards;
  const socialHighlights = facebookCards.slice(0, 3);

  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
            <Radio size={14} />
            Médias et actualités
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Nos réalisations et nos contenus sociaux, présentés proprement
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600">
            Un bloc clair pour suivre nos temps forts, voir nos publications
            officielles et accéder à nos vidéos sans message d’erreur visible.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1877f2]/10 px-3 py-1 text-xs font-semibold text-[#1877f2]">
                  <Facebook size={14} />
                  Fil Facebook
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Nos publications récentes
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Une vue directe sur notre page Facebook officielle, avec un
                  aperçu complémentaire des projets mis en avant.
                </p>
              </div>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Ouvrir
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="flex-1 bg-slate-50 p-3 sm:p-4">
              <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                {socialBlocked ? (
                  <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center">
                    <div className="max-w-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <Facebook size={28} />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">
                        Intégration Facebook indisponible ici
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Le contenu est disponible directement sur notre page
                        officielle.
                      </p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    title="Fil Facebook GNAMBA SERVICES"
                    src={facebookEmbedUrl}
                    className="h-[620px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {socialHighlights.map((card) => {
                  const meta =
                    categoryMeta[card.category?.toLowerCase() || "btp"] ||
                    categoryMeta.btp;
                  const Icon = meta.icon;

                  return (
                    <article
                      key={card.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} text-white`}
                        >
                          <Icon size={16} />
                        </span>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {meta.label}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {card.location}
                          </div>
                        </div>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-slate-900 line-clamp-2">
                        {card.title}
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-3">
                        {card.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <Youtube size={14} />
                  YouTube
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Vidéos et présentations
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {youtubeStatus}
                </p>
              </div>
              {youtubeLink && (
                <a
                  href={youtubeLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-red-300 hover:text-red-700"
                >
                  Voir sur YouTube
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="flex-1 bg-slate-50 p-3 sm:p-4">
              <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-black shadow-sm">
                {youtubeEmbedUrl && !socialBlocked ? (
                  <iframe
                    title="Lecteur YouTube GNAMBA SERVICES"
                    src={youtubeEmbedUrl}
                    className="aspect-video w-full border-0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 text-center">
                    <div className="max-w-sm">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Youtube size={28} />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-white">
                        Espace vidéo prêt à accueillir vos contenus
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Dès qu’une chaîne ou une playlist est renseignée dans
                        les paramètres, les vidéos s’affichent ici
                        automatiquement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
