/* Hallmark · genre: editorial · macrostructure: 02 Long Document · design-system: design.md · designed-as-app */
import { EditorialSection, EditorialHeading, Rule } from "@/components/ui/editorial";

export type LegalSection = {
  heading: string;
  /** Paragraphs and/or bullet lists, in order. */
  body: Array<string | { list: string[] }>;
};

export type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
  /** Contact block shown at the end — the data controller. */
  contact: { heading: string; lines: readonly string[] };
};

/**
 * Long Document content family: continuous prose at a comfortable measure,
 * hairline-ruled section heads, no boxes. One shared shell so the three legal
 * pages stay identical in rhythm.
 */
export function LegalDocument({
  eyebrow,
  title,
  updatedLabel,
  intro,
  sections,
  contact,
}: LegalDocumentProps) {
  return (
    <EditorialSection rhythm="base" className="bg-atelier-paper">
      <div className="mx-auto max-w-3xl">
        <EditorialHeading as="h1" scale="display-s" label={eyebrow}>
          {title}
        </EditorialHeading>
        <p className="fl-label mt-fl-sm">{updatedLabel}</p>
        <p className="fl-measure mt-fl-md text-fl-md text-atelier-ink-2">{intro}</p>

        <Rule className="mt-fl-lg" weight="strong" />

        <div className="mt-fl-lg flex flex-col gap-fl-xl">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="font-serif text-fl-xl text-atelier-ink">
                {index + 1}. {section.heading}
              </h2>
              <div className="fl-measure mt-fl-sm flex flex-col gap-fl-sm text-fl-sm text-atelier-ink-2">
                {section.body.map((block, blockIndex) =>
                  typeof block === "string" ? (
                    <p key={blockIndex}>{block}</p>
                  ) : (
                    <ul key={blockIndex} className="flex flex-col gap-fl-2xs">
                      {block.list.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="border-l border-atelier-rule pl-fl-sm"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <Rule className="mt-fl-xl" />
        <section className="mt-fl-md">
          <h2 className="fl-label">{contact.heading}</h2>
          <address className="mt-fl-2xs flex flex-col gap-0.5 text-fl-sm not-italic text-atelier-ink">
            {contact.lines.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </address>
        </section>
      </div>
    </EditorialSection>
  );
}

/** Shared controller/contact block — the same entity across all three pages. */
export const FLOF_CONTACT = {
  heading: "Đơn vị chịu trách nhiệm dữ liệu",
  lines: [
    "Maison de FLOF",
    "Số 15 Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội",
    "Hotline: 1800 1511 / 0900 000 001",
    "Email: contact@flof.vn",
  ],
} as const;
