/**
 * Atelier Editorial primitives — the shared presentation vocabulary for every
 * public page. See design.md for the locked system these implement.
 *
 * Anything added here must be needed by at least two pages.
 */
export { Rule, type RuleProps } from "./Rule";
export { DrenchBand, type DrenchBandProps, type DrenchColor } from "./DrenchBand";
export {
  EditorialHeading,
  type EditorialHeadingProps,
  type HeadingScale,
} from "./EditorialHeading";
export { TypographicLink, type TypographicLinkProps } from "./TypographicLink";
export { CascadeText } from "./CascadeText";
export { SwatchChip, type SwatchChipProps } from "./SwatchChip";
export { SpecLedger, type SpecLedgerProps, type SpecRow } from "./SpecLedger";
export { EditorialSection, type EditorialSectionProps } from "./EditorialSection";
export { BandEdge, type BandEdgeProps } from "./BandEdge";
export { SwatchMarquee, type SwatchMarqueeProps } from "./SwatchMarquee";
