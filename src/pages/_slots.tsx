export function Footer() {
  return (
    <div className="marketing-footer">
      <section className="marketing-footer-cta">
        <p>Start building</p>
        <div>
          <a className="marketing-footer-primary" href="/quickstart/agent">
            Use with your agent
          </a>
          <a href="/quickstart/server">Add payments to your API</a>
        </div>
      </section>
      <section className="marketing-footer-bottom">
        <div className="marketing-footer-links">
          <a href="/">Machine Payment Protocol</a>
          <a href="https://github.com/wevm/mppx">GitHub</a>
          <a href="https://x.com/mpp">X</a>
        </div>
        <img alt="Machine Payment Protocol" src="/marketing/footer-logo.svg" />
        <div className="marketing-footer-links marketing-footer-legal">
          <span>Open source protocol</span>
          <span>Built for the web</span>
          <span>© 2026 MPP. San Francisco, California.</span>
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
