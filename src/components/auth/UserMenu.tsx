import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { LogOut, UserCircle2, Settings2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function SignedInPill() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const initial = (user?.firstName?.[0] || user?.username?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "C").toUpperCase();
  const name = user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Creator";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 p-2 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:bg-foreground/[0.06] hover:border-foreground/20 transition-all group">
          <div className="relative w-9 h-9 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-pink-500 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="relative w-9 h-9 rounded-full object-cover ring-2 ring-foreground/10" />
            ) : (
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-black text-sm">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-foreground truncate">{name}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Creator</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className="w-60 bg-popover/95 backdrop-blur-2xl border-border text-foreground"
      >
        <DropdownMenuLabel className="text-foreground/60 text-[10px] font-mono uppercase tracking-widest">
          Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-foreground/10" />
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer focus:bg-foreground/[0.06]">
            <UserCircle2 className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-300" /> Profile
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer focus:bg-foreground/[0.06]">
            <Settings2 className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-300" /> Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-foreground/10" />
        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="cursor-pointer focus:bg-red-500/10 text-red-600 dark:text-red-300 focus:text-red-700 dark:focus:text-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignedOutCta() {
  return (
    <Link
      href="/sign-in"
      className="relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white font-bold text-sm shadow-[0_8px_24px_-6px_rgba(168,85,247,0.6)] hover:brightness-110 transition-all group overflow-hidden"
    >
      <Sparkles className="w-4 h-4" />
      <span>Sign in to create</span>
    </Link>
  );
}

export function UserMenu() {
  return (
    <>
      <Show when="signed-in"><SignedInPill /></Show>
      <Show when="signed-out"><SignedOutCta /></Show>
    </>
  );
}
