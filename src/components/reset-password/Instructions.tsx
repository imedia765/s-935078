interface InstructionsProps {
  isReset: boolean;
}

export const Instructions = ({ isReset }: InstructionsProps) => (
  <div className="mb-6 text-sm text-gray-400">
    {isReset ? (
      <p>Please enter your new password below. Make sure it's secure and unique.</p>
    ) : (
      <div className="space-y-2">
        <p>To reset your password, please provide:</p>
        <ul className="list-disc list-inside">
          <li>Your member number</li>
          <li>Your registered email address</li>
          <li>Your contact number for verification</li>
        </ul>
        <p>We'll send you instructions to reset your password.</p>
      </div>
    )}
  </div>
);