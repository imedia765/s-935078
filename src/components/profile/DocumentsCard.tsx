import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  title: string;
  type: string;
  size: string;
  updated_at: string;
  url: string;
}

interface DocumentsCardProps {
  documents: Document[];
  onView: (doc: Document) => void;
  onDownload: (doc: Document) => void;
}

export function DocumentsCard({ documents: initialDocuments, onView, onDownload }: DocumentsCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.error('Session check failed:', error);
      toast({
        title: "Session Expired",
        description: "Please sign in again",
        variant: "destructive"
      });
      navigate("/");
      return false;
    }
    return true;
  };

  const fetchDocuments = async () => {
    try {
      if (!(await checkSession())) return;

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching documents for user:', user.id);

      // First ensure user directory exists by creating a .keep file if needed
      const { data: keepFile, error: keepError } = await supabase.storage
        .from('profile_documents')
        .list(`${user.id}`, {
          limit: 1,
          search: '.keep'
        });

      if (!keepFile?.length) {
        await supabase.storage
          .from('profile_documents')
          .upload(`${user.id}/.keep`, new Blob([''], { type: 'text/plain' }));
      }

      // Now list all files in user's directory
      const { data: files, error } = await supabase.storage
        .from('profile_documents')
        .list(`${user.id}/`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      console.log('Files retrieved:', files);

      if (files) {
        const actualFiles = files.filter(file => file.name !== '.keep');
        const formattedDocs: Document[] = await Promise.all(
          actualFiles.map(async (file) => {
            const { data: { publicUrl } } = supabase.storage
              .from('profile_documents')
              .getPublicUrl(`${user.id}/${file.name}`);

            const sizeInMB = (file.metadata.size / (1024 * 1024)).toFixed(2);
            
            return {
              id: file.id,
              title: file.name,
              type: file.metadata.mimetype || 'Unknown',
              size: `${sizeInMB}MB`,
              updated_at: file.updated_at,
              url: publicUrl
            };
          })
        );

        setDocuments(formattedDocs);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      if (error.message?.includes('session')) {
        navigate("/");
      }
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!(await checkSession())) return;
      
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      console.log('Uploading file:', fileName);
      
      const { error } = await supabase.storage
        .from('profile_documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      await fetchDocuments();

    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message?.includes('session')) {
        navigate("/");
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    if (!(await checkSession())) return;
    window.open(doc.url, '_blank');
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      if (!(await checkSession())) return;
      
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Important Documents</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleUpload}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No documents available</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.type} • {doc.size}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDocument(doc)}
                  className="h-8 w-8 bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadDocument(doc)}
                  className="h-8 w-8 bg-green-500/20 hover:bg-green-500/30"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
