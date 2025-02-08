
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Database, AlertCircle, CheckCircle2 } from "lucide-react";

interface HealthMetric {
  metric_name: string;
  current_value: number;
  status: 'healthy' | 'warning' | 'critical';
  details: Record<string, any>;
}

interface HealthMonitoringProps {
  metrics?: HealthMetric[];
}

export function HealthMonitoring({ metrics }: HealthMonitoringProps) {
  if (!metrics) {
    return <div>Loading health metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <h3 className="font-medium">{metric.metric_name}</h3>
            </div>
            
            <div className={`mt-2 flex items-center gap-2 ${
              metric.status === 'healthy' ? 'text-green-500' :
              metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {metric.status === 'healthy' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="capitalize">{metric.status}</span>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              {typeof metric.details === 'object' && metric.details !== null && 
                Object.entries(metric.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key.replace(/_/g, ' ')}:</span>
                    <span>{value}</span>
                  </div>
                ))
              }
            </div>
          </Card>
        ))}
      </div>

      {metrics.some(m => m.status === 'critical') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            Some database metrics are in critical state. Please review the issues above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
