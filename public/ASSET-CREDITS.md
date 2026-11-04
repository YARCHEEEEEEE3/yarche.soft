# Shared SAKYRA logo

- scene/sakyra-logo.png: transparent logo asset extracted with image generation from living-background.png. Preserves the title page’s black angular SAKYRA lettering, sun and cherry branch. Shared by onboarding, settings, desktop sidebar and mobile studio header through StudioBrand.tsx.

# Added in SAKYRA studio dashboard (v7)

- scene/dashboard-room.png: image-generation edit based on the user’s Japanese tea-room dashboard reference. All painted UI was removed; warm shoji room, cherry blossoms, lake/Fuji view, sleeping cat and desk accessories remain in the generated environment plate.
- scene/project-covers.png: newly generated three-panel Japanese pixel-art illustration: street/pagoda, temple, and moonlit torii. Used as cropped CSS project thumbnails, not generated user videos.
- Dashboard interface: real React/CSS panels and controls, Lucide icons, SVG landscape and blossom decorations, animated CSS petals and steam. Demo metrics are visibly labeled examples.

# Mobile title addition

- scene/title-mobile.png: image-generation portrait adaptation of living-background.png, preserving the SAKYRA wordmark and Japanese setting while recomposing for a narrow phone viewport. No painted controls. The desktop artwork is preserved.

# Added in SAKYRA v5

- scene/onboarding-background.png: generated edit based on the user’s new first-launch reference. The painted form, logo and loose petals were removed to provide a clean scenery plate. Japanese veranda, lantern, cat, cherry trees, Fuji, waterfall and torii setting retained as a visual interpretation.
- StudioBrand.tsx: vector wordmark, sun/mountain/pagoda emblem and blossom decoration built as scalable SVG.
- Onboarding.tsx: live HTML form with Lucide icons (ISC license), local preferences and Ukrainian/English UI.
- OnboardingAtmosphere.tsx: Canvas water distortion and falling petals, paused for hidden pages and reduced motion.

# Assets — SAKYRA v4

- scene/reference.jpg: unmodified original user artwork from photo_2026-11-04_05-51-27.zip, 1672 × 941.
- scene/living-background.png: image-generation edit of that reference, 1672 × 941. Removes loose static petals, baked login button and bright vertical sun reflection; cleans pixel-art details while retaining the composition. The native resolution has not increased.
- GoogleIcon.tsx: four-color SVG Google mark. Login text and arrow are real UI elements.
- LivingScene.tsx and ambient/: localized WebGL water, foliage, clouds and warm lighting; Canvas water fallback.
- ReferenceEffects.tsx: procedural animated petals and contact ripples.
- Manrope: SIL Open Font License; fonts/OFL.txt.

Earlier scene assets are retained in source backups under /workspace/scratch/sakyra/.
