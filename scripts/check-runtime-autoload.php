<?php
/**
 * Verify that the distributed plugin can autoload every PHP runtime class
 * without Composer's vendor/autoload.php.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

define( 'ABSPATH', '/tmp/wordpress/' );

if ( ! class_exists( 'WP_REST_Controller' ) ) {
	class WP_REST_Controller {
	}
}

require dirname( __DIR__ ) . '/autoload.php';

$classes = [
	'VirtualMediaFolders\\AddonChecker',
	'VirtualMediaFolders\\Admin',
	'VirtualMediaFolders\\Editor',
	'VirtualMediaFolders\\RestApi',
	'VirtualMediaFolders\\Settings',
	'VirtualMediaFolders\\Suggestions',
	'VirtualMediaFolders\\Taxonomy',
	'VirtualMediaFolders\\Addon\\AbstractPlugin',
	'VirtualMediaFolders\\Addon\\AbstractSettingsTab',
	'VirtualMediaFolders\\Addon\\ActionSchedulerLoader',
];

$missing = [];

foreach ( $classes as $class ) {
	if ( ! class_exists( $class ) ) {
		$missing[] = $class;
	}
}

if ( $missing !== [] ) {
	fwrite( STDERR, "Runtime autoload failed for:\n- " . implode( "\n- ", $missing ) . "\n" );
	exit( 1 );
}

foreach ( get_included_files() as $file ) {
	if ( str_contains( str_replace( '\\', '/', $file ), '/vendor/' ) ) {
		fwrite( STDERR, "Runtime autoload unexpectedly loaded vendor code: {$file}\n" );
		exit( 1 );
	}
}

echo 'Vendor-free runtime autoload verified for ' . count( $classes ) . " plugin classes.\n";
