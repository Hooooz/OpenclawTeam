# Findings

## Current Workspace

- The workspace currently contains only `大纲.md`.
- `大纲.md` is already converted into a control-outline document and can be used as the source structure for full drafting.
- The user later clarified that the project is an internal digital employee management backend, not an external enterprise product.
- The user added `主Agent-子Agent协作产品开发模式.md`, which aligns with the three-document specification-first workflow.
- The local target server is `192.168.31.189`, but from the current session environment SSH returns `No route to host`.
- The target GitHub repository `https://github.com/Hooooz/OpenclawTeam.git` is reachable and appears empty or without refs from unauthenticated `ls-remote`.
- A new reachable server login was provided and verified: `Administrator@192.168.31.189`.
- The server is Windows 11 Pro with PowerShell 5.1, about 15.85 GB RAM, Docker 29.2.0, Docker Compose v5.0.2, Node and npm available, Python available.
- Git is installed on the server and available at `C:\\Program Files\\Git\\cmd\\git.exe`; machine PATH was updated so the host is ready for Git-based deployment flows.
- The MVP scaffold was deployed successfully to the Windows server using the Node-process fallback path:
  - Admin Web: `http://192.168.31.189:3000`
  - Control API health: `http://192.168.31.189:3001/health`
- Docker Compose on the server reaches the daemon but currently fails on image pull credentials, so Node fallback is the active deployment mode.

## Writing Constraints

- Internal-facing documentation only.
- Feishu-friendly structure.
- No introductory explanation of basic OpenClaw concepts.
- Emphasis on internal management console, runtime control, governance, deployment path, and staged delivery.

## Drafting Strategy

- Rewrite the prior generic-enterprise framing into an internal control-plane framing.
- Keep terminology consistent across all documents:
  - Admin Web
  - Control API
  - Agent Runtime
  - Skill Registry
  - Knowledge / Memory
  - Scheduler / Run Record
  - Audit / Trace
- Make document 2 closer to engineering execution, repository layout, deployment, and GitHub usage.
- Make document 3 usable as a review, testing, and deployment acceptance basis.
- Deployment assumptions should now target a Windows host with Docker Compose available.
- Deployment should support dual mode on Windows:
  - Preferred: Docker Compose when Docker Desktop Linux engine and registry auth are healthy
  - Fallback: native Node processes managed by PowerShell scripts
