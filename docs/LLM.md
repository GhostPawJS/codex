# LLM Guide

Codex exposes three additive runtime layers for agents:

- `tools`: intent-shaped JSON-schema-described actions
- `skills`: markdown procedures built from those tools
- `soul`: a prompt foundation that encodes Codex posture

The tools wrap the same public `read` and `write` surface available to direct-code callers. They do not bypass the direct API.
