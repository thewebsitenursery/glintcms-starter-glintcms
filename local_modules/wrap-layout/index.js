var debug = require('debug')('wrap-layout');
var fs = require('fs');
var ejs = require('ejs');
var router = require('page.js');
var isBrowser = require('is-browser');
var Wrap = require('glint-wrap');
var Widget = require('glint-widget');
var Adapter = require('glint-adapter');
var Style = require('glint-plugin-block-style-editable');
var Block = require('glint-block');
var TextBlock = require('glint-block-text');
var CKEditorBlock = require('glint-block-ckeditor');
var Container = require('glint-container');
var PageAdapter = require('page-adapter');
var MenuWidget = require('widget-menu');

var template = fs.readFileSync(__dirname + '/index.ejs', 'utf-8');

// `title` and `content` must be provided
module.exports = function layout(o) {
  o = o || {};

  var pageWidget = Widget(function(options) {
    return ejs.render(o.template || template, options)
  });

  function text() {
    return Block(TextBlock()).use(Style());
  }

  function editor() {
    return Block(CKEditorBlock()).use(Style({hover: false}));
  }

  var blocks = {
    footerLeft: editor().selector('[data-id=footer-left]'),
    footerRight: editor().selector('[data-id=footer-right]')
  };

  var adapter = o.adapter || PageAdapter(o);
  var db = o.db || 'glint';
  var type = o.type || 'layout';
  var id = o.id || 'layout';
  var templateData = o.templateData || '__template__';

  var layoutAdapter = Adapter(adapter).db(db).type(type);

  var container = Container(blocks, layoutAdapter).id(id).template(templateData);


  if (isBrowser) {

    // arrow left, right for page (carousel) navigation
    $('.carousel').off('keydown.bs.carousel');

    container.on('pre-load', function(e) {
      debug('start loading', e);
      $(document).bind('keyup', function(e) {
        if (e.which == 39) {
          $('.carousel').carousel('next');
        }
        else if (e.which == 37) {
          $('.carousel').carousel('prev');
        }
      });
    });

    container.on('pre-edit', function(e) {
      debug('start editing', e);
      $(document).unbind('keyup');
      $(document).unbind('keydown');
    });

  }

  return Wrap()
    .series(container)
    .series('menu', MenuWidget().selector('body').prepend(true).place('force:server'))
    .series('page', pageWidget.place('force:server'))

};



/*
code executed only once on load
 */
if (isBrowser) {
  /*
   remove preloader, when loaded
   */
  var preloader = $('.preloader');
  $(window).load(function() {
    preloader.remove();
  });


  /*
   reset pre, code width to 0
   */
  function resetPreWidth() {

    var elements = document.querySelectorAll('div.item pre');
    if (elements.length === 0) return;

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      if (window.innerWidth > 1200) {
        el.style['width'] = '100%';
        el.style['max-width'] = '100%';

      } else {
        var width = 0;
        el.style['width'] = width + 'px';
        el.style['max-width'] = width + 'px';
      }

      el.style['opacity'] = 0;
      //$(el).fadeTo(100, 0);
    }

  }

  /*
   get pre, code width right
   */
  function setPreWidth() {

    var elements = document.querySelectorAll('div.item.active pre');
    if (elements.length === 0) return;

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      if (window.innerWidth > 1200) {
        el.style['width'] = '100%';
        el.style['max-width'] = '100%';
      } else {
        var left = el.getBoundingClientRect().left;
        var right = left * 2 || 30;
        var width = (screen.width < window.innerWidth) ? screen.width : window.innerWidth;
        width = width - right;
        el.style['width'] = width + 'px';
        el.style['max-width'] = width + 'px';
      }

      el.style['opacity'] = 0.9;
      //$(el).fadeTo(50, 0.9);

    }

  }

  /*
   get pre, code width right
   */

  $('#page-slider').on('slide.bs.carousel', function(e) {
    debug('slide start');
    resetPreWidth();
  });

  $(window).resize(setPreWidth);

  $(window).load(function() {
    setTimeout(setPreWidth, 100);
  });

  $('#page-slider').on('slid.bs.carousel', function(e) {
    debug('slide end');
    setTimeout(setPreWidth, 100);
  });

}
