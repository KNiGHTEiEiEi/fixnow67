import { Link, useLocation } from "react-router";
import type { MouseEvent } from "react";

function Header() {
  const { pathname } = useLocation();

  const scrollTo = (id?: string) => (e: MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();

    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={scrollTo()}>
        {/* <span className="logo-icon">🔧</span> */}
        <span>test01</span>
      </Link>

      <div className="nav-links">
        <Link to="/" onClick={scrollTo()}>หน้าหลัก</Link>
        <Link to="/#service" onClick={scrollTo("service")}>บริการ</Link>
        <Link to="/#contact" onClick={scrollTo("contact")}>ติดต่อเรา</Link>
      </div>

      <Link to="/request" className="nav-button">
        เรียกช่าง
      </Link>
    </nav>
  );
}

export default Header;