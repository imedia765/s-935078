import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Smartphone, Apple, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface BuildTask {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  description: string;
}

interface BuildPhase {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  progress: number;
  startDate?: Date;
  completedDate?: Date;
  tasks: BuildTask[];
  description: string;
  estimatedDays: string;
}

const buildPhases: BuildPhase[] = [
  {
    id: "phase1",
    name: "Initial Setup & Configuration",
    status: "in-progress",
    progress: 65,
    startDate: new Date(),
    tasks: [
      { id: "1.1", name: "Install Capacitor Dependencies", status: "completed", description: "Core and platform-specific packages" },
      { id: "1.2", name: "Initialize Capacitor", status: "completed", description: "Project configuration setup" },
      { id: "1.3", name: "Configure Build Settings", status: "in-progress", description: "Platform-specific configurations" },
    ],
    description: "Setting up the foundation for mobile development",
    estimatedDays: "1-2 days"
  },
  {
    id: "phase2",
    name: "Mobile-Specific Optimizations",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "2.1", name: "Add Mobile Plugins", status: "pending", description: "Camera, File System, Notifications" },
      { id: "2.2", name: "Update Features", status: "pending", description: "Native functionality integration" },
      { id: "2.3", name: "UI/UX Adjustments", status: "pending", description: "Mobile-specific interface updates" },
    ],
    description: "Enhancing the app with mobile-specific features",
    estimatedDays: "3-5 days"
  },
  {
    id: "phase3",
    name: "Platform Setup",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "3.1", name: "iOS Configuration", status: "pending", description: "Xcode and CocoaPods setup" },
      { id: "3.2", name: "Android Configuration", status: "pending", description: "Android Studio and SDK setup" },
    ],
    description: "Setting up platform-specific development environments",
    estimatedDays: "2-3 days"
  },
  {
    id: "phase4",
    name: "Build & Test",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "4.1", name: "Initial Build", status: "pending", description: "First platform builds" },
      { id: "4.2", name: "Testing Setup", status: "pending", description: "Test environment configuration" },
      { id: "4.3", name: "Device Testing", status: "pending", description: "Physical device testing" },
    ],
    description: "Building and testing the application",
    estimatedDays: "3-4 days"
  },
  {
    id: "phase5",
    name: "Platform-Specific Features",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "5.1", name: "iOS Features", status: "pending", description: "iOS-specific implementation" },
      { id: "5.2", name: "Android Features", status: "pending", description: "Android-specific implementation" },
    ],
    description: "Implementing platform-specific functionality",
    estimatedDays: "4-5 days"
  },
  {
    id: "phase6",
    name: "Deployment & Distribution",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "6.1", name: "Store Preparation", status: "pending", description: "App store requirements" },
      { id: "6.2", name: "Release Management", status: "pending", description: "Version and distribution" },
    ],
    description: "Preparing for app store deployment",
    estimatedDays: "2-3 days"
  },
  {
    id: "phase7",
    name: "Maintenance & Monitoring",
    status: "pending",
    progress: 0,
    tasks: [
      { id: "7.1", name: "Analytics Setup", status: "pending", description: "Monitoring configuration" },
      { id: "7.2", name: "Continuous Updates", status: "pending", description: "Ongoing maintenance" },
    ],
    description: "Ongoing maintenance and improvements",
    estimatedDays: "Ongoing"
  },
];

const StatusBadge = ({ status }: { status: BuildPhase["status"] }) => {
  const statusConfig = {
    pending: { color: "bg-slate-500", icon: Clock, text: "Pending" },
    "in-progress": { color: "bg-blue-500", icon: Clock, text: "In Progress" },
    completed: { color: "bg-green-500", icon: CheckCircle2, text: "Completed" },
    failed: { color: "bg-red-500", icon: AlertCircle, text: "Failed" }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`${config.color} text-white`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
};

export function MobileBuildProgress() {
  const overallProgress = Math.round(
    buildPhases.reduce((acc, phase) => acc + phase.progress, 0) / buildPhases.length
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/placeholder.svg"
            alt="Lovable Logo"
            className="w-12 h-12"
          />
          <div>
            <h2 className="text-2xl font-bold text-gradient">Mobile Build Progress</h2>
            <p className="text-muted-foreground">Track your app's journey to mobile platforms</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5" />
            <span>iOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <span>Android</span>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {buildPhases.map((phase) => (
          <AccordionItem key={phase.id} value={phase.id} className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{phase.name}</span>
                  <StatusBadge status={phase.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{phase.estimatedDays}</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{phase.description}</p>
                {phase.startDate && (
                  <div className="text-sm">
                    Started: {format(phase.startDate, "PPP")}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Phase Progress</span>
                    <span className="text-sm font-medium">{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
                <div className="space-y-2">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{task.name}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">{task.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
