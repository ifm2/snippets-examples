# Canvas snippets

A static, single-page teaching resource with responsive flexbox profile cards and a Panopto embed template. Designed for teachers who are new to HTML.

## Preview locally

Open `index.html` in a browser. For clipboard access and a local web preview, run this from the project folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8000. No build tools, packages, fonts, or external scripts are required. The clipboard button selects the code for manual copying when clipboard access is unavailable.

## Publish on GitHub Pages (no terminal needed)

1. Sign in to GitHub and create a **public** repository named `snippets-examples`. Leave the initial README, licence and gitignore options unticked because this folder already contains the site files.
2. On the repository page, choose **uploading an existing file** (or **Add file → Upload files**). Upload `index.html`, `styles.css`, `script.js`, `.nojekyll`, and this `README.md` into the root of the repository. Commit the upload to `main`.
3. Open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose **main** and **/(root)**, then **Save**.
5. Wait for the Pages deployment to finish. GitHub displays the live link in Settings → Pages: `https://YOUR-USERNAME.github.io/snippets-examples/`.
6. Check that both previews, the jump links, the narrow profile view and copy buttons work on that live URL.

Reference: [GitHub’s publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

For the exact root address `https://YOUR-USERNAME.github.io/`, name the repository `YOUR-USERNAME.github.io` instead. You can only have one user site per account; `snippets-examples` is a separate project site.

To update the site, edit or upload these same files in the repository and commit the changes. Pages will publish the update. No server or paid hosting is needed for a public repository.

## What is included

- Anchor links at the top of the page.
- A profile customiser with a wide/narrow preview, optional HTTPS photo and email, and generated HTML.
- A real Panopto example recording, plus a customiser for previewing and copying your own video embed.
- Copy buttons, readable HTML, plain-language editing guidance and Canvas installation steps.
- Keyboard focus indicators, a skip link, semantic headings, responsive layouts and reduced-motion support.

Profile content is generic. The Panopto example uses the recording supplied for this website: https://ox.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=2e6213de-5173-49c5-bc0d-b4f100ac1769. Form values are kept in memory and reset when the page reloads. Entering a photo loads that remote image; viewing the video section contacts the Oxford Panopto server. There are no analytics or storage cookies in this site's own code.

## Panopto limitations and validation

The default view and copyable HTML use the supplied example recording, with autoplay disabled, captions requested, and interactivity enabled. **Reset example** restores that recording. To use another recording, paste its HTTPS `Embed.aspx?id=…` URL and select **Load my video**. The form supports institution-specific Panopto domains. It rebuilds only the video ID and documented embed settings into the snippet, discarding unrelated query parameters.

`interactivity=all` enables interactive features; it does not generate contents entries. `captions=true` requests captions; it does not create them. The teacher must check chapters, captions, sharing permissions and the saved Canvas page with a student account. Embedded player layout can vary by Panopto version and viewport. A full-viewer link is always included as an alternative. Third-party sign-in or browser cookie policies can affect embedded playback.

Canvas may adjust supported HTML when saving. Inline layout styles follow the supplied example; compatibility must be checked in the institution’s saved Canvas page. The website preview cannot reproduce Canvas’s sanitiser or institution-specific settings.

Sources for the teaching guidance:

- [Canvas HTML view guide](https://community.instructure.com/en/kb/articles/662912-how-do-i-use-the-html-view-in-the-rich-content-editor)
- [Panopto employee’s example of the standard embed URL](https://community.panopto.com/discussion/1138/canvas-integration-data-via-panopto-api)

## Maintenance

- `index.html`: page content and forms.
- `styles.css`: website presentation; these styles are not copied into Canvas.
- `script.js`: generates self-contained HTML, handles previews and clipboard interaction.
- `.nojekyll`: tells GitHub Pages to serve the static files directly.

To add another snippet later, add a section, a top navigation link and a separate generator/copy target. Keep sample content generic and escape user-entered text before generating HTML.
