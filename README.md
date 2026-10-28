# Canvas snippets

[Canvas snippets](https://ifm2.github.io/snippets-examples/) is a small, interactive toolkit for Canvas educators with no HTML experience. Teachers can explore visual examples, personalise their content and copy ready-to-use HTML into a Canvas page.

## The toolkit

- **Flexbox profile cards:** introduce a teaching team with a photo, description and contact email. Wide and narrow previews show how the layout wraps on smaller screens.
- **Panopto viewer:** embed a recording with a full-viewer link. Advanced options control captions, contents and interactivity, fullscreen, title, branding and autoplay.
- **Accordions:** build a main section with none, one or several sub-accordions. Edit headings and paragraphs, add or remove sections, and change padding and text/background colours.

The accordion example starts with one sub-accordion. Both the main section and that sub-accordion start expanded so their contents are visible. Advanced Options starts closed. Choosing a smaller structure temporarily hides sections; choosing a larger structure restores their edited text during the current page session.

Each builder updates its preview and copyable HTML together. The generated snippets use inline styles so they can be pasted into Canvas's HTML editor. The page also includes guidance on editing tags, adding course images and checking the saved result.

## Accessibility and Canvas compatibility

The site includes keyboard focus indicators, a skip link, semantic headings, responsive layouts and reduced-motion support. Photo descriptions are editable, and accordion headings use native HTML disclosure controls.

The accordion colour mixer calculates contrast for normal-sized text and shows AA (4.5:1) and AAA (7:1) results. Low contrast produces a warning without blocking copying. Displayed ratios are rounded to three decimal places; pass/fail uses the unrounded value. Inherited text colours are measured in the website preview. These checks cover text contrast, rather than overall accessibility; always check the saved Canvas page too.

Accordion HTML retains the University's `fossa fossa-r` classes. Default padding is 0.8em for the main heading and 0.5em for main content and sub-accordions, with no added borders or sub-heading padding. Canvas themes and institution-specific HTML rules can change the result, including preventing accordions from starting expanded.

Panopto settings request existing captions and interactive features; they do not create captions or chapters. Videos restricted to a Canvas course may not load on this website even when they work for authorised students in Canvas. Check sharing permissions, caption accuracy and the saved page in Student View.

## Content and privacy

Profile content is generic. The supplied example portrait is stored in `assets/alex-example.png`; copied profile HTML uses its public website URL. For teaching, upload your own photo to Canvas and use an image address students can access.

Form edits are held in memory and reset when the page reloads. The site's own code uses no analytics or storage cookies. Loading a remote photo contacts its host, and viewing a video contacts its Panopto server. The example recording is hosted by Oxford Panopto.

## Developer file guide

This is a static website with no build step, package dependencies, external fonts or external scripts.

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, explanatory text, forms and initial settings. |
| `styles.css` | Website layout, responsive presentation and interaction styles; these styles are not copied into Canvas. |
| `script.js` | Snippet generation, live previews, form handling, contrast calculations and copying. |
| `assets/alex-example.png` | Supplied example portrait. |
| `.nojekyll` | Keeps static files served directly by GitHub Pages. |
| `.gitignore` | Excludes local preview screenshots, archives and unrelated source material. |

Open `index.html` directly for a basic preview. For local HTTP and clipboard support, run this from the project folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then visit [the local preview](http://127.0.0.1:8000/). When clipboard access is unavailable, the copy button selects the code for manual copying.

When adding a snippet, include a section, a navigation link and a separate generator/copy target. Escape user-entered text before inserting it into HTML. After changes, check the affected preview, generated HTML, keyboard controls and small-screen layout.
