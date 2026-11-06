import { Link } from "react-router";
import { images } from "../assets/images";

const services = [
  "ย้ายของชิ้นใหญ่",
  "ขนย้ายเฟอร์นิเจอร์",
  "ย้ายเครื่องใช้ไฟฟ้า",
  "งานช่วยเหลือทั่วไป",
];

const contacts = [
  { icon: images.phone, text: "02-123-4567" },
  { icon: images.line, text: "@test01" },
  { icon: images.clock, text: "เปิดบริการทุกวัน 08:00 – 20:00 น." },
];

// ใส่ลิงก์โซเชียลจริงของคุณแทน "#"
const socials = [
  { label: "Facebook", icon: images.facebook, href: "#" },
  { label: "LINE", icon: images.line, href: "#" },
  { label: "YouTube", icon: images.youtube, href: "#" },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-dots" />

      <div className="footer-inner">
        <div className="footer-main">

          {/* Brand */}
          <div className="footer-brand">
            <div className="logo">
              <span>test01</span>
            </div>

            <p>บริการเรียกช่างสำหรับงานเคลื่อนย้ายถึงบ้าน</p>

            <div className="footer-line" />

            <div className="footer-social">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="social-btn"
                  aria-label={s.label}
                >
                  <img src={s.icon} alt="" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4>บริการของเรา</h4>

            <ul className="footer-list">
              {services.map((s) => (
                <li key={s}>
                  <Link to="/request">
                    <span className="chevron">›</span>
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>ติดต่อเรา</h4>

            <ul className="footer-contact">
              {contacts.map((c) => (
                <li key={c.text}>
                  <img src={c.icon} alt="" className="contact-icon" />
                  {c.text}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="footer-cta">
            <Link to="/request" className="footer-cta-button">
              เรียกช่างตอนนี้ →
            </Link>
          </div>

        </div>

        <div className="footer-bottom">
          <span>© 2026 test01. All rights reserved.</span>

          <div className="footer-links">
            <a href="#">นโยบายความเป็นส่วนตัว</a>
            <a href="#">เงื่อนไขการใช้บริการ</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;