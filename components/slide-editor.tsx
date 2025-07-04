'use client';

import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette,
  Image,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Slide } from '@/lib/types/websocket-types';

interface SlideEditorProps {
  slide: Slide;
  onSave: (updates: Partial<Slide>) => void;
  onCancel: () => void;
}

export function SlideEditor({ slide, onSave, onCancel }: SlideEditorProps) {
  const [editedSlide, setEditedSlide] = useState<Partial<Slide>>({
    title: slide.title,
    html_content: slide.html_content,
    speaker_notes: slide.speaker_notes,
    narrative_purpose: slide.narrative_purpose,
    engagement_hook: slide.engagement_hook,
    visual_suggestions: slide.visual_suggestions
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const handleSave = () => {
    onSave(editedSlide);
  };

  const updateField = (field: keyof Slide, value: any) => {
    setEditedSlide(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Slide</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="content" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="h-full overflow-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slide Title</label>
                <Input
                  value={editedSlide.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter slide title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <div className="border rounded-lg">
                  {/* Simple toolbar */}
                  <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={editedSlide.html_content || ''}
                    onChange={(e) => updateField('html_content', e.target.value)}
                    placeholder="Enter slide content"
                    className="min-h-[200px] border-0 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Speaker Notes</label>
                <Textarea
                  value={editedSlide.speaker_notes || ''}
                  onChange={(e) => updateField('speaker_notes', e.target.value)}
                  placeholder="Add notes for the presenter"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="h-full overflow-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Layout</label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                    <SelectItem value="image-focus">Image Focus</SelectItem>
                    <SelectItem value="title-only">Title Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Background</label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Palette className="h-4 w-4 mr-2" />
                    Choose Color
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Image className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visual Elements</label>
                <div className="space-y-2">
                  {editedSlide.visual_suggestions?.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                      {typeof suggestion === 'string' ? suggestion : suggestion.description}
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    Add Visual Element
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="h-full overflow-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Narrative Purpose</label>
                <Textarea
                  value={editedSlide.narrative_purpose || ''}
                  onChange={(e) => updateField('narrative_purpose', e.target.value)}
                  placeholder="What is the purpose of this slide in the overall narrative?"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Engagement Hook</label>
                <Textarea
                  value={editedSlide.engagement_hook || ''}
                  onChange={(e) => updateField('engagement_hook', e.target.value)}
                  placeholder="How will this slide capture and maintain audience attention?"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Speaking Time</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={slide.metadata?.speaking_time_seconds || 60}
                    onChange={(e) => updateField('metadata', { 
                      ...slide.metadata, 
                      speaking_time_seconds: parseInt(e.target.value) 
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content Depth</label>
                <Select 
                  value={slide.metadata?.content_depth || 'moderate'}
                  onValueChange={(value) => updateField('metadata', {
                    ...slide.metadata,
                    content_depth: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surface">Surface Level</SelectItem>
                    <SelectItem value="moderate">Moderate Detail</SelectItem>
                    <SelectItem value="detailed">In-Depth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Inline edit component for quick edits
export function InlineSlideEdit({
  value,
  onSave,
  onCancel,
  multiline = false,
  className
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (multiline) {
    return (
      <div className={cn("space-y-2", className)}>
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="min-h-[100px]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        autoFocus
      />
    </div>
  );
}