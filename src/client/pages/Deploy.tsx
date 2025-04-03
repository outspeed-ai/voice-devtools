import { useSession } from "@/contexts/session";
import { providers } from "@src/settings";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "react-feather";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const embedCodeSnippet = `<!-- Add React dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Add the FloatingTalkButton script -->
<script src="YOUR_WORKER_URL/floating-talk-button.iife.js"></script>
<script>
    window.addEventListener('load', function() {
        window.FloatingTalkButton.init({
            // Add any configuration options here
        });
    });
</script>`;

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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
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
            title="Step 1: Deploy Your Agent"
            isOpen={openSections.step1}
            onToggle={() => toggleSection('step1')}
          >
            <div className="space-y-4">
              <p>1. Make sure you have the required environment variables in your <code>.env</code> file:</p>
              <div className="bg-gray-50 p-3 rounded-md border">
                <code className="text-sm">OPENAI_API_KEY=your_key_here</code>
                <br />
                <code className="text-sm">OUTSPEED_API_KEY=your_key_here</code>
              </div>
              
              <p>2. Deploy your agent to Cloudflare Workers:</p>
              <div className="bg-gray-50 p-3 rounded-md border">
                <code className="text-sm">npm run deploy</code>
              </div>
              
              <p className="text-sm text-gray-600">This will deploy your agent and provide you with a Worker URL. Save this URL for the next step.</p>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Step 2: Embed the Agent"
            isOpen={openSections.step2}
            onToggle={() => toggleSection('step2')}
          >
            <div className="space-y-4">
              <p>Copy the following code to your webpage, replacing <code>YOUR_WORKER_URL</code> with the URL you received in Step 1:</p>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter language="html" style={atomDark}>
                  {embedCodeSnippet}
                </SyntaxHighlighter>
              </div>
              
              <p className="text-sm text-gray-600">Once added, you'll see a floating icon on the bottom right corner of your webpage. Click it to start interacting with your agent!</p>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
} 
