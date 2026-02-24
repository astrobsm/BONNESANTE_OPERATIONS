/// <reference types="vite/client" />

declare module 'lucide-react' {
  import { ComponentType, SVGAttributes } from 'react';
  interface IconProps extends SVGAttributes<SVGSVGElement> {
    size?: number | string;
    color?: string;
    className?: string;
    absoluteStrokeWidth?: boolean;
  }
  type Icon = ComponentType<IconProps>;
  export const LayoutDashboard: Icon;
  export const Package: Icon;
  export const ShoppingCart: Icon;
  export const Megaphone: Icon;
  export const ClipboardList: Icon;
  export const AlertTriangle: Icon;
  export const BarChart3: Icon;
  export const LogOut: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Wifi: Icon;
  export const WifiOff: Icon;
  export const TrendingUp: Icon;
  export const Users: Icon;
  export const ShieldCheck: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const Lock: Icon;
  export const Mail: Icon;
  export const Loader2: Icon;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
