<?php
/**
 * Runtime autoloader for Virtual Media Folders.
 *
 * The distributed plugin has no third-party PHP runtime dependencies. Composer
 * remains available for development and package-installation metadata, while
 * WordPress loads plugin classes through this focused PSR-4-compatible loader.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

spl_autoload_register(
	static function ( string $class ): void {
		$prefix = 'VirtualMediaFolders\\';

		if ( ! str_starts_with( $class, $prefix ) ) {
			return;
		}

		$relative_class = substr( $class, strlen( $prefix ) );

		if (
			$relative_class === false
			|| $relative_class === ''
			|| preg_match( '/^[A-Za-z_][A-Za-z0-9_]*(?:\\\\[A-Za-z_][A-Za-z0-9_]*)*$/D', $relative_class ) !== 1
		) {
			return;
		}

		$file = __DIR__ . '/src/' . str_replace( '\\', '/', $relative_class ) . '.php';

		if ( is_file( $file ) ) {
			require_once $file;
		}
	}
);
