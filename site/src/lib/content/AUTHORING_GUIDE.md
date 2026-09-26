<!--
1. Relative path: site/src/lib/content/AUTHORING_GUIDE.md
2. Description: The definitive, human-friendly guide for authoring Knowledge Hub entries.
3. Expects: Writers to follow this simple structure for seamless automated formatting.
4. Provides: Clear rules for frontmatter, progressive disclosure, citations, and zero-HTML reference links.
-->
# Knowledge Hub Authoring Guide

Writing a new entry for the `/research` hub is designed to be as frictionless as possible. You write standard Markdown; the build system handles the complex styling, citations, and progressive disclosure automatically.

## 1. Frontmatter (Required)
Every file must start with this exact YAML block. The `slug` must match the filename (without `.md`).

```yaml
---
title: "Your Title Here"
slug: "your-title-here"
publishedDate: 2026-01-26
author: "Author Name"
abstract: "A concise, 1-2 sentence summary of the piece."
tags: ["Tag 1", "Tag 2"]
---
```

## 2. The "Read More" Split
To control exactly where the "Read more..." progressive disclosure button appears, simply place `<!-- more -->` on its own line. 
- **Best Practice**: Place it after the first 1 to 3 paragraphs, right before the first major heading.
- **Fallback**: If you forget this marker, the system will automatically split the text after the very first paragraph.

```markdown
First paragraph of your brilliant introduction.

Second paragraph that hooks the reader.

<!-- more -->

### The First Major Section
The rest of your deep-dive content goes here...
```

## 3. In-Text Citations
Do not use superscript or HTML. Simply use bracketed numbers. 
- **Single**: `...as shown in recent studies [1].`
- **Multiple**: `...as demonstrated previously [2] [3].` *(Note: Always put a space between multiple brackets so they don't merge into `[2][3]`)*.

The system automatically converts these into accessible, lime-colored jump links.

## 4. The Reference List (Zero HTML Required)
At the bottom of your document, create a section titled `### References`. Use a standard numbered list. 

**You do NOT need to write `<a>` tags or SVG code.** The system will automatically detect URLs at the end of your lines and convert them into the canonical lime arrow icon.

**Option A: Just paste the URL (Recommended)**
```markdown
### References

1. Alvarado, R. AI as an Epistemic Technology. Sci Eng Ethics 29, 32 (2023). https://doi.org/10.1007/s11948-023-00451-3
2. Arslan, Sıddık. “AI-Driven Algorithmic Propaganda.” GPH – International Journal, 2025.
```

**Option B: Standard Markdown Link**
```markdown
### References

1. Alvarado, R. AI as an Epistemic Technology. Sci Eng Ethics 29, 32 (2023). [Read Paper](https://doi.org/10.1007/s11948-023-00451-3)
```
*(The system will strip the words "Read Paper" and replace it with the arrow icon automatically).*

**Summary Checklist:**
- [ ] Frontmatter is complete and `slug` matches filename.
- [ ] `<!-- more -->` is placed after the intro.
- [ ] Citations are formatted as `[1]` with spaces between multiples.
- [ ] References are a simple numbered list with bare URLs or standard Markdown links at the end.