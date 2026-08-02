declare module 'lucide-react' {
  import * as React from 'react';

  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }

  export type Icon = React.FC<IconProps>;

  export const LayoutDashboard: Icon;
  export const Users: Icon;
  export const BookOpen: Icon;
  export const Library: Icon;
  export const Award: Icon;
  export const FileCheck: Icon;
  export const ShieldAlert: Icon;
  export const FileText: Icon;
  export const BarChart: Icon;
  export const Bell: Icon;
  export const LifeBuoy: Icon;
  export const CreditCard: Icon;
  export const Settings: Icon;
  export const Activity: Icon;
  export const LogOut: Icon;
  export const ShieldCheck: Icon;
  export const Loader2: Icon;
  export const CheckCircle2: Icon;
  export const XCircle: Icon;
  export const ArrowUpRight: Icon;
  export const DollarSign: Icon;
  export const UserPlus: Icon;
  export const X: Icon;
  export const RefreshCw: Icon;
  export const Shield: Icon;
  export const MoreVertical: Icon;
  export const Eye: Icon;
  export const Ban: Icon;
  export const Trash2: Icon;
  export const KeyRound: Icon;
  export const Copy: Icon;
  export const Search: Icon;
  export const Filter: Icon;
  export const Download: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Calendar: Icon;
  export const ArrowLeft: Icon;
  export const AlertCircle: Icon;
}
