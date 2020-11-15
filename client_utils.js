function rotate($el, degrees) {
  $el.css({
      '-webkit-transform': 'rotate(' + degrees + 'deg)',
      '-moz-transform': 'rotate(' + degrees + 'deg)',
      '-ms-transform': 'rotate(' + degrees + 'deg)',
      '-o-transform': 'rotate(' + degrees + 'deg)',
      'transform': 'rotate(' + degrees + 'deg)',
      'zoom': 1
  });
}