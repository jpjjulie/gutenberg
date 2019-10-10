/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { IconButton, Dropdown, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { ColorPaletteControl } from '@wordpress/block-editor';

/**
 * Color Selector Icon component.
 * @return {*} React Icon component.
 * @constructor
 */
const ColorSelectorIcon = ( { style } ) =>
	<div className="block-editor-block-colors-selector__icon-container">
		<div
			className="colors-selector__state-selection wp-block-navigation-menu-item"
			style={ style }
		>
			{ __( 'Aa' ) }
		</div>
	</div>;

/**
 * Renders the Colors Selector Toolbar with the icon button.
 *
 * @param {function} onToggle Callback open/close Dropdown.
 * @param {bool} isOpen True is the color settings dropdown is open. Otherwise, False.
 * @return {*} React toggle button component.
 */
const renderToggle = ( style ) => ( { onToggle, isOpen } ) => {
	const openOnArrowDown = ( event ) => {
		if ( ! isOpen && event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			onToggle();
		}
	};

	return (
		<Toolbar>
			<IconButton
				className="components-icon-button components-toolbar__control block-editor-block-colors-selector__toggle"
				label={ __( 'Open Colors Selector' ) }
				onClick={ onToggle }
				onKeyDown={ openOnArrowDown }
				icon={ <ColorSelectorIcon style={ style }/> }
			/>
		</Toolbar>
	);
};

const renderContent = ( { backgroundColor, textColor, setBackgroundColor, setTextColor } ) => ( ( { isOpen, onToggle, onClose } ) => {
	return (
		<>
			<div className="color-palette-controller-container">
				<ColorPaletteControl
					value={ backgroundColor.color }
					onChange={ setBackgroundColor }
					label={ __( 'Background Color' ) }
				/>
			</div>

			<div className="color-palette-controller-container">
				<ColorPaletteControl
					value={ textColor.color }
					onChange= { setTextColor }
					label={ __( 'Text Color' ) }
				/>
			</div>
		</>
	)
} );

export default ( { style, className, ...colorControlProps } ) =>
	<Dropdown
		position="bottom right"
		className={ classnames(
			'editor-block-colors-selector,',
			'block-editor-block-colors-selector',
			className,
		) }
		contentClassName="editor-block-colors-selector__popover block-editor-block-colors-selector__popover"
		renderToggle={ renderToggle( style ) }
		renderContent={ renderContent( colorControlProps ) }
	/>;
