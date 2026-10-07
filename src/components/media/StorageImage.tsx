import { useEffect, useState, type AnchorHTMLAttributes, type ImgHTMLAttributes } from "react";
import { apiClient } from "../../api/client";

type StorageImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

export function useStorageImageUrl(src?: string | null): string | undefined {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>();

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined);
      return;
    }

    let active = true;
    let objectUrl: string | undefined;
    const isStorageFile = (() => {
      try {
        return new URL(src, window.location.origin).pathname.startsWith("/storage/");
      } catch {
        return false;
      }
    })();

    if (!isStorageFile) {
      setResolvedSrc(src);
      return;
    }

    setResolvedSrc(undefined);
    void apiClient.fetchStorageFile(src).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setResolvedSrc(objectUrl);
    }).catch(() => {
      if (active) setResolvedSrc(undefined);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolvedSrc;
}

export default function StorageImage({ src, ...imageProps }: StorageImageProps) {
  const resolvedSrc = useStorageImageUrl(src);
  return <img {...imageProps} src={resolvedSrc} />;
}

type StorageLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export function StorageLink({ href, onClick, target, download, ...linkProps }: StorageLinkProps) {
  const handleClick: AnchorHTMLAttributes<HTMLAnchorElement>["onClick"] = async (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    let isStorageFile = false;
    try {
      isStorageFile = new URL(href, window.location.origin).pathname.startsWith("/storage/");
    } catch {
      return;
    }
    if (!isStorageFile) return;

    event.preventDefault();
    const openedWindow = target === "_blank" && download === undefined
      ? window.open("about:blank", "_blank")
      : null;
    try {
      const blob = await apiClient.fetchStorageFile(href);
      const objectUrl = URL.createObjectURL(blob);
      if (openedWindow) {
        openedWindow.location.href = objectUrl;
      } else {
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = objectUrl;
        downloadAnchor.download = typeof download === "string"
          ? download
          : new URL(href, window.location.origin).pathname.split("/").pop() || "file";
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      openedWindow?.close();
    }
  };

  return <a {...linkProps} href={href} target={target} download={download} onClick={handleClick} />;
}
