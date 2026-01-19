# Professional Production Setup

The current setup uses the Tailwind Play CDN, which is slow for production and not recommended. This plan migrates the project to a professional build process, which is ideal for Vercel.

## Proposed Changes

### [Component Name] Styling & Build Process

#### [NEW] [tailwind.config.js](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/tailwind.config.js)
Initialize a proper Tailwind configuration file.

#### [NEW] [postcss.config.js](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/postcss.config.js)
Configure PostCSS for Vite.

#### [NEW] [index.css](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/index.css)
Move all custom styles and Tailwind directives here.

#### [MODIFY] [index.html](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/index.html)
Remove the CDN script and manual Tailwind configuration.

#### [MODIFY] [index.tsx](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/index.tsx)
Import the new `index.css`.

#### [MODIFY] [package.json](file:///c:/Users/PMRV1/Downloads/luci-berkembrock-residence---gestão/package.json)
Add `tailwindcss`, `postcss`, and `autoprefixer` to devDependencies.

## Verification Plan

### Automated Tests
- Run `npm run build` and ensure no errors.
- Check the `dist/assets` folder for the generated CSS file.

### Manual Verification
- Run `npm run dev` and verify the UI remains identical but loads faster.
