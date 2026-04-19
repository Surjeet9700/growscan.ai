import { Card } from "./ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConcernCardProps {
  title: string;
  description: string;
  severity?: "none" | "mild" | "moderate" | "significant" | "tight" | "slightly enlarged" | "enlarged" | "smooth" | "slightly uneven" | "uneven" | "well hydrated" | "slightly dehydrated" | "dehydrated" | "low" | "high";
}

const getSeverityColor = (severity: string) => {
  if (!severity) return "bg-muted text-muted-foreground";
  const s = severity.toLowerCase();
  
  // Green/Positive
  if (s.includes("none") || s.includes("tight") || s.includes("smooth") || s.includes("well")) 
    return "bg-green-100 text-green-800 border-green-200";
  
  // Yellow/Warning
  if (s.includes("mild") || s.includes("slightly") || s.includes("moderate")) 
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
    
  // Red/Danger
  if (s.includes("significant") || s.includes("enlarged") || s.includes("uneven") || s.includes("dehydrated") || s.includes("high")) 
    return "bg-red-100 text-red-800 border-red-200";

  return "bg-stone-100 text-stone-800 border-stone-200";
};

const getSeverityIcon = (severity: string) => {
  if (!severity) return null;
  const s = severity.toLowerCase();
  if (s.includes("none") || s.includes("tight") || s.includes("smooth") || s.includes("well") || s.includes("low")) {
    return <CheckCircle2 className="w-4 h-4 ml-auto" />;
  }
  return <AlertCircle className="w-4 h-4 ml-auto" />;
}

export function ConcernCard({ title, description, severity }: ConcernCardProps) {
  return (
    <Card className="flex flex-col p-4 shadow-sm border space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-stone-800 capitalize">{title.replace(/_/g, " ")}</h4>
        {severity && (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${getSeverityColor(severity)}`}>
            {severity}
            {getSeverityIcon(severity)}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
