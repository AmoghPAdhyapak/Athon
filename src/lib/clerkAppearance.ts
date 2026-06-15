import { shadcn } from "@clerk/themes";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#a855f7",
    colorForeground: "#f4f4f8",
    colorMutedForeground: "#9ca3af",
    colorDanger: "#f87171",
    colorBackground: "rgba(15, 14, 22, 0.85)",
    colorInput: "rgba(255,255,255,0.04)",
    colorInputForeground: "#f4f4f8",
    colorNeutral: "rgba(255,255,255,0.12)",
    fontFamily: "'Outfit', system-ui, sans-serif",
    borderRadius: "0.875rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[rgba(15,14,22,0.85)] backdrop-blur-2xl border border-white/10 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-[0_0_60px_-15px_rgba(168,85,247,0.45)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none px-2",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-black tracking-tight text-2xl",
    headerSubtitle: "text-white/60 text-sm",
    socialButtonsBlockButton:
      "!bg-white/[0.04] !border !border-white/10 hover:!bg-white/[0.08] !text-white !rounded-xl !h-11 transition-colors",
    socialButtonsBlockButtonText: "!text-white font-semibold",
    formFieldLabel: "!text-white/80 text-xs font-semibold uppercase tracking-wider",
    formFieldInput:
      "!bg-white/[0.04] !border !border-white/10 !text-white !rounded-xl !h-11 focus:!border-violet-400/60 focus:!ring-2 focus:!ring-violet-500/20",
    formButtonPrimary:
      "!bg-gradient-to-r !from-violet-600 !via-fuchsia-500 !to-pink-500 !text-white !font-bold !rounded-xl !h-11 !shadow-[0_8px_24px_-6px_rgba(168,85,247,0.6)] hover:!brightness-110 transition-all",
    footerActionText: "!text-white/50 text-sm",
    footerActionLink: "!text-violet-300 hover:!text-violet-200 font-semibold",
    footerAction: "!bg-transparent",
    dividerLine: "!bg-white/10",
    dividerText: "!text-white/40 text-xs uppercase tracking-wider",
    identityPreviewEditButton: "!text-violet-300",
    formFieldSuccessText: "!text-emerald-400",
    alertText: "!text-white",
    alert: "!bg-red-500/10 !border !border-red-500/30 !rounded-xl",
    logoBox: "hidden",
    logoImage: "h-10 w-10",
    otpCodeFieldInput: "!bg-white/[0.04] !border !border-white/10 !text-white !rounded-lg",
    formFieldRow: "",
    main: "gap-4",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back, Creator",
      subtitle: "Sign in to your AETHON workspace",
    },
  },
  signUp: {
    start: {
      title: "Build your creator identity",
      subtitle: "Join AETHON and unlock your workspace",
    },
  },
};
