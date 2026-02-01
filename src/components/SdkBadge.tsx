import IconGitHub from '~icons/simple-icons/github'

export function GitHub({ repo }: { repo: string }) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="vocs:bg-surfaceTint vocs:px-2 vocs:py-1 vocs:rounded-lg vocs:border vocs:border-primary vocs:no-underline vocs:flex vocs:items-center vocs:gap-2"
    >
      <span className="vocs:flex vocs:items-center vocs:gap-2 vocs:text-sm vocs:text-primary vocs:font-[450]">
        <IconGitHub className="vocs:size-3" />
        GitHub
      </span>
    </a>
  )
}

export function Maintainer({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="vocs:bg-surfaceTint vocs:rounded-lg vocs:border vocs:border-primary vocs:flex vocs:items-stretch vocs:text-sm vocs:text-primary vocs:no-underline vocs:overflow-hidden"
    >
      <span className="vocs:px-2 vocs:py-1 vocs:flex vocs:items-center vocs:bg-surface vocs:text-secondary">
        Maintainer
      </span>
      <span className="vocs:px-2 vocs:py-1 vocs:font-[450] vocs:flex vocs:items-center">
        {name}
      </span>
    </a>
  )
}
