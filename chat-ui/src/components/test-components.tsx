"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TestComponents() {
  return (
    <div className="p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Component Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checkbox Test */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Checkbox</h2>
            <div className="flex items-center space-x-2">
              <Checkbox id="test" />
              <label
                htmlFor="test"
                className="text-sm font-medium leading-none"
              >
                Test Checkbox
              </label>
            </div>
          </div>

          {/* Button Test */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Button</h2>
            <div className="flex space-x-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Select Test */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Select</h2>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option 1</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
                <SelectItem value="3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Textarea Test */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Textarea</h2>
            <Textarea placeholder="Type something..." />
          </div>

          {/* ScrollArea Test */}
          <div>
            <h2 className="text-lg font-semibold mb-2">ScrollArea</h2>
            <ScrollArea className="h-[100px] w-full border rounded-md p-4">
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="text-sm">
                    Scroll content line {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Save + Run Button Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Default (Current)</span>
              <Button>Save + Run</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secondary</span>
              <Button variant="secondary">Save + Run</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Outline</span>
              <Button variant="outline">Save + Run</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ghost</span>
              <Button variant="ghost">Save + Run</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Destructive</span>
              <Button variant="destructive">Save + Run</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Link</span>
              <Button variant="link">Save + Run</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
