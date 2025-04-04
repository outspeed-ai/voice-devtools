import { useSession } from "@/contexts/session";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "react-feather";

import SyntaxHighlighter from "@/components/SyntaxHighlighter";

const javascriptSnippet = `<!-- React Dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Load the Outspeed Agent Script -->
<script src="YOUR_WORKER_URL/outspeed-agent-embed.iife.js"></script>

<!-- Initialize the Outspeed Agent -->
<script>
    window.addEventListener('load', function() {
        window.OutspeedAgentEmbed.init({
            // Add any configuration options here
        });
    });
</script>`;

const stylingSnippet = `<!-- Styling Dependencies -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="YOUR_WORKER_URL/outspeed-agent-embed.css">`;

const embedCodeSnippet = `<!-- ===== DEPENDENCIES ===== -->
<!-- React Dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Styling Dependencies -->
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="YOUR_WORKER_URL/outspeed-agent-embed.css">

<!-- ===== OUTSPEED AGENT ===== -->
<!-- Load the Outspeed Agent Script -->
<script src="YOUR_WORKER_URL/outspeed-agent-embed.iife.js"></script>

<!-- Initialize the Outspeed Agent -->
<script>
    window.addEventListener('load', function() {
        window.OutspeedAgentEmbed.init({
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
  const { config, selectedAgent } = useSession();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
  });
  const [showExample, setShowExample] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const configObject = `const agent: Agent = {
  id: "${selectedAgent.id}",
  name: "${selectedAgent.name}",
  modelName: '${config.model}',
  instructions: \`${config.instructions}\`,
  tools: ${JSON.stringify(config.tools, null, 2)},
};
`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Deploy Your Agent</h1>

        <div className="space-y-4">
          <AccordionSection
            title="Step 1: Clone Outspeed Voice DevTools"
            isOpen={openSections.step1}
            onToggle={() => toggleSection("step1")}
          >
            <div className="space-y-4">
              <p>
                Clone the{" "}
                <a href="https://github.com/outspeed-ai/voice-devtools" className="underline" target="_blank">
                  voice-devtools
                </a>{" "}
                repository:
              </p>
              <SyntaxHighlighter
                language="bash"
                content="git clone https://github.com/outspeed-ai/voice-devtools.git"
              />
              <p>Install dependencies:</p>
              <SyntaxHighlighter language="bash" content="npm install" />
            </div>
          </AccordionSection>

          <AccordionSection
            title="Step 2: Configure Your Agent"
            isOpen={openSections.step2}
            onToggle={() => toggleSection("step2")}
          >
            <div className="space-y-4">
              <p>
                Copy the following configuration and place it in <code>deploy/OutspeedAgentEmbed/deploy-config.ts</code>
                :
              </p>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter language="typescript" content={configObject} />
              </div>

              <p className="text-sm text-gray-600">
                This configuration uses your currently selected agent and model settings.
              </p>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Step 3: Deploy Your Agent"
            isOpen={openSections.step3}
            onToggle={() => toggleSection("step3")}
          >
            <div className="space-y-4">
              <p>
                1. Make sure you have the required environment variables in your <code>.env</code> file:
              </p>
              <SyntaxHighlighter
                content={`OPENAI_API_KEY=your_key_here
OUTSPEED_API_KEY=your_key_here`}
              />

              <p>2. Deploy your agent to Cloudflare Workers:</p>

              <SyntaxHighlighter language="bash" content="npm run deploy" />

              <p className="text-sm text-gray-600">
                This will deploy your agent and provide you with a Worker URL. Save this URL for the next step.
              </p>
            </div>
          </AccordionSection>

          <AccordionSection
            title="Step 4: Embed the Agent"
            isOpen={openSections.step4}
            onToggle={() => toggleSection("step4")}
          >
            <div className="space-y-4">
              <p>
                Add the following code to your HTML file, replacing <code>YOUR_WORKER_URL</code> with the URL you
                received in Step 3:
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">1. Add Styling in the &lt;head&gt; section</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Place this code in the <code>&lt;head&gt;</code> section of your HTML file:
                  </p>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter language="html" content={stylingSnippet} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">2. Add JavaScript before the closing &lt;/body&gt; tag</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Place this code just before the closing <code>&lt;/body&gt;</code> tag:
                  </p>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter language="html" content={javascriptSnippet} />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <button 
                  onClick={() => setShowExample(!showExample)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-medium text-blue-700">Example Implementation</h3>
                  {showExample ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {showExample && (
                  <>
                    <p className="text-sm text-gray-700 mb-2 mt-2">
                      Here's how your HTML file structure should look:
                    </p>
                    <div className="rounded-lg overflow-hidden">
                      <SyntaxHighlighter 
                        language="html" 
                        content={`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Page Title</title>
    <!-- Add styling here -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="YOUR_WORKER_URL/outspeed-agent-embed.css">
</head>
<body>
    <!-- Your page content here -->
    
    <!-- Add JavaScript here -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="YOUR_WORKER_URL/outspeed-agent-embed.iife.js"></script>
    <script>
        window.addEventListener('load', function() {
            window.OutspeedAgentEmbed.init({
                // Add any configuration options here
            });
        });
    </script>
</body>
</html>`} 
                      />
                    </div>
                  </>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Once added, you'll see a floating icon on the bottom right corner of your webpage. Click it to start
                interacting with your agent!
              </p>
            </div>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}
