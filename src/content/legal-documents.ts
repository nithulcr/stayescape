import type { LegalDocument } from "@/content/legal-types";

export const legalDocuments: Record<string, LegalDocument> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Privacy",
    description:
      "How Stay Escape handles information across discovery, enquiries, reviews and subscriptions.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "This policy explains the information Stay Escape processes, why it is processed, who it is shared with and the choices available to you. It covers browsing, saved favourites, enquiries, direct owner contact, reviews and subscription payments.",
    sections: [
      {
        id: "privacy-01-introduction",
        title: "1. Introduction",
        paragraphs: [
          "Stay Escape is a property discovery and enquiry marketplace. We help visitors find resorts, villas, homestays and other stays, submit enquiries or quote requests, and contact property owners directly. We do not confirm availability, prices, bookings, or owner responses.",
          "This policy applies to visitors, registered users, property owners and administrators. It should be read alongside our terms, cookie policy and security notes."
        ],
        links: [
          { label: "Terms and Conditions", href: "/terms-and-conditions" },
          { label: "Cookie Policy", href: "/cookie-policy" },
          { label: "Security", href: "/security" }
        ]
      },
      {
        id: "privacy-02-who-we-are",
        title: "2. Who we are",
        paragraphs: [
          "For the purposes of applicable data protection law, Stay Escape acts as the controller for the information described in this policy. Where a property owner uses contact details from their own profile to speak with you directly, that owner may act as an independent controller for that conversation.",
          "We have not published a named data protection contact or corporate address in this initial version. Support and privacy requests can be sent through the contact page."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "privacy-03-scope",
        title: "3. Scope of this policy",
        paragraphs: [
          "This policy covers the Stay Escape website, account and dashboard areas, public property and destination pages, enquiry and review features, and subscription flows. It also covers essential cookies and browser-local storage used by those features.",
          "It does not cover the internal practices of WhatsApp, telecom providers, Razorpay, or any other third-party service you choose to use after leaving the platform. Those services apply their own terms and privacy notices."
        ]
      },
      {
        id: "privacy-04-information-we-collect",
        title: "4. Information we collect",
        paragraphs: [
          "We collect information that is needed to run the marketplace, keep it secure and support the features described in this policy. We do not intentionally collect special categories of personal data, and you should avoid submitting them in enquiries or reviews."
        ],
        bullets: [
          "Account details such as email address, authentication identifiers and role.",
          "Profile fields you choose to complete, such as a display name.",
          "Property, owner and listing details supplied by owners.",
          "Enquiry and quote request content you submit.",
          "Ratings, review text and review moderation information.",
          "Essential cookie and security session data.",
          "Subscription status, plan, amount and payment reference information from Razorpay."
        ]
      },
      {
        id: "privacy-05-account-and-profile",
        title: "5. Account and profile information",
        paragraphs: [
          "Accounts are provided through Supabase Auth. We process your email address, authentication identifiers, session metadata and assigned role, such as user, owner, admin or super_admin, to sign you in and control access to the right parts of the platform.",
          "We do not store passwords in plain text. Authentication credentials are handled by Supabase Auth. You are responsible for keeping account details current and for protecting access to your device and inbox."
        ]
      },
      {
        id: "privacy-06-property-and-owner-information",
        title: "6. Property and owner information",
        paragraphs: [
          "Owners provide property names, descriptions, locations, amenities, images, indicative pricing and contact details. This information is used to create public discovery pages and to connect visitors with the responsible owner.",
          "WhatsApp and phone details come from the associated owner profile and are made available through a property-scoped public owner view. That means the details shown are tied to the property you are viewing, rather than a general directory of owner contacts."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "privacy-07-enquiries-and-quote-requests",
        title: "7. Enquiries and quote requests",
        paragraphs: [
          "When you submit an enquiry or quote request, we process the property reference, the dates or travel details you provide, your message and the contact information you choose to include. This lets the request be presented to the relevant owner and administrators.",
          "Enquiry details are shared with the property owner and platform administrators. They are not private messages between you and Stay Escape, and we do not guarantee that an owner will respond, that a property is available, or that a quoted price will be accepted."
        ],
        links: [{ label: "User Terms", href: "/user-terms" }]
      },
      {
        id: "privacy-08-reviews-and-ratings",
        title: "8. Reviews and ratings",
        paragraphs: [
          "We process ratings, review text, moderation status and report information so that reviews can be checked before public display. Anonymous guest reviews may be associated with the `STAYESCAPE:guest_review` cookie to help identify repeat submissions and prevent abuse.",
          "Reviews can be reported for moderation. Owners must not manipulate ratings or arrange reviews in exchange for preferential treatment. We may anonymise or remove reviews where needed to protect platform integrity or comply with law."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "privacy-09-saved-properties-and-local-storage",
        title: "9. Saved properties and localStorage",
        paragraphs: [
          "Saved properties, also called favourites, are stored in your browser's localStorage on the device you are using. They are browser-local and are not synced to your account or available automatically on another device.",
          "Clearing site data or changing browsers may remove saved properties. Favourites are not stored in a cookie and are not used by us for analytics or advertising."
        ],
        links: [{ label: "Cookie Policy", href: "/cookie-policy" }]
      },
      {
        id: "privacy-10-cookies-and-similar-technologies",
        title: "10. Cookies and similar technologies",
        paragraphs: [
          "Stay Escape uses Supabase auth and session cookies to keep you signed in, essential and security cookies set through Supabase SSR, and the `STAYESCAPE:guest_review` cookie to identify anonymous reviews. These cookies support core functions and platform security.",
          "There are no analytics, advertising or marketing cookies currently in use. LocalStorage is used for favourites, as explained above. Full details are in our cookie policy."
        ],
        links: [{ label: "Cookie Policy", href: "/cookie-policy" }]
      },
      {
        id: "privacy-11-how-we-use-information",
        title: "11. How we use information",
        paragraphs: [
          "We use the information described in this policy to operate the marketplace and provide the features you request. We also use it to keep the service secure and to enforce our policies."
        ],
        bullets: [
          "Creating and securing accounts and dashboards.",
          "Displaying properties, destinations and owner contact options.",
          "Routing enquiries and quote requests to owners and administrators.",
          "Moderating reviews and handling reports.",
          "Administering Free and Premium subscriptions.",
          "Investigating misuse, fraud and policy breaches.",
          "Meeting legal, tax and audit obligations."
        ]
      },
      {
        id: "privacy-12-legal-bases-for-processing",
        title: "12. Legal bases for processing",
        paragraphs: [
          "Where applicable, we rely on the performance of a contract for account, enquiry, listing and subscription processing. We rely on legitimate interests for security, fraud prevention, review moderation and platform integrity, and on legal obligations for financial and audit records.",
          "Where consent is required for a particular use, you may withdraw it, although this will not affect processing that was lawful before withdrawal. Essential security and session processing does not depend on marketing consent because no marketing cookies are currently used."
        ]
      },
      {
        id: "privacy-13-how-we-share-information",
        title: "13. How we share information",
        paragraphs: [
          "We share information only as described in this policy: with property owners and administrators for enquiries, with infrastructure providers to run the platform, with Razorpay for subscription payments, and where required by law or for safety and integrity.",
          "We do not sell personal information. We do not share personal information with analytics, advertising or marketing providers because none are currently integrated."
        ]
      },
      {
        id: "privacy-14-sharing-with-owners-and-administrators",
        title: "14. Sharing with owners and administrators",
        paragraphs: [
          "Enquiry and quote request details are shared with the property owner and platform administrators so the enquiry can be handled and monitored. Please do not include sensitive information in an enquiry unless it is necessary and you are comfortable with the owner and administrators seeing it.",
          "Administrators may view enquiries, listings, reviews and audit records for support, moderation, security and compliance. Access is controlled through role-based permissions and server-side guards."
        ],
        links: [{ label: "Terms and Conditions", href: "/terms-and-conditions" }]
      },
      {
        id: "privacy-15-whatsapp-and-phone-communications",
        title: "15. WhatsApp and phone communications",
        paragraphs: [
          "WhatsApp and phone buttons open an external service using the number associated with the owner profile for the property through the property-scoped public owner view. Once opened, your communication is handled by WhatsApp or your telecom provider and takes place directly between you and the owner.",
          "We do not receive or store the content of your WhatsApp messages or phone calls unless you separately submit that content to us through a platform feature. Third-party service terms and privacy notices apply to those interactions."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "privacy-16-service-providers",
        title: "16. Service providers",
        paragraphs: [
          "Supabase provides authentication, database and image storage functions. Razorpay provides subscription checkout and payment verification. Hosting infrastructure is used to serve the website. These providers process information to deliver their services to the platform.",
          "No analytics, advertising or marketing tools are currently used. WhatsApp and telecom providers are third-party services you may choose to open from a property page; they are not acting as our service providers for the content of your direct conversations."
        ]
      },
      {
        id: "privacy-17-legal-safety-and-integrity-disclosures",
        title: "17. Legal, safety and integrity disclosures",
        paragraphs: [
          "We may disclose information where reasonably necessary to comply with applicable law, respond to valid legal process, enforce our terms, investigate suspected fraud or misuse, or protect the rights, safety and property of visitors, owners and the platform.",
          "Where practicable, we limit such disclosures to the information needed for the purpose and retain an internal record of the action taken."
        ]
      },
      {
        id: "privacy-18-subscription-payments-and-razorpay",
        title: "18. Subscription payments and Razorpay",
        paragraphs: [
          "Premium subscription payments are processed through Razorpay checkout. Razorpay handles payment instrument details; Stay Escape receives information such as plan, amount, payment status, order or payment references and timestamps. We use this to activate and administer subscriptions.",
          "There is no automatic renewal implemented. Renewal is a new manual checkout. Cancellation does not automatically create a refund; refund eligibility is considered at the platform's discretion and is subject to applicable law."
        ],
        links: [
          { label: "Subscription Policy", href: "/subscription-policy" },
          { label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }
        ]
      },
      {
        id: "privacy-19-data-retention",
        title: "19. Data retention",
        paragraphs: [
          "We retain information for as long as needed to provide the platform, support enquiries, administer listings and reviews, prevent misuse and meet legal obligations. Browser-local favourites remain on your device until you clear them.",
          "Financial and audit records are retained where required. Reviews may be anonymised rather than deleted, and listings or enquiries may be retained in a limited form where needed for platform integrity or legal compliance."
        ],
        links: [{ label: "Account Deletion", href: "/account-deletion" }]
      },
      {
        id: "privacy-20-security",
        title: "20. Security",
        paragraphs: [
          "We use Supabase Auth, server-side route and action guards, role-based access control for user, owner, admin and super_admin, row-level security, a property-scoped owner contact view, a server-only service-role key, Zod validation, rate limiting, image upload validation, admin audit logging, security headers and HMAC-verified Razorpay webhooks.",
          "We do not claim ISO, SOC, penetration-test or external audit certifications in this version. Details and responsible disclosure guidance are in our security notes."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "privacy-21-your-rights-and-choices",
        title: "21. Your rights and choices",
        paragraphs: [
          "Depending on applicable law, you may have rights to access, correct, delete or restrict processing of your information, to object to certain processing, to receive portable copies where available, and to complain to a regulator. You can also clear browser-local favourites at any time.",
          "To exercise a right, use the contact page. We may need to verify your identity and may retain records that we are legally required to keep."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "privacy-22-account-deletion",
        title: "22. Account deletion",
        paragraphs: [
          "You can request deletion from `/account-deletion`. Authenticated users must type the required confirmation phrase before the request is recorded. The flow anonymises the profile and deletion request record, and attempts hard deletion only where the service role is configured and legally retainable records allow it.",
          "Some records are retained where required, including financial and audit records. Reviews may be anonymised rather than deleted, and listings or enquiries may be retained in limited form where needed for platform integrity."
        ],
        links: [{ label: "Account Deletion", href: "/account-deletion" }]
      },
      {
        id: "privacy-23-childrens-privacy",
        title: "23. Children's privacy",
        paragraphs: [
          "Stay Escape is intended for people who can enter into a binding agreement under applicable law. We do not knowingly collect personal information from children through accounts, enquiries or reviews.",
          "If you believe a child has provided information through the platform, contact us so that we can review and take appropriate action."
        ]
      },
      {
        id: "privacy-24-third-party-links-and-services",
        title: "24. Third-party links and services",
        paragraphs: [
          "Property pages may offer links or buttons that open WhatsApp, a phone dialler, or other external destinations. These services are controlled by their operators, and their privacy notices apply once you leave or interact outside the platform.",
          "We are not responsible for third-party content or processing, but we aim to make it clear when an action will take you outside Stay Escape."
        ]
      },
      {
        id: "privacy-25-changes-to-this-policy",
        title: "25. Changes to this policy",
        paragraphs: [
          "We may update this policy as the platform changes. The last-updated date and version at the top of this document indicate the current version. Material changes will be posted on the site.",
          "Continued use of the platform after an update indicates acceptance to the extent permitted by applicable law."
        ]
      },
      {
        id: "privacy-26-contact-us",
        title: "26. Contact us",
        paragraphs: [
          "For questions about this policy or to exercise a privacy right, contact hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "You can also use our general contact page or the grievance process for formal complaints."
        ],
        links: [
          { label: "Contact", href: "/contact" },
          { label: "Grievance Redressal", href: "/grievance-redressal" }
        ]
      }
    ],
    related: [
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Security", href: "/security" },
      { label: "Account Deletion", href: "/account-deletion" }
    ],
    showTableOfContents: true
  },

  "terms-and-conditions": {
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    eyebrow: "Legal",
    description:
      "The baseline terms governing use of the Stay Escape discovery and enquiry marketplace.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "These terms apply to everyone who uses Stay Escape. Stay Escape helps people discover properties and make enquiries; it does not operate as a booking platform and does not confirm availability, prices, bookings or owner responses.",
    sections: [
      {
        id: "terms-01-acceptance-of-terms",
        title: "Acceptance of terms",
        paragraphs: [
          "By accessing or using Stay Escape, you agree to these terms and the related policies linked from this page. If you do not agree, you should not use the platform.",
          "If you use the platform on behalf of an organisation, you confirm that you have authority to bind that organisation to these terms."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "terms-02-eligibility",
        title: "Eligibility",
        paragraphs: [
          "You must be legally capable of entering into a binding agreement under applicable law to register an account, submit an enquiry, list a property or purchase a subscription.",
          "We may refuse or restrict access where we reasonably believe eligibility requirements are not met."
        ]
      },
      {
        id: "terms-03-accounts",
        title: "Accounts",
        paragraphs: [
          "Accounts are created and managed through Supabase Auth. You must provide accurate registration information and keep your profile current. Roles such as user, owner, admin and super_admin determine which areas of the platform you can access.",
          "You may not transfer or sell an account, or use another person's account without permission. Administrators may change roles and access where needed for security or operations."
        ]
      },
      {
        id: "terms-04-account-security",
        title: "Account security",
        paragraphs: [
          "You are responsible for safeguarding your login credentials and for activity that occurs under your account. Use a strong, unique password and notify us promptly if you suspect unauthorised access.",
          "We use server-side guards and role-based controls, but security also depends on your device and inbox practices."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "terms-05-user-responsibilities",
        title: "User responsibilities",
        paragraphs: [
          "Visitors and guests must use the platform lawfully, provide truthful enquiry and review information, respect property owners and other users, and avoid attempts to disrupt or misuse the service.",
          "You are responsible for the content you submit and for decisions you make after contacting an owner directly."
        ],
        links: [{ label: "User Terms", href: "/user-terms" }]
      },
      {
        id: "terms-06-owner-responsibilities",
        title: "Owner responsibilities",
        paragraphs: [
          "Owners must ensure they are authorised to list a property, keep listing details accurate, handle enquiries appropriately and comply with all laws that apply to their property and guest interactions.",
          "Owners are responsible for their own communications, agreements and services. Stay Escape does not manage bookings or act as an agent for owners."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "terms-07-listing-accuracy",
        title: "Listing accuracy",
        paragraphs: [
          "Owners are responsible for the accuracy of property descriptions, images, amenities, indicative pricing and contact details. Information should be reviewed regularly and updated when it changes.",
          "We do not independently verify every listing and do not guarantee that listing information is complete or current."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "terms-08-prohibited-content",
        title: "Prohibited content",
        paragraphs: [
          "You must not submit content that is unlawful, fraudulent, defamatory, discriminatory, harassing, obscene, threatening, infringing, or that discloses someone else's private information without permission.",
          "Malware, deceptive links, spam and content intended to mislead users or manipulate search results are also prohibited."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "terms-09-fraudulent-and-misleading-listings",
        title: "Fraudulent and misleading listings",
        paragraphs: [
          "Fake properties, stolen images, bait pricing, false amenities and misrepresented ownership are strictly prohibited. Owners must not create listings they do not have the right to offer.",
          "We may remove listings, suspend accounts, preserve evidence and take other appropriate action where we reasonably suspect fraud or misrepresentation."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "terms-10-reviews",
        title: "Reviews",
        paragraphs: [
          "Reviews and ratings must reflect genuine experiences and relate to the property or interaction being reviewed. Reviews are moderated before public display and can be reported for review.",
          "Owners must not manipulate ratings, post fake reviews or pressure guests to change honest feedback."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "terms-11-intellectual-property",
        title: "Intellectual property",
        paragraphs: [
          "You retain rights in content you lawfully submit, but grant Stay Escape a limited licence to host, display, moderate and remove that content as needed to operate the platform.",
          "You must not upload images, text or other material unless you have the right to use it for this purpose."
        ]
      },
      {
        id: "terms-12-platform-content",
        title: "Platform content",
        paragraphs: [
          "The platform's software, design, text, graphics, guides and branding are protected by intellectual property laws. You may view and use them for normal platform use only.",
          "You must not copy, scrape, reverse engineer or commercially reuse platform content without permission."
        ]
      },
      {
        id: "terms-13-direct-communication",
        title: "Direct communication",
        paragraphs: [
          "WhatsApp and phone buttons use contact information from the associated owner profile through a property-scoped public owner view. Communications opened through those buttons are direct between you and the owner.",
          "WhatsApp, telecom and similar third-party services handle those communications under their own terms. We do not control or store the content of external messages or calls."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "terms-14-enquiries-and-quotes",
        title: "Enquiries and quotes",
        paragraphs: [
          "An enquiry or quote request is a request for information. It is not a reservation, booking or confirmation of availability or price. Enquiry details are shared with the property owner and platform administrators.",
          "We do not guarantee responses, availability, pricing or the outcome of any discussion between a visitor and an owner."
        ]
      },
      {
        id: "terms-15-subscriptions",
        title: "Subscriptions",
        paragraphs: [
          "Owners may list properties on a Free or Premium plan. Plan limits, including property count, image count and expired-listing visibility, are set by admin-managed plans.",
          "Premium payments are processed through Razorpay checkout. There is no automatic renewal implemented; renewal is a separate manual checkout."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "terms-16-fees-and-commission",
        title: "Fees and commission",
        paragraphs: [
          "Platform fees or commission are not currently charged on owner bookings. Only subscription payments are processed by the platform.",
          "Third-party charges, such as payment network or telecom charges, may apply independently and are outside our control."
        ]
      },
      {
        id: "terms-17-payment-processing",
        title: "Payment processing",
        paragraphs: [
          "Razorpay checkout processes Premium subscription payments. Payment instrument details are handled by Razorpay; Stay Escape receives payment status and reference information needed to administer the subscription.",
          "A failed or pending payment does not guarantee plan activation. Payment records and webhook events are verified before subscription status is updated."
        ]
      },
      {
        id: "terms-18-cancellation",
        title: "Cancellation",
        paragraphs: [
          "Enquiries may be withdrawn by contacting the owner or support, but any direct booking or agreement is handled outside the platform. Subscription cancellation does not automatically reverse a completed payment.",
          "There is no automatic renewal, so allowing a plan to expire simply ends the paid subscription period."
        ],
        links: [{ label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }]
      },
      {
        id: "terms-19-refunds",
        title: "Refunds",
        paragraphs: [
          "Cancellation does not automatically create a refund. Refund eligibility is determined at the platform's discretion and is subject to applicable law and consumer rights.",
          "Approved refunds are handled through the original payment route where possible and are subject to provider and banking timelines."
        ]
      },
      {
        id: "terms-20-suspension-and-termination",
        title: "Suspension and termination",
        paragraphs: [
          "We may suspend or terminate access, remove content or disable listings where we reasonably believe there has been a breach of these terms, fraud, safety risk, legal violation or abuse of the platform.",
          "Where appropriate, we may give notice and an opportunity to explain, but immediate action may be taken where needed to protect users or the platform."
        ]
      },
      {
        id: "terms-21-disputes",
        title: "Disputes",
        paragraphs: [
          "If a dispute arises, please first contact support with the relevant details so that we can try to resolve it. Consumer forums or other remedies available under applicable law remain unaffected.",
          "Disputes between visitors and owners about direct communications or agreements are primarily between those parties, subject to applicable law."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "terms-22-limitation-of-liability",
        title: "Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, Stay Escape is not liable for indirect or consequential losses, lost profits, loss of data, or outcomes arising from direct owner communications, owner services or third-party services.",
          "Nothing in these terms excludes liability that cannot lawfully be excluded."
        ]
      },
      {
        id: "terms-23-indemnification",
        title: "Indemnification",
        paragraphs: [
          "To the extent permitted by law, you agree to indemnify Stay Escape against claims arising from your unlawful content, breach of these terms, infringement of third-party rights, or conduct in connection with listings, enquiries or direct communications.",
          "This obligation does not apply where a claim arises from our own unlawful conduct or where indemnification is not permitted."
        ]
      },
      {
        id: "terms-24-availability",
        title: "Availability",
        paragraphs: [
          "We aim to keep the platform available but do not guarantee uninterrupted access. Maintenance, third-party outages, network issues or security incidents may affect availability.",
          "Where possible, we will provide notice of planned maintenance."
        ]
      },
      {
        id: "terms-25-changes-to-terms",
        title: "Changes to terms",
        paragraphs: [
          "We may update these terms to reflect platform changes or legal requirements. The last-updated date and version at the top of this document indicate the current version.",
          "Continued use after an update indicates acceptance to the extent permitted by law."
        ]
      },
      {
        id: "terms-26-governing-law-and-jurisdiction",
        title: "Governing law and jurisdiction",
        paragraphs: [
          "These terms are governed by the laws of India. Subject to any mandatory consumer forum or consumer court jurisdiction available to you, the courts of competent jurisdiction in India will have jurisdiction over disputes arising from these terms.",
          "This clause does not remove rights you cannot waive under applicable law."
        ]
      },
      {
        id: "terms-27-contact",
        title: "Contact",
        paragraphs: [
          "Questions about these terms can be sent to hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "Formal complaints can be raised through the grievance process."
        ],
        links: [
          { label: "Contact", href: "/contact" },
          { label: "Grievance Redressal", href: "/grievance-redressal" }
        ]
      }
    ],
    related: [
      { label: "User Terms", href: "/user-terms" },
      { label: "Owner Terms", href: "/owner-terms" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Acceptable Use Policy", href: "/acceptable-use-policy" }
    ],
    showTableOfContents: true
  },

  "user-terms": {
    slug: "user-terms",
    title: "User Terms",
    eyebrow: "For guests",
    description:
      "Rules for visitors and guests who browse properties, send enquiries and submit reviews.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "These terms explain what is expected when you use Stay Escape as a visitor or guest. The platform helps you discover properties and contact owners; it does not confirm availability, prices, bookings or owner responses.",
    sections: [
      {
        id: "user-01-account-creation",
        title: "Account creation",
        paragraphs: [
          "If you choose to register, provide accurate information and keep it current. Accounts are used for features such as dashboards, review submission and owner interactions where required.",
          "You are responsible for credentials and activity under your account. Do not share accounts or register using someone else's details."
        ]
      },
      {
        id: "user-02-browsing-and-discovery",
        title: "Browsing and discovery",
        paragraphs: [
          "You may browse public properties and destinations for legitimate discovery purposes. Listing content is supplied by owners and may change or contain inaccuracies.",
          "Use the information as a starting point and verify important details directly with the owner before making any commitment."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "user-03-saved-properties",
        title: "Saved properties",
        paragraphs: [
          "Favourites are saved in your browser's localStorage on the device you are using. They are not synced account data and will not automatically appear on another device.",
          "You can remove saved properties in the browser interface or clear site data. We are not responsible for favourites lost through device or browser changes."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "user-04-enquiries",
        title: "Enquiries",
        paragraphs: [
          "Enquiry forms let you ask an owner about a property. Provide accurate travel details and contact information, and keep messages relevant to the enquiry.",
          "Enquiry details are shared with the property owner and platform administrators. Submitting an enquiry does not create a booking or guarantee a response."
        ]
      },
      {
        id: "user-05-quote-requests",
        title: "Quote requests",
        paragraphs: [
          "Quote requests are requests for information or pricing from an owner. Any price mentioned by an owner is their own offer and may change.",
          "Stay Escape does not confirm quotes, hold inventory or act as a party to your final arrangement with an owner."
        ]
      },
      {
        id: "user-06-whatsapp-contact",
        title: "WhatsApp contact",
        paragraphs: [
          "WhatsApp buttons use the contact details associated with the owner profile for the property through a property-scoped public owner view. Opening WhatsApp takes you to a third-party service.",
          "Messages sent through WhatsApp are handled by WhatsApp and the owner. We do not receive or store their content through the platform."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "user-07-direct-calls",
        title: "Direct calls",
        paragraphs: [
          "Phone buttons initiate a call using the owner's contact details shown for that property. Calls are handled by your telecom provider and take place directly between you and the owner.",
          "We do not record or monitor those calls. Charges or network conditions are the responsibility of your provider."
        ]
      },
      {
        id: "user-08-reviews-and-ratings",
        title: "Reviews and ratings",
        paragraphs: [
          "You may submit ratings and reviews where the feature is available. Reviews are moderated before public display and may be reported by others.",
          "Feedback should be accurate, specific and related to the property or interaction being described."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "user-09-review-authenticity",
        title: "Review authenticity",
        paragraphs: [
          "Do not post fake reviews, impersonate another guest, or coordinate reviews to create a misleading impression. Anonymous guest reviews may be identified using the `STAYESCAPE:guest_review` cookie.",
          "We may remove, anonymise or reject reviews that breach the review policy."
        ]
      },
      {
        id: "user-10-prohibited-behaviour",
        title: "Prohibited behaviour",
        paragraphs: [
          "Do not use the platform to harass, threaten, discriminate against or deceive others, submit unlawful content, interfere with security controls, or attempt to gain unauthorised access to accounts or dashboards.",
          "Automated access, scraping and bulk requests are not permitted without written approval."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "user-11-spam-and-fake-enquiries",
        title: "Spam and fake enquiries",
        paragraphs: [
          "Do not send bulk, repetitive or automated enquiries, promotional messages, or requests that you know are false. Fake enquiries waste owner time and undermine trust in the marketplace.",
          "We may block submissions, rate-limit activity, remove records or suspend accounts where abuse is detected."
        ]
      },
      {
        id: "user-12-harassment-and-fraud",
        title: "Harassment and fraud",
        paragraphs: [
          "Harassment, threats, payment scams, impersonation and attempts to obtain money or personal information through misinformation are prohibited.",
          "Report suspected fraud or harassment through the contact or grievance channels with relevant details."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "user-13-suspension",
        title: "Suspension",
        paragraphs: [
          "We may suspend or restrict an account or submission ability where we reasonably believe these terms have been breached or where action is needed to protect users, owners or the platform.",
          "Where appropriate, we may provide notice and a route to explain, subject to safety and legal considerations."
        ]
      },
      {
        id: "user-14-user-generated-content",
        title: "User-generated content",
        paragraphs: [
          "You retain rights in content you submit, but grant Stay Escape a limited licence to host, display, moderate and remove it for platform operation. Ensure you have rights to any images or text you upload.",
          "Do not submit content that infringes intellectual property rights or contains another person's private information without permission."
        ]
      },
      {
        id: "user-15-privacy",
        title: "Privacy",
        paragraphs: [
          "Information about how enquiries, favourites, cookies, reviews and direct owner contact are handled is set out in the privacy and cookie policies.",
          "Enquiry details are shared with owners and administrators, and favourites remain stored locally on your device."
        ],
        links: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Cookie Policy", href: "/cookie-policy" }
        ]
      },
      {
        id: "user-16-liability",
        title: "Liability",
        paragraphs: [
          "Stay Escape is not responsible for owner services, direct communications, availability, prices or agreements made outside the platform. Our liability is limited to the extent permitted by law.",
          "Nothing in these terms excludes liability that cannot lawfully be excluded."
        ]
      },
      {
        id: "user-17-disputes",
        title: "Disputes",
        paragraphs: [
          "If you have a concern about platform content, moderation or conduct, contact support or use the grievance process. Disputes about a direct arrangement with an owner are primarily between you and that owner, subject to applicable law.",
          "Consumer rights and remedies remain available where applicable."
        ],
        links: [{ label: "Terms and Conditions", href: "/terms-and-conditions" }]
      }
    ],
    related: [
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Cookie Policy", href: "/cookie-policy" }
    ],
    showTableOfContents: true
  },

  "owner-terms": {
    slug: "owner-terms",
    title: "Owner Terms",
    eyebrow: "For property owners",
    description:
      "Terms for owners who list properties, handle enquiries and manage subscriptions.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "These terms govern property owner use of Stay Escape. Stay Escape is a discovery and enquiry platform only. It does not confirm availability, prices, bookings or owner responses, and it does not manage guest agreements.",
    sections: [
      {
        id: "owner-01-platform-role",
        title: "Platform role",
        paragraphs: [
          "Stay Escape helps visitors discover properties and send enquiries. It is not a booking platform. We do not take reservations, confirm availability, set final prices, guarantee owner responses or act as an agent for owners.",
          "All decisions about whether to offer a stay, accept an enquiry or enter into an agreement rest with the owner, subject to applicable law."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "owner-02-owner-registration",
        title: "Owner registration",
        paragraphs: [
          "To list a property, register an owner account and provide accurate information. Role changes to owner are controlled through platform administration and access is protected by authentication and server-side guards.",
          "You must keep account and profile details current so that enquiries and contact features work correctly."
        ]
      },
      {
        id: "owner-03-ownership-and-authorisation",
        title: "Ownership and authorisation",
        paragraphs: [
          "You confirm that you own the property or have clear authorisation to list it and respond to enquiries. You must be able to provide evidence of that authority if requested.",
          "Do not list properties you do not control or have permission to represent."
        ]
      },
      {
        id: "owner-04-listing-and-pricing-accuracy",
        title: "Listing and pricing accuracy",
        paragraphs: [
          "Provide truthful property descriptions, amenity details, images and indicative pricing. Prices shown should be explained clearly, including what is and is not included where relevant.",
          "Update listings when details change. Misleading or stale information damages trust and may lead to enforcement action."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "owner-05-images-and-copyright",
        title: "Images and copyright",
        paragraphs: [
          "Upload only images you own or have permission to use. Images must show the property being listed and must not be borrowed from unrelated listings or stock sources without appropriate rights.",
          "We may reject or remove images that appear misleading, low quality or infringing."
        ]
      },
      {
        id: "owner-06-amenities-and-facilities",
        title: "Amenities and facilities",
        paragraphs: [
          "List amenities accurately and do not suggest facilities that are unavailable, shared in a misleading way, or subject to undisclosed restrictions.",
          "Where an amenity has conditions, such as timing, extra charges or shared access, state those conditions clearly."
        ]
      },
      {
        id: "owner-07-availability",
        title: "Availability",
        paragraphs: [
          "Do not present a property as available when you know it is not. Availability information supplied in a listing should be kept up to date as far as reasonably practicable.",
          "Even where availability information is shown, Stay Escape does not confirm it. Visitors should verify availability directly with the owner."
        ]
      },
      {
        id: "owner-08-owner-contact-information",
        title: "Owner contact information",
        paragraphs: [
          "Phone and WhatsApp details come from your associated owner profile and are shown through a property-scoped public owner view. Ensure the details you provide are correct, appropriate for public display and belong to someone authorised to handle enquiries.",
          "Visitors interact directly with you, and third-party services handle the resulting messages or calls."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "owner-09-enquiry-handling",
        title: "Enquiry handling",
        paragraphs: [
          "Enquiry and quote request details are shared with you and platform administrators. Handle them promptly, courteously and honestly, and do not use them for unrelated marketing without a lawful basis.",
          "Do not submit fake enquiries to inflate interest or manipulate platform signals."
        ]
      },
      {
        id: "owner-10-direct-bookings",
        title: "Direct bookings",
        paragraphs: [
          "Any booking or stay arrangement you make with a visitor happens directly between you and that visitor. Stay Escape does not process, confirm or manage those bookings.",
          "You are responsible for your own terms, payment handling, check-in arrangements, safety and service delivery."
        ]
      },
      {
        id: "owner-11-booking-responsibility",
        title: "Booking responsibility",
        paragraphs: [
          "You remain responsible for the accuracy of what you offer and for honouring lawful commitments you make directly to visitors. We do not guarantee that an enquiry will lead to a booking or that either party will perform as expected.",
          "Disagreements about direct arrangements are primarily between the owner and visitor, subject to applicable law."
        ]
      },
      {
        id: "owner-12-subscriptions",
        title: "Subscriptions",
        paragraphs: [
          "Owners can list properties on Free or Premium plans. Subscriptions help control access to plan features and are administered through the dashboard and admin-managed plan configuration.",
          "Premium payments are processed through Razorpay checkout."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "owner-13-free-versus-premium",
        title: "Free versus Premium",
        paragraphs: [
          "Free plans provide a basic way to list and manage properties. Premium plans may offer additional visibility or feature benefits depending on the current plan configuration.",
          "The exact limits and benefits are set by administrators and may change from time to time."
        ]
      },
      {
        id: "owner-14-plan-benefits-and-limits",
        title: "Plan benefits and limits",
        paragraphs: [
          "Limits such as property count, image count and expired-listing visibility are set by admin-managed plans. These limits are not negotiated through individual listings.",
          "Where a listing expires or exceeds a plan limit, visibility may be reduced or the listing may require renewal or removal."
        ]
      },
      {
        id: "owner-15-renewal",
        title: "Renewal",
        paragraphs: [
          "There is no automatic renewal implemented. When a Premium plan expires, continued Premium use requires a new manual checkout.",
          "Allowing a plan to lapse will not generate a fresh charge automatically."
        ]
      },
      {
        id: "owner-16-cancellation-and-refunds",
        title: "Cancellation and refunds",
        paragraphs: [
          "Cancelling a subscription does not automatically create a refund. Refund eligibility is decided at the platform's discretion and is subject to applicable law and consumer rights.",
          "Approved refunds are handled through the original payment route where possible."
        ],
        links: [{ label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }]
      },
      {
        id: "owner-17-suspension",
        title: "Suspension",
        paragraphs: [
          "Listings or owner accounts may be suspended where we reasonably suspect misleading content, fraud, abuse, legal violations or safety risks. We may also suspend access while a complaint is reviewed.",
          "Where possible, we will explain the reason and provide a route to respond, subject to safety and legal considerations."
        ]
      },
      {
        id: "owner-18-misleading-listings",
        title: "Misleading listings",
        paragraphs: [
          "Fake properties, borrowed images, false amenities, bait pricing and inaccurate location claims are prohibited. Owners must not create multiple listings to mislead visitors or manipulate discovery results.",
          "We may remove content, suspend access and retain records where misleading listings are identified."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "owner-19-reviews-and-reputation",
        title: "Reviews and reputation",
        paragraphs: [
          "Reviews are moderated before public display and can be reported. Owners must not manipulate ratings, write fake reviews, or pressure guests to change honest feedback.",
          "You may respond constructively to reviews where the feature is available, but must not harass reviewers or disclose their private information."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "owner-20-fees-and-commission",
        title: "Fees and commission",
        paragraphs: [
          "Platform fees or commission are not currently charged on owner bookings. Only subscription payments are processed by the platform.",
          "Third-party charges from payment, telecom or other providers are outside our control."
        ]
      },
      {
        id: "owner-21-liability",
        title: "Liability",
        paragraphs: [
          "Owners are responsible for their listings, communications, services and direct arrangements with visitors. Stay Escape is not liable for owner conduct or visitor-owner agreements, except where liability cannot lawfully be excluded.",
          "To the extent permitted by law, our liability is limited for indirect or consequential losses."
        ]
      },
      {
        id: "owner-22-termination",
        title: "Termination",
        paragraphs: [
          "We may terminate owner access for serious or repeated breaches, fraud, unlawful conduct or risks to users or the platform. Listing, enquiry and audit records may be retained where needed for integrity or legal compliance.",
          "You may stop using the platform at any time; cancellation or non-renewal of a paid plan does not itself create a refund."
        ]
      },
      {
        id: "owner-23-disputes",
        title: "Disputes",
        paragraphs: [
          "Platform-related disputes should first be raised through support or the grievance process with relevant details. Disputes with visitors about a direct arrangement are primarily between the owner and visitor, subject to applicable law.",
          "Consumer and other statutory remedies remain available where applicable."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      }
    ],
    related: [
      { label: "Listing Policy", href: "/listing-policy" },
      { label: "Subscription Policy", href: "/subscription-policy" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" }
    ],
    showTableOfContents: true
  },

  "cookie-policy": {
    slug: "cookie-policy",
    title: "Cookie Policy",
    eyebrow: "Cookies",
    description:
      "A plain-language account of the cookies and browser storage used by Stay Escape.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Stay Escape uses a small number of cookies for sign-in, security and review integrity. Favourites are stored locally on your device rather than in cookies. No analytics, advertising or marketing cookies are currently used.",
    sections: [
      {
        id: "cookie-01-what-cookies-are",
        title: "What cookies are",
        paragraphs: [
          "Cookies are small text files placed on a device by a website. They can support core functions such as keeping a user signed in, remembering security state, or identifying a submission for integrity checks.",
          "Browser localStorage is different: it stores data in the browser on the device and is not sent with every page request."
        ]
      },
      {
        id: "cookie-02-cookies-we-use",
        title: "Cookies we use",
        paragraphs: [
          "The cookies currently used are Supabase auth and session cookies, essential and security cookies set through Supabase SSR, and the guest review cookie named `STAYESCAPE:guest_review`.",
          "We do not currently set analytics, advertising or marketing cookies."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "cookie-03-essential-and-security-cookies",
        title: "Essential and security cookies",
        paragraphs: [
          "Supabase SSR sets cookies that support essential site security and request handling. These help maintain safe interactions between your browser and the platform, including protection against common web vulnerabilities.",
          "Because these cookies support core security and session functions, they are necessary for the platform to operate as intended."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "cookie-04-auth-and-session-cookies",
        title: "Auth and session cookies",
        paragraphs: [
          "Supabase authentication uses cookies to keep you signed in and to identify your session across protected pages and actions. These cookies allow the platform to apply the correct role-based access for users, owners, admins and super admins.",
          "If you sign out or your session expires, these cookies no longer provide access to protected areas."
        ]
      },
      {
        id: "cookie-05-guest-review-cookie",
        title: "Guest review cookie",
        paragraphs: [
          "The cookie `STAYESCAPE:guest_review` is used to identify anonymous reviews submitted without an account. It helps reduce duplicate or abusive submissions and supports review moderation.",
          "This cookie is not used for marketing and does not track browsing across other websites."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "cookie-06-analytics-not-used",
        title: "Analytics",
        paragraphs: [
          "Stay Escape does not currently use analytics cookies or analytics tools. We do not measure visitors through advertising pixels or behavioural analytics providers.",
          "If this changes, this policy and the cookie information shown on the site will be updated before new cookies are introduced."
        ]
      },
      {
        id: "cookie-07-preferences-and-local-storage",
        title: "Preferences and localStorage",
        paragraphs: [
          "No preference cookies are currently used. Saved properties are stored in browser localStorage on your device, which means they are local to that browser and are not synced to your account.",
          "Clearing site data, changing browsers or using a different device may remove or hide saved favourites."
        ]
      },
      {
        id: "cookie-08-third-party-cookies",
        title: "Third-party cookies",
        paragraphs: [
          "There are no third-party analytics, advertising or marketing cookies currently in use on Stay Escape. WhatsApp may be opened externally from a property page, and that service may set its own cookies under its own privacy notice.",
          "Razorpay checkout is used for subscription payments; payment-related processing occurs through that service's own flow."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "cookie-09-cookie-management",
        title: "Cookie management",
        paragraphs: [
          "Because the cookies in use are limited to session, security and review-integrity purposes, there is no separate marketing cookie preference centre at present.",
          "You can still control cookies through browser settings, but blocking essential cookies may prevent sign-in or protected actions from working."
        ]
      },
      {
        id: "cookie-10-browser-controls",
        title: "Browser controls",
        paragraphs: [
          "Most browsers let you view, block or delete cookies and clear localStorage. The exact steps depend on the browser and device you use.",
          "Deleting cookies will sign you out and may remove the guest review identifier, which can affect anonymous review features."
        ]
      },
      {
        id: "cookie-11-changes-and-contact",
        title: "Changes and contact",
        paragraphs: [
          "We may update this cookie policy when the platform changes. The last-updated date and version at the top of this document indicate the current version.",
          "Questions can be sent to hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      }
    ],
    related: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Security", href: "/security" }
    ],
    showTableOfContents: true
  },

  disclaimer: {
    slug: "disclaimer",
    title: "Disclaimer",
    eyebrow: "Important information",
    description:
      "What Stay Escape does and does not guarantee about listings, enquiries and direct owner contact.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Stay Escape is a property discovery and enquiry marketplace. It is not a booking platform, and it does not verify or guarantee every detail supplied by property owners.",
    sections: [
      {
        id: "disclaimer-01-discovery-and-enquiry-only",
        title: "Discovery and enquiry only",
        paragraphs: [
          "The platform helps visitors find properties and destinations and send enquiries or quote requests to owners. It does not accept reservations, issue confirmations or manage stays.",
          "We do not confirm availability, prices, bookings or owner responses."
        ],
        links: [{ label: "Terms and Conditions", href: "/terms-and-conditions" }]
      },
      {
        id: "disclaimer-02-owner-supplied-information",
        title: "Owner-supplied information",
        paragraphs: [
          "Property descriptions, images, amenities, locations, contact details and indicative pricing are supplied by owners. Stay Escape publishes and organises this information but does not independently guarantee it.",
          "Owners are responsible for keeping their listings accurate and lawful."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "disclaimer-03-no-independent-guarantee",
        title: "No independent guarantee",
        paragraphs: [
          "We do not inspect every property or verify every claim made in a listing. Listing quality, safety, legality and suitability are matters for the owner and the visitor to assess.",
          "Nothing on the platform should be treated as a warranty by Stay Escape about a particular property."
        ]
      },
      {
        id: "disclaimer-04-verify-before-booking",
        title: "Verify before booking",
        paragraphs: [
          "Before paying, travelling or making any commitment, verify the property, total price, inclusions, cancellation terms, check-in arrangements and any required permissions directly with the owner.",
          "Ask questions through an enquiry or the contact details shown for that property."
        ]
      },
      {
        id: "disclaimer-05-availability-and-pricing",
        title: "Availability and pricing",
        paragraphs: [
          "Availability and prices shown on listings can change. A price indication on the platform is not a held quote and may be superseded by information provided directly by the owner.",
          "Stay Escape does not hold inventory or guarantee that a property can be booked on any given date."
        ]
      },
      {
        id: "disclaimer-06-contacting-owner-is-not-booking",
        title: "Contacting an owner is not a booking",
        paragraphs: [
          "Using a WhatsApp or phone button, or submitting an enquiry, does not create a reservation or contract with Stay Escape or with the owner.",
          "Any booking arises only from a separate agreement you make directly with the owner."
        ]
      },
      {
        id: "disclaimer-07-direct-communication",
        title: "Direct communication",
        paragraphs: [
          "WhatsApp and phone details come from the associated owner profile through a property-scoped public owner view. Those interactions happen directly between you and the owner.",
          "Third-party services such as WhatsApp and telecom providers handle those messages and calls under their own terms."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "disclaimer-08-owner-visitor-agreements",
        title: "Owner-visitor agreements",
        paragraphs: [
          "We are not a party to agreements made between owners and visitors and are not responsible for their performance, subject to applicable law. Payment, refunds, cancellations and service standards in those agreements are handled by the parties involved.",
          "Statutory rights and remedies that cannot be excluded remain available."
        ]
      },
      {
        id: "disclaimer-09-individual-reviews",
        title: "Individual reviews",
        paragraphs: [
          "Reviews reflect individual experiences and opinions. They are moderated before display and can be reported, but they are not guarantees of future service or quality.",
          "Owners must not manipulate ratings or submit misleading reviews."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "disclaimer-10-inaccuracies-and-unavailability",
        title: "Inaccuracies and unavailability",
        paragraphs: [
          "Listings and platform content may occasionally contain inaccuracies or become unavailable without notice. Maintenance, third-party outages or security incidents may also affect access.",
          "If you spot an issue, report it through the contact or grievance channels so that it can be reviewed."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "disclaimer-11-consumer-rights-preserved",
        title: "Consumer rights preserved",
        paragraphs: [
          "Nothing in this disclaimer limits rights you have under applicable consumer law or other mandatory legal protections.",
          "Where a term or disclaimer conflicts with a non-waivable right, the right prevails to the extent of the conflict."
        ]
      },
      {
        id: "disclaimer-12-contact",
        title: "Contact",
        paragraphs: [
          "For questions about this disclaimer, contact hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "Formal complaints can be raised through the grievance process."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      }
    ],
    related: [
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Listing Policy", href: "/listing-policy" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Grievance Redressal", href: "/grievance-redressal" }
    ],
    showTableOfContents: true
  },

  "grievance-redressal": {
    slug: "grievance-redressal",
    title: "Grievance Redressal",
    eyebrow: "Complaints",
    description:
      "How to raise a complaint about privacy, listings, fraud, reviews, subscriptions or payments.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "If something on Stay Escape concerns you, you can raise a complaint through the support contact below. This process is intended to help us review issues fairly and keep a clear record of the outcome.",
    sections: [
      {
        id: "grievance-01-purpose",
        title: "Purpose",
        paragraphs: [
          "This process covers complaints about platform content, privacy handling, listings, reviews, subscriptions, payments, security concerns and user conduct. It does not replace statutory complaint routes or consumer forums.",
          "We aim to handle complaints consistently and to preserve records needed for accountability."
        ]
      },
      {
        id: "grievance-02-how-to-submit",
        title: "How to submit",
        paragraphs: [
          "Send your complaint in writing to the support email below or through the contact page. Include enough detail for us to identify the issue, the property or page involved, and the outcome you are seeking.",
          "If you already have a case reference, include it in the subject line so that related messages can be grouped together."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "grievance-03-support-contact",
        title: "Support contact",
        paragraphs: [
          "The support address currently shown is hello@STAYESCAPE.example. This is a placeholder and must be replaced with the official support email before launch.",
          "No named grievance officer is published in this initial version; complaints are routed through the support team."
        ]
      },
      {
        id: "grievance-04-complaint-categories",
        title: "Complaint categories",
        paragraphs: [
          "To help route your complaint, identify whether it concerns privacy or personal information, property listing accuracy, suspected fraud or misrepresentation, reviews or ratings, subscriptions or payments, security, or general platform conduct.",
          "If you are unsure, describe the issue plainly and we will route it internally."
        ]
      },
      {
        id: "grievance-05-information-to-include",
        title: "Information to include",
        paragraphs: [
          "Include your name or display name, account email if applicable, the relevant property or destination, dates, screenshot or message references where available, and a concise description of what happened.",
          "Do not include passwords, full payment instrument details or unrelated sensitive information."
        ]
      },
      {
        id: "grievance-06-acknowledgement-target",
        title: "Acknowledgement target",
        paragraphs: [
          "We aim to acknowledge complaints within 3 working days. This is a service target, not a guarantee, and complex or high-volume periods may take longer.",
          "Acknowledgement will usually include a case reference and the category the complaint has been assigned to."
        ]
      },
      {
        id: "grievance-07-resolution-target",
        title: "Resolution target",
        paragraphs: [
          "We aim to provide a substantive response or resolution update within 10 working days of acknowledgement. This is also a target, not a guarantee, and may be extended where investigation is needed or law requires a different timeline.",
          "If more time is needed, we will explain the reason and provide the next update point where practicable."
        ]
      },
      {
        id: "grievance-08-escalation",
        title: "Escalation",
        paragraphs: [
          "If you are unhappy with a response, reply with your case reference and explain what remains unresolved. We will review the matter again with any new information you provide.",
          "You may also use any regulator, consumer forum or legal remedy available under applicable law."
        ]
      },
      {
        id: "grievance-09-privacy-complaints",
        title: "Privacy complaints",
        paragraphs: [
          "Privacy complaints may include access or correction requests, concerns about enquiry information being shared, questions about cookies or localStorage, and account deletion issues.",
          "We may need to verify identity before acting on a privacy request."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "grievance-10-listing-and-fraud-complaints",
        title: "Listing and fraud complaints",
        paragraphs: [
          "Report fake properties, borrowed images, misleading amenities, inaccurate location claims, bait pricing or suspected impersonation with links and supporting details.",
          "We may temporarily hide a listing while a complaint is reviewed where we consider it necessary to protect users."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "grievance-11-review-complaints",
        title: "Review complaints",
        paragraphs: [
          "Reviews can be reported where they appear fake, abusive, irrelevant, defamatory or manipulated. Include the review text, property link and reason for the report.",
          "Reviews are moderated before public display, and owners must not manipulate ratings."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "grievance-12-subscription-and-payment-complaints",
        title: "Subscription and payment complaints",
        paragraphs: [
          "For billing questions, include the plan, payment reference, approximate date and the issue you experienced. We will review the payment status and subscription records.",
          "Razorpay processes checkout payments, and some payment issues may need to be raised with your payment provider as well."
        ],
        links: [{ label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }]
      },
      {
        id: "grievance-13-records-and-privacy",
        title: "Records and privacy",
        paragraphs: [
          "We keep complaint records to manage the process, prevent repetition of known issues and meet legal or audit requirements. Information is handled in line with the privacy policy.",
          "Where a complaint concerns a person's personal information, we limit access to those who need it to review and resolve the matter."
        ]
      },
      {
        id: "grievance-14-related-documents",
        title: "Related documents",
        paragraphs: [
          "The linked policies provide more detail on the standards that apply to listings, reviews, subscriptions, security and acceptable use.",
          "Reading them before submitting a complaint may help you include the right information."
        ],
        links: [
          { label: "Terms and Conditions", href: "/terms-and-conditions" },
          { label: "Security", href: "/security" },
          { label: "Acceptable Use Policy", href: "/acceptable-use-policy" }
        ]
      }
    ],
    related: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }
    ],
    showTableOfContents: true
  },

  contact: {
    slug: "contact",
    title: "Contact",
    eyebrow: "Get in touch",
    description:
      "How to reach Stay Escape support and what information to include.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Use this page for support requests, policy questions, complaint intake and general enquiries about Stay Escape.",
    sections: [
      {
        id: "contact-01-support-email",
        title: "Support email",
        paragraphs: [
          "Email hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch."
        ]
      },
      {
        id: "contact-02-what-to-include",
        title: "What to include",
        paragraphs: [
          "Include a clear subject, the relevant property or page link, your account email if applicable, and a concise description of the issue. For payment queries, include the payment reference but never send full card details.",
          "For privacy requests, state which right you wish to exercise. For suspected fraud, include links and supporting details rather than sensitive personal information."
        ]
      },
      {
        id: "contact-03-response-target",
        title: "Response target",
        paragraphs: [
          "We aim to respond within 3 working days. This is a target, not a guarantee, and complex issues may take longer.",
          "Formal complaints can also be tracked through the grievance process."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "contact-04-related-links",
        title: "Related links",
        paragraphs: [
          "The policies below cover the most common topics people contact us about."
        ],
        links: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms and Conditions", href: "/terms-and-conditions" },
          { label: "Security", href: "/security" }
        ]
      }
    ],
    related: [
      { label: "Grievance Redressal", href: "/grievance-redressal" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Security", href: "/security" }
    ],
    showTableOfContents: false
  },

  "listing-policy": {
    slug: "listing-policy",
    title: "Listing Policy",
    eyebrow: "Standards",
    description:
      "Standards for accurate, lawful and trustworthy property listings on Stay Escape.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Listings are the core of the discovery experience. This policy sets the standards owners must meet so that visitors can make informed enquiries and contact the right owner.",
    sections: [
      {
        id: "listing-01-scope",
        title: "Scope",
        paragraphs: [
          "This policy applies to all property listings, images, descriptions, amenities, pricing information and contact details submitted by owners or administrators on Stay Escape.",
          "Listings are for discovery and enquiries only and do not create bookings or availability guarantees."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "listing-02-accuracy-and-honesty",
        title: "Accuracy and honesty",
        paragraphs: [
          "Listings must be accurate, current and honestly presented. Owners must not exaggerate facilities, omit material restrictions or use wording likely to mislead a reasonable visitor.",
          "If details change, the listing should be updated promptly."
        ]
      },
      {
        id: "listing-03-ownership-and-authorisation",
        title: "Ownership and authorisation",
        paragraphs: [
          "Only the owner or a person with clear authorisation may list a property. Owners should be able to provide evidence of that authority if requested.",
          "Do not list a property you do not control or have permission to represent."
        ]
      },
      {
        id: "listing-04-property-basics",
        title: "Property basics",
        paragraphs: [
          "Include the property type, location, capacity, bedrooms or key spaces, and a clear description of what guests can expect. Location information should be specific enough to be useful without exposing private addresses beyond what is appropriate.",
          "Avoid vague or generic copy that does not help visitors decide whether to enquire."
        ]
      },
      {
        id: "listing-05-pricing-and-fees",
        title: "Pricing and fees",
        paragraphs: [
          "Indicative pricing must be explained clearly. State whether taxes, cleaning charges, deposits or other fees may apply, and avoid bait pricing designed to attract enquiries on false terms.",
          "Final prices are set by the owner in direct discussions with visitors. Stay Escape does not confirm prices."
        ]
      },
      {
        id: "listing-06-availability",
        title: "Availability",
        paragraphs: [
          "Do not mark a property as available when you know it is unavailable. Update availability information when practical and respond honestly to date-specific enquiries.",
          "Stay Escape does not guarantee availability, even where a listing or field suggests a property may be open."
        ]
      },
      {
        id: "listing-07-photos-and-videos",
        title: "Photos and videos",
        paragraphs: [
          "Images must depict the actual property being listed, be clear and reasonably representative, and respect size and file-type validation. Do not use stock images or images from unrelated properties unless clearly labelled as illustrative and permitted.",
          "We may reject or remove images that appear misleading, infringing, duplicated across unrelated listings or of poor quality."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "listing-08-amenities-and-facilities",
        title: "Amenities and facilities",
        paragraphs: [
          "List only amenities that genuinely exist and are available to guests. If an amenity is shared, paid, time-limited or conditional, say so plainly.",
          "Do not list facilities that are planned but not yet available."
        ]
      },
      {
        id: "listing-09-house-rules-and-safety",
        title: "House rules and safety",
        paragraphs: [
          "State material rules such as check-in expectations, pet policies, smoking rules, event restrictions and safety considerations where relevant. Rules must not be discriminatory or unlawful.",
          "Owners remain responsible for the safety and legality of the property and their own guest arrangements."
        ]
      },
      {
        id: "listing-10-contact-information",
        title: "Contact information",
        paragraphs: [
          "Phone and WhatsApp details must belong to the associated owner profile and be appropriate for public display. They are shown through a property-scoped public owner view so visitors contact the right owner for that property.",
          "Do not use another person's contact details or publish details you are not authorised to share."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "listing-11-prohibited-content",
        title: "Prohibited content",
        paragraphs: [
          "Listings must not contain unlawful, discriminatory, hateful, obscene, threatening, defamatory or infringing content. They must not promote illegal activity or include malware, deceptive links or spam.",
          "Personal information about others must not be included without permission."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "listing-12-misleading-listings",
        title: "Misleading listings",
        paragraphs: [
          "Fake properties, borrowed photos, false amenities, bait pricing, inaccurate location claims and misrepresented ownership are prohibited.",
          "We may remove a listing, suspend an owner account, preserve evidence and take other appropriate action where misleading content is suspected."
        ]
      },
      {
        id: "listing-13-duplicates-and-location",
        title: "Duplicates and location",
        paragraphs: [
          "Do not create multiple listings for the same property to crowd discovery results or create a false impression of availability. Location labels should reflect the property accurately.",
          "Where a listing covers multiple units, explain the arrangement clearly."
        ]
      },
      {
        id: "listing-14-plan-limits-and-expiry",
        title: "Plan limits and expiry",
        paragraphs: [
          "Property count, image count and expired-listing visibility are controlled by admin-managed Free and Premium plans. Listings may be limited, hidden or require renewal when plan limits apply.",
          "There is no automatic renewal; continued Premium visibility requires a new manual checkout."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "listing-15-review-and-moderation",
        title: "Review and moderation",
        paragraphs: [
          "Listings and related reviews may be reviewed by administrators for quality, safety and policy compliance. Reviews are moderated before public display and can be reported.",
          "Owners must not manipulate ratings or arrange fake reviews to improve a listing's reputation."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "listing-16-updates-and-removals",
        title: "Updates and removals",
        paragraphs: [
          "Owners should update or remove listings that are no longer accurate, available or authorised. We may remove or hide listings that breach this policy or create risk for visitors.",
          "Removal does not necessarily erase audit or enquiry records that must be retained for integrity or legal reasons."
        ]
      },
      {
        id: "listing-17-enforcement",
        title: "Enforcement",
        paragraphs: [
          "Enforcement may include editing or removing content, hiding a listing, suspending an owner account, restricting submissions or terminating access. We may act immediately where fraud or safety risk is suspected.",
          "Concerns can be raised through the grievance process with supporting details."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      }
    ],
    related: [
      { label: "Owner Terms", href: "/owner-terms" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Subscription Policy", href: "/subscription-policy" },
      { label: "Disclaimer", href: "/disclaimer" }
    ],
    showTableOfContents: true
  },

  "review-policy": {
    slug: "review-policy",
    title: "Review Policy",
    eyebrow: "Community standards",
    description:
      "Rules for authentic ratings, moderated reviews and reporting on Stay Escape.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Reviews help visitors assess properties, but they must be genuine, relevant and fair. This policy explains what is allowed, how moderation works and how to report a problem.",
    sections: [
      {
        id: "review-01-scope",
        title: "Scope",
        paragraphs: [
          "This policy applies to ratings, written reviews and review reports submitted through Stay Escape. It applies to guests, owners and administrators who handle review content.",
          "Reviews are one input into discovery and should not be treated as guarantees of future service."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "review-02-who-can-review",
        title: "Who can review",
        paragraphs: [
          "Reviews may be submitted by users with relevant accounts and by guests using the anonymous guest review feature where available. Anonymous reviews may be associated with the `STAYESCAPE:guest_review` cookie for integrity checks.",
          "You must not impersonate another person or submit a review on behalf of someone without their permission."
        ]
      },
      {
        id: "review-03-authenticity",
        title: "Authenticity",
        paragraphs: [
          "Reviews must reflect a genuine experience or genuine interaction connected to the property being reviewed. Fabricated, paid-for or coordinated reviews are prohibited.",
          "The platform may use account history, cookie identifiers and moderation review to assess authenticity."
        ]
      },
      {
        id: "review-04-moderation-before-display",
        title: "Moderation before display",
        paragraphs: [
          "All reviews are moderated before public display. Moderation checks relevance, authenticity indicators, language and compliance with this policy.",
          "A review may be approved, rejected, anonymised, edited for limited formatting reasons or held for further review."
        ]
      },
      {
        id: "review-05-ratings-and-criteria",
        title: "Ratings and criteria",
        paragraphs: [
          "Where a star or numeric rating is offered, it should reflect the overall experience being described and should not be used as a substitute for abusive commentary.",
          "Keep ratings aligned with the written review so that visitors receive a coherent picture."
        ]
      },
      {
        id: "review-06-content-standards",
        title: "Content standards",
        paragraphs: [
          "Write reviews that are specific, relevant and based on your own experience. Mention what worked or did not work, and avoid mentioning unrelated disputes or third parties.",
          "Do not publish private contact details, full addresses beyond what is already public, payment instrument details or identity documents."
        ]
      },
      {
        id: "review-07-prohibited-review-content",
        title: "Prohibited review content",
        paragraphs: [
          "Reviews must not contain hate speech, harassment, threats, discriminatory language, obscene material, defamatory claims presented as fact, spam, promotional links or malware.",
          "Content that reveals someone else's confidential information or infringes intellectual property rights is also prohibited."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "review-08-owner-conduct",
        title: "Owner conduct",
        paragraphs: [
          "Owners must not manipulate ratings, create fake reviews, offer incentives for positive reviews, or pressure guests to change honest feedback.",
          "Owners may respond to reviews where the feature is available, but responses must be factual and respectful."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "review-09-incentives-and-conflicts",
        title: "Incentives and conflicts",
        paragraphs: [
          "Do not offer discounts, gifts or other benefits in exchange for a positive review or a change to an existing review. Disclose material conflicts where relevant.",
          "Soliciting feedback is acceptable when it does not condition the review on a particular rating."
        ]
      },
      {
        id: "review-10-reporting-reviews",
        title: "Reporting reviews",
        paragraphs: [
          "If you see a review that appears fake, abusive, irrelevant or manipulative, report it through the platform or contact support with the property link and review details.",
          "Include a concise reason so that moderators can assess the report effectively."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "review-11-how-reports-are-handled",
        title: "How reports are handled",
        paragraphs: [
          "Reports are reviewed by administrators, who may keep the review, request clarification, hide it, anonymise it or remove it. Action depends on the evidence and the policy issue involved.",
          "We aim to handle reports fairly and to avoid removing genuine critical feedback simply because it is unfavourable."
        ]
      },
      {
        id: "review-12-anonymity-and-data",
        title: "Anonymity and data",
        paragraphs: [
          "Guest reviews may be linked to the `STAYESCAPE:guest_review` cookie to identify repeat or duplicate submissions. This identifier is used for integrity, not marketing.",
          "Information about review handling is also covered by the privacy policy."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "review-13-edits-and-removals",
        title: "Edits and removals",
        paragraphs: [
          "Once published, reviews may be edited only where the platform permits it or where an administrative correction is needed. Reviews can be removed where they breach this policy or where law requires it.",
          "A review may be anonymised instead of deleted, particularly where records are needed for moderation history or platform integrity."
        ]
      },
      {
        id: "review-14-enforcement",
        title: "Enforcement",
        paragraphs: [
          "Repeated or serious breaches may lead to rejected reviews, restricted review submission, account suspension, listing action or termination of access.",
          "Suspected fraud or harassment can also be raised through the grievance process."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      }
    ],
    related: [
      { label: "User Terms", href: "/user-terms" },
      { label: "Owner Terms", href: "/owner-terms" },
      { label: "Listing Policy", href: "/listing-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" }
    ],
    showTableOfContents: true
  },

  "cancellation-refund-policy": {
    slug: "cancellation-refund-policy",
    title: "Cancellation and Refund Policy",
    eyebrow: "Payments",
    description:
      "How cancellation and refund requests are handled across enquiries, direct bookings and subscriptions.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "This policy distinguishes enquiries and direct arrangements from subscription payments. Stay Escape processes subscription payments only and does not manage bookings or owner agreements.",
    sections: [
      {
        id: "cancellation-01-scope",
        title: "Scope",
        paragraphs: [
          "This policy covers enquiries, quote requests, direct owner arrangements and Premium subscription payments made through Stay Escape. It does not create cancellation rights for bookings that are handled entirely outside the platform.",
          "Consumer rights and mandatory legal protections are preserved."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "cancellation-02-enquiries-and-quote-requests",
        title: "Enquiries and quote requests",
        paragraphs: [
          "An enquiry or quote request is not a booking. If you no longer need a response, tell the owner directly or contact support so the request can be noted.",
          "There is no payment held against an enquiry, so there is no platform refund to process for an enquiry alone."
        ]
      },
      {
        id: "cancellation-03-direct-bookings",
        title: "Direct bookings",
        paragraphs: [
          "Any booking or stay arrangement is made directly between the visitor and the owner. Stay Escape does not confirm, hold or manage those bookings.",
          "Cancellation and refund terms for a direct booking are set by the owner and applicable law, not by this platform policy."
        ],
        links: [{ label: "Disclaimer", href: "/disclaimer" }]
      },
      {
        id: "cancellation-04-subscription-cancellation",
        title: "Subscription cancellation",
        paragraphs: [
          "Owners may cancel or allow a Premium subscription to expire. There is no automatic renewal implemented, so expiry does not create a new charge.",
          "Cancelling a subscription affects future access and does not by itself reverse a completed payment."
        ]
      },
      {
        id: "cancellation-05-no-automatic-refund",
        title: "No automatic refund on cancellation",
        paragraphs: [
          "Cancellation does not automatically refund any amount already paid. Refund eligibility is considered at the platform's discretion and is subject to applicable law.",
          "Where a refund is approved, it is processed through the appropriate payment route."
        ]
      },
      {
        id: "cancellation-06-refund-eligibility",
        title: "Refund eligibility",
        paragraphs: [
          "Factors that may be considered include the nature of the payment, whether a subscription benefit was used, technical failure attributable to the platform, duplicate charges and applicable legal requirements.",
          "Submitting a cancellation request does not guarantee that a refund will be approved."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "cancellation-07-failed-payments",
        title: "Failed payments",
        paragraphs: [
          "If a Razorpay checkout fails, is declined or remains pending, subscription activation may not occur. Where a duplicate or unsuccessful charge is suspected, provide the payment reference to support.",
          "We will review the payment status and coordinate the appropriate next step, which may involve Razorpay or your payment provider."
        ]
      },
      {
        id: "cancellation-08-chargebacks",
        title: "Chargebacks",
        paragraphs: [
          "If you raise a chargeback with your payment provider, notify support with the relevant reference. Chargebacks can affect subscription status while the dispute is reviewed.",
          "We may provide payment and subscription records where needed to resolve the dispute."
        ]
      },
      {
        id: "cancellation-09-payment-processing",
        title: "Payment processing",
        paragraphs: [
          "Premium subscription payments are processed through Razorpay checkout. Razorpay handles payment instrument details, while Stay Escape receives payment status and reference information.",
          "No platform fee or commission is currently charged on owner bookings; only subscription payments are processed by the platform."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "cancellation-10-processing-times",
        title: "Processing times",
        paragraphs: [
          "Approved refunds are subject to Razorpay, payment network and banking timelines. We do not control when your bank or card issuer reflects the credit.",
          "We will confirm when a refund has been initiated from our side where applicable."
        ]
      },
      {
        id: "cancellation-11-consumer-rights",
        title: "Consumer rights",
        paragraphs: [
          "Nothing in this policy limits non-waivable consumer rights or statutory remedies. Where mandatory law provides a different outcome, that law applies.",
          "If you believe a right has been affected, use the grievance process."
        ],
        links: [{ label: "Terms and Conditions", href: "/terms-and-conditions" }]
      },
      {
        id: "cancellation-12-contact",
        title: "Contact",
        paragraphs: [
          "For cancellation or refund queries, include your account email, plan, payment reference and a short explanation. Contact hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "You can also use the contact page for general support."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      }
    ],
    related: [
      { label: "Subscription Policy", href: "/subscription-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Grievance Redressal", href: "/grievance-redressal" },
      { label: "Owner Terms", href: "/owner-terms" }
    ],
    showTableOfContents: true
  },

  "subscription-policy": {
    slug: "subscription-policy",
    title: "Subscription Policy",
    eyebrow: "Owner plans",
    description:
      "How Free and Premium owner plans, limits, payments, renewal and cancellation work.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "Owners can list properties on a Free or Premium plan. Plan limits are controlled by admin-managed configuration, and Premium payments are processed through Razorpay checkout.",
    sections: [
      {
        id: "subscription-01-plans-overview",
        title: "Plans overview",
        paragraphs: [
          "Stay Escape offers a Free plan for basic owner participation and a Premium plan for owners who want additional benefits. The available plan configuration is managed by administrators.",
          "A subscription supports listing features only. It does not create bookings, guarantee enquiries or confirm owner responses."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "subscription-02-free-plan",
        title: "Free plan",
        paragraphs: [
          "The Free plan allows an owner to get started without a Premium payment. It is subject to admin-managed limits, including property count, image count and expired-listing visibility.",
          "Free listings remain subject to all listing, review and acceptable-use standards."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "subscription-03-premium-plan",
        title: "Premium plan",
        paragraphs: [
          "The Premium plan may offer additional visibility or feature benefits according to the current plan configuration. Exact benefits are shown in the product experience and can be changed by administrators.",
          "Premium access begins only after payment verification is complete."
        ]
      },
      {
        id: "subscription-04-admin-managed-limits",
        title: "Admin-managed limits",
        paragraphs: [
          "Limits such as how many properties an owner may list, how many images may be uploaded and whether expired listings remain visible are set in admin-managed plans rather than by individual negotiation.",
          "We may update limits as the platform evolves and will reflect current limits in the plan information shown to owners."
        ]
      },
      {
        id: "subscription-05-plan-duration",
        title: "Plan duration",
        paragraphs: [
          "A paid Premium plan is active for the duration stated at checkout. The subscription status shown in the dashboard reflects the current plan period.",
          "When the period ends, Premium features stop applying unless a new checkout is completed."
        ]
      },
      {
        id: "subscription-06-billing-and-razorpay",
        title: "Billing and Razorpay",
        paragraphs: [
          "Premium payments are processed by Razorpay checkout. Payment instrument details are handled by Razorpay; Stay Escape receives plan, amount, status and reference information needed to administer the subscription.",
          "HMAC-verified Razorpay webhooks help ensure that subscription status is updated from trusted payment events."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "subscription-07-no-automatic-renewal",
        title: "No automatic renewal",
        paragraphs: [
          "There is no automatic renewal implemented. A completed checkout does not authorise recurring future charges.",
          "Owners who want to continue Premium access after expiry must start a new checkout."
        ]
      },
      {
        id: "subscription-08-manual-renewal",
        title: "Manual renewal",
        paragraphs: [
          "Renewal is a new manual checkout. The price and benefits at renewal reflect the plan configuration available at that time.",
          "Completing a renewal checkout creates a new subscription period rather than extending an existing one automatically."
        ]
      },
      {
        id: "subscription-09-cancellation",
        title: "Cancellation",
        paragraphs: [
          "Owners may cancel a Premium subscription or simply allow it to expire. Cancellation affects future plan access and does not by itself refund a completed payment.",
          "Listings may remain subject to the limits of the plan that applies after cancellation or expiry."
        ],
        links: [{ label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }]
      },
      {
        id: "subscription-10-downgrade",
        title: "Downgrade",
        paragraphs: [
          "If a Premium plan is not renewed, the account returns to Free or another applicable default plan. This may reduce the number of active properties, permitted images or visibility of expired listings.",
          "Owners should review listings after a downgrade so that they remain compliant with current limits."
        ]
      },
      {
        id: "subscription-11-refund-eligibility",
        title: "Refund eligibility",
        paragraphs: [
          "Cancellation does not automatically refund a payment. Refund eligibility is decided at the platform's discretion and is subject to applicable law and consumer rights.",
          "Duplicate charges, failed payments and clear technical failures may be reviewed through the support or grievance process."
        ]
      },
      {
        id: "subscription-12-failed-payments",
        title: "Failed payments",
        paragraphs: [
          "A failed, declined or pending Razorpay payment may not activate Premium access. Owners should check the payment status before repeating a checkout to avoid duplicate attempts.",
          "If a duplicate or unclear charge appears, contact support with the payment reference."
        ]
      },
      {
        id: "subscription-13-feature-availability",
        title: "Feature availability",
        paragraphs: [
          "Plan features depend on the current configuration and on technical availability. We aim to deliver stated Premium benefits for the active plan period but do not guarantee uninterrupted access.",
          "Maintenance or third-party outages may temporarily affect dashboards and payment flows."
        ]
      },
      {
        id: "subscription-14-suspension-and-termination",
        title: "Suspension and termination",
        paragraphs: [
          "A subscription does not prevent suspension or termination for policy breaches, fraud, unlawful conduct or safety risks. Plan access may be suspended while an issue is reviewed.",
          "Termination of platform access does not itself create a refund."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "subscription-15-fees-and-commission",
        title: "Fees and commission",
        paragraphs: [
          "Platform fees or commission are not currently charged on owner bookings. Only subscription payments are processed by the platform.",
          "Razorpay or your payment provider may apply their own charges according to their terms."
        ]
      },
      {
        id: "subscription-16-changes-to-plans",
        title: "Changes to plans",
        paragraphs: [
          "We may update plan names, prices, benefits or limits. Current plan information shown at checkout and in the dashboard governs the active subscription period unless applicable law provides otherwise.",
          "Changes to future periods will be reflected before a new manual checkout."
        ]
      },
      {
        id: "subscription-17-contact",
        title: "Contact",
        paragraphs: [
          "For plan or billing questions, include your account email, plan name and payment reference. Contact hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "Formal complaints can be raised through the grievance process."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      }
    ],
    related: [
      { label: "Owner Terms", href: "/owner-terms" },
      { label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" },
      { label: "Listing Policy", href: "/listing-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" }
    ],
    showTableOfContents: true
  },

  "acceptable-use-policy": {
    slug: "acceptable-use-policy",
    title: "Acceptable Use Policy",
    eyebrow: "Conduct",
    description:
      "Rules for users, owners and administrators using Stay Escape systems and data.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "This policy sets baseline conduct rules for everyone who uses Stay Escape. It protects visitors, owners, administrators and the reliability of the platform.",
    sections: [
      {
        id: "acceptable-01-scope",
        title: "Scope",
        paragraphs: [
          "This policy applies to all activity on Stay Escape, including browsing, enquiries, reviews, listings, dashboards, administrative actions and payment flows.",
          "It applies alongside the terms, privacy policy and role-specific policies."
        ],
        links: [{ label: "Terms and Conditions", href: "/terms-and-conditions" }]
      },
      {
        id: "acceptable-02-user-rules",
        title: "User rules",
        paragraphs: [
          "Users must submit truthful enquiries and reviews, respect owners and other visitors, and use contact features only for legitimate communication about properties.",
          "Do not use the platform for promotional messages, fake requests or attempts to bypass moderation."
        ],
        links: [{ label: "User Terms", href: "/user-terms" }]
      },
      {
        id: "acceptable-03-owner-rules",
        title: "Owner rules",
        paragraphs: [
          "Owners must list only properties they are authorised to offer, keep details accurate, handle enquiries honestly and avoid misleading pricing or availability claims.",
          "Owners must not manipulate ratings or contact visitors using information obtained through misuse of platform features."
        ],
        links: [{ label: "Owner Terms", href: "/owner-terms" }]
      },
      {
        id: "acceptable-04-admin-rules",
        title: "Admin rules",
        paragraphs: [
          "Administrators and super admins must use privileged access only for legitimate platform operations, support, moderation and security. Administrative actions should be proportionate and recorded where audit logging applies.",
          "Privileged access must not be used to view information for curiosity, favouritism or improper advantage."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "acceptable-05-prohibited-conduct",
        title: "Prohibited conduct",
        paragraphs: [
          "Harassment, threats, discrimination, impersonation, extortion, fraud, unlawful activity and deliberate disruption of the platform are prohibited.",
          "Do not assist others in doing any of the above."
        ]
      },
      {
        id: "acceptable-06-spam-and-fake-enquiries",
        title: "Spam and fake enquiries",
        paragraphs: [
          "Bulk messaging, repetitive enquiries, automated form submissions and false quote requests are not allowed. Fake enquiries waste owner time and distort platform activity.",
          "We may rate-limit, filter or block submissions and suspend accounts involved in spam."
        ]
      },
      {
        id: "acceptable-07-fraud-and-misrepresentation",
        title: "Fraud and misrepresentation",
        paragraphs: [
          "Fake listings, stolen images, bait pricing, false ownership claims, payment scams and misleading review activity are prohibited.",
          "Suspected fraud may be investigated and reported where appropriate."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "acceptable-08-scraping-and-automation",
        title: "Scraping and automation",
        paragraphs: [
          "Do not scrape pages, copy listings in bulk, or use bots, scripts or automated agents to access the platform without written permission.",
          "Automated access can overload services and undermine fair use of listing data."
        ]
      },
      {
        id: "acceptable-09-attacks-and-security",
        title: "Attacks and security",
        paragraphs: [
          "Do not probe, scan or attack platform systems, attempt SQL injection or cross-site scripting, bypass rate limits, access another account, or misuse service-role functionality.",
          "Security testing is allowed only where expressly authorised by the platform."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "acceptable-10-ip-violations",
        title: "IP violations",
        paragraphs: [
          "Do not upload images, text, branding or other material that infringes copyright, trademark or other intellectual property rights.",
          "Repeat infringement may lead to content removal and account action."
        ]
      },
      {
        id: "acceptable-11-harassment-and-abuse",
        title: "Harassment and abuse",
        paragraphs: [
          "Do not abuse, threaten, stalk or humiliate visitors, owners or staff. Do not publish private contact details or identity documents to pressure another person.",
          "Reports of harassment can be submitted through the grievance process."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      },
      {
        id: "acceptable-12-review-manipulation",
        title: "Review manipulation",
        paragraphs: [
          "Fake reviews, incentivised positive ratings, coordinated rating campaigns and pressure to change honest feedback are prohibited.",
          "Reviews are moderated before display and can be reported for review."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "acceptable-13-enforcement",
        title: "Enforcement",
        paragraphs: [
          "We may remove content, reject submissions, rate-limit activity, hide listings, suspend accounts or terminate access where this policy is breached.",
          "Immediate action may be taken where fraud, safety risk or legal violation is suspected."
        ]
      },
      {
        id: "acceptable-14-reporting",
        title: "Reporting",
        paragraphs: [
          "Report suspected abuse, fraud, security issues or policy breaches through the contact or grievance channels with links and relevant details.",
          "For security vulnerabilities, follow the responsible disclosure guidance in the security notes."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "acceptable-15-related-documents",
        title: "Related documents",
        paragraphs: [
          "The linked policies provide role-specific and topic-specific detail that applies alongside this policy.",
          "If policies conflict for a specific situation, the more specific policy generally applies unless law requires otherwise."
        ],
        links: [
          { label: "Listing Policy", href: "/listing-policy" },
          { label: "Review Policy", href: "/review-policy" },
          { label: "Privacy Policy", href: "/privacy-policy" }
        ]
      }
    ],
    related: [
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "User Terms", href: "/user-terms" },
      { label: "Owner Terms", href: "/owner-terms" },
      { label: "Security", href: "/security" }
    ],
    showTableOfContents: true
  },

  "account-deletion": {
    slug: "account-deletion",
    title: "Account Deletion",
    eyebrow: "Your data",
    description:
      "How to request account deletion and what happens to profile, review, listing and financial records.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "You can request deletion of your Stay Escape account from `/account-deletion`. The flow is designed to remove or anonymise information where possible while retaining records that must be kept for legal, financial or integrity reasons.",
    sections: [
      {
        id: "deletion-01-overview",
        title: "Overview",
        paragraphs: [
          "Account deletion is not the same as immediate removal of every record. Some data is anonymised, some may be hard-deleted where conditions allow, and some is retained where required by law or platform integrity needs.",
          "This page explains each outcome in plain language."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "deletion-02-how-to-request",
        title: "How to request",
        paragraphs: [
          "Open `/account-deletion` and follow the instructions shown. Authenticated users must type the required confirmation phrase before the deletion request can proceed.",
          "The confirmation step helps prevent accidental or coerced deletion."
        ]
      },
      {
        id: "deletion-03-confirmation-phrase",
        title: "Confirmation phrase",
        paragraphs: [
          "The phrase shown in the deletion flow must be entered exactly as displayed. It confirms that you understand the effects described on this page.",
          "If you cannot complete the phrase because of an accessibility issue, contact support for assistance."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "deletion-04-what-happens-to-profile",
        title: "What happens to your profile",
        paragraphs: [
          "The deletion flow anonymises the profile so that it no longer identifies you in ordinary platform views. Where technically and legally possible, associated identifiers are removed from user-facing records.",
          "You will no longer be able to use the account after the request is completed."
        ]
      },
      {
        id: "deletion-05-anonymisation-of-records",
        title: "Anonymisation of records",
        paragraphs: [
          "Anonymisation means replacing identifying details with non-identifying values so that the record can be retained for operational or integrity purposes without pointing back to you in normal use.",
          "The profile and deletion request record are anonymised as part of the flow."
        ]
      },
      {
        id: "deletion-06-hard-deletion-conditions",
        title: "Hard deletion conditions",
        paragraphs: [
          "Hard deletion is attempted only where the service role is configured and legally retainable records allow it. If those conditions are not met, anonymisation is used instead.",
          "This approach avoids deleting records that the platform must keep for legal, financial or safety reasons."
        ]
      },
      {
        id: "deletion-07-retained-records",
        title: "Retained records",
        paragraphs: [
          "Financial and audit records are retained where required. Subscription, payment and verification records may be kept to answer billing queries, prevent fraud and meet legal obligations.",
          "Retained records are handled under the privacy policy and are not used for marketing."
        ],
        links: [{ label: "Cancellation and Refund Policy", href: "/cancellation-refund-policy" }]
      },
      {
        id: "deletion-08-reviews",
        title: "Reviews",
        paragraphs: [
          "Reviews you submitted may be anonymised rather than deleted, especially where moderation history or platform integrity records are needed.",
          "Anonymised reviews may remain visible without identifying you."
        ],
        links: [{ label: "Review Policy", href: "/review-policy" }]
      },
      {
        id: "deletion-09-listings-and-enquiries",
        title: "Listings and enquiries",
        paragraphs: [
          "Listings and enquiries may be retained in limited form where needed for platform integrity, dispute handling or legal compliance. Owner contact details and visitor enquiry content are reviewed under the same principles.",
          "Where a listing is no longer authorised or accurate, it should be removed or updated before or during the deletion process."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "deletion-10-subscription-and-payment-records",
        title: "Subscription and payment records",
        paragraphs: [
          "Premium subscription and Razorpay payment records may be retained after account deletion to support billing questions, chargebacks, tax obligations and audits.",
          "Cancellation or deletion does not automatically create a refund."
        ]
      },
      {
        id: "deletion-11-audit-and-security-records",
        title: "Audit and security records",
        paragraphs: [
          "Admin audit logs and security records may be retained where needed to investigate misuse, preserve evidence or meet legal requirements. Access to these records is restricted through role-based controls.",
          "These records are not used for advertising or marketing."
        ],
        links: [{ label: "Security", href: "/security" }]
      },
      {
        id: "deletion-12-confirmation-and-timeline",
        title: "Confirmation and timeline",
        paragraphs: [
          "You will receive a confirmation when the deletion request is recorded. A further confirmation may be provided when anonymisation or deletion has been applied to the records that can be changed.",
          "Some retained records will remain under the rules described above and in the privacy policy."
        ]
      },
      {
        id: "deletion-13-contact",
        title: "Contact",
        paragraphs: [
          "For help with a deletion request, contact hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "You may also use the grievance process for a formal complaint about data handling."
        ],
        links: [{ label: "Grievance Redressal", href: "/grievance-redressal" }]
      }
    ],
    related: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Security", href: "/security" },
      { label: "Review Policy", href: "/review-policy" },
      { label: "Contact", href: "/contact" }
    ],
    showTableOfContents: true
  },

  security: {
    slug: "security",
    title: "Security",
    eyebrow: "Trust and safety",
    description:
      "Security practices implemented or being introduced across Stay Escape, and how to report a concern.",
    lastUpdated: "21 November 2026",
    version: "1.0",
    intro:
      "This page describes security controls that are implemented or being introduced in the same release as these documents. It avoids claims of certification or external audit.",
    sections: [
      {
        id: "security-01-our-approach",
        title: "Our approach",
        paragraphs: [
          "Stay Escape uses layered controls across authentication, access management, input handling, storage and payment verification. These controls are intended to reduce unauthorised access, misuse and data exposure.",
          "Security is an ongoing process, and controls may be strengthened as the platform evolves."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "security-02-authentication",
        title: "Authentication",
        paragraphs: [
          "Supabase Auth handles sign-in, session management and account recovery flows. Authentication cookies maintain a user's signed-in state across protected areas of the site.",
          "Passwords are not stored by the platform in plain text."
        ]
      },
      {
        id: "security-03-access-controls-and-rbac",
        title: "Access controls and RBAC",
        paragraphs: [
          "Role-based access control is used for user, owner, admin and super_admin roles. Access to dashboards, actions and data is limited according to the role assigned to an account.",
          "Administrative privileges are restricted and should be used only for legitimate platform operations."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "security-04-row-level-security",
        title: "Row-level security",
        paragraphs: [
          "Row-level security, or RLS, is used to limit which database rows a request can access according to the applicable policy and role.",
          "RLS works alongside application-level checks rather than replacing them."
        ]
      },
      {
        id: "security-05-server-side-guards",
        title: "Server-side guards",
        paragraphs: [
          "Server-side route and action guards check authentication and authorisation before protected pages or actions are allowed to run.",
          "Client-side visibility is not treated as a security control on its own."
        ]
      },
      {
        id: "security-06-owner-contact-view",
        title: "Owner contact view",
        paragraphs: [
          "WhatsApp and phone details are exposed through a property-scoped public owner view. This limits contact information to the owner associated with the property being viewed rather than exposing a general owner directory.",
          "Visitors interact directly with owners, and third-party services handle the resulting messages or calls."
        ],
        links: [{ label: "Privacy Policy", href: "/privacy-policy" }]
      },
      {
        id: "security-07-secrets-management",
        title: "Secrets management",
        paragraphs: [
          "The Supabase service-role key is server-only. It is not intended to be exposed to browsers or client bundles.",
          "Secrets should be configured through deployment environment settings and restricted to the services that need them."
        ]
      },
      {
        id: "security-08-input-validation",
        title: "Input validation",
        paragraphs: [
          "Zod validation is used to check structured inputs before they are accepted by application logic. This helps reject malformed or unexpected data early.",
          "Validation supports data quality as well as security."
        ]
      },
      {
        id: "security-09-rate-limiting",
        title: "Rate limiting",
        paragraphs: [
          "Rate limiting is used or being introduced to reduce abusive submission patterns such as spam enquiries and automated requests.",
          "Limits may apply to forms, API routes or other high-abuse endpoints."
        ],
        links: [{ label: "Acceptable Use Policy", href: "/acceptable-use-policy" }]
      },
      {
        id: "security-10-image-upload-validation",
        title: "Image upload validation",
        paragraphs: [
          "Image uploads are validated for permitted file types and size constraints before being accepted. This reduces the risk of malicious or unsupported files entering storage.",
          "Owners should upload only images they are authorised to use."
        ],
        links: [{ label: "Listing Policy", href: "/listing-policy" }]
      },
      {
        id: "security-11-audit-logging",
        title: "Audit logging",
        paragraphs: [
          "Administrative audit logging is used or being introduced to record significant privileged actions. Records help with accountability, incident review and dispute handling.",
          "Access to audit records is restricted through role-based controls."
        ]
      },
      {
        id: "security-12-transport-and-security-headers",
        title: "Transport and security headers",
        paragraphs: [
          "Security headers are used or being introduced to improve browser-side protection for platform responses. HTTPS should be used for all access to the platform.",
          "Header configuration is reviewed as the application changes."
        ]
      },
      {
        id: "security-13-payment-webhook-verification",
        title: "Payment webhook verification",
        paragraphs: [
          "Razorpay webhooks are verified using HMAC verification before payment events are trusted for subscription status updates.",
          "This helps prevent forged payment notifications from changing plan state."
        ],
        links: [{ label: "Subscription Policy", href: "/subscription-policy" }]
      },
      {
        id: "security-14-monitoring-and-improvement",
        title: "Monitoring and improvement",
        paragraphs: [
          "We review security controls as platform features change and address issues that are identified through normal operations, reports or internal review.",
          "No external audit or certification is claimed in this version."
        ]
      },
      {
        id: "security-15-responsible-disclosure",
        title: "Responsible disclosure",
        paragraphs: [
          "If you believe you have found a security vulnerability, report it privately to hello@STAYESCAPE.example. This is a placeholder address and must be replaced with the official support email before launch.",
          "Include a description, affected page or endpoint, steps to reproduce and the impact you observed. Please do not exploit the issue beyond what is needed to demonstrate it, and do not disclose it publicly before we have had a reasonable opportunity to investigate."
        ],
        links: [{ label: "Contact", href: "/contact" }]
      },
      {
        id: "security-16-no-certifications",
        title: "No certifications",
        paragraphs: [
          "Stay Escape does not claim ISO or SOC certification, penetration-test approval, or external security audit status in this version of the documentation.",
          "References to security describe platform practices only and should not be read as third-party assurance."
        ]
      },
      {
        id: "security-17-related-documents",
        title: "Related documents",
        paragraphs: [
          "The linked documents explain how personal information, acceptable conduct and subscription records are handled alongside these controls.",
          "They should be read together with this page."
        ],
        links: [
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Acceptable Use Policy", href: "/acceptable-use-policy" },
          { label: "Cookie Policy", href: "/cookie-policy" }
        ]
      }
    ],
    related: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Acceptable Use Policy", href: "/acceptable-use-policy" },
      { label: "Account Deletion", href: "/account-deletion" },
      { label: "Grievance Redressal", href: "/grievance-redressal" }
    ],
    showTableOfContents: true
  }
};
