import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, BookOpen, ThumbsUp, Eye, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { KnowledgeBaseArticles, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { CATEGORIES } from "@/lib/ticketConstants";
import { formatDate } from "@/lib/utils";

const emptyForm = { title: "", content: "", category: CATEGORIES[0], tags: "", status: "published" };

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { isStaff } = useRole();
  const [articles] = useLiveQuery(() => KnowledgeBaseArticles.list("-created_date"), []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const visible = articles.filter((a) => isStaff || a.status === "published");
  const filtered = visible.filter((a) => {
    if (category && a.category !== category) return false;
    if (search && !`${a.title} ${a.content} ${(a.tags || []).join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(a) {
    setEditing(a);
    setForm({ ...emptyForm, ...a, tags: (a.tags || []).join(", ") });
    setOpen(true);
  }
  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function save() {
    const fields = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), author_name: user.full_name };
    if (editing) {
      KnowledgeBaseArticles.update(editing.id, fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "KnowledgeBaseArticle", entityId: editing.id, before: editing, after: fields });
      toast.success("Article updated");
    } else {
      const created = KnowledgeBaseArticles.create({ ...fields, view_count: 0, helpful_count: 0 });
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "KnowledgeBaseArticle", entityId: created.id, after: fields });
      toast.success("Article published");
    }
    setOpen(false);
  }

  function view(article) {
    KnowledgeBaseArticles.update(article.id, { view_count: (article.view_count || 0) + 1 });
    setViewing(article);
  }

  function markHelpful(article) {
    KnowledgeBaseArticles.update(article.id, { helpful_count: (article.helpful_count || 0) + 1 });
    setViewing((v) => (v ? { ...v, helpful_count: (v.helpful_count || 0) + 1 } : v));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Self-service articles and how-to guides.</p>
        </div>
        {isStaff && <Button onClick={openNew}><Plus className="h-4 w-4" /> New Article</Button>}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><BookOpen className="h-8 w-8" /><p className="text-sm">No articles found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:shadow-md" onClick={() => view(a)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{a.category}</Badge>
                  {a.status !== "published" && <Badge variant="warning">Draft</Badge>}
                </div>
                <CardTitle className="line-clamp-2">{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{a.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {a.view_count || 0}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {a.helpful_count || 0}</span>
                  {isStaff && (
                    <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="flex items-center gap-1 hover:text-foreground">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        {viewing && (
          <DialogContent onClose={() => setViewing(null)}>
            <DialogHeader>
              <Badge variant="outline" className="mb-2 w-fit">{viewing.category}</Badge>
              <DialogTitle>{viewing.title}</DialogTitle>
            </DialogHeader>
            <p className="whitespace-pre-wrap text-sm">{viewing.content}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>By {viewing.author_name} · {formatDate(viewing.created_date, false)}</span>
              <Button size="sm" variant="outline" onClick={() => markHelpful(viewing)}>
                <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({viewing.helpful_count || 0})
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={set("title")} /></div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea rows={6} value={form.content} onChange={set("content")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={set("status")}><option value="published">Published</option><option value="draft">Draft</option></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={set("tags")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
