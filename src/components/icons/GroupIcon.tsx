import type { IconProps } from "@/components/icons/Icon";
import {
  IconBolt,
  IconBook,
  IconBrain,
  IconGlobe,
  IconHandshake,
  IconHeart,
  IconPaletteArt,
  IconRocket,
  IconStrength,
} from "@/components/icons/Icon";
import { normalizeGroupIcon, type GroupIconId } from "@/lib/groupIconIds";
import type { ComponentType } from "react";

const MAP: Record<GroupIconId, ComponentType<IconProps>> = {
  strength: IconStrength,
  palette: IconPaletteArt,
  globe: IconGlobe,
  book: IconBook,
  bolt: IconBolt,
  heart: IconHeart,
  brain: IconBrain,
  handshake: IconHandshake,
  rocket: IconRocket,
};

export function GroupIcon({ storedIcon, ...rest }: IconProps & { storedIcon: string }) {
  const Cmp = MAP[normalizeGroupIcon(storedIcon)];
  return <Cmp {...rest} />;
}
