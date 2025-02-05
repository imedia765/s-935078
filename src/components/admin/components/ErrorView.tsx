
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { getErrorIcon, getErrorDetails } from "../utils/role-utils";
import { getFixOptions } from "./FixOptions";
import { ValidationDetails, UserRole } from "../types/role-types";

interface ErrorViewProps {
  validations: any[];
  generateMagicLink: (userId: string) => Promise<void>;
  handleFixRoleError: (userId: string | undefined, checkType: string, fixType: UserRole | 'remove_role') => Promise<void>;
  handleRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
}

export const ErrorView = ({ 
  validations, 
  generateMagicLink, 
  handleFixRoleError,
  handleRoleChange 
}: ErrorViewProps) => {
  return (
    <div className="space-y-4">
      {validations?.map((validation: any, index: number) => (
        <Alert
          key={index}
          variant={validation.status.toLowerCase() === 'critical' ? "destructive" : "default"}
          className="glass-card"
        >
          {getErrorIcon(validation.status)}
          <AlertTitle className="flex items-center justify-between">
            <span>{validation.check_type}</span>
            <div className="flex gap-2">
              {validation.status !== 'Good' && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {getFixOptions(
                    validation.check_type,
                    validation.details as ValidationDetails,
                    handleRoleChange,
                    handleFixRoleError
                  ).map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      onClick={() => option.action && option.action()}
                      className="whitespace-nowrap flex items-center gap-2 bg-background hover:bg-secondary/80"
                    >
                      {option.icon}
                      {option.label}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateMagicLink(validation.details?.auth_user_id)}
                    className="whitespace-nowrap flex items-center gap-2 bg-background hover:bg-secondary/80"
                  >
                    <History className="h-4 w-4" />
                    Generate Magic Link
                  </Button>
                </div>
              )}
            </div>
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {validation.status !== 'Good' && (
                <div className="bg-background/50 p-4 rounded-md space-y-3">
                  {Object.entries(getErrorDetails(validation.check_type, validation.details)).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-sm font-medium capitalize">{key}:</div>
                      <div className="text-sm text-muted-foreground">{value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm font-medium mt-4">Raw Details:</div>
              <pre className="bg-background/50 p-2 rounded-md text-sm whitespace-pre-wrap overflow-auto">
                {JSON.stringify(validation.details, null, 2)}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
