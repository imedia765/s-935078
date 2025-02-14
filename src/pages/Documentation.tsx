
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { marked } from "marked";
import { BookOpen, Users } from "lucide-react";

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  section_type: 'user_guide' | 'admin_guide';
}

export default function Documentation() {
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const { data, error } = await supabase
          .from('documentation_sections')
          .select('*')
          .order('title');

        if (error) throw error;
        
        const typedData = data?.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          section_type: item.section_type as 'user_guide' | 'admin_guide'
        })) || [];
        
        setSections(typedData);
      } catch (error) {
        console.error('Error fetching documentation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  const renderMarkdown = (content: string) => {
    return { __html: marked(content) };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-primary/10 rounded"></div>
          <div className="h-32 bg-primary/5 rounded"></div>
        </div>
      </div>
    );
  }

  const userGuides = sections.filter(s => s.section_type === 'user_guide');
  const adminGuides = sections.filter(s => s.section_type === 'admin_guide');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gradient">Documentation</h1>

      <Tabs defaultValue="user" className="w-full">
        <TabsList className="w-full flex flex-col sm:flex-row gap-2 sm:gap-0 bg-transparent sm:bg-black/40 sm:backdrop-blur-xl border-0 sm:border sm:border-white/10">
          <TabsTrigger 
            value="user" 
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <BookOpen className="h-4 w-4" />
            <span>User Guide</span>
          </TabsTrigger>
          <TabsTrigger 
            value="admin"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Users className="h-4 w-4" />
            <span>Admin Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <div className="grid gap-6">
            {userGuides.map((section) => (
              <Card key={section.id} className="p-6">
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={renderMarkdown(section.content)} 
                />
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <div className="grid gap-6">
            {adminGuides.map((section) => (
              <Card key={section.id} className="p-6">
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={renderMarkdown(section.content)} 
                />
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
