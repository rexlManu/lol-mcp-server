# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please email [mail@emmanuel-lampe.de](mailto:mail@emmanuel-lampe.de) instead of opening a public issue.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue before public disclosure.

## API Key Security

- **Never** commit your Riot API key to the repository
- The `.env` file is gitignored by default
- Use environment variables in production
- Rotate your API key if it's ever exposed

## Rate Limiting

This server respects Riot API rate limits. Do not attempt to bypass rate limiting as it may result in your API key being revoked.
