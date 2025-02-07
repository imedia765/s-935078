
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateEditor } from './TemplateEditor';
import { TemplateList } from './TemplateList';

export function TemplateManager() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Template Management</h1>
      
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Templates</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <TemplateList />
        </TabsContent>
        
        <TabsContent value="editor">
          <TemplateEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
