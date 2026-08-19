import { ReactNode, useEffect } from "react";
import { PublicSiteContentDto } from "@hrm-plus/shared";
import { resolveFileUrl } from "../../utils/fileUrl";
import { getBrandStyleVars } from "../../utils/brandTheme";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import "./publicSite.css";

export function PublicSiteLayout({
  content,
  tenantSlug,
  children,
}: {
  content: PublicSiteContentDto;
  tenantSlug: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = content.siteSettings.siteTitle;
    const faviconUrl = resolveFileUrl(content.siteSettings.faviconUrl);
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [content.siteSettings.siteTitle, content.siteSettings.faviconUrl]);

  return (
    <div className="min-h-screen bg-white" style={getBrandStyleVars(content.siteSettings)}>
      <Navbar content={content} />
      {children}
      <Footer content={content} tenantSlug={tenantSlug} />
    </div>
  );
}
