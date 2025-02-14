
interface InstructionsProps {
  isReset: boolean;
  isVerification?: boolean;
}

export const Instructions = ({ isReset, isVerification }: InstructionsProps) => {
  if (isVerification) {
    return (
      <div className="space-y-4 mb-6">
        <p className="text-sm text-muted-foreground text-center">
          Please wait while we verify your email address. This will only take a moment.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Important:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Check both your inbox and spam/junk folder</li>
            <li>If found in spam, please mark as &apos;Not Spam&apos;</li>
            <li>This helps ensure you receive future communications</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isReset) {
    return (
      <div className="space-y-4 mb-6">
        <p className="text-sm text-muted-foreground text-center">
          Please enter your new password below. Your password should be at least 8 characters long.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Password tips:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Use a combination of letters, numbers, and symbols</li>
            <li>Avoid using personal information</li>
            <li>Store your password securely</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <p className="text-sm text-muted-foreground text-center">
        Enter your member number and we&apos;ll send you instructions to reset your password.
        {" "}If you have a temporary email address, you&apos;ll need to provide your personal email address.
      </p>
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">Please note:</p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>Reset instructions will be sent within a few minutes</li>
          <li>Remember to check your spam/junk folder</li>
          <li>Mark our email as &apos;Not Spam&apos; to ensure future delivery</li>
        </ul>
      </div>
    </div>
  );
};
