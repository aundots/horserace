import {
  createContext,
  useCallback,
  useContext,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import "./play-shim.css";

type ToastOptions = { type?: string };

const ToastContext = createContext<{ openToast: (msg: string, opts?: ToastOptions) => void }>({
  openToast: () => {},
});

export function PlayToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const openToast = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ openToast }}>
      {children}
      {message ? <div className="play-toast">{message}</div> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

type ButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  display?: "block" | "inline";
  size?: "medium" | "large" | "xlarge";
  color?: "primary" | "dark";
  variant?: "fill" | "weak";
  style?: CSSProperties;
};

export function Button({
  children,
  onClick,
  disabled,
  display = "inline",
  size = "medium",
  color = "primary",
  variant = "fill",
  style,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        "play-btn",
        `play-btn--${display}`,
        `play-btn--${size}`,
        `play-btn--${color}`,
        `play-btn--${variant}`,
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

type TextButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  color?: string;
  size?: string;
};

export function TextButton({ children, onClick, color, size }: TextButtonProps) {
  return (
    <button
      type="button"
      className={`play-text-btn play-text-btn--${size ?? "medium"}`}
      style={{ color: color ?? "#6b7684" }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TitleParagraph({ children, size }: { children?: ReactNode; size?: number }) {
  return (
    <h1 className="play-top__title" style={{ fontSize: size ? `${size}px` : undefined }}>
      {children}
    </h1>
  );
}

function SubtitleParagraph({ children, size }: { children?: ReactNode; size?: number }) {
  return (
    <p className="play-top__subtitle" style={{ fontSize: size ? `${size}px` : undefined }}>
      {children}
    </p>
  );
}

export function Top({
  title,
  subtitle,
  subtitleBottom,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  subtitleBottom?: ReactNode;
}) {
  return (
    <header className="play-top">
      {title}
      {subtitle}
      {subtitleBottom}
    </header>
  );
}

Top.TitleParagraph = TitleParagraph;
Top.SubtitleParagraph = SubtitleParagraph;

export function List({ children }: { children?: ReactNode }) {
  return <div className="play-list">{children}</div>;
}

type ListRowTextsProps = {
  top?: ReactNode;
  bottom?: ReactNode;
  topProps?: CSSProperties;
  bottomProps?: CSSProperties;
};

function ListRowTexts({ top, bottom, topProps, bottomProps }: ListRowTextsProps) {
  return (
    <div className="play-list-row__texts">
      {top ? (
        <div className="play-list-row__top" style={topProps}>
          {top}
        </div>
      ) : null}
      {bottom ? (
        <div className="play-list-row__bottom" style={bottomProps}>
          {bottom}
        </div>
      ) : null}
    </div>
  );
}

type ListRowProps = {
  contents?: ReactNode;
  onClick?: () => void;
  verticalPadding?: string;
  withArrow?: boolean;
  left?: ReactNode;
};

export function ListRow({ contents, onClick, withArrow, left }: ListRowProps) {
  return (
    <button type="button" className="play-list-row" onClick={onClick}>
      {left}
      <div className="play-list-row__body">{contents}</div>
      {withArrow ? <span className="play-list-row__arrow">›</span> : null}
    </button>
  );
}

ListRow.Texts = ListRowTexts;

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  variant?: string;
};

export function TextField({ label, variant, ...props }: TextFieldProps) {
  return (
    <label className={`play-field play-field--${variant ?? "box"}`}>
      {label ? <span className="play-field__label">{label}</span> : null}
      <input className="play-field__input" {...props} />
    </label>
  );
}

export function Badge({
  children,
  color = "blue",
  variant = "weak",
  size = "small",
}: {
  children?: ReactNode;
  color?: string;
  variant?: string;
  size?: string;
}) {
  return (
    <span className={`play-badge play-badge--${color} play-badge--${variant} play-badge--${size}`}>
      {children}
    </span>
  );
}

export function TDSMobileProvider({ children }: { children: ReactNode }) {
  return <PlayToastProvider>{children}</PlayToastProvider>;
}
