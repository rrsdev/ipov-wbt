/**
 * Module encapsulating the template text.
 * Module returns a Function taking (currently) JQuery as a parameter and configuring the $.template() calls enabled by JsRender.
 */
define([
		"text!tmpl/banner-body-footer.html",	// the main 'body' of the template
		"text!themes/silearn/tmpl/banner_content.html",		// "./scripts"  is automatically prepended to the path here.
		"text!themes/silearn/tmpl/banner_bottom.html",
		"text!themes/silearn/tmpl/content_top.html",
		"text!themes/silearn/tmpl/footer_content.html",
		"text!themes/silearn/tmpl/confirmDlg.html"
	], function (
		tmplBody,
		tmplBannerContent,
		tmplBannerBottom,
		tmpContentTop,
		tmplFooterContent,
		tmplConfirmDlg
		) {

	// code,
	return function ($) {
		$.template( 'bannerContent', tmplBannerContent );
		$.template( 'bannerBottom', tmplBannerBottom );
		$.template( 'contentTop', tmpContentTop );
		$.template( 'contentMain', '' );
		$.template( 'contenBottom', '' );
		$.template( 'footerTop', '' );
		$.template( 'footerContent', tmplFooterContent );
		$.template( 'theme', tmplBody );
		$.template( 'confirmDlg', tmplConfirmDlg );
	};
});