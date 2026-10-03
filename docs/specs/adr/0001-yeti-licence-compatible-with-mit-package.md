---
status: accepted
---

# The package wraps Yeti under its FSL-1.1-MIT licence and is itself released under MIT

Yeti ships under the Functional Source License 1.1 with an MIT future license (FSL-1.1-MIT; `github.com/foundation/yeti/LICENSE`, `package.json` `"license": "FSL-1.1-MIT"`). Its Competing Use clause reserves "making the Software available to others in a commercial product or service that: 1. substitutes for the Software; 2. substitutes for any other product or service we offer using the Software" (`LICENSE:32-38`). The announcement, foundation/yeti#15554, reads it as reserving "offering Yeti itself as a competing product", and says each release converts to plain MIT two years after it ships.

Whether that allows this package was a legal reading under the user's identity, so it was the user's to make ([Decide: whether Yeti's licence and readiness allow this package](../issues/15-decide-yeti-licence-and-readiness.md)). On 2026-10-01 the user ruled, verbatim:

> I approve that FSL-1.1-MIT is compatible with what we want to do as a free and open-source project that will be using the MIT license.

We therefore decided that the package is a free and open-source project released under the MIT licence, and that it wraps Yeti under Yeti's own FSL-1.1-MIT licence.

## Consequences

- Every spec may depend on Yeti. The package's own `LICENSE` is MIT.
- How the package depends on Yeti (a peer dependency, a pinned version, or vendored files) is open, and is decided with the version policy in [Decide: which Yeti version the specs target, and how the package tracks it](../issues/12-decide-yeti-version-policy.md). Whichever it chooses, Yeti's own files keep Yeti's licence and notice.
- The user's ruling covers the package as a free and open-source MIT project. A commercial product or service built on Yeti would be a new question.
