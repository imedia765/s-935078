
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Note {
  note_type: string;
  note_text: string;
}

interface MemberNotesProps {
  notes: Note[];
}

export function MemberNotes({ notes }: MemberNotesProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4" />
        <h4 className="text-sm font-medium">Notes</h4>
      </div>
      <div className="space-y-2">
        {notes.map((note, index) => (
          <div key={index} className="bg-muted/30 rounded p-2">
            <Badge variant="outline" className="mb-1">
              {note.note_type}
            </Badge>
            <p className="text-sm">{note.note_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
