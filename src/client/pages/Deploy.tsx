import { useSession } from "@/contexts/session";
import { providers } from "@src/settings";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "react-feather";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const openAICodeSnippet = `import { RealtimeClient } from "@outspeed-ai/voice-devtools";

const client = new RealtimeClient({
  apiKey: "your-openai-api-key",
  model: "gpt-4-turbo-preview",
  provider: "openai",
  // Optional: Configure voice settings
  voice: {
    provider: "elevenlabs",
    voiceId: "your-voice-id",
    apiKey: "your-elevenlabs-api-key"
  }
});

// Start a conversation
await client.start();
`;

const outspeedCodeSnippet = `import { RealtimeClient } from "@outspeed-ai/voice-devtools";

const client = new RealtimeClient({
  apiKey: "your-outspeed-api-key",
  model: "gpt-4",
  provider: "outspeed",
  // Optional: Configure voice settings
  voice: {
    provider: "elevenlabs",
    voiceId: "your-voice-id",
    apiKey: "your-elevenlabs-api-key"
  }
});

// Start a conversation
await client.start();
`;

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionSection({ title, children, isOpen, onToggle }: AccordionSectionProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

export default function Deploy() {
  const { selectedModel } = useSession();
  const isOutspeed = selectedModel.provider === providers.Outspeed;
  const codeSnippet = isOutspeed ? outspeedCodeSnippet : openAICodeSnippet;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cloudflare: true,
    vercel: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Deploy Your Agent</h1>
        
        <div className="space-y-4">
          <AccordionSection
            title="Deploy on Cloudflare"
            isOpen={openSections.cloudflare}
            onToggle={() => toggleSection('cloudflare')}
          >
            <div className="space-y-4">
              <p>1. Deploy your {selectedModel.provider.name} voice agent's backend to Cloudflare Workers:</p>
              <div className="bg-gray-50 p-3 rounded-md border">
                <code className="text-sm">npm run deploy</code>
              </div>
              
              <p>2. Copy the following code to your webpage to connect to the backend:</p>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter language="typescript" style={atomDark}>
                  {codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Deploy on Vercel"
            isOpen={openSections.vercel}
            onToggle={() => toggleSection('vercel')}
          >
            <div className="space-y-4">
              <p>1. Clone and deploy the template repository:</p>
              <div className="bg-gray-50 p-3 rounded-md border">
                <code className="text-sm">git clone https://github.com/outspeed-ai/outspeed-nextjs-template</code>
              </div>
              
              <p>2. Copy your agent's configuration to the <code>agent.ts</code> file in your repository:</p>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter language="typescript" style={atomDark}>
                  {codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
} 