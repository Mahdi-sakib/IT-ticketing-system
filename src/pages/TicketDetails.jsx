import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Loading from "@/components/Loading";
import Conversation from "@/components/ticket/Conversation";
import CommentComposer from "@/components/ticket/CommentComposer";
import HistoryTimeline from "@/components/ticket/HistoryTimeline";
import TicketSidebar from "@/components/ticket/TicketSidebar";
import AgentActions from "@/components/ticket/AgentActions";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { Tickets, TicketComments, TicketHistory, Assets, Notifications, CsatResponses } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStaff } = useRole();
  const [rating, setRating] = useState(0);
  const [csatComment, setCsatComment] = useState("");

  const [ticket] = useLiveQuery(() => Tickets.get(id), [id]);
  const [comments] = useLiveQuery(() => TicketComments.filter({ ticket_id: id }, "created_date"), [id]);
  const [history] = useLiveQuery(() => TicketHistory.filter({ ticket_id: id }, "-created_date"), [id]);
  const [csat] = useLiveQuery(() => CsatResponses.filter({ ticket_id: id })[0] || null, [id]);
  const asset = ticket?.related_asset_id ? Assets.get(ticket.related_asset_id) : null;

  if (ticket === undefined) return <Loading />;
  if (!ticket) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-lg font-medium">Ticket not found</p>
        <Button onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const isOwner = ticket.requester_id === user?.id;
  const canComment = isOwner || isStaff;
  const showCsatPrompt = isOwner && ["resolved", "closed"].includes(ticket.status) && !csat;

  function handleComment({ body, attachment_name, is_internal }) {
    const comment = TicketComments.create({
      ticket_id: ticket.id,
      author_id: user.id,
      author_name: user.full_name,
      author_role: user.role,
      body,
      attachment_name,
      is_internal,
    });
    TicketHistory.create({ ticket_id: ticket.id, action: is_internal ? "Internal note added" : "Reply added", actor_name: user.full_name });

    if (isStaff && !ticket.first_response_at) {
      Tickets.update(ticket.id, { first_response_at: new Date().toISOString() });
    }
    if (isStaff && !is_internal && ticket.requester_id) {
      Notifications.create({ user_id: ticket.requester_id, type: "ticket_reply", title: `New reply on ${ticket.display_id}`, body, ticket_id: ticket.id, read: false });
    }
    if (!isStaff && ticket.assigned_agent_id) {
      Notifications.create({ user_id: ticket.assigned_agent_id, type: "ticket_reply", title: `Requester replied: ${ticket.display_id}`, body, ticket_id: ticket.id, read: false });
    }
    return comment;
  }

  function submitCsat() {
    if (!rating) return toast.error("Please select a star rating.");
    CsatResponses.create({
      ticket_id: ticket.id,
      ticket_display_id: ticket.display_id,
      rating,
      comment: csatComment,
      respondent_id: user.id,
      respondent_name: user.full_name,
      agent_name: ticket.assigned_agent_name || null,
      department: ticket.department,
      category: ticket.category,
    });
    toast.success("Thanks for your feedback!");
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-primary">{ticket.display_id}</p>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted by {ticket.requester_name} · {ticket.department} · {ticket.location}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {showCsatPrompt && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">How did we do?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}>
                      <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full rounded-md border border-border p-2 text-sm"
                  rows={2}
                  placeholder="Any additional feedback? (optional)"
                  value={csatComment}
                  onChange={(e) => setCsatComment(e.target.value)}
                />
                <Button size="sm" onClick={submitCsat}>Submit Feedback</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
              {ticket.attachment_name && <p className="mt-2 text-xs text-muted-foreground">📎 {ticket.attachment_name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="conversation">
                <TabsList>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="history">History ({history.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="conversation" className="mt-4">
                  <Conversation comments={comments} />
                  {canComment && <CommentComposer onSubmit={handleComment} />}
                  {isStaff && comments.some((c) => c.is_internal) && (
                    <div className="mt-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-700">Internal Notes</p>
                      {comments.filter((c) => c.is_internal).map((c) => (
                        <p key={c.id} className="text-sm text-amber-800">
                          <strong>{c.author_name}:</strong> {c.body}
                        </p>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <HistoryTimeline history={history} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <TicketSidebar ticket={ticket} asset={asset} />
          {isStaff && <AgentActions ticket={ticket} />}
        </div>
      </div>
    </div>
  );
}
