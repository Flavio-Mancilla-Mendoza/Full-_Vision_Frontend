import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export default function SEO({ title, description, keywords, image, url, type = "website", author, publishedTime, modifiedTime }: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Function to update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;

      if (!element) {
        element = document.createElement("meta");
        if (property) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMeta("description", description);
    if (keywords) {
      updateMeta("keywords", keywords);
    }
    if (author) {
      updateMeta("author", author);
    }

    // Open Graph tags
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", type, true);

    if (url) {
      updateMeta("og:url", url, true);
    }

    if (image) {
      updateMeta("og:image", image, true);
      updateMeta("og:image:alt", title, true);
    }

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);

    if (image) {
      updateMeta("twitter:image", image);
    }

    // Article specific meta tags
    if (type === "article") {
      if (publishedTime) {
        updateMeta("article:published_time", publishedTime, true);
      }
      if (modifiedTime) {
        updateMeta("article:modified_time", modifiedTime, true);
      }
      if (author) {
        updateMeta("article:author", author, true);
      }
    }

    // Structured data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "Article" : "WebPage",
      name: title,
      description: description,
      ...(url && { url }),
      ...(image && { image }),
      ...(author && { author: { "@type": "Person", name: author } }),
      ...(publishedTime && { datePublished: publishedTime }),
      ...(modifiedTime && { dateModified: modifiedTime }),
    };

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Analytics tracking
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "GA_MEASUREMENT_ID", {
        page_title: title,
        page_location: url || window.location.href,
      });
    }

    // Cleanup function to remove meta tags on unmount
    return () => {
      // Note: In a real app, you might want to restore previous meta tags
      // rather than remove them entirely
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime]);

  return null; // This component doesn't render anything
}
