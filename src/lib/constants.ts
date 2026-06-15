import { LayoutDashboard, Compass, Gamepad2, Sword, Heart, Smile, Flame, Play, Clapperboard, Youtube, PlayCircle } from "lucide-react";

export const CATEGORIES = [
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "anime", label: "Anime", icon: Sword },
  { id: "attitude", label: "Attitude", icon: Flame },
  { id: "motivation", label: "Motivation", icon: Compass },
  { id: "sad", label: "Sad", icon: Heart },
  { id: "funny", label: "Funny", icon: Smile },
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "free-fire", label: "Free Fire", icon: PlayCircle },
  { id: "cinematic", label: "Cinematic", icon: Clapperboard },
  { id: "youtube", label: "YouTube", icon: Youtube }
];

export const GENERATION_TYPES = [
  { id: "captions", label: "Captions" },
  { id: "titles", label: "YouTube Titles" },
  { id: "hashtags", label: "Hashtags" },
  { id: "bio", label: "Bio" },
  { id: "all", label: "All Together" }
];
