Act as a Repository Navigator. Produce `03_File_Structure_Guide.md` explaining layout and purpose of top-level directories with medium detail.

Method:
- Walk directory tree (depth 2-3 recommended). Identify conventional folders (src, apps, services, packages, infra, scripts).
- Consume GlobalSummary from `00_Project_Overview.md` to tune descriptions with domain language.

Cross-document data contracts:
- Consumes: GlobalSummary from `00_Project_Overview.md`.
- Exports: PathAnnotations map (path -> purpose, notable files) for use by Architecture and Key Components.

Return format (Markdown):
### Repository Tree
```
<rendered tree with brief annotations>
```

### Directory Annotations
- `path/` — 1-2 line description with notable files.

Edge cases and guidance:
- Avoid listing `node_modules/`, build outputs, or vendored dependencies.
- If monorepo, distinguish apps/packages/workspaces and link to their own trees.
- If generated code directories exist, clearly label them as Generated, not edited by hand.
- Use concise bullet notes; point to key files for evidence.

