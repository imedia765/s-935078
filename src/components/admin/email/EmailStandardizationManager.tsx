
import { useEmailStandardization } from "../hooks/useEmailStandardization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, CheckCircle, Mail, Shield, Plus, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const whitelistSchema = z.object({
  email: z.string().email(),
  memberNumber: z.string().min(1, "Member number is required"),
  reason: z.string().min(10, "Please provide a detailed reason"),
});

type WhitelistFormData = z.infer<typeof whitelistSchema>;

export function EmailStandardizationManager() {
  const [isWhitelistDialogOpen, setIsWhitelistDialogOpen] = useState(false);
  const {
    standardizationResults,
    whitelistedEmails,
    isLoadingResults,
    isLoadingWhitelist,
    standardizeEmail,
    whitelistEmail,
    removeFromWhitelist,
    isStandardizing,
    isWhitelisting,
    isRemoving
  } = useEmailStandardization();

  const form = useForm<WhitelistFormData>({
    resolver: zodResolver(whitelistSchema),
  });

  const onWhitelistSubmit = (values: WhitelistFormData) => {
    whitelistEmail({
      email: values.email,
      memberNumber: values.memberNumber,
      reason: values.reason
    }, {
      onSuccess: () => {
        setIsWhitelistDialogOpen(false);
        form.reset();
      }
    });
  };

  if (isLoadingResults || isLoadingWhitelist) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const legacyCount = standardizationResults?.filter(r => r.standardization_status === 'legacy').length || 0;
  const personalCount = standardizationResults?.filter(r => r.standardization_status === 'personal').length || 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Email Standardization Management</h2>
          <Dialog open={isWhitelistDialogOpen} onOpenChange={setIsWhitelistDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Whitelist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email to Whitelist</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onWhitelistSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="memberNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed reason for whitelisting this email
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isWhitelisting}>
                    {isWhitelisting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add to Whitelist
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Legacy Format (@temp.com)</p>
                <p className="text-2xl font-bold">{legacyCount}</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${legacyCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Personal Emails</p>
                <p className="text-2xl font-bold">{personalCount}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Whitelisted Emails</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Member Number</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Approved At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelistedEmails?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.member_number}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{new Date(item.approved_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromWhitelist(item.id)}
                        disabled={isRemoving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Email Standardization Status</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Number</TableHead>
                  <TableHead>Current Auth Email</TableHead>
                  <TableHead>Member Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standardizationResults?.map((result) => (
                  <TableRow key={result.member_number}>
                    <TableCell>{result.member_number}</TableCell>
                    <TableCell>{result.current_auth_email}</TableCell>
                    <TableCell>{result.current_member_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {result.standardization_status === 'standardized' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : result.standardization_status === 'legacy' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        {result.standardization_status}
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.issues.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {result.issues.map((issue, index) => (
                            <li key={index} className="text-red-500">{issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-500">No issues</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.standardization_status === 'legacy' && (
                        <Button
                          size="sm"
                          onClick={() => standardizeEmail(result.member_number)}
                          disabled={isStandardizing}
                        >
                          {isStandardizing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Standardize
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
}
