
import { ValidationDetails } from "../types/role-types";
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

export const getErrorSeverity = (status: string): "default" | "destructive" => {
  switch (status.toLowerCase()) {
    case 'critical':
      return "destructive";
    default:
      return "default";
  }
};

export const getErrorIcon = (status: string): JSX.Element => {
  switch (status.toLowerCase()) {
    case 'good':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export const getErrorDetails = (checkType: string, details: ValidationDetails): Record<string, string | undefined> => {
  return {
    "User ID": details.auth_user_id,
    "Full Name": details.full_name,
    "Member Number": details.member_number,
    "Current Roles": details.current_roles?.join(", "),
    "Member Status": details.member_status
  };
};
