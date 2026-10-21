export type WorkGalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type InstagramPost = {
  title: string;
  mediaType: "gallery" | "video";
  instagramHref: string;
  images?: WorkGalleryImage[];
  videoUrl?: string;
  videoPosterUrl?: string;
};

// Local copies of the supplied posts. The original links stay available in
// each viewer; no login, third-party embed or expiring CDN URL is needed.
export const INSTAGRAM_POSTS: Record<string, InstagramPost> = {
  "DWMCTqeAD4K": {
    "title": "DoorDash",
    "mediaType": "gallery",
    "instagramHref": "https://www.instagram.com/p/DWMCTqeAD4K/",
    "images": [
      {
        "src": "/media/instagram/doordash-1.webp",
        "width": 1080,
        "height": 1350,
        "alt": "Sunday is a spectrum"
      },
      {
        "src": "/media/instagram/doordash-2.webp",
        "width": 1080,
        "height": 1350,
        "alt": "Sunday plans versus what actually happened"
      },
      {
        "src": "/media/instagram/doordash-3.webp",
        "width": 1282,
        "height": 1600,
        "alt": "Luxury then and luxury now"
      },
      {
        "src": "/media/instagram/doordash-4.webp",
        "width": 1280,
        "height": 1600,
        "alt": "Asking DoorDash to bring me whatever this is"
      }
    ]
  },
  "Dd9E8WsETcu": {
    "title": "Adidas",
    "mediaType": "gallery",
    "instagramHref": "https://www.instagram.com/p/Dd9E8WsETcu/",
    "images": [
      {
        "src": "/media/instagram/adidas-1.webp",
        "width": 1340,
        "height": 1600,
        "alt": "Neighborhood gorp-casual creative starter pack"
      },
      {
        "src": "/media/instagram/adidas-2.webp",
        "width": 1340,
        "height": 1600,
        "alt": "Bass hunter and bass hunter"
      },
      {
        "src": "/media/instagram/adidas-3.webp",
        "width": 1340,
        "height": 1600,
        "alt": "Fixing the pain as a child and as an adult"
      },
      {
        "src": "/media/instagram/adidas-4.webp",
        "width": 1340,
        "height": 1600,
        "alt": "If sharks wore adidas, would they wear it like this?"
      },
      {
        "src": "/media/instagram/adidas-5.webp",
        "width": 1340,
        "height": 1600,
        "alt": "Fish wearing adidas shoes"
      }
    ]
  },
  "DRcVq2FDiKu": {
    "title": "Square & Cash App — neighborhood memes",
    "mediaType": "gallery",
    "instagramHref": "https://www.instagram.com/p/DRcVq2FDiKu/",
    "images": [
      {
        "src": "/media/instagram/square-memes-1.webp",
        "width": 1392,
        "height": 1600,
        "alt": "How to support your neighbourhood"
      },
      {
        "src": "/media/instagram/square-memes-2.webp",
        "width": 1392,
        "height": 1600,
        "alt": "Justifying purchases by supporting local businesses"
      },
      {
        "src": "/media/instagram/square-memes-3.webp",
        "width": 1392,
        "height": 1600,
        "alt": "The Williamsburg experience"
      },
      {
        "src": "/media/instagram/square-memes-4.webp",
        "width": 1392,
        "height": 1600,
        "alt": "Saturday neighbourhood impulse purchases"
      },
      {
        "src": "/media/instagram/square-memes-5.webp",
        "width": 1392,
        "height": 1600,
        "alt": "Born just in time for the Cash App and Square pop-up"
      }
    ]
  },
  "DRfKxLHDd8l": {
    "title": "Square & Cash App — Brooklyn Coffee Shop",
    "mediaType": "video",
    "instagramHref": "https://www.instagram.com/p/DRfKxLHDd8l/",
    "videoUrl": "/media/instagram/square-coffee-shop.mp4",
    "videoPosterUrl": "/media/instagram/square-coffee-shop-poster.webp"
  }
};

export function getInstagramPost(href?: string): InstagramPost | undefined {
  if (!href) return;
  try {
    const url = new URL(href);
    if (url.hostname !== "www.instagram.com" && url.hostname !== "instagram.com") return;
    const code = url.pathname.match(/^\/(?:p|reel)\/([^/]+)\/?$/)?.[1];
    return code ? INSTAGRAM_POSTS[code] : undefined;
  } catch {
    return;
  }
}
