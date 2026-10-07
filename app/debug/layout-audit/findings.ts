export type AuditShot = {
  src: string;
  width: number;
  height: number;
  label: string;
};

export type AuditFinding = {
  id: string;
  title: string;
  kind: "Layout" | "Content" | "Interaction";
  href: string;
  note: string;
  question?: string;
  shots: AuditShot[];
};

export const auditFindings: AuditFinding[] = [
  {
    "id": "desktop-motion-toggle",
    "title": "Desktop: changing the motion preference crashes the homepage",
    "kind": "Interaction",
    "href": "/",
    "note": "After the desktop page has initialized, changing the system preference to reduced motion produces a client-side exception and removes the page. This was reproduced at 1440 px. The new figure passes the same preference-change check in isolation; the homepage animation teardown needs investigation.",
    "question": "Check the pinned sections when the motion preference changes, and make sure both reduced-motion startup and live changes work.",
    "shots": [
      {
        "width": 1440,
        "height": 900,
        "label": "Desktop / error after changing motion preference",
        "src": "/debug/layout-audit/2026-09-29/1440-motion-desktop.webp"
      }
    ]
  },
  {
    "id": "tablet-lifecycle",
    "title": "Landscape tablet: lifecycle slides lose their scroll sequence",
    "kind": "Layout",
    "href": "/#_lifecycle-e7cb36f18c98",
    "note": "On a 1024 px touch viewport, this section has only one screen of height. Scrolling carries the first slide out of view before the orbit and glasses slides get their turn. The desktop slide layout and the touch scrolling behavior need to agree.",
    "question": "Use the stacked phone slides on touch tablets, or give tablets their own pinned sequence?",
    "shots": [
      {
        "width": 1024,
        "height": 768,
        "label": "Touch tablet / first slide",
        "src": "/debug/layout-audit/2026-09-29/1024-lifecycle-touch-start.webp"
      },
      {
        "width": 1024,
        "height": 768,
        "label": "Touch tablet / leaving before the later slides appear",
        "src": "/debug/layout-audit/2026-09-29/1024-lifecycle-touch-exit.webp"
      }
    ]
  },
  {
    "id": "neighborhood-heading",
    "title": "Square & Cash App: “NEIGHBORHOOD” clips on small phones",
    "kind": "Layout",
    "href": "/work/square-cash-app#keep-it-in-the-neighborhood",
    "note": "At 320 px, the last word of the project heading extends beyond its white panel and off the right edge of the screen. The heading needs a smaller narrow-screen size or a deliberate line-break treatment.",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "The project title extends off the right edge",
        "src": "/debug/layout-audit/2026-09-29/320-case-square-cash-app-content.webp"
      }
    ]
  },
  {
    "id": "jobs-camera",
    "title": "Jobs: the title and job star are cropped on touch screens",
    "kind": "Layout",
    "href": "/jobs",
    "note": "The initial camera framing cuts off the JOBS title and pushes the job star against the left edge on phones and portrait tablets. The job can still be opened, and its text and LinkedIn button fit after opening; the scene itself needs responsive camera framing.",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Small phone / initial jobs view",
        "src": "/debug/layout-audit/2026-09-29/320-jobs.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Portrait tablet / cropped title and opened listing",
        "src": "/debug/layout-audit/2026-09-29/768-jobs-tap.webp"
      }
    ]
  },
  {
    "id": "friends-content",
    "title": "“And we bring friends” supporting copy",
    "kind": "Content",
    "href": "/#our-network",
    "note": "The six supplied cutouts and filename handles now replace the stand-ins, with Instagram profile links. The supporting line still needs a copy review.",
    "question": "Keep the current supporting line, or supply the final copy for this section?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Phone / supplied cutouts",
        "src": "/debug/layout-audit/2026-10-02/320-friends.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Tablet / supplied cutouts",
        "src": "/debug/layout-audit/2026-10-02/768-friends.webp"
      }
    ]
  },
  {
    "id": "missing-case-media",
    "title": "Ramp and Square & Cash App still need project media",
    "kind": "Content",
    "href": "/work/ramp",
    "note": "Both project panels currently contain only the heading, result, and body copy. Their client objects are present, but there is no campaign video or supporting imagery in either project panel.",
    "question": "Supply a hero film or still and one or two supporting images for each project. Square & Cash App is at /work/square-cash-app.",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Ramp / text-only project panel",
        "src": "/debug/layout-audit/2026-09-29/320-case-ramp-content.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Square & Cash App / text-only project panel",
        "src": "/debug/layout-audit/2026-09-29/768-case-square-cash-app-content.webp"
      }
    ]
  },
  {
    "id": "glasses-composition",
    "title": "Review the glasses and copy overlap on phones",
    "kind": "Layout",
    "href": "/#_lifecycle-e7cb36f18c98",
    "note": "The portrait layout puts the paragraph directly over the glasses, with large empty areas above and below. This makes the frames and lens reflection harder to see while reading the slide.",
    "question": "Move the paragraph above the glasses on phones, or keep the overlap and adjust the model/text scale?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Small phone / text over the lenses",
        "src": "/debug/layout-audit/2026-09-29/320-glasses.webp"
      },
      {
        "width": 390,
        "height": 844,
        "label": "Phone / current glasses composition",
        "src": "/debug/layout-audit/2026-09-29/390-glasses.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Portrait tablet / current glasses composition",
        "src": "/debug/layout-audit/2026-09-29/768-glasses.webp"
      }
    ]
  },
  {
    "id": "credibility-logo-size",
    "title": "Review orbit-logo readability on phones",
    "kind": "Layout",
    "href": "/#credibility",
    "note": "The orbit renders, but several brand names become very small at 320–390 px, especially on the far side. The near/far scale effect is working; a minimum phone logo size needs a design decision.",
    "question": "Keep the full set with a larger minimum scale, or show fewer orbiting logos at once on phones?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Small phone / tiny far-side logos",
        "src": "/debug/layout-audit/2026-09-29/320-credibility.webp"
      },
      {
        "width": 390,
        "height": 844,
        "label": "Phone / orbit logo sizes",
        "src": "/debug/layout-audit/2026-09-29/390-credibility.webp"
      }
    ]
  },
  {
    "id": "services-swipe",
    "title": "Services: make the horizontal touch interaction easier to discover",
    "kind": "Interaction",
    "href": "/#what-we-do-grid",
    "note": "Horizontal scrolling reaches the remaining service cards at 320 and 768 px. The first view only shows part of the next card, with no explicit swipe cue or position indicator.",
    "question": "Is the partial next card enough, or should we add a small swipe hint or simple dots?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "First service / next card peeking in",
        "src": "/debug/layout-audit/2026-09-29/320-services.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Tablet / later cards are reachable",
        "src": "/debug/layout-audit/2026-09-29/768-services-last.webp"
      }
    ]
  },
  {
    "id": "contact-button-wrap",
    "title": "Work With Us: the long button label is cramped at 320 px",
    "kind": "Layout",
    "href": "/#work-with-us",
    "note": "“Incredible Fortune Ahead Button” wraps to three tight lines in the small rectangle. The animated stars can also pass across the label.",
    "question": "Shorten the label on phones or give the button more height and keep the stars clear of the text?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Small phone / three-line contact button",
        "src": "/debug/layout-audit/2026-09-29/320-contact.webp"
      }
    ]
  },
  {
    "id": "newsletter-placeholder",
    "title": "Newsletter: the email placeholder gets cut off on a small phone",
    "kind": "Content",
    "href": "/#basket-links",
    "note": "The pigeon, paper, email field, and submit control fit the 320 px viewport. The long “Pigeon intercept point here” placeholder is truncated by the field width. No newsletter submission was made during this check.",
    "question": "Use “Your email” on small screens, or keep a shorter playful label?",
    "shots": [
      {
        "width": 320,
        "height": 740,
        "label": "Small phone / truncated input placeholder",
        "src": "/debug/layout-audit/2026-09-29/320-newsletter.webp"
      },
      {
        "width": 768,
        "height": 1024,
        "label": "Tablet / the same newsletter form",
        "src": "/debug/layout-audit/2026-09-29/768-newsletter.webp"
      }
    ]
  },
  {
    "id": "header-theme-reset",
    "title": "Recheck header colour after long jumps down the homepage",
    "kind": "Interaction",
    "href": "/#what-we-are",
    "note": "During the jump-and-scroll checks, the Matrix green header effect sometimes remained above the What We Are section and the footer. Reproduced again on the new parchment layout; this is separate from the section-edge alignment fix. A direct settled visit can show the normal black header. This needs a navigation-state check, including quick scrolls and anchor links.",
    "shots": [
      {
        "width": 768,
        "height": 1024,
        "label": "Green header after jumping to What We Are",
        "src": "/debug/layout-audit/2026-10-02/768-header-theme-parchment.webp"
      }
    ]
  }
];
