import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageCircle, Send, X, User, Bot } from "lucide-react";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

// Form schemas
const initialChatSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(1, "Please enter a message"),
});

const messageSchema = z.object({
  message: z.string().min(1, "Please enter a message"),
});

type InitialChatForm = z.infer<typeof initialChatSchema>;
type MessageForm = z.infer<typeof messageSchema>;

interface UserInfo {
  name: string;
  email: string;
}

export function ChatWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [hasInitialMessage, setHasInitialMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID and user info from localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat-session-id");
    const storedUserInfo = localStorage.getItem("chat-user-info");

    if (storedSessionId) {
      setSessionId(storedSessionId);
      setHasInitialMessage(true);
    } else {
      const newSessionId = nanoid();
      setSessionId(newSessionId);
      localStorage.setItem("chat-session-id", newSessionId);
    }

    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  // Fetch messages for the session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", sessionId],
    enabled: Boolean(sessionId && hasInitialMessage),
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Forms
  const initialForm = useForm<InitialChatForm>({
    resolver: zodResolver(initialChatSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Send initial message mutation
  const initialMessageMutation = useMutation({
    mutationFn: async (data: InitialChatForm) => {
      const response = await apiRequest("POST", "/api/chat/messages", {
        name: data.name,
        email: data.email,
        message: data.message,
        session_id: sessionId,
        is_admin: false,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      setUserInfo({ name: variables.name, email: variables.email });
      setHasInitialMessage(true);
      localStorage.setItem("chat-user-info", JSON.stringify({ name: variables.name, email: variables.email }));
      
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", sessionId] });
      
      // Reset form
      initialForm.reset();
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you soon.",
      });
    },
    onError: (error) => {
      console.error("Error sending initial message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send follow-up message mutation
  const messageMutation = useMutation({
    mutationFn: async (data: MessageForm) => {
      if (!userInfo) {
        throw new Error("User info not available. Please refresh the page and try again.");
      }
      if (!sessionId) {
        throw new Error("Session not available. Please refresh the page and try again.");
      }
      
      const response = await apiRequest("POST", "/api/chat/messages", {
        name: userInfo.name,
        email: userInfo.email,
        message: data.message,
        session_id: sessionId,
        is_admin: false,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", sessionId] });
      
      // Reset form
      messageForm.reset();
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInitialSubmit = (data: InitialChatForm) => {
    initialMessageMutation.mutate(data);
  };

  const handleMessageSubmit = (data: MessageForm) => {
    messageMutation.mutate(data);
  };

  const formatTime = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="bronze"
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 h-96 shadow-xl bg-background border border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-lg font-semibold">Live Chat</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" data-testid="chat-messages-area">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${
                        message.is_admin ? "flex-row" : "flex-row-reverse"
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className={`p-2 rounded-lg max-w-[85%] ${
                        message.is_admin
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}>
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.is_admin ? "text-muted-foreground" : "text-primary-foreground/70"
                        }`}>
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        message.is_admin ? "bg-muted" : "bg-primary/10"
                      }`}>
                        {message.is_admin ? (
                          <Bot className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <User className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : hasInitialMessage ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Welcome! Send us a message to get started.
                </div>
              )}
            </ScrollArea>

            {/* Message Input Form */}
            <div className="p-4 border-t border-border">
              {!hasInitialMessage || !userInfo ? (
                <Form {...initialForm}>
                  <form onSubmit={initialForm.handleSubmit(handleInitialSubmit)} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={initialForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Your name"
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={initialForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Email"
                                type="email"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={initialForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Type your message..."
                              className="min-h-[60px] resize-none"
                              {...field}
                              data-testid="textarea-initial-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full btn-bronze"
                      disabled={initialMessageMutation.isPending}
                      data-testid="button-send-initial-message"
                    >
                      {initialMessageMutation.isPending ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleMessageSubmit)} className="flex gap-2">
                    <FormField
                      control={messageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Type your message..."
                              {...field}
                              data-testid="input-follow-up-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="btn-bronze"
                      disabled={messageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}