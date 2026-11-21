export type LegalLink = {
  label: string;
  href: string;
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: LegalLink[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  version: string;
  intro: string;
  sections: LegalSection[];
  related: LegalLink[];
  showTableOfContents?: boolean;
};
