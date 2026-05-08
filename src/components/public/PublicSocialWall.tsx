import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  HardHat,
  Map,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  Youtube,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { supabase } from "../../lib/supabase";

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

function getWrappedIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return (index + total) % total;
}

export default function PublicSocialWall() {
  const { settings } = useSettings();
  const [derivedChannel, setDerivedChannel] = useState<{
    identifier: string;
    url: string;
    label: string;
  } | null>(null);
  const [newsCards, setNewsCards] = useState<SocialNewsCard[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeIntentRef = useRef<"horizontal" | "vertical" | null>(null);

  const facebookUrl = normalizeFacebookPageUrl(
    settings.social_facebook?.trim() || DEFAULT_FACEBOOK_PAGE,
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
  }, [directChannelIdentifier, playlistId, videoId]);

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
    ? "Playlist synchronisée automatiquement"
    : directChannelIdentifier || derivedChannel?.identifier
      ? "Dernières vidéos synchronisées automatiquement"
      : "Vidéo source affichée";

  const youtubeHint =
    playlistId || directChannelIdentifier || derivedChannel?.identifier
      ? "Le bloc YouTube suit la source configurée sans retouche manuelle."
      : "Collez une URL de chaîne ou playlist YouTube dans Paramètres > Réseaux sociaux pour un suivi automatique complet.";

  useEffect(() => {
    let cancelled = false;
    const fetchNewsCards = async () => {
      try {
        const { data } = await supabase
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
  }, []);

  const facebookCards = newsCards.length > 0 ? newsCards : fallbackNewsCards;
  const totalNewsCards = facebookCards.length;
  const activeNewsCard = facebookCards[newsIndex] || facebookCards[0];

  useEffect(() => {
    setNewsIndex((current) => getWrappedIndex(current, totalNewsCards));
  }, [totalNewsCards]);

  const showPreviousCard = () => {
    setNewsIndex((current) => getWrappedIndex(current - 1, totalNewsCards));
    setDragOffset(0);
  };

  const showNextCard = () => {
    setNewsIndex((current) => getWrappedIndex(current + 1, totalNewsCards));
    setDragOffset(0);
  };

  const goToCard = (index: number) => {
    setNewsIndex(getWrappedIndex(index, totalNewsCards));
    setDragOffset(0);
  };

  useEffect(() => {
    if (totalNewsCards <= 1 || isAutoplayPaused || isDragging) return;

    const timer = window.setInterval(() => {
      setNewsIndex((current) => getWrappedIndex(current + 1, totalNewsCards));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isAutoplayPaused, isDragging, totalNewsCards]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipeIntentRef.current = null;
    setIsDragging(false);
    setIsAutoplayPaused(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || totalNewsCards <= 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (!swipeIntentRef.current) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;
      swipeIntentRef.current =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }

    if (swipeIntentRef.current !== "horizontal") return;

    setIsDragging(true);
    setDragOffset(Math.max(-140, Math.min(140, deltaX)));
  };

  const handleTouchEnd = () => {
    if (swipeIntentRef.current === "horizontal" && Math.abs(dragOffset) > 70) {
      if (dragOffset < 0) {
        showNextCard();
      } else {
        showPreviousCard();
      }
    }

    touchStartRef.current = null;
    swipeIntentRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
    setIsAutoplayPaused(false);
  };

  const handleCarouselKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousCard();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextCard();
    }
  };

  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            <Radio size={14} />
            Actualite sociale
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900">
            Les contenus du terrain remontent directement sur la vitrine
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-slate-600">
            Les réalisations publiées alimentent ces cartes d&apos;actualité,
            pendant que YouTube peut suivre automatiquement une chaîne ou une
            playlist pour garder le site vivant sans republier chaque nouveauté.
          </p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#1877f2]/10 px-3 py-1 text-xs font-semibold text-[#1877f2]">
                  <Facebook size={14} />
                  Facebook
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Cartes d’actualités
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Une version plus légère du flux social, pensée pour le mobile,
                  avec ouverture directe vers Facebook.
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

            <div className="bg-slate-100 p-3">
              <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-6 text-slate-500">
                Carrousel auto, navigation latérale et swipe mobile. Pour le
                flux social complet, utilisez le bouton Facebook.
              </div>

              <div
                className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1877f2] p-4 sm:p-5"
                onMouseEnter={() => setIsAutoplayPaused(true)}
                onMouseLeave={() => setIsAutoplayPaused(false)}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at top left, white 0, transparent 38%), radial-gradient(circle at bottom right, white 0, transparent 32%)",
                  }}
                />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/65">
                      A la une
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      Un carrousel plus vivant, inspiré des rotating cards.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                      {isAutoplayPaused ? "Pause" : "Auto"}
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3 text-white backdrop-blur-sm">
                      <Facebook size={18} />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-5">
                  {totalNewsCards > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousCard}
                        className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/75 sm:inline-flex"
                        aria-label="Actualité précédente"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={showNextCard}
                        className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/75 sm:inline-flex"
                        aria-label="Actualité suivante"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  <div
                    className="overflow-hidden rounded-[26px]"
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Carrousel d'actualités Gnamba Services"
                    tabIndex={0}
                    onKeyDown={handleCarouselKeyDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    style={{ touchAction: "pan-y" }}
                  >
                    <div
                      className={`flex ${isDragging ? "transition-none" : "transition-transform duration-500 ease-out"}`}
                      style={{
                        transform: `translate3d(calc(${dragOffset}px - ${newsIndex * 100}%), 0, 0)`,
                      }}
                    >
                      {facebookCards.map((card, index) => {
                        const categoryKey =
                          card.category?.toLowerCase() || "btp";
                        const meta =
                          categoryMeta[categoryKey] || categoryMeta.btp;
                        const Icon = meta.icon;

                        return (
                          <div key={card.id} className="min-w-full">
                            <article className="overflow-hidden rounded-[26px] border border-white/15 bg-white text-left shadow-2xl">
                              <div className="relative h-[250px] sm:h-[300px]">
                                {card.image_url ? (
                                  <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                      backgroundImage: `url("${card.image_url}")`,
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`absolute inset-0 bg-gradient-to-br ${meta.accent}`}
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-900/10" />
                                <div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-6">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
                                        <Icon size={14} />
                                        {meta.label}
                                      </span>
                                      <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">
                                        Actualité {index + 1}/{totalNewsCards}
                                      </span>
                                    </div>
                                    <div className="rounded-2xl bg-white/12 p-2.5 text-white/90 backdrop-blur-sm">
                                      <Facebook size={18} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPin size={12} />
                                        {card.location || "Côte d’Ivoire"}
                                      </span>
                                      <span className="inline-flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        {card.year || new Date().getFullYear()}
                                      </span>
                                    </div>
                                    <h4 className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-[1.8rem]">
                                      {card.title}
                                    </h4>
                                    <p className="mt-3 max-w-2xl line-clamp-3 text-sm leading-6 text-white/80 sm:text-base">
                                      {card.description ||
                                        "Découvrez l’actualité récente publiée sur nos activités et réalisations."}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                                <div>
                                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Réseaux + vitrine
                                  </div>
                                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Cette carte reprend une réalisation récente
                                    pour nourrir la vitrine, puis renvoie vers
                                    Facebook pour le flux social complet.
                                  </p>
                                </div>
                                <a
                                  href={facebookUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#1667d9]"
                                >
                                  Ouvrir Facebook
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </article>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    {totalNewsCards > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={showPreviousCard}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/15 sm:hidden"
                          aria-label="Actualité précédente"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={showNextCard}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/15 sm:hidden"
                          aria-label="Actualité suivante"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                    {facebookCards.map((card, index) => (
                      <button
                        key={`${card.id}-dot`}
                        type="button"
                        onClick={() => goToCard(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === newsIndex
                            ? "w-8 bg-white"
                            : "w-2.5 bg-white/40 hover:bg-white/60"
                        }`}
                        aria-label={`Afficher la carte ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      Swipe mobile
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      {activeNewsCard
                        ? `${newsIndex + 1} sur ${totalNewsCards}`
                        : "Actualités"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  <Youtube size={14} />
                  YouTube
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Bloc video evolutif
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

            <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <RefreshCw
                  size={16}
                  className="mt-0.5 flex-shrink-0 text-slate-500"
                />
                <div>
                  <p className="font-medium text-slate-800">
                    {derivedChannel?.label
                      ? `Source detectee: ${derivedChannel.label}`
                      : "Source dynamique YouTube"}
                  </p>
                  <p className="mt-1 leading-6">{youtubeHint}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-3">
              <div className="overflow-hidden rounded-[22px] bg-black">
                {youtubeEmbedUrl ? (
                  <iframe
                    title="Lecteur YouTube Gnamba Services"
                    src={youtubeEmbedUrl}
                    className="aspect-video w-full border-0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/80">
                    Aucune source YouTube exploitable n&apos;a ete detectee.
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
