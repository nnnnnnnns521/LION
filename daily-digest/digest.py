#!/usr/bin/env python3
"""
Daily Intelligence Email Digest for Nicole Silver / Paces
Fetches RSS feeds, summarizes with Claude, sends via Gmail SMTP.
"""

import os
import sys
import smtplib
import logging
import datetime
import requests
import atoma
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from anthropic import Anthropic

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_FILE = os.path.join(os.path.dirname(__file__), "digest.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ── RSS Feed Sources ──────────────────────────────────────────────────────────
# Core energy/infrastructure feeds
RSS_FEEDS = [
    "https://canarymededia.org/feed",
    "https://heatmap.news/feed",
    "https://www.latitudemedia.com/feed",
    "https://www.greentechmedia.com/rss/all",
    "https://www.datacenterdynamics.com/en/rss/",
    "https://techcrunch.com/tag/energy/feed/",
]

# ── Google Alert RSS Feeds (add your URLs here) ───────────────────────────────
# Paste your Google Alerts RSS feed URLs below.
# To create one: google.com/alerts → set alert → "RSS feed" delivery option.
GOOGLE_ALERT_FEEDS = [
    # "https://www.google.com/alerts/feeds/XXXXX/YYYYY",  # Alert: Paces energy
    # "https://www.google.com/alerts/feeds/XXXXX/YYYYY",  # Alert: permitting solar
    # "https://www.google.com/alerts/feeds/XXXXX/YYYYY",  # Alert: data center power
    # "https://www.google.com/alerts/feeds/XXXXX/YYYYY",  # Alert: interconnection queue
    # "https://www.google.com/alerts/feeds/XXXXX/YYYYY",  # Alert: LevelTen Energy
]

MAX_ARTICLES = 50
MAX_CHARS_PER_ARTICLE = 300
MAX_RESPONSE_TOKENS = 1500

SYSTEM_PROMPT = """You are a daily intelligence briefing agent for Nicole Silver, \
Vice President of Marketing at Paces — an AI-powered platform for energy \
infrastructure development. Paces serves power developers and data center \
developers with tools for siting, permitting, interconnection, and power studies. \
Key competitors are PermitFlow, Tyba, and LevelTen Energy. The fastest growing \
customer segment is data center developers (Meta, AWS, Google, Microsoft). \
Be specific and direct — no filler, no obvious news. Flag competitor positioning \
and content opportunities."""

DIGEST_PROMPT = """Based on the articles below, produce a daily intelligence digest \
for Nicole Silver, VP Marketing at Paces. Today is {date}.

Format the digest as HTML with these exact sections. For each section use the \
section header exactly as shown. If a section has nothing significant, write one \
brief sentence saying so — do not pad.

SECTIONS:
1. ⚡ Paces & Team — mentions of Paces, James McWalter, or the Paces product
2. 🏗️ Market & Category — top 3–5 developments in power development, data center \
buildout, interconnection, permitting
3. 🤖 Competitive Intelligence — news from PermitFlow, Tyba, LevelTen Energy, Krux, \
Aurora Solar, Enverus, GridUnity
4. 🏢 Data Center & Hyperscaler — Meta, AWS, Google, Microsoft power and infrastructure news
5. 📰 Content Worth Reading — highly relevant articles with URLs and one-sentence \
relevance note; include relevant policy news
6. 💡 One Opportunity — one specific, actionable content or positioning opportunity \
based on today's news

Rules:
- Signal only, no noise. Skip obvious or generic news.
- Each bullet should deliver a specific insight or data point.
- For "Content Worth Reading", include the URL inline.
- "One Opportunity" must be concrete and actionable (e.g., a LinkedIn post angle, \
a competitive response, a topic to own).

ARTICLES (title | source | summary):
{articles}
"""


def _parse_xml_feed(content: bytes, url: str) -> list[dict]:
    """Fallback parser using stdlib xml.etree — handles most RSS 2.0 and Atom feeds."""
    import xml.etree.ElementTree as ET
    NS_ATOM = "{http://www.w3.org/2005/Atom}"
    NS_CONTENT = "{http://purl.org/rss/1.0/modules/content/}"

    root = ET.fromstring(content)
    items = []

    # RSS 2.0
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        desc = (item.findtext("description") or
                item.findtext(f"{NS_CONTENT}encoded") or "").strip()
        pub = item.findtext("pubDate")
        items.append({
            "title": title,
            "url": link,
            "summary": desc[:MAX_CHARS_PER_ARTICLE],
            "published": _parse_date(pub),
            "source": url,
        })

    # Atom
    if not items:
        for entry in root.iter(f"{NS_ATOM}entry"):
            title_el = entry.find(f"{NS_ATOM}title")
            title = (title_el.text or "") if title_el is not None else ""
            link_el = entry.find(f"{NS_ATOM}link[@rel='alternate']") or entry.find(f"{NS_ATOM}link")
            link = link_el.get("href", "") if link_el is not None else ""
            summary_el = entry.find(f"{NS_ATOM}summary") or entry.find(f"{NS_ATOM}content")
            summary = (summary_el.text or "") if summary_el is not None else ""
            pub_el = entry.find(f"{NS_ATOM}published") or entry.find(f"{NS_ATOM}updated")
            pub = pub_el.text if pub_el is not None else None
            items.append({
                "title": title.strip(),
                "url": link,
                "summary": summary.strip()[:MAX_CHARS_PER_ARTICLE],
                "published": _parse_date(pub),
                "source": url,
            })

    return items


def _parse_date(date_str: str | None) -> datetime.datetime | None:
    if not date_str:
        return None
    import email.utils
    try:
        t = email.utils.parsedate_to_datetime(date_str)
        return t
    except Exception:
        pass
    try:
        # ISO 8601 / Atom format
        date_str = date_str.rstrip("Z")
        if "T" in date_str:
            return datetime.datetime.fromisoformat(date_str).replace(tzinfo=datetime.timezone.utc)
    except Exception:
        pass
    return None


def fetch_feed(url: str) -> list[dict]:
    """Fetch and parse a single RSS/Atom feed. Returns list of article dicts."""
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        content = resp.content
    except Exception as e:
        log.warning("Failed to fetch feed %s: %s", url, e)
        return []

    # Try atoma RSS first
    try:
        feed = atoma.parse_rss_bytes(content)
        items = []
        for entry in feed.items:
            items.append({
                "title": entry.title or "",
                "url": entry.link or "",
                "summary": (entry.description or "")[:MAX_CHARS_PER_ARTICLE],
                "published": entry.pub_date,
                "source": url,
            })
        if items:
            return items
    except Exception:
        pass

    # Try atoma Atom
    try:
        feed = atoma.parse_atom_bytes(content)
        items = []
        for entry in feed.entries:
            summary = ""
            if entry.summary:
                summary = entry.summary.value[:MAX_CHARS_PER_ARTICLE]
            elif entry.content:
                summary = entry.content[0].value[:MAX_CHARS_PER_ARTICLE]
            link = entry.links[0].href if entry.links else ""
            items.append({
                "title": entry.title.value if entry.title else "",
                "url": link,
                "summary": summary,
                "published": entry.published,
                "source": url,
            })
        if items:
            return items
    except Exception:
        pass

    # Stdlib XML fallback
    try:
        return _parse_xml_feed(content, url)
    except Exception as e:
        log.warning("Failed to parse feed %s: %s", url, e)
        return []


def fetch_all_articles() -> list[dict]:
    """Fetch all feeds, filter to last 24 hours, cap at MAX_ARTICLES."""
    all_feeds = RSS_FEEDS + GOOGLE_ALERT_FEEDS
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    articles = []

    for url in all_feeds:
        log.info("Fetching %s", url)
        items = fetch_feed(url)
        for item in items:
            pub = item.get("published")
            if pub:
                # Make timezone-aware if naive
                if hasattr(pub, "tzinfo") and pub.tzinfo is None:
                    pub = pub.replace(tzinfo=datetime.timezone.utc)
                if pub < cutoff:
                    continue
            articles.append(item)

    log.info("Fetched %d articles within 24 hours", len(articles))

    # Deduplicate by title, cap at MAX_ARTICLES
    seen = set()
    unique = []
    for a in articles:
        key = a["title"].lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(a)
        if len(unique) >= MAX_ARTICLES:
            break

    log.info("Using %d unique articles after dedup/cap", len(unique))
    return unique


def build_article_text(articles: list[dict]) -> str:
    lines = []
    for a in articles:
        title = a["title"].replace("|", "-")
        source = a["source"]
        summary = a["summary"].replace("|", "-").replace("\n", " ")
        lines.append(f"{title} | {source} | {summary}")
    return "\n".join(lines)


def generate_digest(articles: list[dict]) -> str:
    """Call Claude Haiku to produce the digest HTML body."""
    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    article_text = build_article_text(articles)
    today = datetime.date.today().strftime("%A, %B %d, %Y")
    user_prompt = DIGEST_PROMPT.format(date=today, articles=article_text)

    log.info("Sending %d chars to Claude", len(user_prompt))

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=MAX_RESPONSE_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return response.content[0].text


def wrap_in_email_html(digest_body: str, date_str: str) -> str:
    """Wrap the AI-generated content in the full email HTML template."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Paces Daily Intelligence — {date_str}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f5f5f5; margin: 0; padding: 0; color: #222; }}
  .wrapper {{ max-width: 680px; margin: 0 auto; background: #fff; }}
  .header {{ background: #1B3D35; color: #fff; padding: 24px 32px; }}
  .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }}
  .header p {{ margin: 4px 0 0; font-size: 13px; opacity: 0.75; }}
  .content {{ padding: 28px 32px; line-height: 1.6; }}
  .content h2 {{ font-size: 16px; font-weight: 700; color: #1B3D35;
                 border-bottom: 2px solid #1B3D35; padding-bottom: 6px; margin-top: 28px; }}
  .content ul {{ padding-left: 20px; margin: 8px 0; }}
  .content li {{ margin-bottom: 6px; font-size: 14px; }}
  .content p {{ font-size: 14px; margin: 8px 0; }}
  .content a {{ color: #1B3D35; }}
  .footer {{ background: #f0f0f0; padding: 16px 32px; font-size: 12px; color: #888;
             border-top: 1px solid #ddd; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Paces Daily Intelligence</h1>
    <p>{date_str}</p>
  </div>
  <div class="content">
{digest_body}
  </div>
  <div class="footer">
    Generated automatically · Paces Intelligence Digest
  </div>
</div>
</body>
</html>"""


def send_email(html_body: str, date_str: str):
    """Send the digest via Gmail SMTP."""
    gmail_address = os.environ["GMAIL_ADDRESS"]
    gmail_password = os.environ["GMAIL_APP_PASSWORD"]
    recipient = "silver.nicole@gmail.com"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"⚡ Paces Daily Intelligence — {date_str}"
    msg["From"] = gmail_address
    msg["To"] = recipient

    msg.attach(MIMEText(html_body, "html"))

    log.info("Sending email to %s", recipient)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(gmail_address, gmail_password)
        server.sendmail(gmail_address, recipient, msg.as_string())
    log.info("Email sent successfully")


def load_env():
    """Load .env file if present."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())


def main():
    load_env()

    required = ["ANTHROPIC_API_KEY", "GMAIL_ADDRESS", "GMAIL_APP_PASSWORD"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        log.error("Missing required env vars: %s", ", ".join(missing))
        sys.exit(1)

    date_str = datetime.date.today().strftime("%A, %B %d, %Y")
    log.info("=== Starting digest for %s ===", date_str)

    articles = fetch_all_articles()

    if not articles:
        log.warning("No articles fetched — sending minimal digest")
        digest_body = "<p>No articles were fetched from RSS feeds in the last 24 hours. Check feed URLs and network connectivity.</p>"
    else:
        digest_body = generate_digest(articles)

    html = wrap_in_email_html(digest_body, date_str)
    send_email(html, date_str)
    log.info("=== Digest complete ===")


if __name__ == "__main__":
    main()
