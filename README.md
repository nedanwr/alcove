# Alcove

Alcove is a modular, self-hosted productivity platform. It is designed around software ownership, privacy, and simplicity: you run it on your own infrastructure, with Docker as the primary deployment target, and without mandatory subscriptions or vendor lock-in.

Alcove aims to be extensible without unnecessary complexity. Each product is designed independently but shares a cohesive interface, and you install only the functionality you need.

## Development status

> [!WARNING]
> Alcove is in early development and is **not production-ready**. Do not use it for important data or production workloads.

Features, architecture, APIs, and data formats may change without notice. Bugs, breaking changes, and data loss are possible. Much of what this README describes is planned rather than implemented.

## Architecture

Alcove is organized into three levels:

- **Core**: authentication, permissions, configuration, licensing, and module management.
- **Modules**: independent products that integrate into Alcove.
- **Plugins**: optional extensions that add functionality to modules.

The first planned module is **Alcove Drive**, intended to provide file storage, folders, sharing, previews, and version history.

## Licensing

Alcove uses more than one license:

- **Core, Controller, and official open-source modules**: [GNU AGPLv3 only](LICENSE) (`AGPL-3.0-only`).
- **Public SDKs, contracts, templates, and examples**: [Apache License 2.0](LICENSES/Apache-2.0.txt) (`Apache-2.0`).
- **Everything else**: as mapped in [LICENSES.md](LICENSES.md).

Optional Premium components may be distributed separately under commercial licenses. They are not part of this repository.

## Disclaimer

Alcove is experimental software. It is provided "AS IS", without warranties of any kind, to the extent permitted by applicable law. You run Alcove at your own risk. Production use is strongly discouraged during early development, and you should keep independent backups of any important data. See the applicable license texts for the full warranty and liability terms.

## Contributing

Contributions are welcome, including bug reports, feedback, feature suggestions, documentation improvements, testing, and code.

Contributions follow the [Developer Certificate of Origin](DCO) (DCO): every contributed commit needs a `Signed-off-by` trailer. Every commit must also be cryptographically signed. No Contributor License Agreement (CLA) is required.

See the [contribution guidelines](.github/CONTRIBUTING.md) for details.

## Copyright

Copyright (C) 2026 Naveed Ali Anwar
