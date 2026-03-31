# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x.x   | ✅        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities via GitHub Issues.**

If you discover a security vulnerability, please report it by emailing:

**t@ma-navi.co.jp**

Include the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You can expect a response within **5 business days**. We will work with you to understand and resolve the issue, and coordinate public disclosure once a fix is available.

## Security Considerations

freee-demo-kit is designed with the following security principles:

- **Sandbox-only**: Intended for use with freee sandbox environments, not production
- **Confirmation prompts**: All write operations require explicit company confirmation to prevent accidental data injection
- **Token storage**: OAuth tokens are stored in `~/.config/fdk/tokens.json` with `chmod 600` permissions
- **Path traversal prevention**: Preset file paths are validated to prevent directory traversal attacks
- **No hardcoded credentials**: All credentials are managed via environment variables or interactive setup
