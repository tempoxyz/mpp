import type { FeaturedService, Service } from "../../data/registry";
import { serviceIconUrl } from "../../data/registry";
import { CopyBadge } from "./CopyBadge";

export function ServiceCard({
  service,
}: {
  service: FeaturedService | Service;
}) {
  const category = service.categories?.[0] ?? "service";
  const url = service.serviceUrl ?? service.url;
  return (
    <div className="flex w-full flex-col justify-between gap-6 border border-border bg-[#101010] py-4 pl-4 pr-10 md:h-72 md:gap-0">
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <img
            alt=""
            className="size-[43px] shrink-0 object-contain"
            src={serviceIconUrl(service)}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-sans text-xl font-normal leading-[1.1] text-offwhite">
              {service.name}
            </p>
            <p className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary">
              {category}
            </p>
          </div>
        </div>
        <p className="font-sans text-lg leading-[1.2] text-secondary">
          {service.description ?? "MPP-enabled service for your agents."}
        </p>
      </div>
      <CopyBadge className="self-start" text={url} />
    </div>
  );
}
