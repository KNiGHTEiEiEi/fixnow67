import { useEffect } from "react";
import { useLocation } from "react-router";

// เลื่อนไปที่ #id ใน URL หลังเปลี่ยนหน้า (ถ้าไม่มี # จะเลื่อนขึ้นบนสุด)
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default ScrollToHash;