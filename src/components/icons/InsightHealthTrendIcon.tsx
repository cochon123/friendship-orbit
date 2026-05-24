import type { IconProps } from "@/components/icons/Icon";
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconCheckSmall,
} from "@/components/icons/Icon";

export type HealthTrendVariant = "balanced" | "growing" | "onesided" | "drifting";

export function InsightHealthTrendIcon({
  variant,
  ...rest
}: IconProps & { variant: HealthTrendVariant }) {
  switch (variant) {
    case "balanced":
      return <IconCheckSmall {...rest} />;
    case "growing":
      return <IconArrowUp {...rest} />;
    case "onesided":
      return <IconArrowRight {...rest} />;
    case "drifting":
      return <IconArrowDown {...rest} />;
  }
}
