// The original logo-blob design is preserved in legacy-credibility-section.tsx.
// The retro GPS version remains in credibility-gps-section.tsx.
// The photoreal Earth version remains in credibility-orbit-section.tsx.
// This local switch does not change the shared Sanity document.
import SpaceSection from "./credibility-space-section";
import UniverseSection from "./credibility-universe-section";
import { CREDIBILITY_PRESENTATION } from "./credibility-presentation";

export default CREDIBILITY_PRESENTATION === "space" ? SpaceSection : UniverseSection;
