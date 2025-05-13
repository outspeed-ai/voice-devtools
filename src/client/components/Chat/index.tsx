import { memo, useEffect, useRef, useState } from "react";
import { AlertCircle, Copy, Send, Tool } from "react-feather";

import Button from "@/components/ui/Button";
import { useSession } from "@/contexts/session";

import { copyToClipboard } from "@/utils/clipboard";
import styles from "./style.module.css";
export interface MessageBubbleProps {
  /**
   * The role of the message
   */
  role: "system" | "user" | "assistant" | "custom:session-recording";

  /**
   * Whether the message was interrupted by the user by speaking while bot was streaming
   */
  interrupted?: boolean;

  /**
   * Text content of the message
   */
  text?: {
    content: string;
    timestamp: string;
    type?: "error";
    streaming?: boolean;
  };

  /**
   * Audio content of the message
   */
  audio?: {
    content: string;
    timestamp: string;
    processing?: boolean;
  };

  /**
   * Function call content
   */
  function_call?: {
    name: string;
    arguments: string;
    timestamp: string;
    streaming?: boolean;
  };
}

const TypingIndicator: React.FC = () => {
  return (
    <span className={styles.typingIndicator}>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
      <span className={styles.dot}></span>
    </span>
  );
};

// use memo to prevent unnecessary re-renders . without memo, it re-renders all
// messages even when the user just types each character of a new message because
// the message state in <Chat /> gets updated every time the user types a new character
const MessageBubble: React.FC<MessageBubbleProps> = memo(({ text, audio, interrupted, role, function_call }) => {
  const isUser = role !== "assistant" && role !== "custom:session-recording";
  const isSessionRecording = role === "custom:session-recording";
  const baseContainer = "flex justify-end flex-col";
  const containerClasses = `${baseContainer} ${isUser ? "items-end" : "items-start"}`;
  const bubbleBase = `max-w-lg p-3 rounded-xl ${
    isSessionRecording
      ? "bg-purple-50 border border-purple-200 text-purple-900"
      : isUser
      ? "bg-gray-900 text-gray-100"
      : "bg-gray-100 text-black"
  }`;

  // If this is an error message
  if (text?.type === "error") {
    const errorBubble = "max-w-lg p-3 rounded-xl bg-red-50 border border-red-200 text-red-800";

    return (
      <div className={containerClasses}>
        <div className={errorBubble}>
          <div className="text-xs text-red-500 font-mono">{text.timestamp}</div>
          <div className="flex items-start gap-2 mt-1">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="whitespace-pre-wrap">{text.content}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={`${bubbleBase} relative`}>
        {interrupted && !isUser && (
          <p className="w-full text-xs text-gray-400 flex items-center justify-end">
            •<i>interrupted</i>
          </p>
        )}
        {text && (
          <>
            <div
              className={`text-xs ${
                isSessionRecording ? "text-purple-500" : isUser ? "text-gray-400" : "text-gray-500"
              } font-mono`}
            >
              {text.timestamp}
            </div>
            <div className="whitespace-pre-wrap">{text.content}</div>
            {text.streaming && (
              <div className="flex mt-1">
                <TypingIndicator />
              </div>
            )}
          </>
        )}
        {function_call && (
          <>
            <div className="text-xs text-gray-500 font-mono">{function_call.timestamp}</div>
            <div className="flex items-start gap-2 mt-1">
              <Tool size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 w-full">
                <div className="font-semibold text-gray-700">{function_call.name}</div>
                <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words font-mono">
                  {(() => {
                    try {
                      const parsed = JSON.parse(function_call.arguments);
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      return function_call.arguments;
                    }
                  })()}
                </pre>
              </div>
            </div>
            {function_call.streaming && (
              <div className="flex mt-1">
                <TypingIndicator />
              </div>
            )}
          </>
        )}
        {audio && (
          <div className="min-w-[200px] mt-2">
            <div className={`text-xs ${isUser ? "text-gray-400" : "text-gray-500"} font-mono mb-2`}>
              {audio.timestamp}
            </div>
            {audio.processing ? <p>processing audio...</p> : <audio src={audio.content} controls preload="auto" />}
          </div>
        )}
      </div>
    </div>
  );
});

const formatTranscript = (messages: Map<string, MessageBubbleProps>): string => {
  return Array.from(messages.values())
    .map((message) => {
      const roleDisplay =
        message.role === "custom:session-recording"
          ? "Session Recording"
          : message.role.charAt(0).toUpperCase() + message.role.slice(1);

      let formattedMessage = `[${roleDisplay}]`;

      if (message.text) {
        formattedMessage += ` (${message.text.timestamp})`;
        if (message.interrupted) {
          formattedMessage += " [Interrupted]";
        }
        formattedMessage += ":\n";
        formattedMessage += message.text.content;
      }

      if (message.audio) {
        formattedMessage += ` (${message.audio.timestamp})`;
        formattedMessage += "\n[Audio Message]";
      }

      if (message.function_call) {
        formattedMessage += ` (${message.function_call.timestamp})`;
        formattedMessage += "\n[Function Call]";
        formattedMessage += `\nName: ${message.function_call.name}`;
        formattedMessage += `\nArguments: ${message.function_call.arguments}`;
      }

      return formattedMessage + "\n";
    })
    .join("\n");
};

interface ChatProps {
  messages: Map<string, MessageBubbleProps>;
  sendTextMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = memo(({ messages, sendTextMessage }) => {
  const { activeState } = useSession();
  const [message, setMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const scrolledManually = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle auto-scrolling when messages change
  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    if (!scrolledManually.current) {
      scrollToBottom();
    } else if (messages.size === 0) {
      // reset the scrolledManually ref when starting anew
      scrolledManually.current = false;
    }
  }, [messages]);

  // Detect when user manually scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if scrolled away from bottom
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100; // 100px threshold

      if (!isAtBottom) {
        scrolledManually.current = true;
      } else {
        scrolledManually.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSendText = () => {
    if (activeState !== "active") {
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return;
    }

    sendTextMessage(trimmedMessage);
    setMessage("");

    // Reset scroll position when sending a new message
    scrolledManually.current = false;
    scrollToBottom();
  };

  const handleCopyTranscript = () => {
    const transcript = formatTranscript(messages);
    copyToClipboard(transcript).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-2 border-b border-gray-200">
        <Button
          onClick={handleCopyTranscript}
          icon={<Copy width={12} height={12} />}
          iconClassName="mr-1"
          className="text-xs px-2 py-2"
          disabled={messages.size === 0}
        >
          {copySuccess ? "Copied!" : "Copy Transcript"}
        </Button>
      </div>
      <section ref={containerRef} className="overflow-auto p-4 flex flex-col gap-y-4 flex-1">
        {Array.from(messages.entries()).map(([id, message]) => (
          <MessageBubble key={id} {...message} />
        ))}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </section>
      <div className="p-4 flex items-center gap-x-2 flex-shrink-0 border-t border-gray-200">
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter" && message.trim()) {
              handleSendText();
            }
          }}
          autoFocus
          type="text"
          className="flex-1 px-4 py-2 focus:outline-none"
          placeholder="type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          onClick={handleSendText}
          icon={<Send height={16} />}
          className="rounded-full w-10 h-10 p-0"
          disabled={activeState !== "active"}
        />
      </div>
    </div>
  );
});

export default Chat;
