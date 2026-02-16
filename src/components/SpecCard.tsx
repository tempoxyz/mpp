import { Card } from "vocs";

export function SpecCard({
  title = "Protocol spec",
  description = "See the normative definition",
  to,
}: {
  title?: string;
  description?: string;
  to: string;
}) {
  return (
    <Card
      description={description}
      icon="lucide:file-text"
      title={title}
      to={to}
    />
  );
}
