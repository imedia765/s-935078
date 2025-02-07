
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-primary">Important Announcements</h2>
      </div>
      {announcements.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No announcements at this time</p>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border rounded-lg p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{announcement.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityStyles(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(announcement.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground">{announcement.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
