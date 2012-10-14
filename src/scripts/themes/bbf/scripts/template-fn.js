/*
Copyright (C) 2011 iPOV.net
Author: Robert Sanders (dotperson@gmail.com)

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
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