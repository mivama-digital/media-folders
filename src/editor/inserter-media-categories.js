/**
 * Block inserter "Media" tab integration for Virtual Media Folders.
 *
 * Registers one Inserter Media Category per top-level virtual folder so
 * folder images appear in the block inserter Media tab alongside Images
 * and Openverse. Each category's `fetch` reads core `wp/v2/media`, filtered
 * to the folder's whole subtree of terms.
 *
 * This is additive to the classic-modal folder sidebar (see ./index.js).
 */

import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

const PER_PAGE = 40;
const REST_BASE = 'vmfo-folders';

/**
 * Build a parent -> children[] index from the flat folder list.
 *
 * @param {Array<Object>} folders Flat folder list from window.vmfEditor.
 * @return {Map<number, Array<Object>>} Children keyed by parent id.
 */
function indexByParent( folders ) {
	const byParent = new Map();
	folders.forEach( ( folder ) => {
		const parent = folder.parent || 0;
		if ( ! byParent.has( parent ) ) {
			byParent.set( parent, [] );
		}
		byParent.get( parent ).push( folder );
	} );
	return byParent;
}

/**
 * Collect a folder's own id plus all descendant folder ids.
 *
 * @param {number}                     rootId   Top-level folder id.
 * @param {Map<number, Array<Object>>} byParent Children index.
 * @return {Array<number>} Subtree term ids (root first).
 */
function collectSubtreeIds( rootId, byParent ) {
	const ids = [ rootId ];
	const queue = [ rootId ];
	while ( queue.length ) {
		const current = queue.shift();
		const children = byParent.get( current ) || [];
		children.forEach( ( child ) => {
			ids.push( child.id );
			queue.push( child.id );
		} );
	}
	return ids;
}

/**
 * Sum image counts across a set of folder ids.
 *
 * @param {Array<number>}       ids  Folder ids.
 * @param {Map<number, Object>} byId Folder lookup.
 * @return {number} Combined image count.
 */
function subtreeImageCount( ids, byId ) {
	return ids.reduce( ( total, id ) => {
		const folder = byId.get( id );
		return total + ( folder ? folder.imageCount || 0 : 0 );
	}, 0 );
}

/**
 * Sort top-level folders by custom order (nulls last), then name.
 *
 * @param {Array<Object>} folders Top-level folders.
 * @return {Array<Object>} Sorted copy.
 */
function sortByOrder( folders ) {
	return [ ...folders ].sort( ( a, b ) => {
		const orderA = a.order;
		const orderB = b.order;
		if ( orderA !== null && orderA !== undefined && orderB !== null && orderB !== undefined ) {
			return orderA - orderB;
		}
		if ( orderA !== null && orderA !== undefined ) {
			return -1;
		}
		if ( orderB !== null && orderB !== undefined ) {
			return 1;
		}
		return a.name.localeCompare( b.name );
	} );
}

/**
 * Map a core media REST item to an InserterMediaItem.
 *
 * @param {Object} item wp/v2/media response item.
 * @return {Object} InserterMediaItem.
 */
function toInserterItem( item ) {
	const sizes = item.media_details?.sizes || {};
	const preview = sizes.medium?.source_url || sizes.thumbnail?.source_url || item.source_url;

	return {
		id: item.id,
		url: item.source_url,
		previewUrl: preview,
		alt: item.alt_text || '',
		caption: item.caption?.rendered || '',
		title: item.title?.rendered || '',
	};
}

/**
 * Build the fetch handler for a folder subtree.
 *
 * @param {Array<number>} subtreeIds Folder term ids to query.
 * @return {Function} Inserter media fetch handler.
 */
function makeFetch( subtreeIds ) {
	return async ( query = {} ) => {
		const path = addQueryArgs( '/wp/v2/media', {
			media_type: 'image',
			[ REST_BASE ]: subtreeIds.join( ',' ),
			search: query.search || undefined,
			per_page: query.per_page || PER_PAGE,
			page: query.page || 1,
			orderby: query.search ? 'relevance' : 'date',
			_fields: 'id,source_url,alt_text,caption,title,media_details',
		} );

		try {
			const results = await apiFetch( { path } );
			return Array.isArray( results ) ? results.map( toInserterItem ) : [];
		} catch ( error ) {
			return [];
		}
	};
}

/**
 * Register an Inserter Media Category per top-level virtual folder.
 *
 * Categories are marked `isExternalResource` so the block editor skips its
 * per-category emptiness probe (one `fetch` per category on tab open); each
 * folder is only queried when the user actually opens it. Because that probe
 * is skipped, our server-provided image count is the sole hide-empty gate:
 * only folders whose subtree holds at least one image are registered.
 *
 * @return {void}
 */
export function registerFolderInserterCategories() {
	const editorData = window.vmfEditor;
	if ( ! editorData?.inserterMediaFolders ) {
		return;
	}

	const folders = editorData?.folders;
	if ( ! Array.isArray( folders ) || ! folders.length ) {
		return;
	}

	const blockEditor = dispatch( 'core/block-editor' );
	if ( ! blockEditor?.registerInserterMediaCategory ) {
		return;
	}

	const byParent = indexByParent( folders );
	const byId = new Map( folders.map( ( folder ) => [ folder.id, folder ] ) );
	const topLevel = sortByOrder( folders.filter( ( folder ) => ( folder.parent || 0 ) === 0 ) );

	topLevel.forEach( ( folder ) => {
		const subtreeIds = collectSubtreeIds( folder.id, byParent );
		if ( subtreeImageCount( subtreeIds, byId ) === 0 ) {
			return;
		}

		blockEditor.registerInserterMediaCategory( {
			name: `vmfo-folder-${ folder.id }`,
			labels: {
				name: folder.name,
				search_items: sprintf(
					/* translators: %s: virtual folder name. */
					__( 'Search %s', 'virtual-media-folders' ),
					folder.name
				),
			},
			mediaType: 'image',
			// Skip the block editor's per-category emptiness probe on tab open.
			isExternalResource: true,
			fetch: makeFetch( subtreeIds ),
		} );
	} );
}
