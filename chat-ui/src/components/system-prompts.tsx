"use client";

import { SystemPrompt, SystemPromptCreate } from "@/api/models/SystemPrompt";
import { DefaultService } from "@/api/services/DefaultService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SystemPrompts() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [newPrompt, setNewPrompt] = useState<SystemPromptCreate>({
    name: "",
    content: "",
    description: "",
    is_cached: false,
  });

  // Load system prompts
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const prompts = await DefaultService.getSystemPromptsSystemPromptsGet();
      setPrompts(prompts);
    } catch (err) {
      console.error("Error loading system prompts:", err);
      setError("Failed to load system prompts");
    }
  };

  const handleCreatePrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      await DefaultService.createSystemPromptSystemPromptsPost(newPrompt);
      setNewPrompt({
        name: "",
        content: "",
        description: "",
        is_cached: false,
      });
      await loadPrompts();
    } catch (err) {
      console.error("Error creating system prompt:", err);
      setError("Failed to create system prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;

    try {
      setLoading(true);
      setError(null);
      await DefaultService.updateSystemPromptSystemPromptsPromptIdPut(
        editingPrompt.id,
        editingPrompt
      );
      setEditingPrompt(null);
      await loadPrompts();
    } catch (err) {
      console.error("Error updating system prompt:", err);
      setError("Failed to update system prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      setLoading(true);
      setError(null);
      await DefaultService.deleteSystemPromptSystemPromptsPromptIdDelete(
        promptId
      );
      await loadPrompts();
    } catch (err) {
      console.error("Error deleting system prompt:", err);
      setError("Failed to delete system prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen p-4 overflow-hidden">
      <Card className="h-full flex flex-col mx-auto w-[800px] max-w-[1200px]">
        <CardHeader>
          <CardTitle>System Prompts</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Create New Prompt */}
          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-lg font-semibold">Create New Prompt</h3>
            <Input
              placeholder="Name"
              value={newPrompt.name}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, name: e.target.value })
              }
            />
            <Input
              placeholder="Description (optional)"
              value={newPrompt.description || ""}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, description: e.target.value })
              }
            />
            <Textarea
              placeholder="Content"
              value={newPrompt.content}
              onChange={(e) =>
                setNewPrompt({ ...newPrompt, content: e.target.value })
              }
              rows={4}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-cache"
                checked={newPrompt.is_cached}
                onCheckedChange={(checked) =>
                  setNewPrompt({ ...newPrompt, is_cached: checked as boolean })
                }
              />
              <label htmlFor="new-cache" className="text-sm font-medium">
                Enable Caching
              </label>
            </div>
            <Button
              onClick={handleCreatePrompt}
              disabled={loading || !newPrompt.name || !newPrompt.content}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
          </div>

          {/* Existing Prompts */}
          <ScrollArea className="flex-1 border rounded-md p-4">
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="p-4">
                  {editingPrompt?.id === prompt.id ? (
                    <div className="space-y-4">
                      <Input
                        value={editingPrompt.name}
                        onChange={(e) =>
                          setEditingPrompt({
                            ...editingPrompt,
                            name: e.target.value,
                          })
                        }
                      />
                      <Input
                        value={editingPrompt.description || ""}
                        onChange={(e) =>
                          setEditingPrompt({
                            ...editingPrompt,
                            description: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        value={editingPrompt.content}
                        onChange={(e) =>
                          setEditingPrompt({
                            ...editingPrompt,
                            content: e.target.value,
                          })
                        }
                        rows={4}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-cache-${prompt.id}`}
                          checked={editingPrompt.is_cached}
                          onCheckedChange={(checked) =>
                            setEditingPrompt({
                              ...editingPrompt,
                              is_cached: checked as boolean,
                            })
                          }
                        />
                        <label
                          htmlFor={`edit-cache-${prompt.id}`}
                          className="text-sm font-medium"
                        >
                          Enable Caching
                        </label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setEditingPrompt(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdatePrompt}
                          disabled={
                            loading ||
                            !editingPrompt.name ||
                            !editingPrompt.content
                          }
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{prompt.name}</h3>
                          {prompt.description && (
                            <p className="text-sm text-muted-foreground">
                              {prompt.description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPrompt(prompt)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePrompt(prompt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <pre className="mt-2 p-2 bg-muted rounded-md text-sm whitespace-pre-wrap">
                        {prompt.content}
                      </pre>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          Caching: {prompt.is_cached ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>

          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
