import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useCases } from "@/contexts/CasesContext";
import { ActionDropdown } from "@/components/ActionDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "shared/index.js";
import { fetchMessages, sendMessage as sendMsgApi } from "@/api/messages.api";

type MessageWithTempId = (Message & { isTemp?: boolean }) | { id: string; role: "user" | "assistant"; content: string; isTemp?: boolean };

export function ChatPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { cases, diagnoses, procedures, loadOptions } = useCases();
  const [messages, setMessages] = useState<MessageWithTempId[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentCase = cases.find((c) => c.id === caseId);

  useEffect(() => {
    if (!caseId) return;

    loadOptions();

    // Load initial messages
    fetchMessages(caseId)
      .then((data) => setMessages(data || []))
      .catch((err) => {
        console.error("Failed to load messages:", err);
        toast.error("Failed to load messages. Please try again later.");
      });

    // Set up SSE
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || "http://localhost:3031/api"}/cases/${caseId}/events`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chunk") {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === "assistant" && lastMsg.isTemp) {
              // Append to existing temp message
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + data.content },
              ];
            } else {
              // Create new temp message
              return [
                ...prev,
                { id: `temp-${Date.now()}`, role: "assistant", content: data.content, isTemp: true },
              ];
            }
          });
        } else if (data.type === "done") {
          // Finalize temp message
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.isTemp) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, isTemp: false },
              ];
            }
            return prev;
          });
        } else if (data.type === "error") {
          console.error("SSE Error:", data.content);
          toast.error(`Error: ${data.content || "Connection lost"}`);
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", e);
      }
    };

    return () => eventSource.close();
  }, [caseId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isInputDisabled || !caseId) return;

    setIsSending(true);
    setInput("");

    const tempId = `opt-${Date.now()}`;

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content },
    ]);

    try {
      await sendMsgApi(caseId, content);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message. Please try again.");
      // Rollback optimistic update
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!currentCase) {
    return <div className="p-8 text-center text-muted-foreground">Case not found.</div>;
  }

  // Determine all messages to show (include chief complaint as first AI message if no messages yet)
  const welcomeMessage: MessageWithTempId = {
    id: "welcome-msg",
    role: "assistant",
    content: "Welcome to AetioChat! You can start asking questions to investigate the case, propose diagnoses, and suggest procedures to uncover the underlying issue.",
  };

  const chiefComplaintMessage: MessageWithTempId = {
    id: "chief-complaint-msg",
    role: "assistant",
    content: `Patient's Chief Complaint: ${currentCase.chiefComplaint}`,
  };

  const displayMessages = [welcomeMessage, chiefComplaintMessage, ...messages];

  // Disable input if the last message in the main sequence was from the user
  // We check the raw messages array since displayMessages has artificial assistant messages at the start
  const lastRealMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isWaitingForResponse = lastRealMessage?.role === "user" || isSending;
  const isInputDisabled = isWaitingForResponse || !!currentCase.completed;

  return (
    <div className="flex flex-col h-full relative">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {displayMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                } ${"isTemp" in msg && msg.isTemp ? "animate-pulse" : ""}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isWaitingForResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground flex items-center gap-1.5 h-[36px]">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex gap-2">
            <ActionDropdown
              type="Diagnosis"
              items={diagnoses}
              onSelect={(name) => sendMessage(`Make diagnosis: ${name}`)}
              disabled={isInputDisabled}
            />
            <ActionDropdown
              type="Procedure"
              items={procedures}
              onSelect={(name) => sendMessage(`Schedule procedure: ${name}`)}
              disabled={isInputDisabled}
            />
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isWaitingForResponse ? "Waiting for response..." : "Type your message..."}
              disabled={isInputDisabled}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isInputDisabled}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          {currentCase.completed && (
            <div className="text-center text-sm text-green-600 font-medium">
              This case has been successfully diagnosed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
