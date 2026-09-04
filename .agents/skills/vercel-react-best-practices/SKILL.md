Description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js…

Source: https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices

---

[Skills](https://www.skills.sh/)
[Packs](https://www.skills.sh/packs)
[Topics](https://www.skills.sh/topic)
[Official](https://www.skills.sh/official)
[Audits](https://www.skills.sh/audits)
[Docs](https://www.skills.sh/docs)
[Packs](https://www.skills.sh/packs)
[Topics](https://www.skills.sh/topic)
[Official](https://www.skills.sh/official)
[Audits](https://www.skills.sh/audits)
[Docs](https://www.skills.sh/docs)
[skills](https://www.skills.sh/)
[vercel-labs](https://www.skills.sh/vercel-labs)
[agent-skills](https://www.skills.sh/vercel-labs/agent-skills)

# vercel-react-best-practices
[React](https://www.skills.sh/topic/react)
[Next.js](https://www.skills.sh/topic/nextjs)

```
$ npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

React and Next.js performance optimization across 70 rules prioritized by impact.
- Organized into 8 categories from critical (eliminating waterfalls, bundle optimization) to low priority (advanced patterns), each with specific, actionable rules prefixed for easy reference
- Covers server-side performance including React.cache() deduplication, parallel fetching, and serialization minimization
- Addresses client-side concerns: re-render optimization through memoization and dependency management, rendering performance with CSS strategies and hydration patterns
- Includes JavaScript-level optimizations like DOM batching, caching, and Set/Map lookups for O(1) performance
- Each rule includes detailed explanations, incorrect and correct code examples, and contextual guidance for automated refactoring and code generation

# Vercel React Best Practices
Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 70 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply
Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## More in [React](https://www.skills.sh/topic/react)
[React](https://www.skills.sh/topic/react)
- [vercel-composition-patternsCompound components, render props, and context patterns for scalable component APIsvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/vercel-composition-patterns)
- [shadcnshadcn/ui component usage, customization, and Tailwind integrationshadcn/ui](https://www.skills.sh/shadcn/ui/shadcn)
- [webapp-testingTesting React apps: unit, integration, and end-to-end patternsanthropics/skills](https://www.skills.sh/anthropics/skills/webapp-testing)
- [typescript-advanced-typesDiscriminated unions, conditional types, template literals, and utility type patternswshobson/agents](https://www.skills.sh/wshobson/agents/typescript-advanced-types)
- [tailwind-design-systemDesign system implementation with Tailwind: tokens, variants, and component patternswshobson/agents](https://www.skills.sh/wshobson/agents/tailwind-design-system)
[vercel-composition-patternsCompound components, render props, and context patterns for scalable component APIsvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/vercel-composition-patterns)

### vercel-composition-patterns
Compound components, render props, and context patterns for scalable component APIs
[shadcnshadcn/ui component usage, customization, and Tailwind integrationshadcn/ui](https://www.skills.sh/shadcn/ui/shadcn)

### shadcn
shadcn/ui component usage, customization, and Tailwind integration
[webapp-testingTesting React apps: unit, integration, and end-to-end patternsanthropics/skills](https://www.skills.sh/anthropics/skills/webapp-testing)

### webapp-testing
Testing React apps: unit, integration, and end-to-end patterns
[typescript-advanced-typesDiscriminated unions, conditional types, template literals, and utility type patternswshobson/agents](https://www.skills.sh/wshobson/agents/typescript-advanced-types)

### typescript-advanced-types
Discriminated unions, conditional types, template literals, and utility type patterns
[tailwind-design-systemDesign system implementation with Tailwind: tokens, variants, and component patternswshobson/agents](https://www.skills.sh/wshobson/agents/tailwind-design-system)

### tailwind-design-system
Design system implementation with Tailwind: tokens, variants, and component patterns

[Next.js](https://www.skills.sh/topic/nextjs)
- [vercel-composition-patternsComposable component architecture patterns for scalable Next.js appsvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/vercel-composition-patterns)
- [next-best-practicesFile conventions, RSC boundaries, data patterns, async APIs, and metadatavercel-labs/next-skills](https://www.skills.sh/vercel-labs/next-skills/next-best-practices)
- [deploy-to-vercelDeploy Next.js apps to Vercel with correct config and environment setupvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/deploy-to-vercel)
- [next-cache-componentsPPR, use cache directive, cacheLife, cacheTag, and revalidateTagvercel-labs/next-skills](https://www.skills.sh/vercel-labs/next-skills/next-cache-components)
- [turborepoTurborepo task pipelines, caching, remote cache, and CI configurationvercel/turborepo](https://www.skills.sh/vercel/turborepo/turborepo)
[vercel-composition-patternsComposable component architecture patterns for scalable Next.js appsvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/vercel-composition-patterns)

### vercel-composition-patterns
Composable component architecture patterns for scalable Next.js apps
[next-best-practicesFile conventions, RSC boundaries, data patterns, async APIs, and metadatavercel-labs/next-skills](https://www.skills.sh/vercel-labs/next-skills/next-best-practices)

### next-best-practices
File conventions, RSC boundaries, data patterns, async APIs, and metadata
[deploy-to-vercelDeploy Next.js apps to Vercel with correct config and environment setupvercel-labs/agent-skills](https://www.skills.sh/vercel-labs/agent-skills/deploy-to-vercel)

### deploy-to-vercel
Deploy Next.js apps to Vercel with correct config and environment setup
[next-cache-componentsPPR, use cache directive, cacheLife, cacheTag, and revalidateTagvercel-labs/next-skills](https://www.skills.sh/vercel-labs/next-skills/next-cache-components)

### next-cache-components
PPR, use cache directive, cacheLife, cacheTag, and revalidateTag
[turborepoTurborepo task pipelines, caching, remote cache, and CI configurationvercel/turborepo](https://www.skills.sh/vercel/turborepo/turborepo)

### turborepo
Turborepo task pipelines, caching, remote cache, and CI configuration
[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
[Gen Agent Trust HubPass](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices/security/agent-trust-hub)
[SocketPass](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices/security/socket)
[SnykPass](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices/security/snyk)

### Browse
- [All skills](https://www.skills.sh/)
- [Trending](https://www.skills.sh/trending)
- [Hot](https://www.skills.sh/hot)
- [Official](https://www.skills.sh/official)
- [Packs](https://www.skills.sh/packs)
- [Security audits](https://www.skills.sh/audits)
[All skills](https://www.skills.sh/)
[Trending](https://www.skills.sh/trending)
[Hot](https://www.skills.sh/hot)
[Official](https://www.skills.sh/official)
[Packs](https://www.skills.sh/packs)
[Security audits](https://www.skills.sh/audits)

### Topics
- [React](https://www.skills.sh/topic/react)
- [Next.js](https://www.skills.sh/topic/nextjs)
- [Design & UI](https://www.skills.sh/topic/design)
- [Mobile](https://www.skills.sh/topic/mobile)
- [Agent workflows](https://www.skills.sh/topic/agent-workflows)
- [Databases](https://www.skills.sh/topic/databases)
- [Testing](https://www.skills.sh/topic/testing)
- [Marketing](https://www.skills.sh/topic/marketing)
- [All topics →](https://www.skills.sh/topic)
[React](https://www.skills.sh/topic/react)
[Next.js](https://www.skills.sh/topic/nextjs)
[Design & UI](https://www.skills.sh/topic/design)
[Mobile](https://www.skills.sh/topic/mobile)
[Agent workflows](https://www.skills.sh/topic/agent-workflows)
[Databases](https://www.skills.sh/topic/databases)
[Testing](https://www.skills.sh/topic/testing)
[Marketing](https://www.skills.sh/topic/marketing)
[All topics →](https://www.skills.sh/topic)

### Agents
- [Claude Code](https://www.skills.sh/agent/claude-code)
- [Cursor](https://www.skills.sh/agent/cursor)
- [Codex](https://www.skills.sh/agent/codex)
- [GitHub Copilot](https://www.skills.sh/agent/github-copilot)
- [Windsurf](https://www.skills.sh/agent/windsurf)
- [Gemini](https://www.skills.sh/agent/gemini)
- [Cline](https://www.skills.sh/agent/cline)
- [AMP](https://www.skills.sh/agent/amp)
- [Antigravity](https://www.skills.sh/agent/antigravity)
- [OpenClaw](https://www.skills.sh/agent/clawdbot)
- [All agents →](https://www.skills.sh/agent)
[Claude Code](https://www.skills.sh/agent/claude-code)
[Cursor](https://www.skills.sh/agent/cursor)
[Codex](https://www.skills.sh/agent/codex)
[GitHub Copilot](https://www.skills.sh/agent/github-copilot)
[Windsurf](https://www.skills.sh/agent/windsurf)
[Gemini](https://www.skills.sh/agent/gemini)
[Cline](https://www.skills.sh/agent/cline)
[AMP](https://www.skills.sh/agent/amp)
[Antigravity](https://www.skills.sh/agent/antigravity)
[OpenClaw](https://www.skills.sh/agent/clawdbot)
[All agents →](https://www.skills.sh/agent)

### Docs
- [Overview](https://www.skills.sh/docs)
- [CLI](https://www.skills.sh/docs/cli)
- [Customize pages](https://www.skills.sh/docs/customize)
- [API](https://www.skills.sh/docs/api)
- [FAQ](https://www.skills.sh/docs/faq)
[Overview](https://www.skills.sh/docs)
[CLI](https://www.skills.sh/docs/cli)
[Customize pages](https://www.skills.sh/docs/customize)
[API](https://www.skills.sh/docs/api)
[FAQ](https://www.skills.sh/docs/faq)

- [About](https://www.skills.sh/about)
- [Contact](https://www.skills.sh/contact)
- [Privacy](https://www.skills.sh/privacy)
- [Terms](https://www.skills.sh/terms)
- [GitHub](https://github.com/vercel-labs/skills)
[About](https://www.skills.sh/about)
[Contact](https://www.skills.sh/contact)
[Privacy](https://www.skills.sh/privacy)
[Terms](https://www.skills.sh/terms)
[GitHub](https://github.com/vercel-labs/skills)
[Vercel](https://vercel.com)
[GitHub](https://github.com/vercel-labs/skills)

