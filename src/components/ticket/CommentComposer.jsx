import React, { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRole } from "@/lib/useRole";

export default function CommentComposer({ onSubmit }) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [internal, setInternal] = useState(false);
  const { isStaff } = useRole();

  function handleSubmit() {
    if (!body.trim()) return;
    onSubmit({ body: body.trim(), attachment_name: file?.name || null, is_internal: internal });
    setBody("");
    setFile(null);
    setInternal(false);
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={internal ? "Add an internal note (only visible to IT staff)..." : "Write a reply..."}
        rows={3}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            {file ? file.name : "Attach"}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {isStaff && (
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Checkbox checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Internal note
            </label>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={!body.trim()}>
          <Send className="h-4 w-4" /> {internal ? "Add Note" : "Send Reply"}
        </Button>
      </div>
    </div>
  );
}
