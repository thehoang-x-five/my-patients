import { useEffect } from "react";

/** Gán --app-dvh = visualViewport.height (px) để chống hở khi zoom */
export default function useViewportVH() {
  useEffect(() => {
    const set = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-dvh", `${h}px`);
    };
    set();
    window.addEventListener("resize", set);
    window.visualViewport?.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      window.removeEventListener("resize", set);
      window.visualViewport?.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, []);
}
