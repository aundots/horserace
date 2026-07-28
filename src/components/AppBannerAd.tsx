import { useT } from "../i18n/LangContext";

type AppBannerAdProps = {
  position: "top" | "bottom";
  onClick?: () => void;
};

export function AppBannerAd({ position, onClick }: AppBannerAdProps) {
  const t = useT();
  const copy =
    position === "top"
      ? {
          badge: t.bannerAd,
          title: t.sponsorBanner,
          body: t.sponsorBannerDesc,
          cta: t.bannerMore,
        }
      : {
          badge: "AD",
          title: t.bottomBanner,
          body: t.bottomBannerDesc,
          cta: t.bannerInfo,
        };

  return (
    <button
      type="button"
      className={`app-banner app-banner--${position}`}
      onClick={onClick}
      aria-label={copy.title}
    >
      <span className="app-banner__badge">{copy.badge}</span>
      <span className="app-banner__text">
        <strong>{copy.title}</strong>
        <span>{copy.body}</span>
      </span>
      <span className="app-banner__cta">{copy.cta}</span>
    </button>
  );
}
