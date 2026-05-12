import { useEffect } from "react";

export default function useWatermark(imageUrl) {
  useEffect(() => {
    document.body.style.setProperty(
      "--watermark-url",
      `url('${imageUrl}')`
    );
    return () => {
      // Reset to default when leaving the page
      document.body.style.removeProperty("--watermark-url");
    };
  }, [imageUrl]);
}
