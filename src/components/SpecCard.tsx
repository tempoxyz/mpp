import { Card } from "vocs";

export function SpecCard({
  title = "IETF Specification",
  description = "Read the full specification",
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
