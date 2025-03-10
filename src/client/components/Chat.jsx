import { useState } from "react";
import { AlertCircle, Send } from "react-feather";

import AudioPlayer from "./AudioPlayer";
import Button from "./ui/Button";

const Chat = ({ messages, isSessionActive, loadingModel, sendTextMessage }) => {
  const [message, setMessage] = useState("");

  const handleSendClientEvent = () => {
    if (!isSessionActive || loadingModel) {
      return;
    }

    sendTextMessage(message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <section className="overflow-auto p-4 flex flex-col gap-y-4 flex-1">
        {messages.map(({ id, role, type, content, timestamp, duration }) => {
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
              <div key={id} className={containerClasses}>
                <div className={bubbleBase}>
                  <div
                    className={`text-xs ${
                      isUser ? "text-gray-400" : "text-gray-500"
                    } font-mono`}
                  >
                    {timestamp}
                  </div>
                  <div className="whitespace-pre-wrap">{content}</div>
                </div>
              </div>
            );
          } else if (type === "audio") {
            return (
              <div key={id} className={containerClasses}>
                <div className={`${bubbleBase} min-w-[200px]`}>
                  <div
                    className={`text-xs ${
                      isUser ? "text-gray-400" : "text-gray-500"
                    } font-mono mb-2`}
                  >
                    {timestamp}
                  </div>
                  <AudioPlayer src={content} duration={duration} />
                </div>
              </div>
            );
          } else if (type === "error") {
            const errorBubble =
              "max-w-lg p-3 rounded-xl bg-red-50 border border-red-200 text-red-800";

            return (
              <div key={id} className={containerClasses}>
                <div className={errorBubble}>
                  <div className="text-xs text-red-500 font-mono">
                    {timestamp}
                  </div>
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
        })}
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
