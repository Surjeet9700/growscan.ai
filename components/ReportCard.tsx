import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface ReportCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ReportCard({ title, icon, children, className = "" }: ReportCardProps) {
  return (
    <Card className={`overflow-hidden border shadow-sm ${className}`}>
      <CardHeader className="bg-stone-50/50 border-b py-3 px-4 flex flex-row items-center gap-2 space-y-0">
        {icon && <div className="text-primary">{icon}</div>}
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}
