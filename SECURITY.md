# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public GitHub issue**.

Instead, report it privately by emailing the repository owner directly.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 48 hours.

## Security Notes for Deployment

- **Change the `SECRET_KEY`** in your `.env` before any production deployment.
- **Restrict CORS origins** in `backend/main.py` — replace `allow_origins=["*"]` with your specific frontend domain.
- **Use strong database passwords** and never expose the database port publicly.
- **Enable HTTPS** in production using a reverse proxy (e.g., Nginx + Let's Encrypt).
- Default credentials (`admin/admin123`, etc.) must be changed immediately after first login.
