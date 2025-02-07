
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

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

export function DocumentsCard({ documents, onView, onDownload }: DocumentsCardProps) {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Important Documents</h2>
      </div>
      {documents.length === 0 ? (
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
                  onClick={() => onView(doc)}
                  className="h-8 w-8 bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(doc)}
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
