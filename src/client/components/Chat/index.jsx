import { memo, useEffect, useRef, useState } from "react";
import { AlertCircle, Send } from "react-feather";

import AudioPlayer from "@/components/AudioPlayer";
import Button from "@/components/ui/Button";

import styles from "./style.module.css";

// use memo to prevent unnecessary re-renders . without memo, it re-renders all
// messages even when the user just types each character of a new message because
// the message state in <Chat /> gets updated every time the user types a new character
const MessageBubble = memo(
  ({ id, role, type, content, timestamp, duration, streaming = false }) => {
    const isUser = role === "user";
    const baseContainer = "flex justify-end flex-col";
    const containerClasses = `${baseContainer} ${
      isUser ? "items-end" : "items-start"
    }`;
    const bubbleBase = `max-w-lg p-3 rounded-xl ${
      isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
    }`;

    if (type === "text") {
      return (
        <div className={containerClasses}>
          <div className={bubbleBase}>
            <div
              className={`text-xs ${
                isUser ? "text-gray-400" : "text-gray-500"
              } font-mono`}
            >
              {timestamp}
            </div>
            <div className="whitespace-pre-wrap">{content}</div>
            {/* Add a typing indicator for partial messages */}
            {!isUser && streaming && (
              <div className="flex mt-1">
                <span className={styles.typingIndicator}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </span>
              </div>
            )}
          </div>
        </div>
      );
    } else if (type === "audio") {
      return (
        <div className={containerClasses}>
          <div className={`${bubbleBase} min-w-[200px]`}>
            <div
              className={`text-xs ${
                isUser ? "text-gray-400" : "text-gray-500"
              } font-mono mb-2`}
            >
              {timestamp}
            </div>
            <AudioPlayer audioBuffer={content} duration={duration} />
          </div>
        </div>
      );
    } else if (type === "error") {
      const errorBubble =
        "max-w-lg p-3 rounded-xl bg-red-50 border border-red-200 text-red-800";

      return (
        <div className={containerClasses}>
          <div className={errorBubble}>
            <div className="text-xs text-red-500 font-mono">{timestamp}</div>
            <div className="flex items-start gap-2 mt-1">
              <AlertCircle
                size={16}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="whitespace-pre-wrap">{content}</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  },
);

const Chat = ({
  messages,
  botStreamingText,
  isSessionActive,
  loadingModel,
  sendTextMessage,
}) => {
  const [message, setMessage] = useState("");

  const scrolledManually = useRef(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle auto-scrolling when messages change
  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    if (!scrolledManually.current) {
      scrollToBottom();
    } else if (messages.length === 0) {
      // reset the scrolledManually ref when starting a new stream
      scrolledManually.current = false;
    }
  }, [messages]);

  // Detect when user manually scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if scrolled away from bottom
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100; // 100px threshold

      if (!isAtBottom) {
        scrolledManually.current = true;
      } else {
        scrolledManually.current = false;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSendClientEvent = () => {
    if (!isSessionActive || loadingModel) {
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

  return (
    <div className="flex flex-col h-full">
      <section
        ref={containerRef}
        className="overflow-auto p-4 flex flex-col gap-y-4 flex-1"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} {...message} />
        ))}
        {botStreamingText && (
          <MessageBubble
            key={botStreamingText.id}
            {...botStreamingText}
            streaming
          />
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </section>
      <div className="p-4 flex items-center gap-x-2 flex-shrink-0 border-t border-gray-200">
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter" && message.trim()) {
              handleSendClientEvent();
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
          onClick={handleSendClientEvent}
          icon={<Send height={16} />}
          className="rounded-full w-10 h-10 p-0"
          disabled={!isSessionActive || loadingModel}
        />
      </div>
    </div>
  );
};

export default Chat;
