/*
Copyright (C) 2011-2012 iPOV.net
Author: Robert Sanders (robert.sanders@ipov.net)

This program is free software; you can redistribute it and/or
modify it under the terms of the Mozilla Public License v2 or higher.

*/
/**
 * Module encapsulating the template text.
 * Module returns a Function taking (currently) JQuery as a parameter and configuring the $.template() calls enabled by JsRender.
 */
define([
		"text!tmpl/banner-body-footer.html",	// the main 'body' of the template
		"text!themes/bbf/tmpl/banner_content.html",		// "./scripts"  is automatically prepended to the path here.
		"text!themes/bbf/tmpl/banner_bottom.html",
		"text!themes/bbf/tmpl/content_top.html",
		"text!themes/bbf/tmpl/footer_content.html",
		"text!themes/bbf/tmpl/confirmDlg.html"
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
		$.templates({
			bannerContent: tmplBannerContent,
			bannerBottom: tmplBannerBottom,
			contentTop: tmpContentTop,
			contentMain: '',
			contenBottom: '',
			footerTop: '',
			footerContent: tmplFooterContent,
			theme: tmplBody,
			confirmDlg: tmplConfirmDlg
		});
	};
});