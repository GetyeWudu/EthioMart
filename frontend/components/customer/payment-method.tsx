import { CreditCard, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentMethodProps {
  id: string;
  type: "visa" | "mastercard" | "amex" | "paypal";
  last4?: string;
  expiry?: string;
  isDefault?: boolean;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

export function PaymentMethod({ id, type, last4, expiry, isDefault, onDelete, onSetDefault }: PaymentMethodProps) {
  // Simple logo placeholders based on type
  const getCardLogo = () => {
    switch (type) {
      case "visa":
        return <div className="text-blue-600 font-bold italic text-xl">VISA</div>;
      case "mastercard":
        return (
          <div className="flex -space-x-2">
            <div className="h-6 w-6 rounded-full bg-red-500 opacity-80 mix-blend-multiply"></div>
            <div className="h-6 w-6 rounded-full bg-amber-400 opacity-80 mix-blend-multiply"></div>
          </div>
        );
      case "amex":
        return <div className="text-blue-500 font-bold text-sm border border-blue-500 px-1 rounded bg-blue-50">AMEX</div>;
      default:
        return <CreditCard className="h-8 w-8 text-slate-400" />;
    }
  };

  return (
    <div className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${isDefault ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 dark:border-indigo-500/50 shadow-sm" : "border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
          {getCardLogo()}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-white capitalize">
              {type} ending in {last4 || "****"}
            </h4>
            {isDefault && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                Default
              </span>
            )}
          </div>
          {expiry && <p className="text-sm text-slate-500 dark:text-slate-400">Expires {expiry}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isDefault && onSetDefault && (
          <Button variant="ghost" size="sm" onClick={() => onSetDefault(id)} className="hidden sm:flex text-xs font-medium">
            Set as default
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
