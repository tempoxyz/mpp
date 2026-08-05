<!-- hy-mt2-i18n:start -->
[English](./README.md) | [中文](./README_zh-CN.md) | [日本語](./README_ja.md) | **Español**
<!-- hy-mt2-i18n:end -->

<br>
<br>

<p align="center">
  <a href="https://mpp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/lockup-light.svg">
      <img alt="Protocolo de pagos entre máquinas" src="public/lockup-dark.svg" width="auto" height="120">
    </picture>
  </a>
</p>

<br>
<br>

# mpp

El protocolo abierto para pagos máquina a máquina.

[![Sitio web](https://img.shields.io/badge/website-mpp.dev-black)](https://mpp.dev)
[![Especificación IETF](https://img.shields.io/badge/spec-paymentauth.org-blue)](https://paymentauth.org)
[![Licencia](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue)](LICENSE-MIT)

[MPP](https://mpp.dev), el Machine Payments Protocol, es un estándar abierto para pagos entre máquinas, desarrollado en colaboración por [Tempo](https://tempo.xyz) y [Stripe](https://stripe.com). Los servicios HTTP de pago suelen requerir claves API, cuentas de facturación o flujos de pago configurados antes de que un cliente pueda realizar una solicitud. MPP permite a agentes, aplicaciones y personas realizar pagos directamente junto con la solicitud a través de un [flujo HTTP `402 Payment Required`](https://mpp.dev/protocol/http-402). Los casos de uso más comunes incluyen pagos automatizados, facturación basada en el uso y comercio entre máquinas.

Puede comenzar hoy mismo leyendo la [visión general del protocolo](https://mpp.dev/protocol), yendo directamente a la [guía de inicio rápido](https://mpp.dev/quickstart), o explorando las [SDKs](https://mpp.dev/sdk).

## ¿Qué hay en este repositorio?

Este repositorio contiene el código fuente de [mpp.dev](https://mpp.dev). Es la sede principal de la documentación de MPP, los explicadores del protocolo, las referencias de los SDK, así como el directorio de servicios activos compatibles con MPP. Comience aquí si es nuevo en MPP, independientemente del idioma o plataforma que utilice.

- **Documentación:** guías de inicio rápido, explicaciones del protocolo y referencias del SDK  
- **Directorio de servicios:** un registro de los servicios compatibles con MPP en [mpp.dev/services](https://mpp.dev/services)

## Desarrollo

```bash
pnpm install      # Instalar dependencias
pnpm run dev      # Iniciar el servidor de desarrollo
pnpm run build    # Compilación para producción
pnpm run check:sdk-drift # Validar las páginas de referencia del SDK en relación con las exportaciones de mppx
pnpm run preview  # Ver la versión en previsualización para producción
```

### Publicar una entrada de blog

1. Copie [`templates/blog-post.mdx`](templates/blog-post.mdx) a `src/pages/blog/<slug>.mdx`.  
2. Reemplace el título, las descripciones, la fecha, el subtítulo y el cuerpo del texto.  
3. Ejecute `pnpm test`, `pnpm check:types` y `pnpm build`.

El frontmatter de la publicación es la fuente de verdad. La fase de compilación lo valida, ordena el índice del blog, agrega elementos decorativos comunes a las publicaciones, renderiza el Markdown semántico y genera `/rss.xml`. No es necesario editar un registro de publicaciones ni duplicar la fecha en otro lugar.

## Contribuir al directorio de servicios

El directorio de servicios en [mpp.dev/services](https://mpp.dev/services) está seleccionado cuidadosamente con servicios MPP activos y listos para producción.

### Envía una solicitud de pull request a este repositorio

Si desea que su servicio se incluya en la lista seleccionada de `mpp.dev/services`, abra una solicitud de pull request y complete esta lista de verificación:

#### Requerido

- [ ] Su servicio está **activo y acepta pagos** a través de MPP (no es un contenido temporal ni está en fase de lanzamiento).  
- [ ] Ha añadido su entrada en `schemas/services.ts`.  
- [ ] Los tipos son válidos: `pnpm check:types`.  
- [ ] La compilación tiene éxito: `pnpm build`.

#### Recomendado

- [ ] Registre su servicio en [MPPScan](https://www.mppscan.com/register) (de Merit Systems). Sigue el formato estándar de detección de MPP y permite que los agentes lo detecten de inmediato, sin necesidad de abrir una PR.

#### Criterios de revisión

Damos prioridad a los servicios que son **de alta calidad y novedosos**. Es posible que no aprobemos servicios que dupliquen funcionalidades existentes o que aún no estén listos para producción.

### Añadir un servicio nuevo

1. **Edite `schemas/services.ts`:** agregue una nueva entrada al array `services`:

```ts
{
  id: "my-service",
  name: "Mi Servicio",
  url: "https://example.com",
  serviceUrl: "https://api.example.com",
  description: "Qué hace su servicio.",
  categories: ["ai"],
  integration: "primario",
  tags: ["llm", "chat"],
  docs: {
    homepage: "https://docs.example.com",
    llmsTxt: "https://docs.example.com/llms.txt",
  },
  provider: { name: "Example Inc.", url: "https://example.com" },
  realm: MPP_REALM,
  intent: "cobrar",
  payment: TEMPO_PAYMENT,
  endpoints: [
    { route: "POST /v1/completions", desc: "Generar completions", amount: "5000" },
    { route: "GET /v1/models", desc: "Listar modelos" },
  ],
}
```

## Contribuir

Se aceptan contribuciones relacionadas con la documentación, el directorio de servicios y las mejoras del sitio.

### Lista de verificación para las solicitudes de pull request

1. **Los tipos pasan la verificación**: `pnpm check:types`
2. **La compilación tiene éxito**: `pnpm build`
3. **El análisis de estilo pasa**: `pnpm check`
4. **Las referencias al SDK permanecen sincronizadas** (si se modifican los documentos del SDK o `vocs.config.ts`): `pnpm check:sdk-drift`
5. **Las pruebas E2E pasan** (si se modifican componentes interactivos o de terminal): `pnpm test:e2e`

### Tipos de contribuciones

| Tipo de cambio | Proceso |
|-------------|---------|
| Error tipográfico o corrección editorial | Envía directamente una PR a `main` |
| Nueva página de documentación | Sigue la estructura existente en `src/pages/` |
| Nueva lista de servicios | Regístrate en [MPPScan](https://www.mppscan.com/register) para que sea detectada de inmediato; abre una PR para incluirla en la lista seleccionada de `mpp.dev/services` |
| Actualización de servicio | Edita la entrada del servicio en `schemas/services.ts`, regenera el archivo y envía una PR |
| Nuevo componente | Sigue los patrones existentes en `src/components/` |
| Configuración del sitio | Abre primero un problema para discusión |

## SDKs

| Repositorio | Idioma |
|------------|----------|
| [wevm/mppx](https://github.com/wevm/mppx) | TypeScript |
| [tempoxyz/pympp](https://github.com/tempoxyz/pympp) | Python |
| [tempoxyz/mpp-rs](https://github.com/tempoxyz/mpp-rs) | Rust |
| [tempoxyz/mpp-go](https://github.com/tempoxyz/mpp-go) | Go |
| [stripe/mpp-rb](https://github.com/stripe/mpp-rb) | Ruby |
| [tempoxyz/mpp-specs](https://github.com/tempoxyz/mpp-specs) | Especificaciones de protocolo |

## Seguridad

Consulte [`SECURITY.md`](./SECURITY.md) para informar sobre vulnerabilidades.

## Licencia

Se licencia bajo la [Licencia Apache, Versión 2.0](./LICENSE-APACHE) o la [Licencia MIT](./LICENSE-MIT), a su elección.

A menos que indique explícitamente lo contrario, cualquier contribución presentada intencionadamente por usted para su inclusión en estos paquetes, según lo definido en la licencia Apache-2.0, estará sujeta a la doble licenciamiento mencionada anteriormente, sin ningún otro término o condición adicional.
