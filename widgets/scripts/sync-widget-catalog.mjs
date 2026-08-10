import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(await readFile(path.join(root, 'widgets.json'), 'utf8'))

const allowedStatuses = new Set(['active', 'available', 'legacy', 'planned'])
const slugs = new Set()

for (const widget of registry.widgets) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(widget.slug)) {
    throw new Error(`Invalid widget slug: ${widget.slug}`)
  }
  if (slugs.has(widget.slug)) throw new Error(`Duplicate widget slug: ${widget.slug}`)
  if (!allowedStatuses.has(widget.status)) throw new Error(`Invalid status for ${widget.slug}`)
  if (widget.status === 'planned' && widget.entryPoint !== null) {
    throw new Error(`Planned widget ${widget.slug} must not have a runnable entry point`)
  }
  if (widget.status !== 'planned' && !widget.entryPoint) {
    throw new Error(`Runnable widget ${widget.slug} needs an entry point`)
  }

  slugs.add(widget.slug)
  await access(path.join(root, widget.slug))
  if (widget.entryPoint) await access(path.join(root, widget.slug, widget.entryPoint))
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const escapeMarkdown = (value) => String(value).replaceAll('|', '\\|')

function replaceGeneratedBlock(source, name, content) {
  const start = `<!-- widgets:${name}:start -->`
  const end = `<!-- widgets:${name}:end -->`
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!pattern.test(source)) throw new Error(`Missing generated block: ${name}`)
  return source.replace(pattern, `${start}\n${content.trimEnd()}\n${end}`)
}

const sorted = [...registry.widgets].sort((a, b) => a.catalog.order - b.catalog.order)
const runnable = sorted.filter((widget) => widget.status !== 'planned')
const planned = sorted.filter((widget) => widget.status === 'planned')

const cards = runnable.map((widget) => {
  const statusClass = widget.status === 'active'
    ? ' status--active'
    : widget.status === 'legacy' ? ' status--legacy' : ''
  const featuredClass = widget.catalog.featured ? ' widget-card--featured' : ''
  const cardStatusLabel = widget.status === 'legacy' ? 'Legacy' : widget.statusLabel
  return `                <a class="widget-card${featuredClass}" href="${escapeHtml(widget.slug)}/">
                    <span class="card-meta"><span class="status${statusClass}">${escapeHtml(cardStatusLabel)}</span> ${escapeHtml(widget.category)}</span>
                    <span class="card-title">${escapeHtml(widget.name)}</span>
                    <span class="card-copy">${escapeHtml(widget.summary)}</span>
                    <span class="card-action">${escapeHtml(widget.catalog.action)} <span aria-hidden="true">&rarr;</span></span>
                </a>`
}).join('\n\n')

const plannedSections = planned.map((widget) => `        <section class="planned" aria-labelledby="${escapeHtml(widget.slug)}-title">
            <p class="eyebrow">On the workbench</p>
            <h2 id="${escapeHtml(widget.slug)}-title">${escapeHtml(widget.name)}</h2>
            <p>${escapeHtml(widget.summary)}</p>
        </section>`).join('\n')

const catalog = `        <section aria-labelledby="available-title">
            <div class="section-heading">
                <h2 id="available-title">Available now</h2>
                <p>Each tool runs independently.</p>
            </div>

            <div class="widget-grid">
${cards}
            </div>
        </section>

${plannedSections}`

const tableRows = sorted.map((widget) => {
  const name = widget.status === 'planned'
    ? escapeMarkdown(widget.name)
    : `[${escapeMarkdown(widget.name)}](${widget.slug}/)`
  const entry = widget.entryPoint ? `\`${widget.slug}/${widget.entryPoint}\`` : 'No runnable entry point'
  return `| ${name} | ${escapeMarkdown(widget.statusLabel)} | ${escapeMarkdown(widget.stack)} | ${entry} |`
}).join('\n')

const table = `| Widget | Status | Stack | Entry point |
| --- | --- | --- | --- |
${tableRows}`

const indexPath = path.join(root, 'index.html')
const readmePath = path.join(root, 'README.md')
const index = replaceGeneratedBlock(await readFile(indexPath, 'utf8'), 'catalog', catalog)
const readme = replaceGeneratedBlock(await readFile(readmePath, 'utf8'), 'table', table)

await Promise.all([
  writeFile(indexPath, index),
  writeFile(readmePath, readme),
])

console.log(`Synchronized ${registry.widgets.length} widgets.`)
