#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_SLUG="virtual-media-folders"
OUTPUT_NAME="${1:-virtual-media-folders.zip}"
OUTPUT_PATH="${ROOT_DIR}/${OUTPUT_NAME}"
STAGING_DIR="$(mktemp -d)"

cleanup() {
	rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

rm -f "${OUTPUT_PATH}"
mkdir -p "${STAGING_DIR}/${PLUGIN_SLUG}"

rsync -a \
	--exclude-from="${ROOT_DIR}/.distignore" \
	"${ROOT_DIR}/" \
	"${STAGING_DIR}/${PLUGIN_SLUG}/"

for required in virtual-media-folders.php readme.txt LICENSE build/admin.js vendor/autoload.php; do
	if [[ ! -f "${STAGING_DIR}/${PLUGIN_SLUG}/${required}" ]]; then
		echo "Required release file is missing: ${required}" >&2
		exit 1
	fi
done

for forbidden in \
	.github \
	.npmrc \
	node_modules \
	tests \
	security \
	scripts \
	docs \
	package.json \
	package-lock.json \
	composer.lock \
	phpunit.xml.dist \
	webpack.config.js \
	vitest.config.js \
	CONTRIBUTING.md \
	SECURITY.md \
	UPSTREAM.md; do
	if [[ -e "${STAGING_DIR}/${PLUGIN_SLUG}/${forbidden}" ]]; then
		echo "Forbidden development file leaked into release: ${forbidden}" >&2
		exit 1
	fi
done

(
	cd "${STAGING_DIR}"
	zip -qr "${OUTPUT_PATH}" "${PLUGIN_SLUG}"
)

unzip -tq "${OUTPUT_PATH}" >/dev/null

if ! unzip -Z1 "${OUTPUT_PATH}" | grep -qx "${PLUGIN_SLUG}/virtual-media-folders.php"; then
	echo "Release archive does not contain the plugin entry point at the expected path." >&2
	exit 1
fi

echo "Built ${OUTPUT_NAME} from .distignore policy."
