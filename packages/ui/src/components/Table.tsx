import { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../cn";

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
      <table className={cn("w-full text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{children}</thead>;
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("border-t border-slate-100 hover:bg-slate-50", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 text-slate-600", className)} {...props}>
      {children}
    </td>
  );
}
