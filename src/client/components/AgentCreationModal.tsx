import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Modal } from "./ui";

interface AgentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstructionsCreated: (instructions: string) => void;
}

const AgentCreationModal: React.FC<AgentCreationModalProps> = ({ 
  isOpen, 
  onClose,
  onInstructionsCreated
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt description");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/api/create-agent", { prompt });
      if (response.data && response.data.instructions) {
        onInstructionsCreated(response.data.instructions);
        setPrompt("");
        onClose();
        toast.success("Agent instructions created successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent instructions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Agent">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Describe your agent
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what kind of agent you want to create (e.g., a dental receptionist that schedules appointments)"
            className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AgentCreationModal; 