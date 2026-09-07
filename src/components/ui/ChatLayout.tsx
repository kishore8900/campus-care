import React from "react";
import ChatWindow from "./ChatWindow";
import type { ApiChat, ReplyLanguage } from "../../api";

type Props = {
  messages?: ApiChat[];
  draft?: string;
  pending?: boolean;
  preview?: boolean;
  onDraft?: (text: string) => void;
  onSend?: (event?: React.FormEvent, suggestion?: string, language?: ReplyLanguage) => void;
  onBreathing?: () => void;
  onStop?: () => void;
};

export default function ChatLayout(props: Props) {
  return (
    <section className="chat-surface" aria-label="Chat conversation">
      <ChatWindow {...props} />
    </section>
  );
}
