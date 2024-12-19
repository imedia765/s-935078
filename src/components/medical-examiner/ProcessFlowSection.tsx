import { Card } from "@/components/ui/card";

export function ProcessFlowSection() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        Process Flow Chart
      </h2>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          View or download our comprehensive Medical Examiner Process Flow Chart:
        </p>
        <object
          data="/Flowchart-ME-Process-NBC-Final-1.pdf"
          type="application/pdf"
          width="100%"
          height="500px"
          className="mb-4"
        >
          <p>
            Unable to display PDF file.{" "}
            <a
              href="/Flowchart-ME-Process-NBC-Final-1.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Download PDF
            </a>
          </p>
        </object>
      </div>
    </Card>
  );
}