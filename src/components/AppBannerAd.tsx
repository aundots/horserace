type AppBannerAdProps = {
  position: "top" | "bottom";
  onClick?: () => void;
};

const COPY = {
  top: {
    badge: "광고",
    title: "스폰서 배너",
    body: "보상형 · 전면형 광고 영역과 함께 운영됩니다",
    cta: "자세히",
  },
  bottom: {
    badge: "AD",
    title: "배너 광고",
    body: "이 영역은 실제 광고 SDK 슬롯으로 교체할 수 있어요",
    cta: "광고 안내",
  },
} as const;

export function AppBannerAd({ position, onClick }: AppBannerAdProps) {
  const copy = COPY[position];

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
