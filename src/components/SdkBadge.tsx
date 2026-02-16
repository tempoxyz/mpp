import IconGitHub from "~icons/simple-icons/github";

export function GitHub({ repo }: { repo: string }) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surfaceTint px-2 py-1 rounded-lg border border-primary no-underline flex items-center gap-2"
    >
      <span className="flex items-center gap-2 text-sm text-primary font-[450]">
        <IconGitHub className="size-3" />
        GitHub
      </span>
    </a>
  );
}

export function Maintainer({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surfaceTint rounded-lg border border-primary flex items-stretch text-sm text-primary no-underline overflow-hidden"
    >
      <span className="px-2 py-1 flex items-center bg-surface text-secondary">
        Maintainer
      </span>
      <span className="px-2 py-1 font-[450] flex items-center">{name}</span>
    </a>
  );
}
