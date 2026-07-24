export function Footer() {
  return (
    <div className="marketing-footer">
      <section className="marketing-footer-cta">
        <p>Start building</p>
        <div>
          <a className="marketing-footer-primary" href="/quickstart/agent">
            <span>Use with your agent</span>
          </a>
          <a href="/quickstart/server">
            <span>Add payments to your API</span>
          </a>
        </div>
      </section>
      <section className="marketing-footer-bottom">
        <div className="marketing-footer-links">
          <a href="/">Machine Payment Protocol</a>
          <a href="https://x.com/mpp">X</a>
          <a href="https://github.com/tempoxyz/mpp">GitHub</a>
        </div>
        <img alt="Machine Payment Protocol" src="/marketing/footer-logo.svg" />
        <div className="marketing-footer-links marketing-footer-legal">
          <p>
            © 2026 All rights reserved, MPP.
            <br />
            San Francisco, California, USA
          </p>
        </div>
      </section>
    </div>
  );
}

export function OutlineFooter() {
  return null;
}

export function SidebarHeader() {
  return null;
}
