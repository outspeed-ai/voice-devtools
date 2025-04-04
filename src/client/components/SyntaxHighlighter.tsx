import { Prism } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

import { Button } from "./ui";

interface SyntaxHighlighterProps {
  language?: string;
  content: string;
}

/**
 * A wrapper over react-syntax-highlighter's Prism component, with a button to copy the code to the clipboard.
 */
const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ language, content }) => {
  const handleCopy = async () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };
  return (
    <div className="syntax-highlighter-container relative">
      <Button
        onClick={handleCopy}
        className="py-1 text-xs absolute top-2 right-2 text-white border-white bg-black hover:bg-black/80"
        variant="outline"
      >
        Copy
      </Button>
      <Prism language={language} style={atomDark}>
        {content}
      </Prism>
    </div>
  );
};

export default SyntaxHighlighter;
