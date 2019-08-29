/**
 * WordPress dependencies
 */
import { createContext, useContext, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { defaultEntities, kinds } from './entities';

const entities = {
	...defaultEntities.reduce( ( acc, entity ) => {
		if ( ! acc[ entity.kind ] ) {
			acc[ entity.kind ] = {};
		}
		acc[ entity.kind ][ entity.name ] = { context: createContext() };
		return acc;
	}, {} ),
	...kinds.reduce( ( acc, kind ) => {
		acc[ kind.name ] = new Proxy(
			{},
			{
				get( target, name ) {
					if ( Reflect.has( target, name ) ) {
						return Reflect.get( ...arguments );
					}
					const value = { context: createContext() };
					Reflect.set( target, name, value );
					return value;
				},
			}
		);
		return acc;
	}, {} ),
};

/**
 * Context provider component for providing
 * an entity for a specific entity type.
 *
 * @param {Object} props          The component's props.
 * @param {string} props.kind     The entity kind.
 * @param {string} props.type     The entity type.
 * @param {number} props.id       The entity ID.
 * @param {*}      props.children The children to wrap.
 *
 * @return {Object} The provided children, wrapped with
 *                   the entity's context provider.
 */
export default function EntityProvider( { kind, type, id, children } ) {
	const Provider = entities[ kind ][ type ].context.Provider;
	return <Provider value={ id }>{ children }</Provider>;
}

/**
 * Hook that returns the ID for the nearest
 * provided entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} type The entity type.
 */
export function useEntityId( kind, type ) {
	return useContext( entities[ kind ][ type ].context );
}

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string} kind The entity kind.
 * @param {string} type The entity type.
 * @param {string} prop The property name.
 *
 * @return {[*, Function]} A tuple where the first item is the
 *                          property value and the second is the
 *                          setter.
 */
export function useEntityProp( kind, type, prop ) {
	const id = useEntityId( kind, type );

	const value = useSelect(
		( select ) => {
			const { getEntityRecord, getEditedEntityRecord } = select( 'core' );
			getEntityRecord( kind, type, id ); // Trigger resolver.
			const entity = getEditedEntityRecord( kind, type, id );
			return entity && entity[ prop ];
		},
		[ kind, type, id, prop ]
	);

	const { editEntityRecord } = useDispatch( 'core' );
	const setValue = useCallback(
		( newValue ) => {
			editEntityRecord( kind, type, id, {
				[ prop ]: newValue,
			} );
		},
		[ kind, type, id, prop ]
	);

	return [ value, setValue ];
}

/**
 * Hook that returns whether the nearest provided
 * entity of the specified type is dirty, saving,
 * and a function to save it.
 *
 * The last, optional parameter is for scoping the
 * selection to a single property or a list properties.
 *
 * By default, dirtyness detection and saving considers
 * and handles all properties of an entity, but this
 * last parameter lets you scope it to a single property
 * or a list of properties for each instance of this hook.
 *
 * @param {string}          kind    The entity kind.
 * @param {string}          type    The entity type.
 * @param {string|[string]} [props] The property name or list of property names.
 */
export function useEntitySaving( kind, type, props ) {
	const id = useEntityId( kind, type );

	const [ isDirty, isSaving, _select ] = useSelect(
		( select ) => {
			const { getEntityRecordNonTransientEdits, isSavingEntityRecord } = select(
				'core'
			);
			const editKeys = Object.keys(
				getEntityRecordNonTransientEdits( kind, type, id )
			);
			return [
				props ?
					editKeys.some( ( key ) =>
						typeof props === 'string' ? key === props : props.includes( key )
					) :
					editKeys.length > 0,
				isSavingEntityRecord( kind, type, id ),
				select,
			];
		},
		[ kind, type, id, props ]
	);

	const { saveEntityRecord } = useDispatch( 'core' );
	const save = useCallback( () => {
		let filteredEdits = _select( 'core' ).getEntityRecordNonTransientEdits(
			kind,
			type,
			id
		);
		if ( typeof props === 'string' ) {
			filteredEdits = { [ props ]: filteredEdits[ props ] };
		} else if ( props ) {
			filteredEdits = Object.keys( filteredEdits ).reduce( ( acc, key ) => {
				if ( props.includes( key ) ) {
					acc[ key ] = filteredEdits[ key ];
				}
				return acc;
			}, {} );
		}
		saveEntityRecord( kind, type, { id, ...filteredEdits } );
	}, [ kind, type, id, props, _select ] );

	return [ isDirty, isSaving, save ];
}
